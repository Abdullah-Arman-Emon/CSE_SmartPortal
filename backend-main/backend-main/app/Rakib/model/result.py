from sqlalchemy import Column, Integer, Float, String, Boolean, ForeignKey, UniqueConstraint
from app.core.database import Base


class Result(Base):
    """A student's final result in a course (marks -> grade)."""
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    marks = Column(Float, nullable=True)
    grade = Column(String(5), nullable=True)
    grade_point = Column(Float, nullable=True)
    published = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint("course_id", "student_id", name="uq_result_course_student"),
    )
