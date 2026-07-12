from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.Rakib.model.result import Result
from app.Rakib.model.student import Student
from app.Rakib.model.semester_result import SemesterResult
from app.Emon.model.course import Course
from app.Rakib.api.NotificationApi import push as push_notification
from app.Rakib import academics

router = APIRouter(prefix="/v1/results", tags=["Results"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Kept for backward-compat imports; canonical scale lives in academics.
def grade_from_marks(marks: float):
    return academics.grade_from_marks(marks)


def _student_name(s: Student) -> str:
    return f"{s.first_name or ''} {s.last_name or ''}".strip() or "Student"


# ------------------------------------------------------------------ result rows

def _published_result_rows(db: Session, student_id: int) -> list:
    """Every published Result for a student, enriched with the course meta the
    academics module needs (catalog_code for retake dedup, credit, term)."""
    rows = (
        db.query(Result, Course)
        .join(Course, Result.course_id == Course.id)
        .filter(Result.student_id == student_id, Result.published == True)
        .all()
    )
    out = []
    for r, c in rows:
        out.append({
            "result_id": r.id,
            "course_id": c.id,
            "course_title": c.title,
            "course_code": c.course_code or c.code,
            "catalog_code": c.course_code,   # None for custom courses -> never dedups
            "credit": c.credit,
            "semester": c.semester,
            "batch": c.batch,
            "marks": r.marks,
            "grade": r.grade,
            "grade_point": r.grade_point,
        })
    return out


def recompute_semester_results(db: Session, student_id: int, finalize_term: tuple = None):
    """Rebuild a student's SemesterResult snapshots from published results.

    finalize_term=(batch, semester) marks that one term 'final' (used when admin
    closes a term). CGPA snapshot per term = running CGPA over all terms up to and
    including that term (latest-attempt dedup)."""
    rows = _published_result_rows(db, student_id)
    per_sem = academics.group_by_semester(rows)
    # running CGPA up to and including each term, in chronological order
    seen = []
    for term in per_sem:
        seen.extend(term["courses"])
        running = academics.compute_cgpa(seen)["cgpa"]
        existing = (
            db.query(SemesterResult)
            .filter(SemesterResult.student_id == student_id,
                    SemesterResult.batch == term["batch"],
                    SemesterResult.semester == term["semester"])
            .first()
        )
        make_final = finalize_term == (term["batch"], term["semester"])
        if existing:
            existing.gpa = term["gpa"]
            existing.total_credits = term["total_credits"]
            existing.cgpa_snapshot = running
            if make_final:
                existing.status = "final"
        else:
            db.add(SemesterResult(
                student_id=student_id, batch=term["batch"], semester=term["semester"],
                gpa=term["gpa"], total_credits=term["total_credits"],
                cgpa_snapshot=running, status="final" if make_final else "provisional",
            ))
    db.flush()


class ResultEntry(BaseModel):
    student_id: int
    marks: Optional[float] = None


class SaveRequest(BaseModel):
    course_id: int
    entries: List[ResultEntry]


@router.get("/course/{course_id}/students")
def course_students_with_results(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    existing = {
        r.student_id: r
        for r in db.query(Result).filter(Result.course_id == course_id).all()
    }
    out = []
    for s in sorted(course.students, key=lambda x: x.id):
        r = existing.get(s.id)
        out.append({
            "student_id": s.id,
            "name": _student_name(s),
            "batch": s.batch,
            "marks": r.marks if r else None,
            "grade": r.grade if r else None,
            "grade_point": r.grade_point if r else None,
            "published": r.published if r else False,
        })
    return {
        "course_id": course.id,
        "course_title": course.title,
        "course_code": course.course_code or course.code,
        "credit": course.credit,
        "students": out,
    }


@router.post("/save")
def save_results(payload: SaveRequest, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    # Students whose grade is already published and is being edited here — their
    # CGPA/semester snapshots must be recomputed so a correction never leaves the
    # transcript stale, and they should be told their grade changed.
    updated_published = []
    for entry in payload.entries:
        grade, grade_point = academics.grade_from_marks(entry.marks)
        existing = (
            db.query(Result)
            .filter(Result.course_id == payload.course_id, Result.student_id == entry.student_id)
            .first()
        )
        if existing:
            changed = existing.marks != entry.marks
            existing.marks = entry.marks
            existing.grade = grade
            existing.grade_point = grade_point
            if existing.published and changed:
                updated_published.append(entry.student_id)
        else:
            db.add(Result(
                course_id=payload.course_id,
                student_id=entry.student_id,
                marks=entry.marks,
                grade=grade,
                grade_point=grade_point,
                published=False,
            ))
    db.flush()
    for sid in updated_published:
        recompute_semester_results(db, sid)
        student = db.query(Student).filter(Student.id == sid).first()
        if student:
            push_notification(
                db, user_id=student.user_id,
                text=f"Your result for {course.title} ({course.code}) was updated by the course teacher.",
                ntype="result", link="/results",
            )
    db.commit()
    return {
        "message": "Results saved",
        "count": len(payload.entries),
        "updated_published": len(updated_published),
    }


@router.put("/publish/{course_id}")
def publish_results(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    rows = db.query(Result).filter(Result.course_id == course_id).all()
    if not rows:
        raise HTTPException(status_code=400, detail="No results to publish")

    for r in rows:
        r.published = True
        student = db.query(Student).filter(Student.id == r.student_id).first()
        if student:
            push_notification(
                db,
                user_id=student.user_id,
                text=f"Your result for {course.title} ({course.code}) has been published: {r.grade}",
                ntype="result",
                link="/results",
            )
    db.flush()
    # Trigger: roll the freshly published grades into each student's semester
    # GPA + running CGPA snapshots (provisional until the term is closed).
    for r in rows:
        recompute_semester_results(db, r.student_id)
    db.commit()
    return {"message": "Results published", "count": len(rows)}


@router.get("/student/{student_id}")
def student_results(student_id: int, db: Session = Depends(get_db)):
    """Flat published-result list (kept for the transcript table)."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    rows = _published_result_rows(db, student_id)
    return [
        {
            "course_id": r["course_id"],
            "course_title": r["course_title"],
            "course_code": r["course_code"],
            "catalog_code": r["catalog_code"],
            "credit": r["credit"],
            "semester": r["semester"],
            "batch": r["batch"],
            "marks": r["marks"],
            "grade": r["grade"],
            "grade_point": r["grade_point"],
        }
        for r in rows
    ]


@router.get("/student/{student_id}/summary")
def student_result_summary(student_id: int, db: Session = Depends(get_db)):
    """Backend-computed academic summary — the single source for CGPA. Applies the
    latest-attempt retake rule so retaken courses are not double-counted."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    rows = _published_result_rows(db, student_id)
    per_sem = academics.group_by_semester(rows)
    overall = academics.compute_cgpa(rows)

    # attach the frozen/running snapshot status per term where present
    snaps = {
        (sr.batch, sr.semester): sr
        for sr in db.query(SemesterResult).filter(SemesterResult.student_id == student_id).all()
    }
    semesters = []
    for term in per_sem:
        snap = snaps.get((term["batch"], term["semester"]))
        semesters.append({
            "batch": term["batch"],
            "semester": term["semester"],
            "gpa": round(term["gpa"], 2),
            "total_credits": term["total_credits"],
            "status": snap.status if snap else "provisional",
            "cgpa_snapshot": round(snap.cgpa_snapshot, 2) if snap and snap.cgpa_snapshot is not None else None,
            "courses": [
                {
                    "course_title": c["course_title"],
                    "course_code": c["course_code"],
                    "catalog_code": c["catalog_code"],
                    "credit": c["credit"],
                    "grade": c["grade"],
                    "grade_point": c["grade_point"],
                }
                for c in term["courses"]
            ],
        })
    return {
        "student_id": student_id,
        "program": student.program,
        "current_semester": student.current_semester,
        "cgpa": round(overall["cgpa"], 2),
        "attempted_credits": overall["attempted_credits"],
        "earned_credits": overall["earned_credits"],
        "has_f": overall["has_f"],
        "semesters": semesters,
    }
