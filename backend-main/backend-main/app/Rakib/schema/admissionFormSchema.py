from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional


class AdmissionFormCreate(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr
    date_of_birth: datetime
    program: str
    profile_image: Optional[str] = None

    highest_qualification: str
    institution_name: str
    field_of_study: str
    graduation_date: datetime
    grade_gpa: Optional[str] = None

    required_doc: Optional[str] = None
    transcript: Optional[str] = None
    recommendation_letter: Optional[str] = None
    personal_essay: Optional[str] = None


class AdmissionFormOut(BaseModel):
    id: int
    form_given_on: datetime
    status: Optional[str] = "pending"
    first_name: str
    last_name: str
    email: EmailStr
    date_of_birth: datetime
    program: str
    profile_image: Optional[str] = None

    highest_qualification: str
    institution_name: str
    field_of_study: str
    graduation_date: datetime
    grade_gpa: Optional[str] = None

    required_doc: Optional[str] = None
    transcript: Optional[str] = None
    recommendation_letter: Optional[str] = None
    personal_essay: Optional[str] = None

    class Config:
        from_attributes = True  # For Pydantic v2 (instead of orm_mode=True)
