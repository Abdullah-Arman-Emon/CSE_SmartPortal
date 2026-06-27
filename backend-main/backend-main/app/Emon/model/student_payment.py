from sqlalchemy import Column, Integer, String, DateTime, Boolean
from app.core.database import Base
from datetime import datetime

class StudentPayment(Base):
    __tablename__ = "student_payments"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    event_id = Column(Integer, nullable=False)
    transaction_id = Column(String(255), nullable=False)
    status = Column(String(10), default="pending")  # "pending", "paid"
    submitted_at = Column(DateTime, default=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
