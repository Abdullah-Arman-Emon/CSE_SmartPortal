import json
from datetime import datetime, date
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Rakib.model.student import Student
from app.Rakib.model.routine import (
    RoutinePeriod, Routine, RoutineSlot, SlotChangeRequest, AcademicHoliday,
)
from app.Rakib.api.NotificationApi import push as push_notification

router = APIRouter(prefix="/v1/routine", tags=["Routine"])

DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]


# ------------------------------------------------------------------ helpers

def require_admin(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can do this")
    return user


def _teacher_name(t: Teacher, user_email: str = None):
    name = f"{t.first_name or ''} {t.last_name or ''}".strip()
    if name:
        return name
    if user_email:
        return user_email.split("@")[0]
    return f"Teacher #{t.id}"


def _initials(name: str):
    parts = [p for p in name.replace(".", " ").split() if p and p[0].isalpha()]
    return "".join(p[0].upper() for p in parts) or "T"


def _tids(slot: RoutineSlot):
    try:
        return [int(x) for x in json.loads(slot.teacher_ids or "[]")]
    except (ValueError, TypeError):
        return []


def _slot_out(slot: RoutineSlot, periods: dict, teacher_names: dict, routine: Routine = None):
    p = periods.get(slot.period_id)
    tids = _tids(slot)
    out = {
        "id": slot.id,
        "routine_id": slot.routine_id,
        "day": slot.day,
        "period_id": slot.period_id,
        "period_label": p.label if p else "?",
        "start_time": p.start_time if p else "",
        "end_time": p.end_time if p else "",
        "course_code": slot.course_code,
        "course_title": slot.course_title,
        "course_id": slot.course_id,
        "teacher_ids": tids,
        "teacher_initials": slot.teacher_initials,
        "teacher_names": [teacher_names.get(t, f"#{t}") for t in tids],
        "room": slot.room,
        "group_label": slot.group_label,
    }
    if routine:
        out["batch"] = routine.batch
        out["semester"] = routine.semester
    return out


def _periods_map(db: Session):
    return {p.id: p for p in db.query(RoutinePeriod).all()}


def _teacher_names_map(db: Session):
    rows = db.query(Teacher, User).join(User, Teacher.user_id == User.id).all()
    return {t.id: _teacher_name(t, u.email) for t, u in rows}


def _admin_user_ids(db: Session):
    return [u.id for u in db.query(User).filter(User.role == "admin").all()]


def _teacher_user_ids(db: Session, teacher_ids: List[int]):
    if not teacher_ids:
        return []
    rows = db.query(Teacher).filter(Teacher.id.in_(teacher_ids)).all()
    return [t.user_id for t in rows if t.user_id]


def _batch_student_user_ids(db: Session, batch: int):
    return [s.user_id for s in db.query(Student).filter(Student.batch == batch).all() if s.user_id]


def check_conflicts(db: Session, routine: Routine, day: str, period_id: int,
                    teacher_ids: List[int], room: Optional[str],
                    group_label: Optional[str], exclude_slot_ids: List[int] = ()):
    """Returns a list of human-readable conflicts for placing a class at
    (day, period) in `routine` with these teachers/room/group."""
    conflicts = []
    teacher_names = _teacher_names_map(db)

    # All slots occupying this day+period in published routines (or this routine)
    candidates = (
        db.query(RoutineSlot, Routine)
        .join(Routine, RoutineSlot.routine_id == Routine.id)
        .filter(RoutineSlot.day == day, RoutineSlot.period_id == period_id)
        .filter((Routine.published == True) | (Routine.id == routine.id))
        .all()
    )
    for slot, r in candidates:
        if slot.id in exclude_slot_ids:
            continue
        label = f"{slot.course_code or slot.course_title or 'a class'}" + (
            f" [{slot.group_label}]" if slot.group_label else ""
        )
        # batch clash: same routine (same batch+semester), overlapping group
        if r.id == routine.id:
            if not (group_label and slot.group_label and group_label != slot.group_label):
                conflicts.append(
                    f"Batch {r.batch} ({r.semester}) already has {label} at that time"
                )
        # teacher clash: any shared teacher anywhere
        shared = set(_tids(slot)) & set(teacher_ids or [])
        for t in shared:
            conflicts.append(
                f"{teacher_names.get(t, f'Teacher #{t}')} is already taking {label} "
                f"(Batch {r.batch}, {r.semester}) at that time"
            )
        # room clash
        if room and slot.room and room.strip().lower() == slot.room.strip().lower():
            conflicts.append(
                f"Room {room} is occupied by {label} (Batch {r.batch}, {r.semester}) at that time"
            )
    return conflicts


def _holiday_for(db: Session, d: date):
    return (
        db.query(AcademicHoliday)
        .filter(AcademicHoliday.start_date <= d, AcademicHoliday.end_date >= d)
        .first()
    )


def _parse_date(s: str, field: str):
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail=f"{field} must be YYYY-MM-DD")


