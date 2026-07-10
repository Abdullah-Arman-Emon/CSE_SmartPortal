from pydantic import BaseModel, Field
from typing import List, Optional


class MySchedule(BaseModel):
    day: str
    start_time: str



class MyCourse(BaseModel):
    id: int
    title: str = Field(..., max_length=255)
    code: str = Field(..., max_length=255)  # Code = passcode
    description: Optional[str] = Field(None, max_length=500)
    semester: str = Field(..., max_length=50)  # e.g., "4-1, 3-2"
    batch: int  # e.g., "27"
    type: str = Field(..., max_length=50)  # e.g., "Theory", "Lab"
    image_url: Optional[str] = Field(None, max_length=255)  # Optional image
    running: bool
    schedules : List[MySchedule]

    class Config:
        from_attributes = True