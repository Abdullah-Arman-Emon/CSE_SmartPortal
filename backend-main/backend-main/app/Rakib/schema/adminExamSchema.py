from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum as PyEnum

class ExamType(str, PyEnum):
    Midterm = "Midterm"
    Final = "Final"

class ExamCreate(BaseModel):
    name: str
    date: datetime
    duration: int
    batch:int
    room: Optional[str]
    type: ExamType

class ExamOut(BaseModel):
    id: int
    name: str
    date: datetime
    duration: int
    batch:int
    room: Optional[str]
    type: ExamType

    class Config:
        from_attributes = True  
