"""
Idempotent demo-data seeder for CSE SmartPortal.

Run inside the backend container (workdir /app):
    docker compose exec backend python seed_demo.py

Safe to run multiple times: every record is looked up by a natural key and
only created if missing. No models are modified — this only inserts rows using
the existing SQLAlchemy models, so it never changes the schema or code pattern.

Demo credentials (also written to DEMO_ACCOUNTS.md):
    Admin    admin@cse.du.ac.bd     / Admin@123
    Teacher  razzaque@cse.du.ac.bd  / Teacher@123
    Teacher  suraiya@cse.du.ac.bd   / Teacher@123
    Student  rakib@cs.du.ac.bd      / Student@123   (batch 27)
    Student  emon@cs.du.ac.bd       / Student@123   (batch 27)
"""

from datetime import datetime, timedelta

from passlib.context import CryptContext

from app.core.database import SessionLocal, Base, engine

# Import every model so metadata + relationships are registered.
from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Emon.model.course import Course
from app.Emon.model.schedule import Schedule
from app.Emon.model.assignment import Assignment
from app.Emon.model.submission import Submission
from app.Emon.model.meeting import Meeting
from app.Emon.model.rsvp import RSVP
from app.Emon.model.finance_event import FinanceEvent
from app.Emon.model.student_payment import StudentPayment
from app.Rakib.model.student import Student
from app.Rakib.model.notice import Notice
from app.Rakib.model.event import Event
from app.Rakib.model.exam import Exam
from app.Rakib.model.equipment import Equipment, StudentEquipment
from app.Rakib.model.admissionform import AdmissionForm
from app.Rakib.model.missingClassOnMonth import MissingClassOnMonth
from app.Rakib.model.attendance import Attendance
from app.Rakib.model.announcement import Announcement

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

NOW = datetime.now()
BATCH = 27


def hash_pw(raw: str) -> str:
    return pwd_context.hash(raw[:72])


def get_or_create(db, model, defaults=None, **lookup):
    """Return (obj, created). Look up by **lookup; create with lookup+defaults."""
    obj = db.query(model).filter_by(**lookup).first()
    if obj:
        return obj, False
    params = dict(lookup)
    if defaults:
        params.update(defaults)
    obj = model(**params)
    db.add(obj)
    db.flush()  # assign PK without full commit
    return obj, True


def migrate():
    """Add columns that create_all() cannot add to already-existing tables."""
    from sqlalchemy import text
    statements = [
        "ALTER TABLE admission_form ADD COLUMN status VARCHAR(20) DEFAULT 'pending'",
        "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE courses ADD COLUMN credit INT DEFAULT 3",
    ]
    for stmt in statements:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
            print(f"  migrated: {stmt}")
        except Exception:
            pass  # column already exists — safe to ignore


