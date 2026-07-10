from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Literal




class NoticeOut(BaseModel):
    id: int
    title: str
    sub_title: Optional[str] = None
    content: str
    batch: Optional[int] = None
    date: datetime
    notice_from: Literal["Chairman", "Admin", "Student-Club", "Department", "Central"]
    attachments: Optional[list[str]] = None

    class Config:
        orm_mode = True