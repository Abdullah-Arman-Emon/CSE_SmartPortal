from sqlalchemy import Column, Integer, String, DateTime, ForeignKey,Text
from sqlalchemy.orm import relationship
from app.core.database import Base




class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    location = Column(String(255), nullable=True)
    registration_deadline = Column(DateTime, nullable=False)
    image_url = Column(String(255), nullable=True)
    video_url = Column(String(255), nullable=True)
    registration_link =  Column(String(255), nullable=True)
    
