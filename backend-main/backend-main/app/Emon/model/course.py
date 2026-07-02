from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from sqlalchemy import Enum
from sqlalchemy import Table

student_courses = Table(
    "student_courses",
    Base.metadata,
    Column("student_id", ForeignKey("students.id"), primary_key=True),
    Column("course_id", ForeignKey("courses.id"), primary_key=True),
)

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    code = Column(String(255), nullable=False, unique=True)  # Code = passcode
    description = Column(Text)
    other_links = Column(Text)
    
    
    semester = Column(String(50), nullable=False)  # e.g., "4-1, 3-2"
    batch = Column(Integer, nullable=False)  # e.g., "27"
    type = Column(Enum("Theory", "Lab", name="course_type"), nullable=False)
    
    
    image_url = Column(String(255))  # Optional image
    credit = Column(Integer, default=3)  # credit hours (for CGPA weighting)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    running = Column(Boolean, default=True)

    teacher = relationship("Teacher", back_populates="courses")
    schedules = relationship("Schedule", back_populates="course", cascade="all, delete-orphan")
    # exams = relationship("Exam", back_populates="course")
    students = relationship("Student", back_populates="courses", secondary="student_courses")
