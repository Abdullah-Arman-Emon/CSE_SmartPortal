from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from app.core.database import Base


class Attendance(Base):
    """Per-session attendance: one row per (course, student, date)."""
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(String(10), nullable=False, default="present")  # present | absent | late

    __table_args__ = (
        UniqueConstraint("course_id", "student_id", "date", name="uq_attendance_course_student_date"),
    )
