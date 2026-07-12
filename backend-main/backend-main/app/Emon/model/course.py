from sqlalchemy import Column, Integer, String, Boolean, Text, ForeignKey, Float
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
    course_code = Column(String(20), nullable=True, index=True)  # catalog code, e.g. "CSE 1101" (NULL = custom course)
    description = Column(Text)
    other_links = Column(Text)
    
    
    semester = Column(String(50), nullable=False)  # e.g., "4-1, 3-2"
    batch = Column(Integer, nullable=False)  # e.g., "27"
    type = Column(Enum("Theory", "Lab", name="course_type"), nullable=False)
    
    
    image_url = Column(String(255))  # Optional image
    credit = Column(Float, default=3.0)  # credit hours, fractional for labs (for CGPA weighting)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=False)
    running = Column(Boolean, default=True)
    # lifecycle: "upcoming" (not started) | "active" (running) | "completed" (done).
    # Teacher-controlled; lets teacher/student/admin separate finished vs ongoing.
    status = Column(String(20), default="active")

    teacher = relationship("Teacher", back_populates="courses")
    schedules = relationship("Schedule", back_populates="course", cascade="all, delete-orphan")
    # exams = relationship("Exam", back_populates="course")
    students = relationship("Student", back_populates="courses", secondary="student_courses")
