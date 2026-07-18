"""Universal direct-messaging: any user can message any other user
(student <-> teacher <-> admin), with presence (online / last seen) and
read receipts (seen). Independent of course membership."""
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy import or_, and_, func
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.Rakib.model.direct_message import DirectMessage
from app.Rakib.model.notification import Notification
from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Rakib.model.student import Student


def _dash_link(db: Session, user_id: int) -> str:
    """Role-appropriate messages deep-link for a notification."""
    u = db.query(User).filter(User.id == user_id).first()
    role = (u.role if u else "student") or "student"
    return {
        "admin": "/admin-dashboard?tab=messages",
        "teacher": "/teacher-dashboard/messages",
        "student": "/messages",
    }.get(role, "/messages")

router = APIRouter(prefix="/v1/dm", tags=["Direct Messages"])

ONLINE_WINDOW = timedelta(seconds=90)  # last_seen newer than this => online


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- profile resolution (cached per request via dict) ----------

def _profiles(db: Session):
    """Return {user_id: {name, role, image}} for every user, in bulk."""
    users = db.query(User).all()
    teachers = {t.user_id: t for t in db.query(Teacher).all() if t.user_id}
    students = {s.user_id: s for s in db.query(Student).all() if s.user_id}
    out = {}
    for u in users:
        t = teachers.get(u.id)
        s = students.get(u.id)
        if t:
            name = f"{t.first_name or ''} {t.last_name or ''}".strip() or "Teacher"
            image = t.profile_image
        elif s:
            name = f"{s.first_name or ''} {s.last_name or ''}".strip() or "Student"
            image = s.profile_image
        else:
            name = (u.email or "User").split("@")[0].replace(".", " ").title()
            image = None
        # every contact gets a face — fall back to a deterministic initials avatar
        if not image:
            seed = (name or "User").replace(" ", "+")
            image = f"https://ui-avatars.com/api/?name={seed}&background=0D8ABC&color=fff&size=256&bold=true"
        out[u.id] = {"name": name, "role": u.role, "image": image, "email": u.email}
    return out


def _is_online(last_seen):
    return bool(last_seen and (datetime.now() - last_seen) < ONLINE_WINDOW)


# ---------- presence ----------