# ------------------------------------------------------------------ schemas

class PeriodIn(BaseModel):
    label: str
    start_time: str
    end_time: str
    display_order: Optional[int] = 0


class RoutineIn(BaseModel):
    batch: int
    semester: str
    title: Optional[str] = None
    room_note: Optional[str] = None
    class_start_date: Optional[str] = None
    copy_from_routine_id: Optional[int] = None


class RoutineUpdate(BaseModel):
    batch: Optional[int] = None
    semester: Optional[str] = None
    title: Optional[str] = None
    room_note: Optional[str] = None
    class_start_date: Optional[str] = None
    published: Optional[bool] = None


class SlotIn(BaseModel):
    routine_id: int
    day: str
    period_id: int
    course_id: Optional[int] = None          # link to a real Course offering
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    teacher_ids: Optional[List[int]] = None
    teacher_initials: Optional[str] = None
    room: Optional[str] = None
    group_label: Optional[str] = None
    force: Optional[bool] = False


class SlotUpdate(BaseModel):
    day: Optional[str] = None
    period_id: Optional[int] = None
    course_id: Optional[int] = None
    course_code: Optional[str] = None
    course_title: Optional[str] = None
    teacher_ids: Optional[List[int]] = None
    teacher_initials: Optional[str] = None
    room: Optional[str] = None
    group_label: Optional[str] = None
    force: Optional[bool] = False


class RequestIn(BaseModel):
    slot_id: int
    type: str                                # "move" | "swap"
    target_slot_id: Optional[int] = None     # swap
    proposed_day: Optional[str] = None       # move
    proposed_period_id: Optional[int] = None # move
    proposed_room: Optional[str] = None      # move
    reason: Optional[str] = None


class HolidayIn(BaseModel):
    title: str
    kind: Optional[str] = "holiday"
    start_date: str
    end_date: Optional[str] = None


# ------------------------------------------------------------------ reads

@router.get("/periods")
def list_periods(db: Session = Depends(get_db)):
    rows = db.query(RoutinePeriod).order_by(RoutinePeriod.display_order, RoutinePeriod.id).all()
    return [
        {"id": p.id, "label": p.label, "start_time": p.start_time,
         "end_time": p.end_time, "display_order": p.display_order}
        for p in rows
    ]


@router.get("/teachers")
def list_teachers(db: Session = Depends(get_db)):
    rows = db.query(Teacher, User).join(User, Teacher.user_id == User.id).all()
    out = []
    for t, u in rows:
        name = _teacher_name(t, u.email)
        out.append({"teacher_id": t.id, "user_id": u.id, "name": name, "initials": _initials(name)})
    return sorted(out, key=lambda x: x["name"].lower())


@router.get("/list")
def list_routines(db: Session = Depends(get_db)):
    rows = db.query(Routine).order_by(Routine.batch.desc(), Routine.semester).all()
    counts = {}
    for rid, in db.query(RoutineSlot.routine_id).all():
        counts[rid] = counts.get(rid, 0) + 1
    return [
        {"id": r.id, "batch": r.batch, "semester": r.semester, "title": r.title,
         "room_note": r.room_note, "class_start_date": r.class_start_date,
         "published": r.published, "slot_count": counts.get(r.id, 0)}
        for r in rows
    ]


@router.get("/grid")
def get_grid(routine_id: Optional[int] = None, batch: Optional[int] = None,
             semester: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Routine)
    if routine_id:
        routine = q.filter(Routine.id == routine_id).first()
    else:
        if batch is None or not semester:
            raise HTTPException(status_code=400, detail="Pass routine_id or batch+semester")
        routine = (
            q.filter(Routine.batch == batch, Routine.semester == semester)
            .order_by(Routine.published.desc(), Routine.id.desc())
            .first()
        )
    if not routine:
        raise HTTPException(status_code=404, detail="No routine found for this batch/semester yet")
    periods = _periods_map(db)
    names = _teacher_names_map(db)
    slots = db.query(RoutineSlot).filter(RoutineSlot.routine_id == routine.id).all()
    return {
        "routine": {
            "id": routine.id, "batch": routine.batch, "semester": routine.semester,
            "title": routine.title, "room_note": routine.room_note,
            "class_start_date": routine.class_start_date, "published": routine.published,
        },
        "days": DAYS[:5],
        "periods": [
            {"id": p.id, "label": p.label, "start_time": p.start_time, "end_time": p.end_time}
            for p in sorted(periods.values(), key=lambda x: (x.display_order, x.id))
        ],
        "slots": [_slot_out(s, periods, names, routine) for s in slots],
    }


