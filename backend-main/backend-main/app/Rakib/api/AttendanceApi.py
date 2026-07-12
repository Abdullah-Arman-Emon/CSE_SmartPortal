from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from datetime import date as date_type
from typing import List, Optional
from pydantic import BaseModel

from app.Rakib.model.attendance import Attendance
from app.Rakib.model.class_session import ClassSession
from app.Rakib.model.student import Student
from app.Rakib.model.batch_term import BSC_SEMESTER_ORDER, semester_rank
from app.Emon.model.course import Course
from app.Emon.model.teacher import Teacher

router = APIRouter(prefix="/v1/attendance", tags=["Attendance"])

YEAR_LABELS = {1: "1st Year", 2: "2nd Year", 3: "3rd Year", 4: "4th Year"}
DAY_NAMES = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]


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
    teacher_id: Optional[int] = None   # who took this class (for co-taught courses)
    topic: Optional[str] = None


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

    # Record (or update) the class session for this date, with who took it.
    session = (
        db.query(ClassSession)
        .filter(ClassSession.course_id == payload.course_id, ClassSession.date == payload.date)
        .first()
    )
    teacher_id = payload.teacher_id if payload.teacher_id is not None else course.teacher_id
    if session:
        if payload.teacher_id is not None:
            session.teacher_id = payload.teacher_id
        if payload.topic is not None:
            session.topic = payload.topic
    else:
        db.add(ClassSession(
            course_id=payload.course_id, date=payload.date,
            teacher_id=teacher_id, topic=payload.topic,
        ))

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


def _teacher_display(t: Teacher):
    name = f"{t.first_name or ''} {t.last_name or ''}".strip() or f"Teacher #{t.id}"
    parts = [p for p in name.replace(".", " ").split() if p and p[0].isalpha()]
    initials = "".join(p[0].upper() for p in parts) or "T"
    return name, initials


