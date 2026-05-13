from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EventCreate(BaseModel):
    name: str
    description: Optional[str] = None
    start_date : datetime
    end_date : Optional[datetime] = None
    location: Optional[str] = None
    registration_deadline: datetime
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    registration_link: Optional[str] = None

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    start_date : Optional[datetime] = None
    end_date : Optional[datetime] = None
    location: Optional[str] = None
    max_team_size: Optional[int] = None
    registration_deadline: Optional[datetime] = None
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    registration_link: Optional[str] = None

class EventOut(EventCreate):
    id: int
    class Config:
        orm_mode = True
        

