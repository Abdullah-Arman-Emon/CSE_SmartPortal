from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey, UniqueConstraint
from datetime import datetime
from app.core.database import Base


class SemesterResult(Base):
    """Derived snapshot of a student's outcome in one (batch, semester) term.

    Written when a term's course results are published / the term is closed. Keeps
    a durable per-semester GPA and the running CGPA at that point, so transcripts
    and dashboards don't recompute from scratch every load. Source of truth for a
    *live* CGPA is still academics.compute_cgpa over published Results; this table
    is the finalised record and drives promotion.
    """
    __tablename__ = "semester_results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    batch = Column(Integer, nullable=False)
    semester = Column(String(10), nullable=False)
    gpa = Column(Float, nullable=True)
    total_credits = Column(Float, nullable=True)
    cgpa_snapshot = Column(Float, nullable=True)   # running CGPA once this term counts
    # provisional (results trickling in) | final (term closed)
    status = Column(String(15), nullable=False, default="provisional")
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("student_id", "batch", "semester", name="uq_semresult_student_term"),
    )
