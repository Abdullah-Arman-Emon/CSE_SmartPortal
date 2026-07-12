
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
    is_pinned: Optional[bool] = False


class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    sub_title: Optional[str] = None
    content: Optional[str] = None
    batch: Optional[int] = None
    date: Optional[datetime] = None
    notice_from: Optional[Literal["Chairman", "Admin", "Student-Club", "Department", "Central"]] = None
    attachments: Optional[List[str]] = None
    is_pinned: Optional[bool] = None


class NoticeOut(BaseModel):
    id: int
    title: str
    sub_title: Optional[str] = None
    content: str
    batch: Optional[int] = None
    date: datetime
    notice_from: Literal["Chairman", "Admin", "Student-Club", "Department", "Central"]
    attachments: Optional[List[str]] = None
    is_pinned: Optional[bool] = False

    class Config:
        orm_mode = True