@router.get("/teacher/{teacher_id}/slots")
def teacher_slots(teacher_id: int, db: Session = Depends(get_db)):
    """Every published class that belongs to this teacher — whether they are
    listed on the slot (teacher_ids) OR the slot's linked course is one they
    teach (course.teacher_id). This keeps a teacher's routine in sync with the
    courses they actually run, across every active batch."""
    from app.Emon.model.course import Course
    periods = _periods_map(db)
    names = _teacher_names_map(db)
    # course ids owned by this teacher (source of truth: who runs the course)
    my_course_ids = {
        c.id for c in db.query(Course.id).filter(Course.teacher_id == teacher_id).all()
    }
    rows = (
        db.query(RoutineSlot, Routine)
        .join(Routine, RoutineSlot.routine_id == Routine.id)
        .filter(Routine.published == True)
        .all()
    )
    out = []
    for s, r in rows:
        mine_by_slot = teacher_id in _tids(s)
        mine_by_course = s.course_id is not None and s.course_id in my_course_ids
        if not (mine_by_slot or mine_by_course):
            continue
        d = _slot_out(s, periods, names, r)
        d["you_teach"] = mine_by_course  # linked to a course you own
        out.append(d)
    order = {p.id: (p.display_order, p.id) for p in periods.values()}
    out.sort(key=lambda s: (
        -(s.get("batch") or 0),  # newest batch first
        DAYS.index(s["day"]) if s["day"] in DAYS else 9,
        order.get(s["period_id"], (99, 99)),
    ))
    return out


@router.get("/availability")
def availability(routine_id: int, teacher_ids: Optional[str] = Query(None, description="comma-separated Teacher.id"),
                 room: Optional[str] = None, group_label: Optional[str] = None,
                 exclude_slot_id: Optional[int] = None, db: Session = Depends(get_db)):
    """Free/busy matrix for every day×period cell of a routine, optionally for
    specific teachers / a room. Used by the grid editor and the move/swap pickers."""
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    tids = []
    if teacher_ids:
        try:
            tids = [int(x) for x in teacher_ids.split(",") if x.strip()]
        except ValueError:
            raise HTTPException(status_code=400, detail="teacher_ids must be comma-separated ints")
    periods = sorted(_periods_map(db).values(), key=lambda x: (x.display_order, x.id))
    excl = [exclude_slot_id] if exclude_slot_id else []
    matrix = {}
    for day in DAYS[:5]:
        matrix[day] = {}
        for p in periods:
            conflicts = check_conflicts(db, routine, day, p.id, tids, room, group_label, excl)
            matrix[day][p.id] = {"free": len(conflicts) == 0, "conflicts": conflicts}
    return {"routine_id": routine.id, "matrix": matrix}


@router.get("/today")
def today_classes(batch: int, semester: str, db: Session = Depends(get_db)):
    now = datetime.now()
    day_name = DAYS[(now.weekday() + 1) % 7]  # Python: Mon=0 → our list starts Sunday
    holiday = _holiday_for(db, now.date())
    routine = (
        db.query(Routine)
        .filter(Routine.batch == batch, Routine.semester == semester, Routine.published == True)
        .order_by(Routine.id.desc())
        .first()
    )
    if not routine:
        return {"date": now.date().isoformat(), "day": day_name, "holiday": None, "classes": []}
    classes = []
    if not holiday:
        periods = _periods_map(db)
        names = _teacher_names_map(db)
        slots = db.query(RoutineSlot).filter(
            RoutineSlot.routine_id == routine.id, RoutineSlot.day == day_name
        ).all()
        order = {p.id: (p.display_order, p.id) for p in periods.values()}
        slots.sort(key=lambda s: order.get(s.period_id, (99, 99)))
        classes = [_slot_out(s, periods, names, routine) for s in slots]
    return {
        "date": now.date().isoformat(),
        "day": day_name,
        "holiday": {"title": holiday.title, "kind": holiday.kind} if holiday else None,
        "classes": classes,
    }


