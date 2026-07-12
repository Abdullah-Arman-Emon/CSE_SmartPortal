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


# Fields the student may edit from their Settings page. registration_number,
# status, batch and current_semester are administered, not self-edited here.
EDITABLE_FIELDS = [
    "first_name", "last_name", "phone", "bio", "program", "msc_group",
    "profile_image", "nickname", "gender", "blood_group", "date_of_birth",
    "roll", "merit_rank", "school", "college", "department",
    "present_address", "permanent_address", "hall", "personal_email",
    "facebook_url", "other_social", "guardian_mobile",
]


def _to_schema(student: Student) -> StudentSchema:
    return StudentSchema(
        id=student.id,
        first_name=student.first_name, last_name=student.last_name,
        phone=student.phone, bio=student.bio, batch=student.batch,
        current_semester=student.current_semester, program=student.program,
        msc_group=student.msc_group, status=student.status,
        profile_image=student.profile_image,
        registration_number=student.registration_number, nickname=student.nickname,
        gender=student.gender, blood_group=student.blood_group,
        date_of_birth=student.date_of_birth, roll=student.roll,
        merit_rank=student.merit_rank, school=student.school, college=student.college,
        department=student.department, present_address=student.present_address,
        permanent_address=student.permanent_address, hall=student.hall,
        personal_email=student.personal_email, facebook_url=student.facebook_url,
        other_social=student.other_social, guardian_mobile=student.guardian_mobile,
    )


@router.get("/get_profile/{student_id}", response_model=StudentSchema)
def get_student_profile(student_id: int, db: Session = Depends(get_db)):
    """
    Fetch the student profile by ID.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return _to_schema(student)


@router.put("/update_profile/{student_id}", response_model=StudentSchema)
def update_student_profile(student_id: int, student_data: UpdateStudentSchema, db: Session = Depends(get_db)):
    """
    Update the student profile.
    """
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # batch is editable only for legacy rows that never had one set
    if student_data.batch is not None:
        student.batch = student_data.batch
    if student_data.current_semester is not None:
        student.current_semester = student_data.current_semester

    for field in EDITABLE_FIELDS:
        val = getattr(student_data, field, None)
        if val is not None:
            setattr(student, field, val)

    db.commit()
    db.refresh(student)
    return _to_schema(student)