@router.post("/heartbeat/{user_id}")
def heartbeat(user_id: int, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.last_seen = datetime.now()
    db.commit()
    return {"ok": True}


# ---------- send ----------

class SendDM(BaseModel):
    sender_id: int
    recipient_id: int
    text: str = ""
    attachment_url: Optional[str] = None
    attachment_name: Optional[str] = None


class EditDM(BaseModel):
    sender_id: int
    text: str


def _serialize(m: DirectMessage):
    return {
        "id": m.id,
        "sender_id": m.sender_id,
        "recipient_id": m.recipient_id,
        "text": m.text,
        "attachment_url": m.attachment_url,
        "attachment_name": m.attachment_name,
        "created_at": m.created_at.isoformat() if m.created_at else None,
        "read_at": m.read_at.isoformat() if m.read_at else None,
        "edited_at": m.edited_at.isoformat() if m.edited_at else None,
        "deleted_at": m.deleted_at.isoformat() if m.deleted_at else None,
    }


@router.post("/send")
def send_dm(payload: SendDM, db: Session = Depends(get_db)):
    text = (payload.text or "").strip()
    if not text and not payload.attachment_url:
        raise HTTPException(status_code=422, detail="Empty message")
    if payload.sender_id == payload.recipient_id:
        raise HTTPException(status_code=422, detail="Cannot message yourself")
    if not db.query(User).filter(User.id == payload.recipient_id).first():
        raise HTTPException(status_code=404, detail="Recipient not found")

    m = DirectMessage(
        sender_id=payload.sender_id,
        recipient_id=payload.recipient_id,
        text=text,
        attachment_url=payload.attachment_url,
        attachment_name=payload.attachment_name,
    )
    db.add(m)
    db.flush()

    # notify the recipient (world-class: the bell rings on every new message)
    profiles = _profiles(db)
    sender_name = profiles.get(payload.sender_id, {}).get("name", "Someone")
    preview = text if text else (f"📎 {payload.attachment_name}" if payload.attachment_name else "sent an attachment")
    db.add(Notification(
        user_id=payload.recipient_id,
        type="message",
        text=f"💬 {sender_name}: {preview[:80]}",
        link=_dash_link(db, payload.recipient_id),
    ))
    db.commit()
    db.refresh(m)
    return _serialize(m)


@router.put("/message/{message_id}")
def edit_dm(message_id: int, payload: EditDM, db: Session = Depends(get_db)):
    m = db.query(DirectMessage).filter(DirectMessage.id == message_id).first()
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
    return _serialize(m)


@router.delete("/message/{message_id}")
def delete_dm(message_id: int, sender_id: int = Query(...), db: Session = Depends(get_db)):
    m = db.query(DirectMessage).filter(DirectMessage.id == message_id).first()
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
    return _serialize(m)


# ---------- thread (marks incoming as read) ----------

@router.get("/thread")
def thread(me: int = Query(...), other: int = Query(...),
           after: int = Query(0), db: Session = Depends(get_db)):
    # mark all unread messages other->me as read (seen receipts)
    now = datetime.now()
    db.query(DirectMessage).filter(
        DirectMessage.sender_id == other,
        DirectMessage.recipient_id == me,
        DirectMessage.read_at.is_(None),
    ).update({DirectMessage.read_at: now}, synchronize_session=False)
    db.commit()

    rows = (
        db.query(DirectMessage)
        .filter(
            DirectMessage.id > after,
            or_(
                and_(DirectMessage.sender_id == me, DirectMessage.recipient_id == other),
                and_(DirectMessage.sender_id == other, DirectMessage.recipient_id == me),
            ),
        )
        .order_by(DirectMessage.id)
        .limit(500)
        .all()
    )
    peer = db.query(User).filter(User.id == other).first()
    return {
        "messages": [_serialize(m) for m in rows],
        "peer_online": _is_online(peer.last_seen) if peer else False,
        "peer_last_seen": peer.last_seen.isoformat() if peer and peer.last_seen else None,
    }


# ---------- conversation list + directory ----------

@router.get("/directory")
def directory(user_id: int = Query(...), db: Session = Depends(get_db)):
    """Everyone I can message, plus my existing conversations, merged.
    Each entry carries last message preview, unread count and presence so the
    frontend can render a world-class contact + conversation list in one call."""
    profiles = _profiles(db)
    if user_id not in profiles:
        raise HTTPException(status_code=404, detail="User not found")

    # latest message + unread counts per peer
    msgs = (
        db.query(DirectMessage)
        .filter(or_(DirectMessage.sender_id == user_id,
                    DirectMessage.recipient_id == user_id))
        .order_by(DirectMessage.id.desc())
        .limit(2000)
        .all()
    )
    last_by_peer = {}
    unread_by_peer = {}
    for m in msgs:
        peer = m.recipient_id if m.sender_id == user_id else m.sender_id
        if peer not in last_by_peer:
            last_by_peer[peer] = m
        if m.recipient_id == user_id and m.read_at is None:
            unread_by_peer[peer] = unread_by_peer.get(peer, 0) + 1

    presence = {u.id: u.last_seen for u in db.query(User).all()}

    out = []
    for uid, p in profiles.items():
        if uid == user_id:
            continue
        last = last_by_peer.get(uid)
        preview = None
        if last:
            preview = last.text or (f"📎 {last.attachment_name}" if last.attachment_name else "📎 Attachment")
        out.append({
            "user_id": uid,
            "name": p["name"],
            "role": p["role"],
            "image": p["image"],
            "online": _is_online(presence.get(uid)),
            "last_seen": presence.get(uid).isoformat() if presence.get(uid) else None,
            "unread": unread_by_peer.get(uid, 0),
            "last_text": preview,
            "last_from_me": (last.sender_id == user_id) if last else False,
            "last_at": last.created_at.isoformat() if last and last.created_at else None,
            "last_id": last.id if last else 0,
        })
    # conversations (with history) first, newest first; then the rest A-Z
    out.sort(key=lambda x: (-x["last_id"], x["name"].lower()))
    return out


@router.get("/unread/{user_id}")
def unread_total(user_id: int, db: Session = Depends(get_db)):
    n = (
        db.query(func.count(DirectMessage.id))
        .filter(DirectMessage.recipient_id == user_id, DirectMessage.read_at.is_(None))
        .scalar()
    )
    return {"unread": int(n or 0)}
