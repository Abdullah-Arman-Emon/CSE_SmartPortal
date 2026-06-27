from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from typing import List, Optional
from datetime import datetime

from app.Rakib.model.admissionform import AdmissionForm

from app.Rakib.schema.admissionFormSchema import AdmissionFormCreate, AdmissionFormOut


router = APIRouter(
    prefix="/guest/admission",
    tags=["AdmissionHub"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        
        
@router.post("/create", response_model=AdmissionFormOut, status_code=status.HTTP_201_CREATED)
def create_admission_form(form_data: AdmissionFormCreate, db: Session = Depends(get_db)):
    form = AdmissionForm(**form_data.model_dump())
    form.form_given_on = datetime.now()
    db.add(form)
    db.commit()
    db.refresh(form)
    return form



