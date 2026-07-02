from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import SessionLocal
from pydantic import BaseModel
from typing import Optional

from app.Rakib.model.message import Message
from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Rakib.model.student import Student
from app.Emon.model.course import Course

router = APIRouter(prefix="/v1/chat", tags=["Chat"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _name_of(db: Session, user_id: int) -> str:
    t = db.query(Teacher).filter(Teacher.user_id == user_id).first()
    if t:
        return f"{t.first_name or ''} {t.last_name or ''}".strip() or "Teacher"
    s = db.query(Student).filter(Student.user_id == user_id).first()
    if s:
        return f"{s.first_name or ''} {s.last_name or ''}".strip() or "Student"
    u = db.query(User).filter(User.id == user_id).first()
    return u.email if u else "User"


class SendMessage(BaseModel):
    course_id: int
    sender_id: int
    recipient_id: Optional[int] = None
    text: str = ""
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None


def _serialize(db, m: Message):
    return {
        "id": m.id,
        "sender_id": m.sender_id,
        "sender_name": _name_of(db, m.sender_id),
        "recipient_id": m.recipient_id,
        "text": m.text,
        "attachment_url": m.attachment_url,
        "attachment_name": m.attachment_name,
        "created_at": m.created_at.isoformat() if m.created_at else None,
    }


def _member_user_ids(course: Course):
    ids = set()
    if course.teacher and course.teacher.user_id:
        ids.add(course.teacher.user_id)
    for s in course.students:
        if s.user_id:
            ids.add(s.user_id)
    return ids


@router.post("/send")
def send_message(payload: SendMessage, db: Session = Depends(get_db)):
    text = (payload.text or "").strip()
    if not text and not payload.attachment_url:
        raise HTTPException(status_code=422, detail="Empty message")

    course = db.query(Course).filter(Course.id == payload.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    members = _member_user_ids(course)
    if payload.sender_id not in members:
        raise HTTPException(status_code=403, detail="You are not a member of this course")
    if payload.recipient_id is not None and payload.recipient_id not in members:
        raise HTTPException(status_code=403, detail="Recipient is not a member of this course")

    m = Message(
        course_id=payload.course_id,
        sender_id=payload.sender_id,
        recipient_id=payload.recipient_id,
        text=text,
        attachment_url=payload.attachment_url,
        attachment_name=payload.attachment_name,
    )
    db.add(m)
    db.commit()
    db.refresh(m)
    return _serialize(db, m)


@router.get("/course/{course_id}/group")
def group_messages(course_id: int, after: int = Query(0), db: Session = Depends(get_db)):
    rows = (
        db.query(Message)
        .filter(Message.course_id == course_id, Message.recipient_id.is_(None), Message.id > after)
        .order_by(Message.id)
        .limit(200)
        .all()
    )
    return [_serialize(db, m) for m in rows]


@router.get("/course/{course_id}/dm")
def dm_messages(course_id: int, user_a: int = Query(...), user_b: int = Query(...),
                after: int = Query(0), db: Session = Depends(get_db)):
    rows = (
        db.query(Message)
        .filter(
            Message.course_id == course_id,
            Message.id > after,
            or_(
                and_(Message.sender_id == user_a, Message.recipient_id == user_b),
                and_(Message.sender_id == user_b, Message.recipient_id == user_a),
            ),
        )
        .order_by(Message.id)
        .limit(200)
        .all()
    )
    return [_serialize(db, m) for m in rows]


@router.get("/course/{course_id}/members")
def course_members(course_id: int, db: Session = Depends(get_db)):
    """Teacher + students (user ids + names) for DM targets."""
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    members = []
    if course.teacher and course.teacher.user_id:
        members.append({
            "user_id": course.teacher.user_id,
            "name": f"{course.teacher.first_name or ''} {course.teacher.last_name or ''}".strip() or "Teacher",
            "role": "teacher",
        })
    for s in course.students:
        if s.user_id:
            members.append({
                "user_id": s.user_id,
                "name": f"{s.first_name or ''} {s.last_name or ''}".strip() or "Student",
                "role": "student",
            })
    return members
