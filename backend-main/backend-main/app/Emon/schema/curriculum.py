from pydantic import BaseModel
from typing import Optional


class CurriculumCourseCreate(BaseModel):
    program: str = "bsc"                # "bsc" | "msc"
    course_code: str                    # e.g., "CSE 1101"
    title: str
    credit: float
    category: str = "core"              # general/core/elective1/elective2/elective3/project
    is_lab: bool = False
    year: Optional[int] = None          # 1..4 for BSc; None for MSc
    semester_no: Optional[int] = None   # 1..2 for BSc; None for MSc


class CurriculumCourseUpdate(BaseModel):
    title: Optional[str] = None
    credit: Optional[float] = None
    category: Optional[str] = None
    is_lab: Optional[bool] = None
    year: Optional[int] = None
    semester_no: Optional[int] = None


class CurriculumCourseResponse(BaseModel):
    id: int
    program: str
    course_code: str
    title: str
    credit: float
    category: str
    is_lab: bool
    year: Optional[int]
    semester_no: Optional[int]
    semester: Optional[str]             # derived "1-1" style

    class Config:
        from_attributes = True
