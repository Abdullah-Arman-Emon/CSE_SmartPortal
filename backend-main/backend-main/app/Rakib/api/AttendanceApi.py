from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from datetime import date as date_type
from typing import List, Optional
from pydantic import BaseModel

from app.Rakib.model.attendance import Attendance
from app.Rakib.model.student import Student
from app.Emon.model.course import Course

router = APIRouter(prefix="/v1/attendance", tags=["Attendance"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


ALLOWED = {"present", "absent", "late"}


class AttendanceRecord(BaseModel):
    student_id: int
    status: str


class MarkRequest(BaseModel):
    course_id: int
    date: date_type
    records: List[AttendanceRecord]


def _student_name(s: Student) -> str:
    return f"{s.first_name or ''} {s.last_name or ''}".strip() or "Student"


@router.get("/course/{course_id}/students")
def course_students(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return [
        {"id": s.id, "name": _student_name(s), "batch": s.batch}
        for s in sorted(course.students, key=lambda x: x.id)
    ]


@router.post("/mark")
def mark_attendance(payload: MarkRequest, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    for rec in payload.records:
        status = rec.status.lower()
        if status not in ALLOWED:
            raise HTTPException(status_code=422, detail=f"Invalid status: {rec.status}")
        existing = (
            db.query(Attendance)
            .filter(
                Attendance.course_id == payload.course_id,
                Attendance.student_id == rec.student_id,
                Attendance.date == payload.date,
            )
            .first()
        )
        if existing:
            existing.status = status
        else:
            db.add(
                Attendance(
                    course_id=payload.course_id,
                    student_id=rec.student_id,
                    date=payload.date,
                    status=status,
                )
            )
    db.commit()
    return {"message": "Attendance saved", "count": len(payload.records)}


@router.get("/course/{course_id}")
def course_attendance(course_id: int, date: Optional[date_type] = Query(None), db: Session = Depends(get_db)):
    q = db.query(Attendance).filter(Attendance.course_id == course_id)
    if date:
        q = q.filter(Attendance.date == date)
    return [
        {"student_id": a.student_id, "date": str(a.date), "status": a.status}
        for a in q.all()
    ]


def _percent(present_like: int, total: int) -> float:
    return round((present_like / total) * 100, 1) if total else 0.0


def _date_window(q, from_date: Optional[date_type], to_date: Optional[date_type]):
    if from_date:
        q = q.filter(Attendance.date >= from_date)
    if to_date:
        q = q.filter(Attendance.date <= to_date)
    return q


@router.get("/course/{course_id}/report")
def course_report(
    course_id: int,
    from_date: Optional[date_type] = Query(None),
    to_date: Optional[date_type] = Query(None),
    db: Session = Depends(get_db),
):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    q = _date_window(db.query(Attendance).filter(Attendance.course_id == course_id), from_date, to_date)
    rows = q.all()
    # distinct session dates for this course (within the window)
    total_sessions = len({r.date for r in rows})

    per_student = {}
    for r in rows:
        d = per_student.setdefault(r.student_id, {"present": 0, "late": 0, "absent": 0})
        d[r.status] = d.get(r.status, 0) + 1

    report = []
    for s in sorted(course.students, key=lambda x: x.id):
        counts = per_student.get(s.id, {"present": 0, "late": 0, "absent": 0})
        attended = counts.get("present", 0) + counts.get("late", 0)
        pct = _percent(attended, total_sessions)
        report.append({
            "student_id": s.id,
            "name": _student_name(s),
            "batch": s.batch,
            "present": counts.get("present", 0),
            "late": counts.get("late", 0),
            "absent": counts.get("absent", 0),
            "total_sessions": total_sessions,
            "percentage": pct,
            "eligible": pct >= 75,
        })
    return {
        "course_id": course_id,
        "course_title": course.title,
        "course_code": course.course_code or course.code,
        "batch": course.batch,
        "semester": course.semester,
        "total_sessions": total_sessions,
        "students": report,
    }


@router.get("/course/{course_id}/matrix")
def course_matrix(
    course_id: int,
    from_date: Optional[date_type] = Query(None),
    to_date: Optional[date_type] = Query(None),
    db: Session = Depends(get_db),
):
    """Date-wise register: every session date x every student with P/L/A status."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    q = _date_window(db.query(Attendance).filter(Attendance.course_id == course_id), from_date, to_date)
    rows = q.all()
    dates = sorted({r.date for r in rows})

    by_student = {}
    for r in rows:
        by_student.setdefault(r.student_id, {})[str(r.date)] = r.status

    return {
        "course_id": course_id,
        "course_title": course.title,
        "course_code": course.course_code or course.code,
        "dates": [str(d) for d in dates],
        "students": [
            {
                "student_id": s.id,
                "name": _student_name(s),
                "batch": s.batch,
                "marks": by_student.get(s.id, {}),
            }
            for s in sorted(course.students, key=lambda x: x.id)
        ],
    }


@router.get("/student/{student_id}")
def student_attendance(
    student_id: int,
    course_id: Optional[int] = Query(None),
    detail: bool = Query(False),
    db: Session = Depends(get_db),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    courses = [c for c in student.courses if course_id is None or c.id == course_id]
    result = []
    for course in courses:
        rows = db.query(Attendance).filter(Attendance.course_id == course.id).all()
        total_sessions = len({r.date for r in rows})
        mine = [r for r in rows if r.student_id == student_id]
        attended = sum(1 for r in mine if r.status in ("present", "late"))
        entry = {
            "course_id": course.id,
            "course_title": course.title,
            "course_code": course.course_code or course.code,
            "attended": attended,
            "total_sessions": total_sessions,
            "percentage": _percent(attended, total_sessions),
            "eligible": _percent(attended, total_sessions) >= 75,
        }
        if detail:
            entry["records"] = [
                {"date": str(r.date), "status": r.status}
                for r in sorted(mine, key=lambda r: r.date)
            ]
        result.append(entry)
    return result


@router.get("/overview")
def overview(
    batch: Optional[int] = Query(None),
    semester: Optional[str] = Query(None),
    from_date: Optional[date_type] = Query(None),
    to_date: Optional[date_type] = Query(None),
    q: Optional[str] = Query(None, description="course title/code contains"),
    db: Session = Depends(get_db),
):
    """Admin read-only: per-course attendance health, optionally filtered."""
    cq = db.query(Course)
    if batch is not None:
        cq = cq.filter(Course.batch == batch)
    if semester:
        cq = cq.filter(Course.semester == semester)
    if q:
        like = f"%{q}%"
        cq = cq.filter(
            (Course.title.like(like)) | (Course.code.like(like)) | (Course.course_code.like(like))
        )
    courses = cq.all()

    out = []
    for course in courses:
        rows = _date_window(
            db.query(Attendance).filter(Attendance.course_id == course.id), from_date, to_date
        ).all()
        total_sessions = len({r.date for r in rows})
        enrolled = len(course.students)
        # average attendance % across enrolled students
        if total_sessions and enrolled:
            per_student = {}
            for r in rows:
                if r.status in ("present", "late"):
                    per_student[r.student_id] = per_student.get(r.student_id, 0) + 1
            avg = round(
                sum(_percent(per_student.get(s.id, 0), total_sessions) for s in course.students) / enrolled,
                1,
            )
            at_risk = sum(
                1 for s in course.students if _percent(per_student.get(s.id, 0), total_sessions) < 75
            )
        else:
            avg, at_risk = 0.0, 0
        out.append({
            "course_id": course.id,
            "course_title": course.title,
            "course_code": course.course_code or course.code,
            "batch": course.batch,
            "semester": course.semester,
            "enrolled": enrolled,
            "total_sessions": total_sessions,
            "avg_percentage": avg,
            "at_risk": at_risk,
        })
    return out