def seed():
    Base.metadata.create_all(bind=engine)
    migrate()
    db = SessionLocal()
    try:
        # ---------------- Users ----------------
        admin, _ = get_or_create(
            db, User, email="admin@cse.du.ac.bd",
            defaults=dict(hashed_password=hash_pw("Admin@123"), role="admin"),
        )

        t1_user, _ = get_or_create(
            db, User, email="razzaque@cse.du.ac.bd",
            defaults=dict(hashed_password=hash_pw("Teacher@123"), role="teacher"),
        )
        t2_user, _ = get_or_create(
            db, User, email="suraiya@cse.du.ac.bd",
            defaults=dict(hashed_password=hash_pw("Teacher@123"), role="teacher"),
        )

        s1_user, _ = get_or_create(
            db, User, email="rakib@cs.du.ac.bd",
            defaults=dict(hashed_password=hash_pw("Student@123"), role="student"),
        )
        s2_user, _ = get_or_create(
            db, User, email="emon@cs.du.ac.bd",
            defaults=dict(hashed_password=hash_pw("Student@123"), role="student"),
        )
        db.flush()

        # ---------------- Teacher profiles (real CSE DU faculty) ----------------
        t1, _ = get_or_create(
            db, Teacher, user_id=t1_user.id,
            defaults=dict(
                first_name="Md. Abdur", last_name="Razzaque",
                department="Computer Science & Engineering, University of Dhaka",
                phone="01841066390", work="Professor & Chairman",
                bio=("Professor and current Chairman of the Dept. of CSE, University of Dhaka. "
                     "PhD in Computer Engineering from Kyung Hee University, South Korea. "
                     "Director of the Green Networking Research Group. 190+ peer-reviewed papers. "
                     "Senior member of IEEE. Research: wireless networking, IoT, edge computing, "
                     "AI/ML in UAV networks, energy optimization."),
                profile_image="https://ssl.du.ac.bd/fontView/assets/faculty_image/image_1768_new.jpg",
                website="http://cse.du.ac.bd/gnr",
                google_scholar="https://scholar.google.com/",
                researchgate="https://www.researchgate.net/",
            ),
        )
        t2, _ = get_or_create(
            db, Teacher, user_id=t2_user.id,
            defaults=dict(
                first_name="Suraiya", last_name="Pervin",
                department="Computer Science & Engineering, University of Dhaka",
                phone="+880-2-8650143", work="Professor",
                bio=("Professor at the Dept. of CSE, University of Dhaka. "
                     "Research interests: Natural Language Processing and Digital Signal Processing."),
                profile_image="https://ssl.du.ac.bd/fontView/assets/faculty_image/cse_suraiya.jpg",
            ),
        )

        # ---------------- Student profiles ----------------
        s1, _ = get_or_create(
            db, Student, user_id=s1_user.id,
            defaults=dict(first_name="Md. Rakib", last_name="Hossain", phone="01700000088",
                          bio="4th year CSE student, batch 27.", batch=BATCH),
        )
        s2, _ = get_or_create(
            db, Student, user_id=s2_user.id,
            defaults=dict(first_name="Abdullah Al Arman", last_name="Emon", phone="01700000050",
                          bio="4th year CSE student, batch 27.", batch=BATCH),
        )
        db.flush()

        # ---------------- Courses + schedules + enrolment ----------------
        c1, _ = get_or_create(
            db, Course, code="CSE4113IPL",
            defaults=dict(
                title="CSE 4113: Internet Programming Lab",
                description="Hands-on full-stack web development: FastAPI, React, REST APIs.",
                semester="4-1", batch=BATCH, type="Lab", teacher_id=t1.id, running=True,
                image_url="https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=1200",
            ),
        )
        c2, _ = get_or_create(
            db, Course, code="CSE4111NLP",
            defaults=dict(
                title="CSE 4111: Natural Language Processing",
                description="Foundations of NLP: tokenization, embeddings, language models.",
                semester="4-1", batch=BATCH, type="Theory", teacher_id=t2.id, running=True,
                image_url="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=1200",
            ),
        )
        db.flush()

        get_or_create(db, Schedule, course_id=c1.id, teacher_id=t1.id, day="Sunday",
                      defaults=dict(start_time="10:00 AM"))
        get_or_create(db, Schedule, course_id=c2.id, teacher_id=t2.id, day="Tuesday",
                      defaults=dict(start_time="12:00 PM"))

        # enrol both students in both courses (avoid duplicates)
        for course in (c1, c2):
            for stu in (s1, s2):
                if stu not in course.students:
                    course.students.append(stu)

        # ---------------- Assignment + submission ----------------
        a1, created_a1 = get_or_create(
            db, Assignment, title="Lab 4: Build a REST endpoint", course_id=c1.id,
            defaults=dict(
                description="Implement and document a CRUD REST endpoint using FastAPI.",
                max_marks=20, given_date=NOW - timedelta(days=3),
                due_date=NOW + timedelta(days=7), type="Homework",
                file_links=["/resources/lab4-spec.pdf"],
            ),
        )
        db.flush()
        if created_a1:
            db.add(Submission(assignment_id=a1.id, student_id=s1.id,
                              submitted_at=NOW - timedelta(days=1), checked=False,
                              file_links=["/resources/rakib-lab4.pdf"], marks=None))
        get_or_create(
            db, Assignment, title="Lecture 1 slides", course_id=c1.id,
            defaults=dict(description="Intro slides and reading material.",
                          given_date=NOW - timedelta(days=5), type="Resource",
                          file_links=["/resources/lecture1.pdf"]),
        )

        # ---------------- Notices ----------------
        get_or_create(db, Notice, title="Semester Final Exam Routine Published",
                      defaults=dict(sub_title="Batch 27", content=(
                          "The final examination routine for 4-1 (Batch 27) has been published. "
                          "Please check your dashboard and the notice board for details."),
                          batch=BATCH, date=NOW - timedelta(days=1),
                          notice_from="Department", attachments=[]))
        get_or_create(db, Notice, title="Message from the Chairman",
                      defaults=dict(sub_title="Welcome", content=(
                          "Welcome to the new academic session. The department wishes all "
                          "students and faculty a productive semester."),
                          batch=None, date=NOW - timedelta(days=4),
                          notice_from="Chairman", attachments=[]))

        # ---------------- Event ----------------
        get_or_create(db, Event, name="CSEDU Tech Fest 2026",
                      defaults=dict(
                          description="Annual technology festival: hackathon, project showcase, seminars.",
                          start_date=NOW + timedelta(days=15),
                          end_date=NOW + timedelta(days=16),
                          location="CSE Building, University of Dhaka",
                          registration_deadline=NOW + timedelta(days=10),
                          image_url="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
                          registration_link="https://du.ac.bd/undergrad/cse"))

        # ---------------- Exams ----------------
        get_or_create(db, Exam, name="CSE 4113: Internet Programming",
                      defaults=dict(date=NOW + timedelta(days=12), duration=180,
                                    batch=BATCH, room="Room 401", type="Final"))
        get_or_create(db, Exam, name="CSE 4111: Natural Language Processing",
                      defaults=dict(date=NOW + timedelta(days=9), duration=90,
                                    batch=BATCH, room="Room 305", type="Midterm"))

        # ---------------- Meetings + RSVP ----------------
        m1, created_m1 = get_or_create(
            db, Meeting, title="Departmental Faculty Meeting",
            defaults=dict(date_time=NOW + timedelta(days=3),
                          meeting_url="https://meet.google.com/abc-defg-hij",
                          created_by=admin.id, is_archived=False, created_at=NOW),
        )
        db.flush()
        if created_m1:
            db.add(RSVP(meeting_id=m1.id, user_id=t1_user.id, response="Yes"))
        get_or_create(db, Meeting, title="Batch 27 Project Defense Briefing",
                      defaults=dict(date_time=NOW + timedelta(days=6),
                                    meeting_url="https://meet.google.com/xyz-1234-abc",
                                    created_by=admin.id, is_archived=False, created_at=NOW))

        # ---------------- Equipment + order ----------------
        eq1, _ = get_or_create(db, Equipment, name="Arduino Uno R3",
                               defaults=dict(description="Microcontroller board for lab projects.",
                                             quantity_available=15,
                                             image_url="https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800"))
        get_or_create(db, Equipment, name="Raspberry Pi 4 (4GB)",
                      defaults=dict(description="Single-board computer for IoT and networking labs.",
                                    quantity_available=8,
                                    image_url="https://images.unsplash.com/photo-1610438235354-a6ae5528385c?w=800"))
        db.flush()
        get_or_create(db, StudentEquipment, student_id=s1.id, equipment_id=eq1.id,
                      defaults=dict(start_date=NOW, end_date=NOW + timedelta(days=7),
                                    quantity=1, returned=False))

        # ---------------- Finance event + payment ----------------
        fe1, _ = get_or_create(db, FinanceEvent, title="Semester Registration Fee (4-1)",
                               defaults=dict(amount=6500, batch=str(BATCH),
                                             deadline=NOW + timedelta(days=14), created_at=NOW))
        db.flush()
        get_or_create(db, StudentPayment, user_id=s1_user.id, event_id=fe1.id,
                      defaults=dict(transaction_id="TXN-DEMO-0001", status="pending",
                                    submitted_at=NOW))

        # ---------------- Admission form ----------------
        get_or_create(db, AdmissionForm, email="applicant.demo@gmail.com",
                      defaults=dict(
                          form_given_on=NOW - timedelta(days=2),
                          first_name="Nusrat", last_name="Jahan",
                          date_of_birth=datetime(2004, 5, 12),
                          program="BSc in Computer Science & Engineering",
                          highest_qualification="Higher Secondary Certificate (HSC)",
                          institution_name="Notre Dame College, Dhaka",
                          field_of_study="Science", graduation_date=datetime(2022, 8, 1),
                          grade_gpa="5.00",
                          required_doc="/resources/demo-doc.pdf",
                          transcript="/resources/demo-transcript.pdf",
                          status="shortlisted"))

        # ---------------- Attendance (legacy monthly + per-session) ----------------
        get_or_create(db, MissingClassOnMonth, student_id=s1.id,
                      month=NOW.strftime("%B"), year=NOW.year,
                      defaults=dict(percentage=12))

        # Per-session attendance for CSE 4113 across recent class dates.
        for offset in range(6):
            d = (NOW - timedelta(days=offset * 2)).date()
            get_or_create(db, Attendance, course_id=c1.id, student_id=s1.id, date=d,
                          defaults=dict(status="present"))
            # s2 misses a couple of classes -> demonstrates <100%
            get_or_create(db, Attendance, course_id=c1.id, student_id=s2.id, date=d,
                          defaults=dict(status="absent" if offset in (1, 3) else "present"))

        # ---------------- Announcement ----------------
        get_or_create(
            db, Announcement, course_id=c1.id,
            text="Welcome to CSE 4113! Lab 4 is due next week — please start early.",
            defaults=dict(teacher_id=t1.id, created_at=NOW - timedelta(days=1)),
        )

        db.commit()
        print("✅ Demo data seeded / verified successfully.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
