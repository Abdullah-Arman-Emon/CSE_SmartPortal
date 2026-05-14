from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class MeetingCreate(BaseModel):
    title: str
    date_time: datetime
    meeting_url: Optional[str] = None
    created_by: int

class MeetingResponse(MeetingCreate):
    id: int
    is_archived: bool

    class Config:
        orm_mode = True

class RSVPRequest(BaseModel):
    meeting_id: int
    user_id: int
    response: str