@router.get("/student/timeline")
def student_routine_timeline(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Every semester this student's batch has reached, past → current, each with
    its published routine (if any). Pure derivation from batch + current_semester
    — no per-student history is stored."""
    from app.Rakib.model.batch_term import BSC_SEMESTER_ORDER
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    curr = student.current_semester
    order = BSC_SEMESTER_ORDER
    idx = order.index(curr) if curr in order else (len(order) - 1)
    reached = order[: idx + 1] if curr in order else order
    counts = {}
    for rid, in db.query(RoutineSlot.routine_id).all():
        counts[rid] = counts.get(rid, 0) + 1
    terms = []
    for sem in reached:
        routine = (
            db.query(Routine)
            .filter(Routine.batch == student.batch, Routine.semester == sem)
            .order_by(Routine.published.desc(), Routine.id.desc())
            .first()
        )
        terms.append({
            "batch": student.batch,
            "semester": sem,
            "is_current": sem == curr,
            "routine_id": routine.id if routine else None,
            "published": bool(routine and routine.published),
            "slot_count": counts.get(routine.id, 0) if routine else 0,
            "title": routine.title if routine else None,
        })
    return {"batch": student.batch, "current_semester": curr, "terms": terms}


@router.get("/teacher/timeline")
def teacher_routine_timeline(teacher_id: int = Query(...), db: Session = Depends(get_db)):
    """Distinct (batch, semester) terms this teacher has taught in — derived from
    the courses they own — each with that term's published routine. Lets a teacher
    reach the routine of any batch/semester they were part of, past or current."""
    from app.Emon.model.course import Course
    from app.Rakib.model.batch_term import semester_rank
    counts = {}
    for rid, in db.query(RoutineSlot.routine_id).all():
        counts[rid] = counts.get(rid, 0) + 1
    courses = db.query(Course).filter(Course.teacher_id == teacher_id).all()
    seen = {}
    for c in courses:
        key = (c.batch, c.semester)
        entry = seen.setdefault(key, {"course_count": 0, "active": False})
        entry["course_count"] += 1
        if (c.status or ("active" if c.running else "completed")) == "active":
            entry["active"] = True
    terms = []
    for (batch, semester), meta in seen.items():
        if not semester or "," in (semester or ""):
            continue  # skip legacy multi-semester course values
        routine = (
            db.query(Routine)
            .filter(Routine.batch == batch, Routine.semester == semester)
            .order_by(Routine.published.desc(), Routine.id.desc())
            .first()
        )
        terms.append({
            "batch": batch,
            "semester": semester,
            "is_current": meta["active"],
            "course_count": meta["course_count"],
            "routine_id": routine.id if routine else None,
            "published": bool(routine and routine.published),
            "slot_count": counts.get(routine.id, 0) if routine else 0,
        })
    terms.sort(key=lambda t: (-(t["batch"] or 0), semester_rank(t["semester"])))
    return {"teacher_id": teacher_id, "terms": terms}


@router.get("/holidays")
def list_holidays(db: Session = Depends(get_db)):
    rows = db.query(AcademicHoliday).order_by(AcademicHoliday.start_date).all()
    return [
        {"id": h.id, "title": h.title, "kind": h.kind,
         "start_date": h.start_date.isoformat(), "end_date": h.end_date.isoformat()}
        for h in rows
    ]


# ------------------------------------------------------------------ admin CRUD

@router.post("/admin/periods")
def create_period(data: PeriodIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = RoutinePeriod(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return {"id": row.id}


@router.put("/admin/periods/{period_id}")
def update_period(period_id: int, data: PeriodIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(RoutinePeriod).filter(RoutinePeriod.id == period_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Period not found")
    for k, v in data.model_dump().items():
        setattr(row, k, v)
    db.commit()
    return {"message": "updated"}


@router.delete("/admin/periods/{period_id}")
def delete_period(period_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    if db.query(RoutineSlot).filter(RoutineSlot.period_id == period_id).first():
        raise HTTPException(status_code=400, detail="Period is used by routine slots — remove them first")
    row = db.query(RoutinePeriod).filter(RoutinePeriod.id == period_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Period not found")
    db.delete(row)
    db.commit()
    return {"message": "deleted"}


@router.post("/admin/routines")
def create_routine(data: RoutineIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    payload = data.model_dump()
    copy_from = payload.pop("copy_from_routine_id", None)
    routine = Routine(**payload)
    db.add(routine)
    db.commit()
    db.refresh(routine)
    copied = 0
    if copy_from:
        for s in db.query(RoutineSlot).filter(RoutineSlot.routine_id == copy_from).all():
            db.add(RoutineSlot(
                routine_id=routine.id, day=s.day, period_id=s.period_id,
                course_code=s.course_code, course_title=s.course_title,
                teacher_ids=s.teacher_ids, teacher_initials=s.teacher_initials,
                room=s.room, group_label=s.group_label,
            ))
            copied += 1
        db.commit()
    return {"id": routine.id, "copied_slots": copied}


@router.put("/admin/routines/{routine_id}")
def update_routine(routine_id: int, data: RoutineUpdate, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    updates = data.model_dump(exclude_unset=True)
    newly_published = updates.get("published") and not routine.published
    for k, v in updates.items():
        setattr(routine, k, v)
    db.commit()
    if newly_published:
        for uid in _batch_student_user_ids(db, routine.batch):
            push_notification(db, uid,
                              f"Class routine published for Batch {routine.batch} ({routine.semester}) — check the Routine tab.",
                              ntype="routine", link="/student-dashboard")
        db.commit()
    return {"message": "updated"}


@router.delete("/admin/routines/{routine_id}")
def delete_routine(routine_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    routine = db.query(Routine).filter(Routine.id == routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    slot_ids = [s.id for (s,) in db.query(RoutineSlot).filter(RoutineSlot.routine_id == routine_id).with_entities(RoutineSlot).all()]
    if slot_ids:
        db.query(SlotChangeRequest).filter(
            (SlotChangeRequest.slot_id.in_(slot_ids)) | (SlotChangeRequest.target_slot_id.in_(slot_ids))
        ).delete(synchronize_session=False)
    db.query(RoutineSlot).filter(RoutineSlot.routine_id == routine_id).delete(synchronize_session=False)
    db.delete(routine)
    db.commit()
    return {"message": "deleted"}


def _hydrate_from_course(db: Session, payload: dict):
    """If a slot references a real Course (course_id), pull its code/title and
    the course teacher into the slot so curriculum→course→routine stay in sync.
    Explicit values in the payload still win (admin can override)."""
    cid = payload.get("course_id")
    if not cid:
        return payload
    from app.Emon.model.course import Course
    course = db.query(Course).filter(Course.id == cid).first()
    if not course:
        return payload
    # fill when absent OR explicitly empty (model_dump sends None for unset fields)
    if not payload.get("course_code"):
        payload["course_code"] = course.code
    if not payload.get("course_title"):
        payload["course_title"] = course.title
    # default the teacher to the course owner when none was chosen explicitly
    if not payload.get("teacher_ids") and course.teacher_id:
        payload["teacher_ids"] = [course.teacher_id]
        t = course.teacher
        if t and not payload.get("teacher_initials"):
            payload["teacher_initials"] = _initials(_teacher_name(t))
    return payload


def _apply_slot_payload(payload: dict):
    if "teacher_ids" in payload:
        payload["teacher_ids"] = json.dumps(payload["teacher_ids"] or [])
    return payload


@router.get("/admin/courses")
def routine_courses(batch: int = Query(...), semester: Optional[str] = Query(None),
                    db: Session = Depends(get_db)):
    """Courses available to attach to a batch's routine slots — the bridge that
    lets admin *select* instead of retyping course code/title/teacher."""
    from app.Emon.model.course import Course
    q = db.query(Course).filter(Course.batch == batch)
    if semester:
        q = q.filter(Course.semester == semester)
    names = _teacher_names_map(db)
    out = []
    for c in q.order_by(Course.id.desc()).all():
        out.append({
            "course_id": c.id,
            "code": c.code,
            "course_code": c.course_code,
            "title": c.title,
            "type": c.type,
            "status": c.status or ("active" if c.running else "completed"),
            "teacher_id": c.teacher_id,
            "teacher_name": names.get(c.teacher_id, ""),
            "teacher_initials": _initials(names.get(c.teacher_id, "T")) if c.teacher_id else "",
        })
    return out


@router.post("/admin/slots")
def create_slot(data: SlotIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    routine = db.query(Routine).filter(Routine.id == data.routine_id).first()
    if not routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    if data.day not in DAYS:
        raise HTTPException(status_code=400, detail="day must be a full weekday name")
    if not db.query(RoutinePeriod).filter(RoutinePeriod.id == data.period_id).first():
        raise HTTPException(status_code=404, detail="Period not found")
    payload = _hydrate_from_course(db, data.model_dump())
    force = payload.pop("force", False)
    conflicts = check_conflicts(db, routine, data.day, data.period_id,
                                payload.get("teacher_ids") or [], payload.get("room"), payload.get("group_label"))
    if conflicts and not force:
        raise HTTPException(status_code=409, detail={"conflicts": conflicts})
    row = RoutineSlot(**_apply_slot_payload(payload))
    db.add(row)
    db.commit()
    db.refresh(row)
    return _slot_out(row, _periods_map(db), _teacher_names_map(db), routine)


@router.put("/admin/slots/{slot_id}")
def update_slot(slot_id: int, data: SlotUpdate, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(RoutineSlot).filter(RoutineSlot.id == slot_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Slot not found")
    routine = db.query(Routine).filter(Routine.id == row.routine_id).first()
    updates = _hydrate_from_course(db, data.model_dump(exclude_unset=True))
    force = updates.pop("force", False)
    day = updates.get("day", row.day)
    period_id = updates.get("period_id", row.period_id)
    teacher_ids = updates.get("teacher_ids", _tids(row))
    room = updates.get("room", row.room)
    group_label = updates.get("group_label", row.group_label)
    conflicts = check_conflicts(db, routine, day, period_id, teacher_ids or [],
                                room, group_label, exclude_slot_ids=[row.id])
    if conflicts and not force:
        raise HTTPException(status_code=409, detail={"conflicts": conflicts})
    for k, v in _apply_slot_payload(updates).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _slot_out(row, _periods_map(db), _teacher_names_map(db), routine)


@router.delete("/admin/slots/{slot_id}")
def delete_slot(slot_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(RoutineSlot).filter(RoutineSlot.id == slot_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Slot not found")
    db.query(SlotChangeRequest).filter(
        (SlotChangeRequest.slot_id == slot_id) | (SlotChangeRequest.target_slot_id == slot_id)
    ).delete(synchronize_session=False)
    db.delete(row)
    db.commit()
    return {"message": "deleted"}


@router.post("/admin/holidays")
def create_holiday(data: HolidayIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    start = _parse_date(data.start_date, "start_date")
    end = _parse_date(data.end_date, "end_date") if data.end_date else start
    if end < start:
        raise HTTPException(status_code=400, detail="end_date is before start_date")
    row = AcademicHoliday(title=data.title, kind=data.kind or "holiday",
                          start_date=start, end_date=end)
    db.add(row)
    db.commit()
    return {"id": row.id}


@router.delete("/admin/holidays/{holiday_id}")
def delete_holiday(holiday_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(AcademicHoliday).filter(AcademicHoliday.id == holiday_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Holiday not found")
    db.delete(row)
    db.commit()
    return {"message": "deleted"}


# ------------------------------------------------------------------ change requests

def _request_out(req: SlotChangeRequest, db: Session):
    periods = _periods_map(db)
    names = _teacher_names_map(db)
    slot = db.query(RoutineSlot).filter(RoutineSlot.id == req.slot_id).first()
    routine = db.query(Routine).filter(Routine.id == slot.routine_id).first() if slot else None
    target = db.query(RoutineSlot).filter(RoutineSlot.id == req.target_slot_id).first() if req.target_slot_id else None
    target_routine = db.query(Routine).filter(Routine.id == target.routine_id).first() if target else None
    p = periods.get(req.proposed_period_id) if req.proposed_period_id else None
    return {
        "id": req.id,
        "type": req.type,
        "status": req.status,
        "reason": req.reason,
        "requested_by": req.requested_by,
        "requested_by_name": names.get(req.requested_by, f"#{req.requested_by}"),
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "slot": _slot_out(slot, periods, names, routine) if slot else None,
        "target_slot": _slot_out(target, periods, names, target_routine) if target else None,
        "proposed_day": req.proposed_day,
        "proposed_period_id": req.proposed_period_id,
        "proposed_period_label": p.label if p else None,
        "proposed_room": req.proposed_room,
    }


@router.post("/requests")
def create_request(data: RequestIn, teacher_id: int = Query(...), db: Session = Depends(get_db)):
    slot = db.query(RoutineSlot).filter(RoutineSlot.id == data.slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if teacher_id not in _tids(slot):
        raise HTTPException(status_code=403, detail="You can only request changes for your own class")
    routine = db.query(Routine).filter(Routine.id == slot.routine_id).first()
    names = _teacher_names_map(db)
    me = names.get(teacher_id, f"Teacher #{teacher_id}")
    periods = _periods_map(db)

    if data.type == "swap":
        target = db.query(RoutineSlot).filter(RoutineSlot.id == data.target_slot_id).first()
        if not target or target.id == slot.id:
            raise HTTPException(status_code=400, detail="Pick a valid class to swap with")
        target_tids = _tids(target)
        if not target_tids:
            raise HTTPException(status_code=400, detail="That class has no assigned teacher account to agree to the swap")
        if teacher_id in target_tids:
            raise HTTPException(status_code=400, detail="That is your own class — use a move request instead")
        req = SlotChangeRequest(
            slot_id=slot.id, requested_by=teacher_id, type="swap",
            target_slot_id=target.id, reason=data.reason, status="pending_teacher",
        )
        db.add(req)
        p = periods.get(slot.period_id)
        tp = periods.get(target.period_id)
        for uid in _teacher_user_ids(db, target_tids):
            push_notification(
                db, uid,
                f"{me} proposes swapping their {slot.course_code or 'class'} "
                f"({slot.day} {p.label if p else ''}) with your {target.course_code or 'class'} "
                f"({target.day} {tp.label if tp else ''}). Open Routine → Requests to accept or decline.",
                ntype="routine", link="/teacher-dashboard",
            )
        db.commit()
        db.refresh(req)
        return _request_out(req, db)

    if data.type == "move":
        if data.proposed_day not in DAYS or not data.proposed_period_id:
            raise HTTPException(status_code=400, detail="Pick the day and period you want to move to")
        conflicts = check_conflicts(
            db, routine, data.proposed_day, data.proposed_period_id, _tids(slot),
            data.proposed_room if data.proposed_room is not None else slot.room,
            slot.group_label, exclude_slot_ids=[slot.id],
        )
        if conflicts:
            raise HTTPException(status_code=409, detail={"conflicts": conflicts})
        req = SlotChangeRequest(
            slot_id=slot.id, requested_by=teacher_id, type="move",
            proposed_day=data.proposed_day, proposed_period_id=data.proposed_period_id,
            proposed_room=data.proposed_room, reason=data.reason, status="pending_admin",
        )
        db.add(req)
        p = periods.get(data.proposed_period_id)
        for uid in _admin_user_ids(db):
            push_notification(
                db, uid,
                f"{me} requests moving {slot.course_code or 'a class'} (Batch {routine.batch}, {routine.semester}) "
                f"from {slot.day} to {data.proposed_day} {p.label if p else ''}. Approve in Admin → Routine.",
                ntype="routine", link="/admin-dashboard",
            )
        db.commit()
        db.refresh(req)
        return _request_out(req, db)

    raise HTTPException(status_code=400, detail="type must be move or swap")


@router.get("/requests")
def my_requests(teacher_id: int = Query(...), db: Session = Depends(get_db)):
    """Requests where this teacher is the requester OR a target-slot teacher."""
    reqs = db.query(SlotChangeRequest).order_by(SlotChangeRequest.id.desc()).limit(100).all()
    out = []
    for r in reqs:
        involved = r.requested_by == teacher_id
        if not involved and r.target_slot_id:
            target = db.query(RoutineSlot).filter(RoutineSlot.id == r.target_slot_id).first()
            involved = target is not None and teacher_id in _tids(target)
        if involved:
            item = _request_out(r, db)
            item["incoming"] = r.requested_by != teacher_id
            out.append(item)
    return out


@router.get("/requests/admin")
def admin_requests(user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    reqs = db.query(SlotChangeRequest).order_by(SlotChangeRequest.id.desc()).limit(100).all()
    return [_request_out(r, db) for r in reqs]


def _notify_reschedule(db: Session, routine: Routine, text: str):
    for uid in _batch_student_user_ids(db, routine.batch):
        push_notification(db, uid, text, ntype="routine", link="/student-dashboard")
    for uid in _admin_user_ids(db):
        push_notification(db, uid, text, ntype="routine", link="/admin-dashboard")


@router.put("/requests/{request_id}/accept")
def accept_request(request_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    req = db.query(SlotChangeRequest).filter(SlotChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in ("pending_teacher", "pending_admin"):
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")
    periods = _periods_map(db)
    names = _teacher_names_map(db)
    slot = db.query(RoutineSlot).filter(RoutineSlot.id == req.slot_id).first()
    if not slot:
        raise HTTPException(status_code=400, detail="The class no longer exists")
    routine = db.query(Routine).filter(Routine.id == slot.routine_id).first()

    if req.type == "swap":
        # only a teacher of the target slot may accept
        target = db.query(RoutineSlot).filter(RoutineSlot.id == req.target_slot_id).first()
        if not target:
            raise HTTPException(status_code=400, detail="The other class no longer exists")
        caller = db.query(Teacher).filter(Teacher.user_id == user_id).first()
        if not caller or caller.id not in _tids(target):
            raise HTTPException(status_code=403, detail="Only the other class's teacher can accept this swap")
        target_routine = db.query(Routine).filter(Routine.id == target.routine_id).first()
        # re-validate both new placements (rooms travel with the course)
        c1 = check_conflicts(db, routine, target.day, target.period_id, _tids(slot),
                             slot.room, slot.group_label, exclude_slot_ids=[slot.id, target.id])
        c2 = check_conflicts(db, target_routine, slot.day, slot.period_id, _tids(target),
                             target.room, target.group_label, exclude_slot_ids=[slot.id, target.id])
        conflicts = c1 + c2
        if conflicts:
            raise HTTPException(status_code=409, detail={"conflicts": conflicts})
        slot.day, target.day = target.day, slot.day
        slot.period_id, target.period_id = target.period_id, slot.period_id
        req.status = "applied"
        req.decided_by = user_id
        req.decided_at = datetime.utcnow()
        p = periods.get(slot.period_id)
        tp = periods.get(target.period_id)
        text = (f"Routine updated: {slot.course_code or 'a class'} is now {slot.day} {p.label if p else ''} "
                f"and {target.course_code or 'a class'} is now {target.day} {tp.label if tp else ''} (teacher swap).")
        _notify_reschedule(db, routine, text)
        if target_routine.id != routine.id:
            _notify_reschedule(db, target_routine, text)
        for uid in _teacher_user_ids(db, [req.requested_by]):
            push_notification(db, uid, f"Your swap request was accepted. {text}",
                              ntype="routine", link="/teacher-dashboard")
        db.commit()
        return _request_out(req, db)

    # move: admin accepts
    require_admin(user_id, db)
    conflicts = check_conflicts(
        db, routine, req.proposed_day, req.proposed_period_id, _tids(slot),
        req.proposed_room if req.proposed_room is not None else slot.room,
        slot.group_label, exclude_slot_ids=[slot.id],
    )
    if conflicts:
        raise HTTPException(status_code=409, detail={"conflicts": conflicts})
    old_day = slot.day
    slot.day = req.proposed_day
    slot.period_id = req.proposed_period_id
    if req.proposed_room:
        slot.room = req.proposed_room
    req.status = "applied"
    req.decided_by = user_id
    req.decided_at = datetime.utcnow()
    p = periods.get(slot.period_id)
    text = (f"Routine updated: {slot.course_code or 'a class'} (Batch {routine.batch}, {routine.semester}) "
            f"moved from {old_day} to {slot.day} {p.label if p else ''}"
            + (f", Room {slot.room}" if slot.room else "") + ".")
    _notify_reschedule(db, routine, text)
    for uid in _teacher_user_ids(db, [req.requested_by]):
        push_notification(db, uid, f"Your move request was approved. {text}",
                          ntype="routine", link="/teacher-dashboard")
    db.commit()
    return _request_out(req, db)


@router.put("/requests/{request_id}/decline")
def decline_request(request_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    req = db.query(SlotChangeRequest).filter(SlotChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status not in ("pending_teacher", "pending_admin"):
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")
    caller = db.query(User).filter(User.id == user_id).first()
    allowed = caller is not None and caller.role == "admin"
    if not allowed and req.type == "swap" and req.target_slot_id:
        t = db.query(Teacher).filter(Teacher.user_id == user_id).first()
        target = db.query(RoutineSlot).filter(RoutineSlot.id == req.target_slot_id).first()
        allowed = t is not None and target is not None and t.id in _tids(target)
    if not allowed:
        raise HTTPException(status_code=403, detail="You are not allowed to decline this request")
    req.status = "declined"
    req.decided_by = user_id
    req.decided_at = datetime.utcnow()
    for uid in _teacher_user_ids(db, [req.requested_by]):
        push_notification(db, uid, "Your routine change request was declined.",
                          ntype="routine", link="/teacher-dashboard")
    db.commit()
    return {"message": "declined"}


@router.put("/requests/{request_id}/cancel")
def cancel_request(request_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    req = db.query(SlotChangeRequest).filter(SlotChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    t = db.query(Teacher).filter(Teacher.user_id == user_id).first()
    if not t or t.id != req.requested_by:
        raise HTTPException(status_code=403, detail="Only the requester can cancel")
    if req.status not in ("pending_teacher", "pending_admin"):
        raise HTTPException(status_code=400, detail=f"Request is already {req.status}")
    req.status = "cancelled"
    req.decided_by = user_id
    req.decided_at = datetime.utcnow()
    db.commit()
    return {"message": "cancelled"}
