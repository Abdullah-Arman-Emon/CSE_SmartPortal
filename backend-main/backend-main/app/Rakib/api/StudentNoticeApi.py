from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List
from datetime import datetime

from app.Rakib.model.notice import Notice


from app.Rakib.schema.studentNoticeSchema import NoticeOut


router = APIRouter(
    prefix="/student/notice",
    tags=["Student NoticeBoard"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

from app.Rakib.model.student import Student

def get_current_student_batch(student_id: int, db: Session):
    print(student_id)
    student = db.query(Student).filter(Student.user_id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student.batch





@router.get("/upcoming", response_model=List[NoticeOut])
def list_all_upcoming_notices_in_desc_order(
    student_id: int,  # from query or path
    db: Session = Depends(get_db)
):
    student_batch = get_current_student_batch(student_id, db)
    print(student_batch)
    notices = (
        db.query(Notice)
        .filter(
            Notice.date >= datetime.now(),
            ((Notice.batch == None) | (Notice.batch == student_batch))
        )
        .order_by(Notice.date.desc())
        .all()
    )
    return notices

# @router.get("/upcoming", response_model=List[NoticeOut])
# def list_all_upcoming_notices_in_desc_order(db: Session = Depends(get_db)):
#     # Get all upcoming notices - notices are sent to all batches, no filtering needed
#     notices = db.query(Notice).filter(Notice.date >= datetime.now()).order_by(Notice.date.desc()).all()
#     return notices


@router.get("/all", response_model=List[NoticeOut])
def list_all_notices(db: Session = Depends(get_db)):
    """Return only notices meant for all batches (Notice.batch == None), ordered by date descending."""
    notices = db.query(Notice).filter(Notice.batch == None).order_by(Notice.date.desc()).all()
    if not notices:
        return []
    return notices


@router.get("/{notice_id}", response_model=NoticeOut)
def get_specific_notice(notice_id: int, db: Session = Depends(get_db)):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()

    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    return notice
