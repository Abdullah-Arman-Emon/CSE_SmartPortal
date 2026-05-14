from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List


from app.Rakib.model.equipment import Equipment, StudentEquipment


from app.Rakib.schema.AdminEquipmentSchema import EquipmentCreate, EquipmentUpdate, EquipmentOut, StudentEquipmentOut


router = APIRouter(
    prefix="/admin/equipment",
    tags=["Admin Equipments"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        

@router.get("/list", response_model=List[EquipmentOut])
def list_all_equipment(db: Session = Depends(get_db)):
    equipments = db.query(Equipment).all()
    return equipments
        
        
@router.post("/create", response_model=EquipmentOut)
def create_equipment(equipment: EquipmentCreate, db: Session = Depends(get_db) ):
    new_equipment = Equipment(
        name=equipment.name,
        description=equipment.description,
        quantity_available=equipment.quantity_available,
        image_url=equipment.image_url,
    )
    db.add(new_equipment)
    db.commit()
    db.refresh(new_equipment)
    return EquipmentOut(
        id=new_equipment.id,
        name=new_equipment.name,
        description=new_equipment.description,
        quantity_available=new_equipment.quantity_available,
        image_url=new_equipment.image_url
    )

@router.put("/edit", response_model=EquipmentOut)
def edit_equipment(equipment_id: int, update_data: EquipmentUpdate, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    if update_data.name is not None:
        equipment.name = update_data.name
    if update_data.description is not None:
        equipment.description = update_data.description
    if update_data.quantity_available is not None:
        equipment.quantity_available = update_data.quantity_available
    if update_data.image_url is not None:
        equipment.image_url = update_data.image_url
    

    db.commit()
    db.refresh(equipment)
    return EquipmentOut(
        id=equipment.id,
        name=equipment.name,
        description=equipment.description,
        quantity_available=equipment.quantity_available,
        image_url=equipment.image_url
    )


@router.delete("/delete", response_model=dict)
def delete_equipment(equipment_id: int, db: Session = Depends(get_db)):
    equipment = db.query(Equipment).filter(Equipment.id == equipment_id).first()
    if not equipment:
        raise HTTPException(status_code=404, detail="Equipment not found")

    db.delete(equipment)
    db.commit()
    return {"message": "Equipment deleted successfully"}


@router.get("/student-equipments/list-all", response_model=List[StudentEquipmentOut])
def list_student_equipment_orders_in_desc(db: Session = Depends(get_db)):
    orders = db.query(StudentEquipment).order_by(StudentEquipment.end_date.desc()).all()

    result = []
    for order in orders:
        result.append(
            StudentEquipmentOut(
                id=order.id,
                student_id=order.student_id,
                equipment_id=order.equipment_id,
                start_date=order.start_date,
                end_date=order.end_date,
                quantity=order.quantity,
                returned=order.returned,
            )
        )
    return result


@router.post("/student-equipments/accept-return", response_model=dict)
def accept_student_returning_equipment(order_id: int, db: Session = Depends(get_db)):
    order = db.query(StudentEquipment).filter(StudentEquipment.id == order_id).first()

    if not order:
        raise HTTPException(status_code=404, detail="Equipment order not found")

    if order.returned:
        raise HTTPException(status_code=400, detail="Already marked as returned")

    order.returned = True

    # Increase available quantity in Equipment
    equipment = db.query(Equipment).filter(Equipment.id == order.equipment_id).first()
    if equipment:
        equipment.quantity_available += order.quantity

    db.commit()

    return {"message": "Equipment return accepted and inventory updated"}

