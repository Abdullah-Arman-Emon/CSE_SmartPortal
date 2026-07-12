from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.Emon.model.userModel import User
from app.Rakib.model.student import Student
from app.Rakib.model.batch_change import BatchChangeRequest
from app.Rakib.model.batch_term import BatchTerm
from app.Rakib.api.NotificationApi import push as push_notification

router = APIRouter(prefix="/v1/batch-change", tags=["Batch Change"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _require_admin(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can do this")
    return user


def _admin_user_ids(db: Session):
    return [u.id for u in db.query(User).filter(User.role == "admin").all()]


def _student_name(s: Student) -> str:
    return f"{s.first_name or ''} {s.last_name or ''}".strip() or f"Student #{s.id}"


def _serialize(req: BatchChangeRequest, db: Session) -> dict:
    s = db.query(Student).filter(Student.id == req.student_id).first()
    return {
        "id": req.id,
        "student_id": req.student_id,
        "student_name": _student_name(s) if s else f"#{req.student_id}",
        "from_batch": req.from_batch,
        "from_semester": req.from_semester,
        "to_batch": req.to_batch,
        "to_semester": req.to_semester,
        "reason": req.reason,
        "status": req.status,
        "decided_note": req.decided_note,
        "created_at": req.created_at.isoformat() if req.created_at else None,
        "decided_at": req.decided_at.isoformat() if req.decided_at else None,
    }


class ChangeIn(BaseModel):
    to_batch: int
    to_semester: str
    reason: Optional[str] = None


class DecisionIn(BaseModel):
    note: Optional[str] = None


@router.post("/request")
def create_request(data: ChangeIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    """A student requests to move to a different batch/semester (drop / readmission
    / full-semester retake with a junior batch)."""
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    if db.query(BatchChangeRequest).filter(
        BatchChangeRequest.student_id == student.id,
        BatchChangeRequest.status == "pending",
    ).first():
        raise HTTPException(status_code=400, detail="You already have a pending batch-change request")

    req = BatchChangeRequest(
        student_id=student.id,
        from_batch=student.batch, from_semester=student.current_semester,
        to_batch=data.to_batch, to_semester=data.to_semester,
        reason=data.reason, status="pending",
    )
    db.add(req)
    db.flush()
    for uid in _admin_user_ids(db):
        push_notification(
            db, uid,
            f"{_student_name(student)} requests moving to Batch {data.to_batch} ({data.to_semester}). "
            f"Review in Admin → Students.",
            ntype="admin", link="/admin-dashboard",
        )
    db.commit()
    db.refresh(req)
    return _serialize(req, db)


@router.get("/my")
def my_requests(user_id: int = Query(...), db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student profile not found")
    reqs = (db.query(BatchChangeRequest)
            .filter(BatchChangeRequest.student_id == student.id)
            .order_by(BatchChangeRequest.id.desc()).all())
    return [_serialize(r, db) for r in reqs]


@router.get("/admin/list")
def admin_list(user_id: int = Query(...), status: Optional[str] = None,
               db: Session = Depends(get_db)):
    _require_admin(user_id, db)
    q = db.query(BatchChangeRequest)
    if status:
        q = q.filter(BatchChangeRequest.status == status)
    reqs = q.order_by(BatchChangeRequest.id.desc()).limit(200).all()
    return [_serialize(r, db) for r in reqs]


@router.put("/admin/{request_id}/approve")
def approve(request_id: int, data: DecisionIn = DecisionIn(), user_id: int = Query(...),
            db: Session = Depends(get_db)):
    """Approve: move the student. Past Results stay attached to their original
    courses (they carry the old batch/semester), so academic history is preserved
    while the student's *current* position changes."""
    _require_admin(user_id, db)
    req = db.query(BatchChangeRequest).filter(BatchChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {req.status}")
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student no longer exists")

    student.batch = req.to_batch
    student.current_semester = req.to_semester
    req.status = "approved"
    req.decided_by = user_id
    req.decided_note = data.note
    req.decided_at = datetime.utcnow()

    # make sure the destination term exists on the spine
    if not (db.query(BatchTerm)
            .filter(BatchTerm.batch == req.to_batch, BatchTerm.semester == req.to_semester).first()):
        db.add(BatchTerm(batch=req.to_batch, semester=req.to_semester,
                         program=student.program, status="running"))

    push_notification(
        db, student.user_id,
        f"Your batch-change request was approved. You are now in Batch {req.to_batch} ({req.to_semester}).",
        ntype="admin", link="/student-dashboard",
    )
    db.commit()
    return _serialize(req, db)


@router.put("/admin/{request_id}/reject")
def reject(request_id: int, data: DecisionIn = DecisionIn(), user_id: int = Query(...),
           db: Session = Depends(get_db)):
    _require_admin(user_id, db)
    req = db.query(BatchChangeRequest).filter(BatchChangeRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request already {req.status}")
    req.status = "rejected"
    req.decided_by = user_id
    req.decided_note = data.note
    req.decided_at = datetime.utcnow()
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if student:
        push_notification(
            db, student.user_id,
            "Your batch-change request was declined." + (f" Note: {data.note}" if data.note else ""),
            ntype="admin", link="/student-dashboard",
        )
    db.commit()
    return _serialize(req, db)
