from pydantic import BaseModel
from typing import Optional, List

class ScheduleCreate(BaseModel):
    day: str
    start_time: str


class CourseCreate(BaseModel):
    title: str
    course_code: Optional[str] = None  # catalog code, e.g. "CSE 1101" (None = custom course)
    credit: Optional[float] = None
    description: Optional[str] = None
    other_links: Optional[str] = None
    semester: str
    batch: int
    type: str
    image_url: Optional[str] = None
    teacher_id: int
    schedules: List[ScheduleCreate]

class CourseResponse(BaseModel):
    id: int
    title: str
    code: str
    course_code: Optional[str] = None
    credit: Optional[float] = None
    description: Optional[str]
    other_links: Optional[str]
    image_url: Optional[str]
    teacher_id: int
    running: bool
    schedules: List[ScheduleCreate]

    class Config:
        from_attributes = True
