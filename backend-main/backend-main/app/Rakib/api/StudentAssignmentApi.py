from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List


from app.Emon.model.assignment import Assignment
from app.Emon.model.course import Course


from app.Rakib.schema.studentAssignmentSchema import AssignmentSchema, SubmissionSchema, SubmissionCreateSchema
from app.Emon.model.submission import Submission



router = APIRouter(
    prefix="/student/assignments",
    tags=["Student Assignments"]
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/my_assignments", response_model=List[AssignmentSchema])
def get_my_assignments_in_recency_order(
    student_id: int,
    db: Session = Depends(get_db),
):
    """
    Get all assignments for a student in recency order.
    """
    # Assignments belong to courses; the student sees assignments of enrolled courses.
    assignments = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(Course.students.any(id=student_id))
        .order_by(Assignment.given_date.desc())
        .all()
    )

    if not assignments:
        return []

    my_assignments = []
    for assignment in assignments:

        # Fetch the submission for the student if it exists
        submission = db.query(Submission).filter_by(
            assignment_id=assignment.id, student_id=student_id
        ).first()
        
        my_submission = SubmissionSchema(
            id=submission.id,
            assignment_id=submission.assignment_id,
            student_id=submission.student_id,
            submitted_at=submission.submitted_at.isoformat(),
            checked=submission.checked,
            file_links=submission.file_links or [],
            marks=submission.marks
        ) if submission else None
        
        my_assignments.append(
            AssignmentSchema(
                id=assignment.id,
                title=assignment.title,
                description=assignment.description,
                given_date=assignment.given_date.isoformat(),
                max_marks=assignment.max_marks,
                type=assignment.type,
                due_date=assignment.due_date.isoformat() if assignment.due_date else None,
                course_id=assignment.course_id,
                file_links=assignment.file_links or [],
                my_submission=my_submission 
            )
        )
        
    return my_assignments



@router.get("/get_assignment/{assignment_id}", response_model=AssignmentSchema)
def get_assignment_by_id(assignment_id: int, student_id: int, db: Session = Depends(get_db)):
    """
    Helper function to get an assignment by ID for a specific student.
    """
    assignment = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(Assignment.id == assignment_id, Course.students.any(id=student_id))
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submission = db.query(Submission).filter(Submission.assignment_id == assignment_id, Submission.student_id == student_id).first()
    
    my_submission = SubmissionSchema(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        submitted_at=submission.submitted_at.isoformat(),
        checked=submission.checked,
        file_links=submission.file_links or [],
        marks=submission.marks
    ) if submission else None       
    
    
    return AssignmentSchema(
        id=assignment.id,
        title=assignment.title,
        description=assignment.description,
        given_date=assignment.given_date.isoformat(),
        max_marks=assignment.max_marks,
        type=assignment.type,
        due_date=assignment.due_date.isoformat() if assignment.due_date else None,
        course_id=assignment.course_id,
        file_links=assignment.file_links or [],
        my_submission=my_submission
    )
    
    
@router.post("/submit_assignment/{assignment_id}/{student_id}", response_model=SubmissionSchema)
def submit_assignment(
    assignment_id: int,
    student_id: int,
    submission_data: SubmissionCreateSchema,
    db: Session = Depends(get_db)
):
    """
    Submit an assignment for a student.
    """
    assignment = (
        db.query(Assignment)
        .join(Course, Assignment.course_id == Course.id)
        .filter(Assignment.id == assignment_id, Course.students.any(id=student_id))
        .first()
    )

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submission = Submission(
        assignment_id=assignment_id,
        student_id=student_id,
        submitted_at=submission_data.submitted_at,
        file_links=submission_data.file_links or [],
    )
    
    db.add(submission)
    db.commit()
    db.refresh(submission)
    
    if not submission:
        raise HTTPException(status_code=400, detail="Submission failed")
    
    return SubmissionSchema(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        submitted_at=submission.submitted_at.isoformat(),
        checked=submission.checked,
        file_links=submission.file_links or [],
        marks=submission.marks
    )
    
    
@router.put("/update_submission/{submission_id}/{student_id}", response_model=SubmissionSchema)
def update_submission(
    submission_id: int,
    student_id: int,
    submission_data: SubmissionCreateSchema,
    db: Session = Depends(get_db)
):
    """
    Update an existing submission for a student.
    """
    submission = db.query(Submission).filter(Submission.id == submission_id, Submission.student_id == student_id).first()
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")
    
    submission.submitted_at = submission_data.submitted_at
    submission.file_links = submission_data.file_links or []
    
    db.commit()
    db.refresh(submission)
    
    return SubmissionSchema(
        id=submission.id,
        assignment_id=submission.assignment_id,
        student_id=submission.student_id,
        submitted_at=submission.submitted_at.isoformat(),
        checked=submission.checked,
        file_links=submission.file_links or [],
        marks=submission.marks
    )   
    



