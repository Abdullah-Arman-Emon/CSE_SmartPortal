from pydantic import BaseModel, Field
from typing import List, Optional




class UpdateStudentSchema(BaseModel):
    first_name: Optional[str] = Field(None, max_length=100)
    last_name: Optional[str] = Field(None, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    bio: Optional[str] = Field(None, max_length=500)
    batch: Optional[int] = None  # e.g., "27"
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
    profile_image: Optional[str] = Field(None, max_length=255)

    class Config:
        orm_mode = True