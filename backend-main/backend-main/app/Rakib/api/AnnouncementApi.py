from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.database import SessionLocal
from pydantic import BaseModel

from app.Rakib.model.announcement import Announcement
from app.Emon.model.course import Course
from app.Emon.model.teacher import Teacher
from app.Rakib.model.student import Student

router = APIRouter(prefix="/v1/announcements", tags=["Announcements"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AnnouncementCreate(BaseModel):
    course_id: int
    teacher_id: int
    text: str


def _serialize(a: Announcement, course_map=None):
    course = course_map.get(a.course_id) if course_map else None
    return {
        "id": a.id,
        "course_id": a.course_id,
        "course_title": course.title if course else None,
        "course_code": course.code if course else None,
        "text": a.text,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


@router.post("")
def create_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    ann = Announcement(course_id=payload.course_id, teacher_id=payload.teacher_id, text=payload.text.strip())
    db.add(ann)
    db.commit()
    db.refresh(ann)
    return _serialize(ann, {course.id: course})


@router.get("/course/{course_id}")
def list_course_announcements(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    anns = (
        db.query(Announcement)
        .filter(Announcement.course_id == course_id)
        .order_by(desc(Announcement.created_at))
        .all()
    )
    cmap = {course.id: course} if course else {}
    return [_serialize(a, cmap) for a in anns]


@router.delete("/{announcement_id}")
def delete_announcement(announcement_id: int, db: Session = Depends(get_db)):
    ann = db.query(Announcement).filter(Announcement.id == announcement_id).first()
    if ann:
        db.delete(ann)
        db.commit()
    return {"message": "Announcement deleted"}


@router.get("/student/{student_id}")
def student_announcements(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    course_ids = [c.id for c in student.courses]
    cmap = {c.id: c for c in student.courses}
    if not course_ids:
        return []
    anns = (
        db.query(Announcement)
        .filter(Announcement.course_id.in_(course_ids))
        .order_by(desc(Announcement.created_at))
        .all()
    )
    return [_serialize(a, cmap) for a in anns]
