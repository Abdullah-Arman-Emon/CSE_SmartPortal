from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.Emon.model.userModel import User
from app.Rakib.model.student import Student
from app.Rakib.model.batch_term import BatchTerm, semester_rank, BSC_SEMESTER_ORDER

router = APIRouter(prefix="/v1/batch-terms", tags=["Batch Terms"])


def _require_admin(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can do this")
    return user


def _next_semester(semester: str):
    """The semester a batch advances to, or None if it just graduated."""
    if semester in BSC_SEMESTER_ORDER:
        i = BSC_SEMESTER_ORDER.index(semester)
        return BSC_SEMESTER_ORDER[i + 1] if i + 1 < len(BSC_SEMESTER_ORDER) else None
    return None


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _serialize(t: BatchTerm) -> dict:
    return {
        "id": t.id,
        "batch": t.batch,
        "semester": t.semester,
        "program": t.program,
        "year_label": t.year_label,
        "start_date": t.start_date.isoformat() if t.start_date else None,
        "end_date": t.end_date.isoformat() if t.end_date else None,
        "status": t.status,
    }


@router.get("")
def list_terms(db: Session = Depends(get_db)):
    """Full term timeline, newest batch first then chronological within a batch."""
    terms = db.query(BatchTerm).all()
    terms.sort(key=lambda t: (-t.batch, semester_rank(t.semester)))
    return [_serialize(t) for t in terms]


@router.get("/batch/{batch}")
def terms_for_batch(batch: int, db: Session = Depends(get_db)):
    """Chronological terms for one batch (spine for student/teacher history UI)."""
    terms = db.query(BatchTerm).filter(BatchTerm.batch == batch).all()
    terms.sort(key=lambda t: semester_rank(t.semester))
    return [_serialize(t) for t in terms]


@router.post("/admin/ensure")
def ensure_term(batch: int = Query(...), semester: str = Query(...),
                program: str = "bsc", year_label: str = None,
                status: str = "running", user_id: int = Query(...),
                db: Session = Depends(get_db)):
    """Create (or return) the BatchTerm for a batch+semester. Idempotent."""
    _require_admin(user_id, db)
    term = (db.query(BatchTerm)
            .filter(BatchTerm.batch == batch, BatchTerm.semester == semester).first())
    if not term:
        term = BatchTerm(batch=batch, semester=semester, program=program,
                         year_label=year_label, status=status)
        db.add(term)
        db.commit()
        db.refresh(term)
    return _serialize(term)


@router.post("/admin/close")
def close_term(batch: int = Query(...), semester: str = Query(...),
               user_id: int = Query(...), db: Session = Depends(get_db)):
    """Promotion engine. Closing a term:
      1. finalises every affected student's SemesterResult for this term,
      2. advances students currently in this semester to the next one,
      3. marks this BatchTerm 'completed' and opens the next one 'running'.
    """
    _require_admin(user_id, db)
    from app.Rakib.api.NotificationApi import push as push_notification
    from app.Rakib.api.ResultApi import recompute_semester_results
    from app.Emon.model.course import Course
    from app.Rakib.model.batch import Batch

    term = (db.query(BatchTerm)
            .filter(BatchTerm.batch == batch, BatchTerm.semester == semester).first())
    if not term:
        term = BatchTerm(batch=batch, semester=semester, status="running")
        db.add(term)
        db.flush()

    students = (db.query(Student)
                .filter(Student.batch == batch, Student.current_semester == semester,
                        Student.status == "active").all())
    nxt = _next_semester(semester)
    promoted = 0
    for s in students:
        recompute_semester_results(db, s.id, finalize_term=(batch, semester))
        if nxt:
            s.current_semester = nxt
            promoted += 1
            push_notification(
                db, s.user_id,
                f"Semester {semester} closed — you have been promoted to {nxt}. "
                f"Your GPA for {semester} is now final.",
                ntype="result", link="/results",
            )
        else:
            # last semester of the programme — this student graduates
            s.status = "graduated"
            push_notification(
                db, s.user_id,
                f"Your final semester ({semester}) is closed. Congratulations on "
                f"completing the programme! Your transcript stays available.",
                ntype="result", link="/results",
            )

    # This term's course offerings are now finished — flip them so teacher/student
    # timelines stop showing them as current and only the new term is "active".
    db.query(Course).filter(Course.batch == batch, Course.semester == semester,
                            Course.status == "active").update(
        {Course.status: "completed", Course.running: False},
        synchronize_session=False)

    term.status = "completed"
    term.end_date = term.end_date or datetime.utcnow().date()
    if nxt:
        nxt_term = (db.query(BatchTerm)
                    .filter(BatchTerm.batch == batch, BatchTerm.semester == nxt).first())
        if not nxt_term:
            db.add(BatchTerm(batch=batch, semester=nxt, program=term.program, status="running"))
        else:
            nxt_term.status = "running"

    # Keep the Batch master row in sync: advance its pointer, or graduate it.
    master = db.query(Batch).filter(Batch.number == batch).first()
    if master:
        master.current_semester = nxt
        if nxt is None:
            master.status = "graduated"

    db.commit()
    return {
        "message": f"Term {batch}/{semester} closed",
        "students_promoted": promoted,
        "next_semester": nxt,
        "graduated": nxt is None,
    }
