"""Batch lifecycle management (admin).

The Batch table is the master lifecycle record for a cohort. This router exposes
the two lifecycle *events* a department performs every year:
  - admit a new batch (creates the Batch row + its first BatchTerm),
  - graduate a whole batch (marks batch + its students graduated, closes courses).

Regular semester-to-semester promotion lives in BatchTermApi.close_term, which
also keeps Batch.current_semester in sync. Reading batch status here lets every
other feature exclude finished batches instead of showing stale "active" data.
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.Emon.model.userModel import User
from app.Emon.model.course import Course
from app.Rakib.model.student import Student
from app.Rakib.model.batch import Batch
from app.Rakib.model.batch_term import BatchTerm

router = APIRouter(prefix="/v1/batches", tags=["Batches"])


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


def _first_semester(program: str) -> str:
    return "1-1"  # both bsc and msc start at 1-1 in this system


def _serialize(b: Batch, db: Session) -> dict:
    counts = {"active": 0, "graduated": 0, "other": 0}
    for (st,) in db.query(Student.status).filter(Student.batch == b.number).all():
        if st == "active":
            counts["active"] += 1
        elif st == "graduated":
            counts["graduated"] += 1
        else:
            counts["other"] += 1
    return {
        "id": b.id,
        "number": b.number,
        "name": b.name,
        "program": b.program,
        "admission_year": b.admission_year,
        "current_semester": b.current_semester,
        "status": b.status,
        "student_counts": counts,
    }


@router.get("")
def list_batches(db: Session = Depends(get_db)):
    """All batches, newest (highest number) first."""
    batches = db.query(Batch).order_by(Batch.number.desc()).all()
    return [_serialize(b, db) for b in batches]


@router.post("/admin/admit")
def admit_batch(number: int = Query(...), program: str = "bsc",
                admission_year: int = None, name: str = None,
                user_id: int = Query(...), db: Session = Depends(get_db)):
    """Admit a new batch: create the Batch master row and open its first term.

    Idempotent on batch number — re-calling returns the existing batch untouched.
    """
    _require_admin(user_id, db)
    if program not in ("bsc", "msc"):
        raise HTTPException(status_code=400, detail="program must be bsc or msc")

    batch = db.query(Batch).filter(Batch.number == number).first()
    if batch:
        return {"message": "Batch already exists", "batch": _serialize(batch, db)}

    first_sem = _first_semester(program)
    batch = Batch(
        number=number, program=program,
        admission_year=admission_year or datetime.utcnow().year,
        name=name or f"Batch {number}",
        current_semester=first_sem, status="active",
    )
    db.add(batch)

    # Open the first BatchTerm so routines/courses can hang off it immediately.
    term = (db.query(BatchTerm)
            .filter(BatchTerm.batch == number, BatchTerm.semester == first_sem).first())
    if not term:
        db.add(BatchTerm(batch=number, semester=first_sem, program=program,
                         status="running",
                         start_date=datetime.utcnow().date()))
    db.commit()
    db.refresh(batch)
    return {"message": f"Batch {number} admitted at {first_sem}",
            "batch": _serialize(batch, db)}


@router.put("/admin/{number}/graduate")
def graduate_batch(number: int, user_id: int = Query(...),
                   db: Session = Depends(get_db)):
    """Graduate a whole batch: mark the batch + all its active students graduated,
    mark its courses completed and its running term completed. This is the
    lifecycle event that moves a cohort into the read-only alumni archive.
    """
    _require_admin(user_id, db)
    batch = db.query(Batch).filter(Batch.number == number).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")

    from app.Rakib.api.NotificationApi import push as push_notification
    from app.Rakib.api.ResultApi import recompute_semester_results

    grad = 0
    for s in db.query(Student).filter(Student.batch == number,
                                      Student.status == "active").all():
        # finalise whatever term they were in so CGPA is locked before alumni
        if s.current_semester:
            recompute_semester_results(db, s.id,
                                       finalize_term=(number, s.current_semester))
        s.status = "graduated"
        grad += 1
        push_notification(
            db, s.user_id,
            "Congratulations! Your batch has graduated. Your results and "
            "transcript remain available in your account.",
            ntype="result", link="/results",
        )

    db.query(Course).filter(Course.batch == number).update(
        {Course.status: "completed", Course.running: False},
        synchronize_session=False)
    db.query(BatchTerm).filter(BatchTerm.batch == number,
                               BatchTerm.status == "running").update(
        {BatchTerm.status: "completed"}, synchronize_session=False)

    batch.status = "graduated"
    batch.current_semester = None
    db.commit()
    return {"message": f"Batch {number} graduated",
            "students_graduated": grad}


@router.put("/admin/{number}/archive")
def archive_batch(number: int, user_id: int = Query(...),
                  db: Session = Depends(get_db)):
    """Hide a graduated batch from lifecycle dashboards (data stays intact)."""
    _require_admin(user_id, db)
    batch = db.query(Batch).filter(Batch.number == number).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    batch.status = "archived"
    db.commit()
    return {"message": f"Batch {number} archived"}
