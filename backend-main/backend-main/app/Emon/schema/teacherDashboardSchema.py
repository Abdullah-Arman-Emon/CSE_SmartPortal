from pydantic import BaseModel
from typing import List
from datetime import datetime

class RecentActivity(BaseModel):
    message: str
    created_at: datetime

class ScheduleItem(BaseModel):
    course_title: str
    day: str
    time: str

class DashboardData(BaseModel):
    assignments_to_check: int
    running_courses: int
    total_students: int
    recent_activity: List[RecentActivity]
    today_schedule: List[ScheduleItem]
