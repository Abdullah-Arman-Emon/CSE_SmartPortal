from sqlalchemy import Column, Integer, String, Date, ForeignKey, UniqueConstraint
from app.core.database import Base


class ClassSession(Base):
    """One held class of a course on a given date, and *who took it*.

    Attendance rows are per (course, student, date); a ClassSession is the
    per-(course, date) spine that records the teacher who actually ran that
    class. A course can be co-taught, so this — not `course.teacher_id` — is
    the source of truth for "Sir X took 12 of 20 classes". Created/updated
    whenever a teacher saves attendance for a date.
    """
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=False, index=True)
    date = Column(Date, nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    topic = Column(String(255), nullable=True)

    __table_args__ = (
        UniqueConstraint("course_id", "date", name="uq_class_session_course_date"),
    )
