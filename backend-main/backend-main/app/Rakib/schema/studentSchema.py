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
    profile_image: Optional[str] = Field(None, max_length=255)

    class Config:
        orm_mode = True