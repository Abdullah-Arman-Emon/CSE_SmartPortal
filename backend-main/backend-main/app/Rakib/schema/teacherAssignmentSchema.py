from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class AssignmentCreate(BaseModel):
    title: str
    description: Optional[str] = None
    max_marks: Optional[int] = None
    due_date: Optional[datetime] = None
    given_date: datetime
    type: str  # "Homework" or "Resource"
    file_links: Optional[List[str]] = None
    course_id:int
    
class AssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    max_marks: Optional[int] = None
    due_date: Optional[datetime] = None
    given_date: datetime
    type: str  # "Homework" or "Resource"
    file_links: Optional[List[str]] = None
    course_id:int
    
    

class SubmissionBase(BaseModel):
    assignment_id: int
    student_id: int
    submitted_at: datetime
    checked: bool
    file_links: Optional[List[str]] = None
    marks: Optional[int] = None

class SubmissionOut(SubmissionBase):
    id: int
    assignment_id: int
    student_id: int
    submitted_at: datetime
    checked: bool
    file_links: Optional[List[str]] = None
    marks: Optional[int] = None
    
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    batch: int
    profile_image: Optional[str] = Field(None, max_length=255)

    