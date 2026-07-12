from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from datetime import datetime
from app.core.database import Base


class BatchChangeRequest(Base):
    """A student's request to move to a different batch/semester — e.g. after a
    year drop ("Dead"), readmission, or retaking a full semester with a junior
    batch. Admin approves; on approval the student's batch/current_semester move
    while past Results stay attached to their original courses (history survives).
    """
    __tablename__ = "batch_change_requests"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False, index=True)
    from_batch = Column(Integer, nullable=True)
    from_semester = Column(String(10), nullable=True)
    to_batch = Column(Integer, nullable=False)
    to_semester = Column(String(10), nullable=False)
    reason = Column(Text, nullable=True)
    status = Column(String(15), nullable=False, default="pending", index=True)  # pending|approved|rejected
    decided_by = Column(Integer, nullable=True)   # admin User.id
    decided_note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)
