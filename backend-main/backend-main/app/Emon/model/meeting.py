from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime
from app.core.database import Base

class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    date_time = Column(DateTime, nullable=False)
    meeting_url = Column(String(255), nullable=False)
    created_by = Column(Integer)
    is_archived = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.now())
