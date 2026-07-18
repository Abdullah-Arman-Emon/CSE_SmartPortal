from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.core.database import SessionLocal
from pydantic import BaseModel
from typing import Optional

from app.Rakib.model.message import Message
from app.Rakib.model.notification import Notification
from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Rakib.model.student import Student
from app.Emon.model.course import Course


def _dash_link(role: str) -> str:
    return {
        "admin": "/admin-dashboard?tab=messages",
        "teacher": "/teacher-dashboard/messages",
        "student": "/messages",
    }.get(role or "student", "/messages")

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


class EditMessage(BaseModel):
    sender_id: int
    text: str


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
        "edited_at": m.edited_at.isoformat() if m.edited_at else None,
        "deleted_at": m.deleted_at.isoformat() if m.deleted_at else None,
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
    db.flush()

    # notifications: DM -> recipient; group -> every member except the sender.
    sender_name = _name_of(db, payload.sender_id)
    preview = text if text else (f"📎 {payload.attachment_name}" if payload.attachment_name else "sent an attachment")
    if payload.recipient_id is not None:
        targets = [payload.recipient_id]
        body = f"💬 {sender_name}: {preview[:80]}"
    else:
        targets = [uid for uid in members if uid != payload.sender_id]
        body = f"💬 {sender_name} in {course.title}: {preview[:70]}"
    roles = {u.id: u.role for u in db.query(User).filter(User.id.in_(targets)).all()} if targets else {}
    for uid in targets:
        db.add(Notification(user_id=uid, type="message", text=body, link=_dash_link(roles.get(uid))))

    db.commit()
    db.refresh(m)
    return _serialize(db, m)


@router.put("/message/{message_id}")
def edit_message(message_id: int, payload: EditMessage, db: Session = Depends(get_db)):
    m = db.query(Message).filter(Message.id == message_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Message not found")
    if m.sender_id != payload.sender_id:
        raise HTTPException(status_code=403, detail="You can only edit your own messages")
    if m.deleted_at is not None:
        raise HTTPException(status_code=400, detail="Cannot edit a deleted message")
    text = (payload.text or "").strip()
    if not text:
        raise HTTPException(status_code=422, detail="Empty message")

    m.text = text
    m.edited_at = datetime.now()
    db.commit()
    db.refresh(m)
    return _serialize(db, m)


@router.delete("/message/{message_id}")
def delete_message(message_id: int, sender_id: int = Query(...), db: Session = Depends(get_db)):
    m = db.query(Message).filter(Message.id == message_id).first()
    if not m:
        raise HTTPException(status_code=404, detail="Message not found")
    if m.sender_id != sender_id:
        raise HTTPException(status_code=403, detail="You can only delete your own messages")
    if m.deleted_at is not None:
        raise HTTPException(status_code=400, detail="Message already deleted")

    m.text = ""
    m.attachment_url = None
    m.attachment_name = None
    m.deleted_at = datetime.now()
    db.commit()
    db.refresh(m)
    return _serialize(db, m)


@router.get("/my_groups/{user_id}")
def my_groups(user_id: int, db: Session = Depends(get_db)):
    """Course groups this user belongs to (teacher: courses they teach;
    student: enrolled courses). Powers batch/course-wise group chat.
    Active courses first, newest first, completed last."""
    teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
    student = db.query(Student).filter(Student.user_id == user_id).first()
    courses = []
    if teacher:
        courses = db.query(Course).filter(Course.teacher_id == teacher.id).all()
    elif student:
        courses = list(student.courses)
    else:  # admin: no owned groups
        return []

    def sort_key(c):
        completed = (c.status == "completed") or (c.status is None and not c.running)
        return (completed, -c.id)  # active first, newest first, completed last

    out = []
    for c in sorted(courses, key=sort_key):
        out.append({
            "course_id": c.id,
            "title": c.title,
            "code": c.course_code or c.code,
            "batch": c.batch,
            "semester": c.semester,
            "status": c.status or ("active" if c.running else "completed"),
            "members": len(c.students) + (1 if c.teacher else 0),
        })
    return out


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


@router.get("/inbox/{user_id}")
def inbox(user_id: int, db: Session = Depends(get_db)):
    """All DM conversations (course, peer) this user is part of, latest first.

    Lets a student (or teacher) see who messaged them and jump straight into
    the thread instead of hunting through course + member dropdowns.
    """
    rows = (
        db.query(Message)
        .filter(
            Message.recipient_id.isnot(None),
            or_(Message.sender_id == user_id, Message.recipient_id == user_id),
        )
        .order_by(Message.id.desc())
        .limit(500)
        .all()
    )
    threads = {}  # (course_id, peer_user_id) -> latest Message
    for m in rows:
        peer = m.recipient_id if m.sender_id == user_id else m.sender_id
        threads.setdefault((m.course_id, peer), m)

    course_ids = {cid for (cid, _) in threads}
    courses = {
        c.id: c for c in db.query(Course).filter(Course.id.in_(course_ids)).all()
    } if course_ids else {}

    out = []
    for (course_id, peer), m in threads.items():
        course = courses.get(course_id)
        preview = m.text or (f"📎 {m.attachment_name}" if m.attachment_name else "📎 Attachment")
        out.append({
            "course_id": course_id,
            "course_title": course.title if course else f"Course {course_id}",
            "peer_user_id": peer,
            "peer_name": _name_of(db, peer),
            "last_text": preview,
            "last_from_me": m.sender_id == user_id,
            "last_at": m.created_at.isoformat() if m.created_at else None,
            "last_id": m.id,
        })
    out.sort(key=lambda x: x["last_id"], reverse=True)
    return out


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
