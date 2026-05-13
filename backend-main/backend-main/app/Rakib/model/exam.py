from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from sqlalchemy import Enum



class Exam(Base):
    
    __tablename__ = "exams"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False) #subject of the exam
    date = Column(DateTime, nullable=False)
    duration = Column(Integer, nullable=False)  # in minutes
    batch = Column(Integer, nullable=False)
    room = Column(String(50), nullable=True)    # room number or name
    type = Column(Enum("Midterm", "Final", name="exam_type"), nullable=False)  # Enum-like behavior for exam type

