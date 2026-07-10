from pydantic import BaseModel, HttpUrl
from typing import List, Optional


class ResearchPaperSchema(BaseModel):
    id: Optional[int]
    paper_link: HttpUrl

class TeacherSchema(BaseModel):
    id:int
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    work: Optional[str] = None
    bio: Optional[str] = None
    profile_image: Optional[str] = None

    # website: Optional[str] = None
    # google_scholar: Optional[str] = None
    # academia: Optional[str] = None
    # linkedin: Optional[str] = None
    # twitter: Optional[str] = None
    # whatsapp: Optional[str] = None
    # researchgate: Optional[str] = None

    # papers: List[ResearchPaperSchema] = []



class TeacherProfileUpdate(BaseModel):
    first_name: str
    last_name: str
    phone: str
    work: Optional[str]
    bio: Optional[str]
    profile_image: Optional[str]

    website: Optional[str]
    google_scholar: Optional[str]
    academia: Optional[str]
    linkedin: Optional[str]
    twitter: Optional[str]
    whatsapp: Optional[str]
    researchgate: Optional[str]

    papers: List[ResearchPaperSchema] = []

class TeacherProfileResponse(TeacherProfileUpdate):
    id: int
    # NULL in DB for freshly-created teachers — must not 500 the GET
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None

    class Config:
        orm_mode = True
