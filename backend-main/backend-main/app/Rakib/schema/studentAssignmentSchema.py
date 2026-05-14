
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class SubmissionCreateSchema(BaseModel):
    assignment_id: int
    student_id: int
    submitted_at: str  # ISO format date string
    file_links: List[str] = []  # list of file links for the submission

class SubmissionSchema(BaseModel):
    id: int
    assignment_id: int
    student_id: int
    submitted_at: str  # ISO format date string
    checked: bool = False  # default to False
    file_links: List[str] = []  # list of file links for the submission
    marks: int | None = None  # marks for the submission - null if not graded
    

class AssignmentSchema(BaseModel):
    id : int
    title: str
    description: str
    given_date: str
    max_marks: int | None = None  # maximum marks for the assignment - null if not graded
    type: str  # Enum-like behavior for assignment type, e.g., "Homework" or "Resource"
    due_date: str
    course_id: int
    file_links: List[str] = []
    my_submission : SubmissionSchema | None = None  # Optional submission details for the student
    
    

class AssignmentOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    max_marks: Optional[int] = None
    due_date: Optional[datetime] = None
    given_date: datetime
    type: str  # "Homework" or "Resource"
    file_links: Optional[List[str]] = []
    course_id:int
    
    
class SubmissionCreate(BaseModel):
    assignment_id: int
    student_id: int
    file_links: Optional[List[str]] = None
    
class SubmissionOut(BaseModel):
    id:int
    assignment_id: int
    student_id: int
    submitted_at: datetime
    checked: bool
    file_links: Optional[List[str]] = []
    marks: Optional[int] = None
    
class SubmissionUpdate(BaseModel):
    assignment_id: int
    student_id: int
    file_links: Optional[List[str]] = None






