from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List
from datetime import datetime

from app.Rakib.model.notice import Notice

from app.Rakib.schema.adminNoticeSchema import NoticeOut, NoticeCreate


router = APIRouter(
    prefix="/admin/notices",
    tags=["Admin NoticeBoard"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        

@router.get("/upcoming", response_model=List[NoticeOut])
def list_all_upcoming_notices_in_asc_order(db: Session = Depends(get_db), batch: int = None):
    query = db.query(Notice).filter(Notice.date >= datetime.now())

    if batch is not None:
        query = query.filter((Notice.batch == batch) | (Notice.batch == None))  # batch-specific or for all

    notices = query.order_by(Notice.date.asc()).all()
    return notices





@router.post("/create", response_model=NoticeOut)
def create_notice(notice_data: NoticeCreate, db: Session = Depends(get_db)):
    new_notice = Notice(
        title=notice_data.title,
        sub_title=notice_data.sub_title,
        content=notice_data.content,
        batch=notice_data.batch,
        date=notice_data.date,
        notice_from=notice_data.notice_from,
        attachments=notice_data.attachments
    )
    db.add(new_notice)
    db.commit()
    db.refresh(new_notice)
    return new_notice

@router.delete("/delete/{notice_id}", response_model=dict)
def delete_notice(notice_id: int, db: Session = Depends(get_db)):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()

    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    db.delete(notice)
    db.commit()
    return {"message": "Notice deleted successfully"}


@router.get("/all", response_model=List[NoticeOut])
def list_all_notices_in_asc_order(db: Session = Depends(get_db)):
    notices = db.query(Notice).order_by(Notice.date.desc()).all()
    return notices



@router.get("/{notice_id}", response_model=NoticeOut)
def get_specific_notice(notice_id: int, db: Session = Depends(get_db)):
    notice = db.query(Notice).filter(Notice.id == notice_id).first()

    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")

    return notice