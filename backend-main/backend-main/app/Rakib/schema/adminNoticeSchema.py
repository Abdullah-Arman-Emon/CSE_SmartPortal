
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal, List


class NoticeCreate(BaseModel):
    title: str
    sub_title: Optional[str] = None
    content: str
    batch: Optional[int] = None
    date: datetime
    notice_from: Literal["Chairman", "Admin", "Student-Club", "Department", "Central"]
    attachments: Optional[List[str]] = None


class NoticeOut(BaseModel):
    id: int
    title: str
    sub_title: Optional[str] = None
    content: str
    batch: Optional[int] = None
    date: datetime
    notice_from: Literal["Chairman", "Admin", "Student-Club", "Department", "Central"]
    attachments: Optional[List[str]] = None

    class Config:
        orm_mode = True