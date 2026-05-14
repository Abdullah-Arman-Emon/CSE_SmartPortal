from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import shutil, random


from app.core.database import get_db
from app.Emon.model.course import Course
from app.Emon.model.schedule import Schedule
from app.Emon.schema.course import CourseResponse, CourseCreate


default_covers = [
    "https://ssl.gstatic.com/classroom/themes/img_code.jpg",
    "https://ssl.gstatic.com/classroom/themes/img_read.jpg",
    "https://ssl.gstatic.com/classroom/themes/img_graduation.jpg",
]

def generate_pass_code(length=10):
    import string, random
    # Google Classroom avoids confusing characters like 'l', 'I', '1', 'O', '0'
    ALLOWED_CHARS = ''.join(
        c for c in (string.ascii_letters + string.digits)
        if c not in 'lI1O0'
    )
    return ''.join(random.choices(ALLOWED_CHARS, k=length))



router = APIRouter(prefix="/v1/courses", tags=["Courses"])


@router.post("/create", response_model=dict)
def create_course(courseCreate: CourseCreate, db: Session = Depends(get_db)):
    
    # image_url = None
    # if image_url:
    #     if image_url.content_type not in ["image/png", "image/jpeg"]:
    #         raise HTTPException(status_code=400, detail="Invalid image type")
    #     file_path = f"static/uploads/{image_url.filename}"
    #     with open(file_path, "wb") as buffer:
    #         shutil.copyfileobj(image_url.file, buffer)
    #     image_url = file_path
    
    print(courseCreate)
    
    if courseCreate.type not in ["Theory", "Lab"]:
        raise HTTPException(status_code=404, detail=f"invalid coursetype {courseCreate.type}")
    
    if len(courseCreate.schedules)==0 or courseCreate.schedules is None:
        raise HTTPException(status_code=404, detail=f"provide schedules")
    
    if courseCreate.image_url is None:
        #randomly choose one from the covers used by google classrooms
        courseCreate.image_url = random.choice(default_covers)
        
    #a 10 char lenght value that can be used just like google classroom 
    pass_code = generate_pass_code()

    course = Course(
        title=courseCreate.title,
        code = pass_code,
        description=courseCreate.description,
        other_links=courseCreate.other_links,
        semester=courseCreate.semester,
        batch=courseCreate.batch,
        type=courseCreate.type,
        teacher_id=courseCreate.teacher_id,
        image_url=courseCreate.image_url
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    
    print(f"created course : {course}")
    
    
    # Create schedules linked to the course
    for sched in courseCreate.schedules:
        schedule = Schedule(
            course_id=course.id,
            day=sched.day,
            start_time=sched.start_time,
            teacher_id=course.teacher_id  # or from input if different
        )
        db.add(schedule)

    db.commit()
    
    return {"message" : "Course created Successfully"}


@router.delete("/delete/course{course_id}")
def delete_course(course_id: int, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    db.delete(course)
    db.commit()
    return {"detail": f"Course with ID {course_id} has been deleted."}
