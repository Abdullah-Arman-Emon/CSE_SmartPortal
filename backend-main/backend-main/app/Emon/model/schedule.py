from sqlalchemy import Column, Integer, String, ForeignKey, Table
from app.core.database import Base
from sqlalchemy.orm import relationship



class Schedule(Base):
    __tablename__ = "schedules"

    id = Column(Integer, primary_key=True)
    course_id = Column(Integer, ForeignKey("courses.id"))
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    day = Column(String(20))  # e.g., Monday
    start_time = Column(String(50))  # e.g., 10:00 AM

    course = relationship("Course", back_populates="schedules")
    teacher = relationship("Teacher", back_populates="schedules")


