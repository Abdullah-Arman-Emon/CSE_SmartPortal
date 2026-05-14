from sqlalchemy import Column, Integer, DateTime, Boolean, ForeignKey, JSON 
from app.core.database import Base
from datetime import datetime
from sqlalchemy.orm import relationship




class Submission(Base):
    __tablename__ = "submissions"

    id = Column(Integer, primary_key=True)
    assignment_id = Column(Integer, ForeignKey("assignments.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    submitted_at = Column(DateTime, default=datetime.now, nullable=False)  # Timestamp when the submission was made
    checked = Column(Boolean, default=False)

    file_links = Column(JSON, nullable=True)
    marks = Column(Integer, nullable=True)
    
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")
