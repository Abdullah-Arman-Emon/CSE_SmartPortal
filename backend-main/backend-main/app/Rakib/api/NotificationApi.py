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
