from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from typing import List, Optional
from datetime import datetime
from sqlalchemy import desc  

from app.Rakib.model.admissionform import AdmissionForm

from app.Rakib.schema.admissionFormSchema import AdmissionFormCreate, AdmissionFormOut


router = APIRouter(
    prefix="/admin/admission",
    tags=["Admin AdmissionHub"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        
# 🔹 List All Admission Forms (ordered by form_given_on descending)
@router.get("/list", response_model=List[AdmissionFormOut])
def list_admission_forms(db: Session = Depends(get_db)):
    return db.query(AdmissionForm).order_by(desc(AdmissionForm.form_given_on)).all()


ALLOWED_STATUSES = {"pending", "shortlisted", "accepted", "rejected"}


# 🔹 Update admission review status (pending -> shortlisted -> accepted/rejected)
@router.put("/status/{form_id}", response_model=AdmissionFormOut)
def update_admission_status(
    form_id: int,
    status: str = Query(..., description="pending | shortlisted | accepted | rejected"),
    db: Session = Depends(get_db),
):
    status = status.lower()
    if status not in ALLOWED_STATUSES:
        raise HTTPException(status_code=422, detail=f"Invalid status. Allowed: {sorted(ALLOWED_STATUSES)}")

    form = db.query(AdmissionForm).filter(AdmissionForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Admission form not found")

    form.status = status
    db.commit()
    db.refresh(form)
    return form


@router.delete("/delete/{form_id}", response_model=dict)
def delete_admission_form(form_id: int, db: Session = Depends(get_db)):
    form = db.query(AdmissionForm).filter(AdmissionForm.id == form_id).first()
    if not form:
        raise HTTPException(status_code=404, detail="Admission form not found")

    db.delete(form)
    db.commit()
    return {"message" : "form deleted successfully"}