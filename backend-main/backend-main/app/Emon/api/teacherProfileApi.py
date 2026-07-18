from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.Emon.model.teacher import Teacher
from app.Emon.model.research_paper import ResearchPaper
from app.Emon.schema.teacherProfileSchema import TeacherProfileUpdate, TeacherProfileResponse

router = APIRouter(prefix="/v1/teacher/profile", tags=["Teacher Profile"])


@router.get("/get", response_model=TeacherProfileResponse)
def get_profile_with_user_id(userId : int, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.user_id == userId).first()

    if not teacher:
        raise HTTPException(status_code=404, detail="teacher not found")

    return teacher


@router.get("/{teacher_id}", response_model=TeacherProfileResponse)
def get_profile(teacher_id: int, db: Session = Depends(get_db)):
    profile = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/{teacher_id}")
def update_profile(teacher_id: int, data: TeacherProfileUpdate, db: Session = Depends(get_db)):
    profile = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not profile:
        profile = Teacher(id=teacher_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)

    for field, value in data.dict(exclude={"papers"}).items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)

    # Delete old papers and add new ones
    db.query(ResearchPaper).filter(ResearchPaper.teacher_id == profile.id).delete()
    db.commit()

    for paper in data.papers:
        db.add(ResearchPaper(teacher_id=profile.id, paper_link=paper.paper_link))

    db.commit()
    db.refresh(profile)
    return {"detail": "Profile updated"}