@router.get("/student/{student_id}/lifecycle")
def student_lifecycle(student_id: int, db: Session = Depends(get_db)):
    """The student's full attendance life-cycle: every year → semester → course,
    with each course's date-wise register, per-teacher session counts and the
    running attendance %. Built so the frontend can filter/drill by any dimension.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # A student's attendance life-cycle spans every course they've actually
    # taken — not just the current term's enrolment. Build the set from
    # currently-enrolled courses ∪ any course this student has attendance for
    # (past semesters). Courses with grades but no attendance are intentionally
    # excluded: an attendance view is about classes that were held.
    enrolled_ids = {c.id for c in student.courses}
    att_course_ids = {
        cid for (cid,) in db.query(Attendance.course_id)
        .filter(Attendance.student_id == student_id).distinct().all()
    }
    course_ids = list(enrolled_ids | att_course_ids)
    courses = (
        db.query(Course).filter(Course.id.in_(course_ids)).all() if course_ids else []
    )

    # teacher directory (id -> name/initials)
    teachers = {t.id: _teacher_display(t) for t in db.query(Teacher).all()}

    def teacher_meta(tid):
        name, initials = teachers.get(tid, (f"Teacher #{tid}" if tid else "—", "T"))
        return name, initials

    # bulk load sessions + this student's attendance for all enrolled courses
    sessions = (
        db.query(ClassSession).filter(ClassSession.course_id.in_(course_ids)).all()
        if course_ids else []
    )
    att_rows = (
        db.query(Attendance)
        .filter(Attendance.course_id.in_(course_ids), Attendance.student_id == student_id)
        .all()
        if course_ids else []
    )
    sessions_by_course = {}
    for s in sessions:
        sessions_by_course.setdefault(s.course_id, {})[s.date] = s
    status_by_course = {}
    for a in att_rows:
        status_by_course.setdefault(a.course_id, {})[a.date] = a.status
    # dates a class was actually held per course = sessions ∪ any date attendance was taken
    all_att = (
        db.query(Attendance.course_id, Attendance.date)
        .filter(Attendance.course_id.in_(course_ids)).distinct().all()
        if course_ids else []
    )
    held_dates = {}
    for cid, d in all_att:
        held_dates.setdefault(cid, set()).add(d)
    for cid, dmap in sessions_by_course.items():
        held_dates.setdefault(cid, set()).update(dmap.keys())

    overall_total = overall_attended = 0
    # year -> semester -> list[course]
    years = {}
    for course in courses:
        dates = sorted(held_dates.get(course.id, set()))
        smap = sessions_by_course.get(course.id, {})
        stat = status_by_course.get(course.id, {})
        present = late = absent = 0
        per_teacher = {}
        session_rows = []
        for d in dates:
            sess = smap.get(d)
            tid = sess.teacher_id if sess and sess.teacher_id else course.teacher_id
            tname, tinit = teacher_meta(tid)
            per_teacher.setdefault(tid, {"teacher_id": tid, "name": tname,
                                         "initials": tinit, "sessions_taken": 0})
            per_teacher[tid]["sessions_taken"] += 1
            st = stat.get(d, "absent")   # class held but no record for me = absent
            if st == "present":
                present += 1
            elif st == "late":
                late += 1
            else:
                absent += 1
            session_rows.append({
                "date": str(d),
                "day": DAY_NAMES[d.weekday()],
                "status": st,
                "teacher_id": tid,
                "teacher_name": tname,
                "teacher_initials": tinit,
                "topic": sess.topic if sess else None,
            })
        total = len(dates)
        attended = present + late
        pct = _percent(attended, total)
        overall_total += total
        overall_attended += attended

        sem = course.semester or "?"
        yr = semester_rank(sem) // 2 + 1 if sem in BSC_SEMESTER_ORDER else 0
        course_obj = {
            "course_id": course.id,
            "course_code": course.course_code or course.code,
            "title": course.title,
            "type": course.type,
            "credit": course.credit,
            "semester": sem,
            "status": course.status or ("active" if course.running else "completed"),
            "total_sessions": total,
            "attended": attended,
            "present": present,
            "late": late,
            "absent": absent,
            "percentage": pct,
            "eligible": pct >= 75,
            "teachers": sorted(per_teacher.values(),
                               key=lambda x: -x["sessions_taken"]),
            "sessions": session_rows,
        }
        years.setdefault(yr, {}).setdefault(sem, []).append(course_obj)

    def agg(course_list):
        t = sum(c["total_sessions"] for c in course_list)
        a = sum(c["attended"] for c in course_list)
        return t, a, _percent(a, t)

    years_out = []
    for yr in sorted(years.keys()):
        sems_out = []
        for sem in sorted(years[yr].keys(), key=semester_rank):
            clist = sorted(years[yr][sem], key=lambda c: c["course_code"] or "")
            t, a, p = agg(clist)
            sems_out.append({
                "semester": sem, "courses": clist,
                "total_sessions": t, "attended": a, "percentage": p,
            })
        clist = [c for s in years[yr].values() for c in s]
        t, a, p = agg(clist)
        years_out.append({
            "year": yr,
            "label": YEAR_LABELS.get(yr, "Other"),
            "semesters": sems_out,
            "total_sessions": t, "attended": a, "percentage": p,
        })

    return {
        "student": {
            "id": student.id,
            "name": _student_name(student),
            "batch": student.batch,
            "current_semester": getattr(student, "current_semester", None),
        },
        "overall": {
            "total_sessions": overall_total,
            "attended": overall_attended,
            "percentage": _percent(overall_attended, overall_total),
        },
        "years": years_out,
    }


@router.get("/overview")
def overview(
    batch: Optional[int] = Query(None),
    semester: Optional[str] = Query(None),
    status: Optional[str] = Query(None, description="active | completed | upcoming"),
    from_date: Optional[date_type] = Query(None),
    to_date: Optional[date_type] = Query(None),
    q: Optional[str] = Query(None, description="course title/code contains"),
    db: Session = Depends(get_db),
):
    """Admin read-only: per-course attendance health, optionally filtered.
    Newest courses first; each row carries lifecycle status so active vs
    completed courses can be separated."""
    cq = db.query(Course)
    if batch is not None:
        cq = cq.filter(Course.batch == batch)
    if semester:
        cq = cq.filter(Course.semester == semester)
    if status:
        st = status.lower().strip()
        if st == "completed":
            cq = cq.filter((Course.status == "completed") | (Course.running == False))  # noqa: E712
        elif st == "active":
            cq = cq.filter((Course.status == "active") | ((Course.status.is_(None)) & (Course.running == True)))  # noqa: E712
        else:
            cq = cq.filter(Course.status == st)
    if q:
        like = f"%{q}%"
        cq = cq.filter(
            (Course.title.like(like)) | (Course.code.like(like)) | (Course.course_code.like(like))
        )
    courses = cq.all()
    # active/current courses first, completed last; newest first within each
    courses.sort(key=lambda c: ((c.status == "completed") or (c.status is None and not c.running), -c.id))

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
            "status": course.status or ("active" if course.running else "completed"),
            "enrolled": enrolled,
            "total_sessions": total_sessions,
            "avg_percentage": avg,
            "at_risk": at_risk,
        })
    return out
