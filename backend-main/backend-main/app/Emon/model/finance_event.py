from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base
from datetime import datetime

class FinanceEvent(Base):
    __tablename__ = "finance_events"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)
    amount = Column(Integer, nullable=False)
    batch = Column(String(50), nullable=False)  # ✅ NEW: e.g. "CSE-45" or "2025"
    deadline = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
