from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from typing import List, Optional
from datetime import datetime


from app.Rakib.model.exam import Exam

from app.Rakib.schema.adminExamSchema import  ExamOut


router = APIRouter(
    prefix="/student/exams",
    tags=["Student Exams"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        



#can be searched using batch, type , room
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