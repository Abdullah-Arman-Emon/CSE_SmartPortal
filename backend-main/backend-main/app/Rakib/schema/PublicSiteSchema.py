from pydantic import BaseModel
from typing import Optional, List


class PersonIn(BaseModel):
    name: str
    role: Optional[str] = None
    category: Optional[str] = "Faculty"
    expertise: Optional[List[str]] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    office: Optional[str] = None
    office_hours: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None
    publications: Optional[List[dict]] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class PersonUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    category: Optional[str] = None
    expertise: Optional[List[str]] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    office: Optional[str] = None
    office_hours: Optional[str] = None
    image_url: Optional[str] = None
    bio: Optional[str] = None
    status: Optional[str] = None
    publications: Optional[List[dict]] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class ContentUpsert(BaseModel):
    value: Optional[str] = None


class ProgramIn(BaseModel):
    title: str
    level: str
    description: Optional[str] = None
    image_url: Optional[str] = None
    credits: Optional[str] = None
    duration: Optional[str] = None
    students_enrolled: Optional[str] = None
    application_deadline: Optional[str] = None
    tuition_fee: Optional[str] = None
    admission_requirements: Optional[List[str]] = None
    career_prospects: Optional[List[str]] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class ProgramUpdate(BaseModel):
    title: Optional[str] = None
    level: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    credits: Optional[str] = None
    duration: Optional[str] = None
    students_enrolled: Optional[str] = None
    application_deadline: Optional[str] = None
    tuition_fee: Optional[str] = None
    admission_requirements: Optional[List[str]] = None
    career_prospects: Optional[List[str]] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None


class SyllabusWeek(BaseModel):
    number: Optional[int] = None
    topic: Optional[str] = None
    date: Optional[str] = None
    description: Optional[str] = None


class ProgramCourseIn(BaseModel):
    program_id: int
    code: Optional[str] = None
    title: str
    semester: Optional[str] = None
    year: Optional[int] = None
    credits: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    instructor: Optional[str] = None
    syllabus_weeks: Optional[List[SyllabusWeek]] = None


class ProgramCourseUpdate(BaseModel):
    program_id: Optional[int] = None
    code: Optional[str] = None
    title: Optional[str] = None
    semester: Optional[str] = None
    year: Optional[int] = None
    credits: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    instructor: Optional[str] = None
    syllabus_weeks: Optional[List[SyllabusWeek]] = None


class GalleryIn(BaseModel):
    image_url: str
    caption: Optional[str] = None
    display_order: Optional[int] = 0
    is_active: Optional[bool] = True


class GalleryUpdate(BaseModel):
    image_url: Optional[str] = None
    caption: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None
