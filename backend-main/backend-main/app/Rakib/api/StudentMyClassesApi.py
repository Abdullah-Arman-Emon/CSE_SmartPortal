from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List
from datetime import datetime


from app.Rakib.model.student import Student
from app.Emon.model.schedule import Schedule
from app.Emon.model.course import Course
from app.Emon.model.assignment import Assignment
from app.Emon.model.submission import Submission

from app.Rakib.schema.studentsMyCourseSchema import MyCourse, MySchedule
from app.Rakib.schema.studentAssignmentSchema import AssignmentOut, SubmissionCreate, SubmissionOut, SubmissionUpdate, AssignmentSchema, SubmissionSchema


router = APIRouter(prefix="/v1/student/courses", tags=["Student My Classes"])



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        


@router.post("/update/submission", response_model=SubmissionOut)
def update_submission(sub: SubmissionUpdate,db: Session = Depends(get_db ) ):
    submission = db.query(Submission).filter(Submission.assignment_id == sub.assignment_id, Submission.student_id == sub.student_id).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="submission not found")
    
    submission.file_links = sub.file_links
    submission.submitted_at = datetime.now()
    
    db.commit()
    db.refresh(submission)
    
    return SubmissionOut(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        submitted_at=submission.submitted_at,
        file_links=submission.file_links,
        marks=submission.marks,
        checked=submission.checked
    )
    


@router.post("/create/submission", response_model=SubmissionOut)
def add_submission(submissionCreate : SubmissionCreate,  db: Session = Depends(get_db )):
    
    print(f"submission : {submissionCreate}")
    
    existing = db.query(Submission).filter(Submission.assignment_id == submissionCreate.assignment_id, Submission.student_id == submissionCreate.student_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Submission already exists")
    
    submission = Submission(
        assignment_id = submissionCreate.assignment_id,
        student_id = submissionCreate.student_id,
        submitted_at = datetime.now(),
        file_links = submissionCreate.file_links
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    if not submission:
        raise HTTPException(status_code=404, detail="submission not created")
    
    return SubmissionOut(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        submitted_at=submission.submitted_at,
        file_links=submission.file_links,
        marks=submission.marks,
        checked=submission.checked
    )

@router.get("/get/submission", response_model=SubmissionOut)
def get_my_submission(assignment_id:int, student_id:int, db: Session = Depends(get_db)):
    
    submission = db.query(Submission).filter(Submission.assignment_id == assignment_id, Submission.student_id == student_id).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="submission not found")
    
    
    return SubmissionOut(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        submitted_at=submission.submitted_at,
        file_links=submission.file_links,
        marks=submission.marks,
        checked=submission.checked
    )
    


@router.get("/assignments/get/all", response_model=List[AssignmentOut])
def list_assignments_in_desc(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unauthorized")

    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).order_by(Assignment.given_date.desc()).all()
    
    if not assignments:
        return []
    
    my_assignments = []
    
    for assignment in assignments:
        my_assignments.append(
            AssignmentOut(
                id=assignment.id,
                title = assignment.title,
                description = assignment.description,
                max_marks = assignment.max_marks,
                course_id = assignment.course_id,
                given_date = assignment.given_date,
                due_date = assignment.due_date,
                type = assignment.type,
                file_links = assignment.file_links if isinstance(assignment.file_links, list) else []
            )
        )
    
    return my_assignments

@router.get("/assignments/get/{assignment_id}", response_model=AssignmentOut)
def get_assignment_by_id(assignment_id: int, db: Session = Depends(get_db)):

    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or unauthorized")

    return AssignmentOut(
            id=assignment.id,
            title = assignment.title,
            description = assignment.description,
            max_marks = assignment.max_marks,
            course_id = assignment.course_id,
            given_date = assignment.given_date,
            due_date = assignment.due_date,
            type = assignment.type,
            file_links = assignment.file_links if isinstance(assignment.file_links, list) else []
        )
    

@router.get("/my_classes/{student_id}", response_model=List[MyCourse])
def get_student_all_my_classes(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    courses = student.courses

    return [
        MyCourse(
            id=course.id,
            title=course.title,
            code=course.code,
            description=course.description,
            type=course.type,
            image_url=course.image_url,
            semester=course.semester,
            batch=course.batch,
            running=course.running,
            schedules=[
                MySchedule(
                    day=s.day,
                    start_time=s.start_time
                ) for s in course.schedules
            ]
        )
        for course in courses
    ]



@router.get("/get_class/{student_id}/{course_id}", response_model=MyCourse)
def get_student_class(student_id: int, course_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course not in student.courses:
        raise HTTPException(status_code=400, detail="Student not enrolled in this course")

    return MyCourse(
        id=course.id,
        title=course.title,
        code=course.code,
        description=course.description,
        type=course.type,
        image_url=course.image_url,
        semester=course.semester,
        batch=course.batch,
        running=course.running,
        schedules=[
            MySchedule(
                day=s.day,
                start_time=s.start_time
            ) for s in course.schedules
        ]
    )


@router.get("/enroll_by_code/{student_id}/{course_code}", response_model=MyCourse)
def enroll_by_code(student_id: int, course_code: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    course = db.query(Course).filter(Course.code == course_code).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course in student.courses:
        raise HTTPException(status_code=400, detail="Student already enrolled in this course")
    
    student.courses.append(course)
    db.commit()
    db.refresh(student)

    return MyCourse(
        id=course.id,
        title=course.title,
        code=course.code,
        description=course.description,
        type=course.type,
        image_url=course.image_url,
        semester=course.semester,
        batch=course.batch,
        running=course.running,
        schedules=[
            MySchedule(
                day=s.day,
                start_time=s.start_time
            ) for s in course.schedules
        ]
    )

    

@router.get("/leave_class/{student_id}/{course_id}", response_model=dict)
def leave_class(student_id: int, course_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    if course not in student.courses:
        raise HTTPException(status_code=400, detail="Student not enrolled in this course")
    
    student.courses.remove(course)
    db.commit()
    db.refresh(student)

    return {"detail": "Successfully left the course"}






