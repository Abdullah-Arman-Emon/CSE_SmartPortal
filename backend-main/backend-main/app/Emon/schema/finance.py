from pydantic import BaseModel
from datetime import datetime
from typing import Optional


# ------------------------------
# Schema for FinanceEvent
# ------------------------------

class FinanceEventCreate(BaseModel):
    title: str
    amount: int
    batch: str           # ✅ NEW: batch info like "CSE-45"
    deadline: datetime


class FinanceEventResponse(FinanceEventCreate):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# ------------------------------
# Schema for StudentPayment
# ------------------------------

class StudentPaymentCreate(BaseModel):
    user_id: int
    event_id: int
    transaction_id: str


class StudentPaymentResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    transaction_id: str
    status: str
    submitted_at: datetime
    verified_at: Optional[datetime]

    class Config:
        orm_mode = True
