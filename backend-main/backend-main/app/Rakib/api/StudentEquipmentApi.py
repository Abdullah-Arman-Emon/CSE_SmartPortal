from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List
from datetime import datetime


from app.Rakib.model.equipment import Equipment, StudentEquipment
from app.Rakib.model.student import Student

from app.Rakib.schema.StudentEquipmentSchema import EquipmentOut, StudentEquipmentCreate, StudentEquipmentOut


router = APIRouter(
    prefix="/student/equipment",
    tags=["Student Equipments"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        


@router.get("/equipments", response_model=List[EquipmentOut])
def list_all_equipments(db: Session = Depends(get_db)):
    equipments = db.query(Equipment).all()
    return equipments


@router.post("/equipment/place-order", response_model=StudentEquipmentOut)
def place_order(order_data: StudentEquipmentCreate, db: Session = Depends(get_db)):
    
    student = db.query(Student).filter(Student.id == order_data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found — log in again")

    equipment = db.query(Equipment).filter(Equipment.id == order_data.equipment_id).first()

    if not equipment or equipment.quantity_available < order_data.quantity:
        raise HTTPException(status_code=400, detail="Not enough equipment available")

    if order_data.quantity < 1:
        raise HTTPException(status_code=400, detail="Quantity must be at least 1")

    new_order = StudentEquipment(
        student_id=order_data.student_id,
        equipment_id=order_data.equipment_id,
        start_date=datetime.now(),
        end_date=order_data.end_date,
        quantity=order_data.quantity
    )

    equipment.quantity_available -= order_data.quantity  # update stock

    db.add(new_order)
    db.commit()
    db.refresh(new_order)

    return new_order

@router.get("/equipment/my-orders", response_model=List[StudentEquipmentOut])
def list_my_orders_in_desc(student_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(StudentEquipment)
        .filter(StudentEquipment.student_id == student_id, StudentEquipment.returned == False)
        .order_by(StudentEquipment.end_date.desc())
        .all()
    )
    return orders

@router.get("/equipment/my-order-history", response_model=List[StudentEquipmentOut])
def list_my_order_history_in_desc(student_id: int, db: Session = Depends(get_db)):
    orders = (
        db.query(StudentEquipment)
        .filter(StudentEquipment.student_id == student_id, StudentEquipment.returned == True)
        .order_by(StudentEquipment.end_date.desc())
        .all()
    )
    return orders
