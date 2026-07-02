from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel

from app.core.database import SessionLocal
from app.Rakib.model.result import Result
from app.Rakib.model.student import Student
from app.Emon.model.course import Course
from app.Rakib.api.NotificationApi import push as push_notification

router = APIRouter(prefix="/v1/results", tags=["Results"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Must stay in sync with the DU 4.00 scale used in StudentCGPA.jsx
def grade_from_marks(marks: float):
    if marks is None:
        return None, None
    if marks >= 80:
        return "A+", 4.00
    if marks >= 75:
        return "A", 3.75
    if marks >= 70:
        return "A-", 3.50
    if marks >= 65:
        return "B+", 3.25
    if marks >= 60:
        return "B", 3.00
    if marks >= 55:
        return "B-", 2.75
    if marks >= 50:
        return "C+", 2.50
    if marks >= 45:
        return "C", 2.25
    if marks >= 40:
        return "D", 2.00
    return "F", 0.00


def _student_name(s: Student) -> str:
    return f"{s.first_name or ''} {s.last_name or ''}".strip() or "Student"


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
        "course_code": course.code,
        "credit": course.credit,
        "students": out,
    }


@router.post("/save")
def save_results(payload: SaveRequest, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    for entry in payload.entries:
        grade, grade_point = grade_from_marks(entry.marks)
        existing = (
            db.query(Result)
            .filter(Result.course_id == payload.course_id, Result.student_id == entry.student_id)
            .first()
        )
        if existing:
            existing.marks = entry.marks
            existing.grade = grade
            existing.grade_point = grade_point
        else:
            db.add(Result(
                course_id=payload.course_id,
                student_id=entry.student_id,
                marks=entry.marks,
                grade=grade,
                grade_point=grade_point,
                published=False,
            ))
    db.commit()
    return {"message": "Results saved as draft", "count": len(payload.entries)}


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
                link="/student/results",
            )
    db.commit()
    return {"message": "Results published", "count": len(rows)}


@router.get("/student/{student_id}")
def student_results(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    rows = (
        db.query(Result)
        .filter(Result.student_id == student_id, Result.published == True)
        .all()
    )
    course_map = {c.id: c for c in student.courses}
    out = []
    for r in rows:
        course = course_map.get(r.course_id) or db.query(Course).filter(Course.id == r.course_id).first()
        if not course:
            continue
        out.append({
            "course_id": course.id,
            "course_title": course.title,
            "course_code": course.code,
            "credit": course.credit,
            "semester": course.semester,
            "batch": course.batch,
            "marks": r.marks,
            "grade": r.grade,
            "grade_point": r.grade_point,
        })
    return out
