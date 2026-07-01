from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import Date, func
from app.core.database import SessionLocal
import calendar
from datetime import timedelta
from datetime import datetime
from sqlalchemy import cast

from app.Rakib.model.student import Student
from app.Emon.model.schedule import Schedule
from app.Rakib.model.missingClassOnMonth import MissingClassOnMonth
from app.Rakib.model.notice import Notice
from app.Emon.model.course import Course
from app.Emon.model.assignment import Assignment
from app.Rakib.model.exam import Exam


from app.Rakib.schema.studentDashboardSchema import StudentInfo, StudentTodaysClass, StudentNotice, StudentMissingClass,StudentUpcomingTest
from typing import List





router = APIRouter(prefix="/v1/student", tags=["Student Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        



@router.get("/dashboard/student_info/{student_id}", response_model=StudentInfo)
def get_student_info(student_id: int, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today_name = calendar.day_name[datetime.today().weekday()]
    today_date = datetime.today().date()

    # Get courses the student is enrolled in
    student_courses = db.query(Course).filter(Course.students.any(id=student_id)).subquery()

    # Count theory classes scheduled today for enrolled courses
    num_theory_classes_today = (
        db.query(Schedule)
        .join(Course, Schedule.course_id == Course.id)
        .filter(
            Schedule.day == today_name,
            Course.type == "Theory",
            Course.id.in_(db.query(student_courses.c.id))
        )
        .count()
    )

    # Count lab classes scheduled today for enrolled courses
    num_labs_today = (
        db.query(Schedule)
        .join(Course, Schedule.course_id == Course.id)
        .filter(
            Schedule.day == today_name,
            Course.type == "Lab",
            Course.id.in_(db.query(student_courses.c.id))
        )
        .count()
    )

    # Count assignments due today
    num_assignments_due_today = (
        db.query(Assignment)
        .join(Course)
        .filter(
            Assignment.due_date != None,
            cast(Assignment.due_date, Date) == today_date,
            Course.students.any(Student.id == student_id)
        )
        .count()
    )

    return StudentInfo(
        num_classes_today=num_theory_classes_today,
        num_assignments_remaining_today=num_assignments_due_today,
        num_labs_today=num_labs_today,
    )



@router.get("/dashboard/todays_classes/{student_id}", response_model=List[StudentTodaysClass])
def get_todays_classes(student_id: int, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today = calendar.day_name[datetime.today().weekday()]

    # Get today's classes through courses the student is enrolled in
    todays_classes = (
        db.query(Schedule)
        .join(Schedule.course)
        .filter(
            Course.students.any(id=student_id),
            Schedule.day == today
        )
        .options(joinedload(Schedule.course))
        .all()
    )

    # Create response list
    response = [
        StudentTodaysClass(
            class_id=s.id,
            course_title=s.course.title,
            course_code=s.course.code,
            time=s.start_time,
            type=s.course.type
        )
        for s in todays_classes
    ]

    return response





@router.get("/dashboard/missing_classes/{student_id}", response_model=List[StudentMissingClass])
def get_missing_classes(student_id: int, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get missing classes for the student
    missing_classes = db.query(MissingClassOnMonth).filter(MissingClassOnMonth.student_id == student_id).all()
    
    if not missing_classes:
        return []
    
    # Convert to response model
    response = []
    for missing_class in missing_classes:
        response.append(StudentMissingClass(
            month=missing_class.month,
            year=missing_class.year,
            percentage_classes=missing_class.percentage
        ))
        
    return response


@router.get("/dashboard/upcoming_tests/{student_id}", response_model=List[StudentUpcomingTest])
def get_upcoming_tests(student_id: int, db: Session = Depends(get_db)):
    # Check if student exists
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    today = datetime.today().date()
    thirty_days_later = today + timedelta(days=30)

    # Get the batches this student belongs to
    student_batch = student.batch

    # Filter exams by batch and upcoming date
    exams = db.query(Exam)\
        .filter(
            Exam.batch == student_batch,
            Exam.date >= today,
            Exam.date <= thirty_days_later
        ).all()

    

    response = []
    for exam in exams: # You might need a proper relation here
        response.append(StudentUpcomingTest(
            id=exam.id,
            name=exam.name,
            date=exam.date.isoformat(),
            duration=exam.duration,
            room=exam.room,
            type=exam.type,
        ))

    return response
