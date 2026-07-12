from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime




class Notice(Base):
    
    __tablename__ = "notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    sub_title = Column(String(255), nullable=True)
    content = Column(Text, nullable=False)
    batch = Column(Integer, nullable=True)  # e.g., "27" -- batch specific notices -- null for all batches
    date = Column(DateTime, default=datetime.now)
    notice_from = Column(Enum("Chairman", "Admin", "Student-Club", "Department", "Central"), nullable=False)
    attachments = Column(JSON, nullable=True)  #url-path
    is_pinned = Column(Boolean, default=False)  # pinned notices float to the top of the public board
    