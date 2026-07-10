from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.Emon.model.userModel import User
from app.Emon.model.curriculum import CurriculumCourse
from app.Emon.schema.curriculum import (
    CurriculumCourseCreate,
    CurriculumCourseUpdate,
    CurriculumCourseResponse,
)

router = APIRouter(prefix="/v1/curriculum", tags=["Curriculum"])

VALID_CATEGORIES = {"general", "core", "elective1", "elective2", "elective3", "project"}
VALID_PROGRAMS = {"bsc", "msc"}


def require_admin(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can modify the curriculum catalog")
    return user


@router.get("", response_model=List[CurriculumCourseResponse])
def list_curriculum(
    program: Optional[str] = Query(None),
    semester: Optional[str] = Query(None, description='e.g. "1-1"'),
    year: Optional[int] = Query(None),
    category: Optional[str] = Query(None),
    q: Optional[str] = Query(None, description="search in course_code/title"),
    db: Session = Depends(get_db),
):
    query = db.query(CurriculumCourse)
    if program:
        query = query.filter(CurriculumCourse.program == program)
    if semester:
        try:
            y, s = semester.split("-")
            query = query.filter(
                CurriculumCourse.year == int(y),
                CurriculumCourse.semester_no == int(s),
            )
        except ValueError:
            raise HTTPException(status_code=400, detail='semester must look like "1-1"')
    if year is not None:
        query = query.filter(CurriculumCourse.year == year)
    if category:
        query = query.filter(CurriculumCourse.category == category)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (CurriculumCourse.course_code.like(like)) | (CurriculumCourse.title.like(like))
        )
    return query.order_by(CurriculumCourse.course_code).all()


@router.get("/{course_code}", response_model=CurriculumCourseResponse)
def get_curriculum_course(course_code: str, db: Session = Depends(get_db)):
    row = db.query(CurriculumCourse).filter(CurriculumCourse.course_code == course_code).first()
    if not row:
        raise HTTPException(status_code=404, detail=f"Course {course_code} not in curriculum catalog")
    return row


@router.post("", response_model=CurriculumCourseResponse)
def create_curriculum_course(
    data: CurriculumCourseCreate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    require_admin(user_id, db)
    if data.program not in VALID_PROGRAMS:
        raise HTTPException(status_code=400, detail=f"invalid program {data.program}")
    if data.category not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"invalid category {data.category}")
    exists = db.query(CurriculumCourse).filter(
        CurriculumCourse.course_code == data.course_code
    ).first()
    if exists:
        raise HTTPException(status_code=409, detail=f"{data.course_code} already exists in catalog")
    row = CurriculumCourse(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.put("/{curriculum_id}", response_model=CurriculumCourseResponse)
def update_curriculum_course(
    curriculum_id: int,
    data: CurriculumCourseUpdate,
    user_id: int = Query(...),
    db: Session = Depends(get_db),
):
    require_admin(user_id, db)
    row = db.query(CurriculumCourse).filter(CurriculumCourse.id == curriculum_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Curriculum course not found")
    updates = data.model_dump(exclude_unset=True)
    if "category" in updates and updates["category"] not in VALID_CATEGORIES:
        raise HTTPException(status_code=400, detail=f"invalid category {updates['category']}")
    for k, v in updates.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return row
