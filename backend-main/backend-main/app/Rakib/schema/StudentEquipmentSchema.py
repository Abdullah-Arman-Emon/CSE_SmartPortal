from pydantic import BaseModel
from datetime import datetime
from typing import Optional



class EquipmentOut(BaseModel):
    id: int
    name: str
    description: Optional[str]
    quantity_available: int
    image_url: Optional[str]

    class Config:
        orm_mode = True
        
        
class StudentEquipmentCreate(BaseModel):
    student_id: int
    equipment_id: int
    end_date: datetime
    quantity: int
    
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


