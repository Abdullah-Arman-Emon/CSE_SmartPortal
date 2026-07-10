from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.Emon.model.finance_event import FinanceEvent
from app.Emon.model.student_payment import StudentPayment
from app.Emon.schema.finance import FinanceEventCreate, FinanceEventResponse, StudentPaymentCreate, StudentPaymentResponse
from datetime import datetime

router = APIRouter(prefix="/v1/finance", tags=["Finance"])


@router.post("/events", response_model=FinanceEventResponse)
def create_event(data: FinanceEventCreate, db: Session = Depends(get_db)):
    event = FinanceEvent(**data.model_dump())
    db.add(event)
    db.commit()
    db.refresh(event)
    return event

@router.put("/update/event/{event_id}", response_model=FinanceEventResponse)
def update_event(event_id: int, data: FinanceEventCreate, db: Session = Depends(get_db)):
    event = db.query(FinanceEvent).filter(FinanceEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    for key, value in data.model_dump().items():
        setattr(event, key, value)
    
    db.commit()
    db.refresh(event)
    return event
    
@router.delete("/delete/event/{event_id}", status_code=204)
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(FinanceEvent).filter(FinanceEvent.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    
    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}

@router.get("/events", response_model=list[FinanceEventResponse])
def list_events(db: Session = Depends(get_db)):
    return db.query(FinanceEvent).all()


@router.post("/payments", response_model=StudentPaymentResponse)
def submit_payment(data: StudentPaymentCreate, db: Session = Depends(get_db)):
    payment = StudentPayment(**data.dict())
    payment.status = "paid"  # Mark as paid immediately
    payment.verified_at = datetime.now()  # Set verification time
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return payment


@router.get("/payments/pending", response_model=list[StudentPaymentResponse])
def pending_payments(db: Session = Depends(get_db)):
    return db.query(StudentPayment).filter(StudentPayment.status == "pending").all()


@router.get("/payments/paid", response_model=list[StudentPaymentResponse])
def paid_payments(db: Session = Depends(get_db)):
    return db.query(StudentPayment).filter(StudentPayment.status == "paid").all()


@router.post("/payments/verify/{payment_id}")
def verify_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(StudentPayment).filter(StudentPayment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    payment.status = "paid"
    payment.verified_at = datetime.now()
    db.commit()
    return {"message": "Payment marked as paid"}
