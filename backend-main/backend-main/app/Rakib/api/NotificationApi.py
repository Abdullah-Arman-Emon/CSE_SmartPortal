from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import SessionLocal
from app.Rakib.model.notification import Notification

router = APIRouter(prefix="/v1/notifications", tags=["Notifications"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def push(db: Session, user_id: int, text: str, ntype: str = None, link: str = None):
    """Helper other routers call to create a notification."""
    db.add(Notification(user_id=user_id, text=text, type=ntype, link=link))


def ensure_daily_class_digest(db: Session, user_id: int):
    """Lazily create today's "your classes" notification for a student, once per
    day, the first time their client polls notifications. No scheduler needed —
    the bell polls every 30s, so students get it as soon as they open the app.
    Skipped on holidays and when no published routine exists."""
    from datetime import datetime
    from app.Rakib.model.student import Student
    from app.Rakib.model.routine import Routine, RoutineSlot, RoutinePeriod, AcademicHoliday

    try:
        student = db.query(Student).filter(Student.user_id == user_id).first()
        if not student or not student.batch or not student.current_semester:
            return
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        already = (
            db.query(Notification)
            .filter(Notification.user_id == user_id,
                    Notification.type == "routine_daily",
                    Notification.created_at >= today_start)
            .first()
        )
        if already:
            return
        if db.query(AcademicHoliday).filter(
            AcademicHoliday.start_date <= now.date(), AcademicHoliday.end_date >= now.date()
        ).first():
            return
        routine = (
            db.query(Routine)
            .filter(Routine.batch == student.batch,
                    Routine.semester == student.current_semester,
                    Routine.published == True)
            .order_by(Routine.id.desc())
            .first()
        )
        if not routine:
            return
        days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
        day_name = days[(now.weekday() + 1) % 7]
        slots = db.query(RoutineSlot).filter(
            RoutineSlot.routine_id == routine.id, RoutineSlot.day == day_name
        ).all()
        if not slots:
            return
        periods = {p.id: p for p in db.query(RoutinePeriod).all()}
        slots.sort(key=lambda s: (periods[s.period_id].display_order, s.period_id) if s.period_id in periods else (99, 99))
        parts = []
        for s in slots:
            p = periods.get(s.period_id)
            piece = f"{s.course_code or s.course_title or 'Class'}"
            if s.group_label:
                piece += f" [{s.group_label}]"
            if p:
                piece += f" {p.label}"
            if s.room:
                piece += f" (R#{s.room})"
            parts.append(piece)
        db.add(Notification(
            user_id=user_id,
            type="routine_daily",
            text=f"Today's classes ({day_name}, Batch {student.batch} {student.current_semester}): " + " · ".join(parts),
            link="/student-dashboard",
        ))
        db.commit()
    except Exception as e:
        # digest must never break notification polling
        print(f"daily digest skipped: {e}")
        db.rollback()


@router.get("/{user_id}")
def list_notifications(user_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_id == user_id)
        .order_by(desc(Notification.created_at))
        .limit(50)
        .all()
    )
    return [
        {"id": n.id, "type": n.type, "text": n.text, "link": n.link,
         "is_read": n.is_read, "created_at": n.created_at.isoformat() if n.created_at else None}
        for n in rows
    ]


@router.get("/{user_id}/unread-count")
def unread_count(user_id: int, db: Session = Depends(get_db)):
    ensure_daily_class_digest(db, user_id)
    count = db.query(Notification).filter(
        Notification.user_id == user_id, Notification.is_read == False
    ).count()
    return {"count": count}


@router.put("/{notification_id}/read")
def mark_read(notification_id: int, db: Session = Depends(get_db)):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if n:
        n.is_read = True
        db.commit()
    return {"message": "ok"}


@router.put("/user/{user_id}/read-all")
def mark_all_read(user_id: int, db: Session = Depends(get_db)):
    db.query(Notification).filter(
        Notification.user_id == user_id, Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "ok"}
