from sqlalchemy import Column, Integer, Text, DateTime, String
from datetime import datetime
from app.core.database import Base


class Message(Base):
    """Course chat message. recipient_id NULL = course group message."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, nullable=False, index=True)
    sender_id = Column(Integer, nullable=False)      # user id
    recipient_id = Column(Integer, nullable=True)    # user id, NULL = group
    text = Column(Text, nullable=False)              # may be "" when attachment-only
    attachment_url = Column(String(500), nullable=True)   # /resources/<name>
    attachment_name = Column(String(255), nullable=True)  # original filename
    created_at = Column(DateTime, default=datetime.now)
    edited_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)
