from sqlalchemy import Column, Integer, Text, DateTime, String, Index
from datetime import datetime
from app.core.database import Base


class DirectMessage(Base):
    """Universal 1:1 direct message between any two users, regardless of role
    or shared course. recipient reads it -> read_at is set (read receipts)."""
    __tablename__ = "direct_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, nullable=False, index=True)     # user id
    recipient_id = Column(Integer, nullable=False, index=True)  # user id
    text = Column(Text, nullable=False)                         # may be "" for attachment-only
    attachment_url = Column(String(500), nullable=True)         # /resources/<name>
    attachment_name = Column(String(255), nullable=True)        # original filename
    created_at = Column(DateTime, default=datetime.now, index=True)
    read_at = Column(DateTime, nullable=True)                   # NULL = unseen
    edited_at = Column(DateTime, nullable=True)
    deleted_at = Column(DateTime, nullable=True)

    __table_args__ = (
        Index("idx_dm_pair", "sender_id", "recipient_id"),
    )
