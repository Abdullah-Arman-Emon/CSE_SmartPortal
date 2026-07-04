from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles
import os
from app.core.config import settings  
from fastapi.security import HTTPBearer

app = FastAPI(
    title="Faiak's API",
    version="1.0",
    description="CSEDU SERVER",
)

# Explicit origins. `allow_origins=["*"]` + `allow_credentials=True` is rejected by
# browsers, so list the real frontends. Add your prod domain(s) here.
allowed_origins = [
    "https://logicloop.farefin.com",
    "http://104.215.151.14:8081",
    "http://localhost:5173",
    "http://localhost:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.mount(
    "/resources",
    StaticFiles(directory=settings.resource_hub),  
    name="resources",
)


from app.core.database import Base, engine
from app.Emon.model.userModel import User  # this is important to register the model
from app.Emon.model.teacher import Teacher
from app.Emon.model.course import Course
from app.Emon.model.assignment import Assignment
from app.Emon.model.submission import Submission
from app.Emon.model.activity_log import ActivityLog
from app.Emon.model.schedule import Schedule
from app.Emon.model.research_paper import ResearchPaper
from app.Rakib.model.equipment import Equipment, StudentEquipment
from app.Rakib.model.equipment import Equipment, StudentEquipment
from app.Rakib.model.student import Student
from app.Rakib.model.exam import Exam
from app.Rakib.model.event import Event
from app.Rakib.model.notice import Notice
from app.Rakib.model.missingClassOnMonth import MissingClassOnMonth
from app.Emon.model.meeting import Meeting
from app.Emon.model.rsvp import RSVP
from app.Emon.model.finance_event import FinanceEvent
from app.Emon.model.student_payment import StudentPayment
from app.Rakib.model.admissionform import AdmissionForm
from app.Rakib.model.attendance import Attendance
from app.Rakib.model.announcement import Announcement
from app.Rakib.model.notification import Notification
from app.Rakib.model.message import Message
from app.Rakib.model.result import Result
from app.Emon.model.curriculum import CurriculumCourse
from app.Rakib.model.publicsite import Person, SiteContent, AdmissionProgram, ProgramCourse, GalleryImage



# Create the tables
Base.metadata.create_all(bind=engine)

# Apply idempotent ALTERs that create_all() cannot (schema drift guard)
from app.core.migrations import run_migrations
run_migrations(engine)

# Seed public-site content (people/chairman/programs/gallery) if tables are empty
try:
    from seed_public_site import seed_if_empty
    seed_if_empty()
except Exception as e:
    print(f"seed_public_site failed (continuing startup): {e}")

@app.get('/')
def read_root():
    return {'message': 'CSEDU Backend is running'}

from app.Emon.api import userApi
from app.Emon.api import teacherDashboardApi
from app.Emon.api import teacherProfileApi
from app.Emon.api import courseApi
from app.Emon.api import meetingApi
from app.Emon.api import financeApi
from app.Emon.api import curriculumApi
app.include_router(userApi.router)
app.include_router(teacherDashboardApi.router)
app.include_router(teacherProfileApi.router)
app.include_router(courseApi.router)
app.include_router(meetingApi.router)
app.include_router(financeApi.router)
app.include_router(curriculumApi.router)

from app.Rakib.api import StudentDashboardApi, StudentSettingsApi, StudentAssignmentApi, StudentMyClassesApi, TeacherMyClassesApi, AdminEquipmentApi, AdminEventApi
from app.Rakib.api import AdminNoticeApi, StudentEquipmentApi, StudentEventApi, UtilityApi, AdminAdmissionHubApi, AdminExamApi, GuestAdmissionHubApi, StudentNoticeApi, StudentExamApi, AttendanceApi, AnnouncementApi, NotificationApi, ChatApi, ResultApi, ChatbotApi

app.include_router(StudentDashboardApi.router)
app.include_router(StudentEquipmentApi.router)
app.include_router(StudentEventApi.router)
app.include_router(StudentNoticeApi.router)
app.include_router(StudentSettingsApi.router)
app.include_router(StudentAssignmentApi.router)
app.include_router(StudentMyClassesApi.router)
app.include_router(TeacherMyClassesApi.router)
app.include_router(AdminEquipmentApi.router)
app.include_router(AdminEventApi.router)
app.include_router(AdminNoticeApi.router)
app.include_router(AdminAdmissionHubApi.router)
app.include_router(AdminExamApi.router)
app.include_router(GuestAdmissionHubApi.router)
app.include_router(StudentExamApi.router)
app.include_router(AttendanceApi.router)
app.include_router(AnnouncementApi.router)
app.include_router(NotificationApi.router)
app.include_router(ChatApi.router)
app.include_router(ResultApi.router)
app.include_router(ChatbotApi.router)

from app.Rakib.api import PublicSiteApi
app.include_router(PublicSiteApi.guest_router)
app.include_router(PublicSiteApi.admin_router)

app.include_router(UtilityApi.router)




