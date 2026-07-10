from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from typing import List, Optional
from datetime import datetime


from app.Rakib.model.exam import Exam

from app.Rakib.schema.adminExamSchema import ExamCreate, ExamOut


router = APIRouter(
    prefix="/admin/exams",
    tags=["Admin Exams"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        
@router.post("/create", response_model=ExamOut, status_code=status.HTTP_201_CREATED)
def create_exam_by_admin(exam_data: ExamCreate, db: Session = Depends(get_db)):
    exam = Exam(
        name=exam_data.name,
        date=exam_data.date,
        duration=exam_data.duration,
        batch = exam_data.batch,
        room=exam_data.room,
        type=exam_data.type,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return exam


@router.delete("/delete/{exam_id}", status_code=status.HTTP_200_OK)
def delete_exam_by_admin(exam_id: int, db: Session = Depends(get_db)):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    db.delete(exam)
    db.commit()
    return {"message": "Exam deleted successfully"}

#can be searched using batch, type , course and/or room
@router.get("/list", response_model=List[ExamOut])
def list_all_upcoming_exams(
    db: Session = Depends(get_db),
    batch: Optional[str] = Query(None),
    type: Optional[str] = Query(None),
    room: Optional[str] = Query(None),
):
    query = db.query(Exam).filter(Exam.date >= datetime.now())

    if batch:
        query = query.filter(Exam.batch == batch)
    if type:
        query = query.filter(Exam.type == type)
    if room:
        query = query.filter(Exam.room == room)

    return query.order_by(Exam.date.asc()).all()