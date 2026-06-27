from pydantic import BaseModel, EmailStr
from typing import Literal

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: Literal["student", "teacher", "admin"]  # ✅ New required role field
    batch: int | None = None  # Optional for students

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    role: str  # ✅ Include role in response

    class Config:
        from_attributes = True  # for Pydantic v2
        
        
class UserPasswordChange(BaseModel):
    email: str
    old_pass: str
    new_pass: str
