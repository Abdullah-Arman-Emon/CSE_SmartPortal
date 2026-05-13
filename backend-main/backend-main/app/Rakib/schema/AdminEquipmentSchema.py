# schemas.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EquipmentCreate(BaseModel):
    name: str
    description: Optional[str] = None
    quantity_available: int
    image_url: Optional[str] = None

class EquipmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    quantity_available: Optional[int] = None
    image_url: Optional[str] = None

class EquipmentOut(EquipmentCreate):
    id: int
    class Config:
        orm_mode = True
        
class StudentEquipmentOut(BaseModel):
    id: int
    student_id: int
    equipment_id: int
    start_date: datetime
    end_date: datetime
    quantity: int
    returned: bool

    class Config:
        orm_mode = True
