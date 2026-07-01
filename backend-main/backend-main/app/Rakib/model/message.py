from sqlalchemy import Column, Integer, Text, DateTime
from datetime import datetime
from app.core.database import Base


class Message(Base):
    """Course chat message. recipient_id NULL = course group message."""
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, nullable=False, index=True)
    sender_id = Column(Integer, nullable=False)      # user id
    recipient_id = Column(Integer, nullable=True)    # user id, NULL = group
    text = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
