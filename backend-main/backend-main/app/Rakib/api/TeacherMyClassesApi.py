from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from typing import List

from app.core.database import get_db
from app.Emon.model.course import Course
from app.Emon.model.teacher import Teacher
from app.Emon.model.assignment import Assignment
from app.Emon.model.submission import Submission
from app.Rakib.model.student import Student
from app.Emon.model.schedule import Schedule


from app.Emon.schema.course import CourseResponse, CourseCreate
from app.Rakib.schema.studentsMyCourseSchema import MyCourse , MySchedule
from app.Rakib.schema.teacherAssignmentSchema import AssignmentCreate, AssignmentOut, SubmissionOut


router = APIRouter(prefix="/v1/teacher/courses", tags=["Teacher My Classes"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.get("/my_class/{course_id}", response_model=MyCourse)
def get_class_by_id(course_id: int, db: Session = Depends(get_db)):
    
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    
    
    my_schd = [
        MySchedule(day=s.day, start_time=s.start_time)
        for s in course.schedules
    ]

    return MyCourse(
        id=course.id,
        title=course.title,
        code=course.code,
        description=course.description,
        semester=course.semester,
        batch=course.batch,
        type=course.type,
        image_url=course.image_url,
        running=course.running,
        schedules=my_schd
    )



@router.get("/my_classes/{teacher_id}", response_model=List[MyCourse])
def get_all_my_classes(teacher_id: int, db: Session = Depends(get_db)):
    
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    courses = db.query(Course).filter(Course.teacher_id == teacher_id).all()
    
    if not courses:
        return []

    return [
        MyCourse(
            id=course.id,
            title=course.title,
            code=course.code,
            description=course.description,
            semester=course.semester,
            batch=course.batch,
            type=course.type,
            image_url=course.image_url,
            running=course.running,
            schedules=[
                MySchedule(day=s.day, start_time=s.start_time)
                for s in course.schedules
            ]
        )
        for course in courses
    ]


@router.post("/assignments/create", response_model=AssignmentOut)
def create_assignment(assignmentCreate: AssignmentCreate, teacher_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == assignmentCreate.course_id, Course.teacher_id == teacher_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unauthorized")

    new_assignment = Assignment(
        title = assignmentCreate.title,
        description = assignmentCreate.description,
        max_marks = assignmentCreate.max_marks,
        course_id = assignmentCreate.course_id,
        given_date = assignmentCreate.given_date,
        due_date = assignmentCreate.due_date,
        type = assignmentCreate.type,
        file_links = assignmentCreate.file_links
    )
    db.add(new_assignment)
    db.commit()
    db.refresh(new_assignment)
    
    return AssignmentOut(
        id=new_assignment.id,
        title = new_assignment.title,
        description = new_assignment.description,
        max_marks = new_assignment.max_marks,
        course_id = new_assignment.course_id,
        given_date = new_assignment.given_date,
        due_date = new_assignment.due_date,
        type = new_assignment.type,
        file_links = new_assignment.file_links
    )
    
    

@router.get("/assignments/get/all", response_model=List[AssignmentOut])
def list_assignments_in_desc(course_id: int, teacher_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id, Course.teacher_id == teacher_id).first()

    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unauthorized")

    assignments = db.query(Assignment).filter(Assignment.course_id == course_id).order_by(Assignment.given_date.desc()).all()
    
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
    

@router.delete("/assignments/delete", response_model=dict)
def delete_assignment(assignment_id: int,  db: Session = Depends(get_db)):
    
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found or unauthorized")
    
    db.delete(assignment)
    db.commit()
    
    return {"message" : "assignment deleted successfully"}



@router.delete("/my_classes/delete/{course_id}", response_model=dict)
def delete_class(course_id:int , db: Session = Depends(get_db) ):
    course = db.query(Course).filter(Course.id == course_id).first()
    
    if not course:
        raise HTTPException(status_code=404, detail="Course not found or unauthorized")
    
    db.delete(course)
    db.commit()
    
    return {"message" : "classroom deleted successfully"}
    

@router.get("/submissions/by-assignment/{assignment_id}", response_model=List[SubmissionOut])
def get_submissions_by_assignment_id(assignment_id: int, db: Session = Depends(get_db)):
    submissions = db.query(Submission).filter(Submission.assignment_id == assignment_id).all()
    
    my_submissions = []
    
    for submission in submissions:
        student = db.query(Student).filter(Student.id == submission.student_id).first()
        
        if not student:
            raise HTTPException(status_code=404, detail=f"Studnet not found or unauthorized for submission with id {submission.id}")
        
        my_submissions.append(
            SubmissionOut(
                id=submission.id,
                assignment_id=submission.assignment_id,
                student_id=submission.student_id,
                submitted_at=submission.submitted_at,
                checked=submission.checked,
                file_links=submission.file_links if isinstance(submission.file_links, list) else [],
                marks=submission.marks,
                
                first_name=student.first_name,
                last_name=student.last_name,
                phone=student.phone,
                bio=student.bio,
                batch=student.batch,
                profile_image=student.profile_image
            )
        )
    return my_submissions



@router.post("/submissions/mark", response_model=dict)
def mark_assignment_submission(submission_id: int, marks: int, db: Session = Depends(get_db)):
    submission = db.query(Submission).filter(Submission.id == submission_id).first()

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    submission.marks = marks
    submission.checked = True
    db.commit()

    return {"message": "Submission marked successfully"}




        



