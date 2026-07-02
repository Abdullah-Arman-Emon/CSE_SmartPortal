from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List


from app.Rakib.model.student import Student


from app.Rakib.schema.studentSchema import StudentSchema, UpdateStudentSchema


router = APIRouter(
    prefix="/student/settings",
    tags=["Student Assignments"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/get_profile/{student_id}", response_model=StudentSchema)
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    """
    Fetch the student profile by ID.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return StudentSchema(
        id=student.id,
        first_name=student.first_name,
        last_name=student.last_name,
        phone=student.phone,
        bio=student.bio,
        batch=student.batch,
        current_semester=student.current_semester,
        program=student.program,
        msc_group=student.msc_group,
        profile_image=student.profile_image
    )


@router.put("/update_profile/{student_id}", response_model=StudentSchema)
def update_student_profile(student_id: int, student_data: UpdateStudentSchema, db: Session = Depends(get_db)):
    """
    Update the student profile.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update the student fields with the provided data
    if student_data.first_name is not None:
        student.first_name = student_data.first_name
    if student_data.last_name is not None:
        student.last_name = student_data.last_name
    if student_data.phone is not None:
        student.phone = student_data.phone
    if student_data.bio is not None:
        student.bio = student_data.bio
    if student_data.batch is not None:
        student.batch = student_data.batch
    if student_data.current_semester is not None:
        student.current_semester = student_data.current_semester
    if student_data.program is not None:
        student.program = student_data.program
    if student_data.msc_group is not None:
        student.msc_group = student_data.msc_group
    if student_data.profile_image is not None:
        student.profile_image = student_data.profile_image
        
    # Commit the changes to the database
    # db.add(student)
    db.commit()
    db.refresh(student)
    
    return StudentSchema(
        id=student.id,
        first_name=student.first_name,
        last_name=student.last_name,
        phone=student.phone,
        bio=student.bio,
        batch=student.batch,
        current_semester=student.current_semester,
        program=student.program,
        msc_group=student.msc_group,
        profile_image=student.profile_image
    )