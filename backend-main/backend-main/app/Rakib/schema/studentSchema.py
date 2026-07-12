from pydantic import BaseModel, Field
from typing import List, Optional




class UpdateStudentSchema(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    batch: Optional[int] = None  # e.g., "27"
    current_semester: Optional[str] = Field(None, max_length=10)  # e.g., "3-1"
    program: Optional[str] = None  # "bsc" | "msc"
    msc_group: Optional[str] = None  # "thesis" | "project" (only for msc)
    profile_image: Optional[str] = Field(None, max_length=255)  # image URL or file path
    # Extended profile (student-editable) — registration_number is intentionally
    # NOT editable here (identity is fixed at sign-up).
    nickname: Optional[str] = Field(None, max_length=60)
    gender: Optional[str] = Field(None, max_length=15)
    blood_group: Optional[str] = Field(None, max_length=5)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    roll: Optional[str] = Field(None, max_length=20)
    merit_rank: Optional[str] = Field(None, max_length=15)
    school: Optional[str] = Field(None, max_length=200)
    college: Optional[str] = Field(None, max_length=200)
    department: Optional[str] = Field(None, max_length=120)
    present_address: Optional[str] = Field(None, max_length=300)
    permanent_address: Optional[str] = Field(None, max_length=300)
    hall: Optional[str] = Field(None, max_length=120)
    personal_email: Optional[str] = Field(None, max_length=150)
    facebook_url: Optional[str] = Field(None, max_length=400)
    other_social: Optional[str] = Field(None, max_length=400)
    guardian_mobile: Optional[str] = Field(None, max_length=30)

    class Config:
        orm_mode = True


class StudentSchema(BaseModel):
    id: int
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    batch: int
    current_semester: Optional[str] = Field(None, max_length=10)
    program: Optional[str] = "bsc"
    msc_group: Optional[str] = None
    status: Optional[str] = "active"  # active | graduated | dropped | on_leave
    profile_image: Optional[str] = Field(None, max_length=255)
    # Extended profile
    registration_number: Optional[str] = Field(None, max_length=30)
    nickname: Optional[str] = Field(None, max_length=60)
    gender: Optional[str] = Field(None, max_length=15)
    blood_group: Optional[str] = Field(None, max_length=5)
    date_of_birth: Optional[str] = Field(None, max_length=20)
    roll: Optional[str] = Field(None, max_length=20)
    merit_rank: Optional[str] = Field(None, max_length=15)
    school: Optional[str] = Field(None, max_length=200)
    college: Optional[str] = Field(None, max_length=200)
    department: Optional[str] = Field(None, max_length=120)
    present_address: Optional[str] = Field(None, max_length=300)
    permanent_address: Optional[str] = Field(None, max_length=300)
    hall: Optional[str] = Field(None, max_length=120)
    personal_email: Optional[str] = Field(None, max_length=150)
    facebook_url: Optional[str] = Field(None, max_length=400)
    other_social: Optional[str] = Field(None, max_length=400)
    guardian_mobile: Optional[str] = Field(None, max_length=30)

    class Config:
        orm_mode = True