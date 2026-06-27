
from pydantic import BaseModel, Field
from typing import List, Optional



class StudentInfo(BaseModel):
    num_classes_today: int
    num_assignments_remaining_today: int
    num_labs_today : int

    
    

class StudentTodaysClass(BaseModel):
    class_id: int
    course_title: str
    course_code: str
    time: str  # e.g., "10:00 AM"
    type: str  # e.g., "Theory", "Lab"
    

class StudentNotice(BaseModel):
    id: int
    title: str
    content: str
    batch: Optional[int] = None  # e.g., "27" -- batch specific notices -- null for all batches
    date: str  # ISO format date string

class StudentUpcomingTest(BaseModel):
    id: int
    name: str
    date: str  # ISO format date string
    duration: int  # in minutes
    room: str
    type: str  # "Midterm", "Final"
 
    
    
class StudentMissingClass(BaseModel):
    month: str  # e.g., "January"
    year: int  # e.g., 2023
    percentage_classes: int  # e.g., 20 for 20%