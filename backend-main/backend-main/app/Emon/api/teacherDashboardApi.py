from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from app.Emon.model.teacher import Teacher
from app.Emon.model.course import Course
from app.Emon.model.assignment import Assignment
from app.Emon.model.submission import Submission
from app.Emon.model.activity_log import ActivityLog
from app.Emon.model.schedule import Schedule
from app.Emon.schema.teacherDashboardSchema import DashboardData, RecentActivity, ScheduleItem
from datetime import datetime
import calendar

router = APIRouter(prefix="/v1/teacher", tags=["Teacher Dashboard"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/dashboard/{teacher_id}", response_model=DashboardData)
def get_teacher_dashboard(teacher_id: int, db: Session = Depends(get_db)):
    # Check if teacher exists
    teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Assignments to check
    assignments_to_check = db.query(Submission).join(Assignment).join(Course)\
        .filter(Course.teacher_id == teacher_id, Submission.checked == False).count()

    # Running courses
    running_courses = db.query(Course).filter(Course.teacher_id == teacher_id, Course.running == True).count()

    # Total students (can be replaced with Enrollment model if needed)
    total_students = db.query(Submission.student_id).join(Assignment).join(Course)\
        .filter(Course.teacher_id == teacher_id).distinct().count()

    # Recent activity logs
    activity_logs = db.query(ActivityLog).filter(ActivityLog.teacher_id == teacher_id)\
        .order_by(ActivityLog.created_at.desc()).limit(5).all()
    recent_activity = [RecentActivity(message=a.message, created_at=a.created_at) for a in activity_logs]

    # Today's schedule
    today = calendar.day_name[datetime.today().weekday()]  # e.g. "Monday"
    schedules = db.query(Schedule).join(Course)\
        .filter(Schedule.teacher_id == teacher_id, Schedule.day == today)\
        .options(joinedload(Schedule.course)).all()

    today_schedule = []
    for s in schedules:
        course = db.query(Course).filter(Course.id == s.course_id).first()
        if course:
            today_schedule.append(ScheduleItem(course_title=course.title, day=s.day, time=s.start_time))

    return DashboardData(
        assignments_to_check=assignments_to_check,
        running_courses=running_courses,
        total_students=total_students,
        recent_activity=recent_activity,
        today_schedule=today_schedule
    )
