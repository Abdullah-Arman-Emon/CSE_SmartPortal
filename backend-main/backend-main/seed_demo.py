"""
Master demo-data seeder for the CSEDU University Management System.

Run inside the backend container (workdir /app):
    docker compose exec backend python seed_demo.py
or on the host (with the backend venv active):
    python seed_demo.py

Idempotent & safe to re-run: every record is looked up by a natural key and
only created if missing; bulk domains (attendance/results/chat/notifications)
are guarded by per-course/per-user sentinels so re-runs are fast and never
duplicate. No models or schema are modified — only rows are inserted.

Builds a department that looks like it has been in daily use for months:
  * 4 undergraduate batches (28-31) x 15 students  + 16 real CSE DU faculty
  * sign-up allowlist pre-approved for every account (+ a few "pending")
  * batch-wise published routines (conflict-free, verified before commit)
  * courses + enrolment, assignments + graded submissions, attendance,
    results/CGPA history, finance + payments, course chat, notifications,
    exams, meetings, equipment, events, announcements, notices.

Demo credentials (also written to DEMO_ACCOUNTS.md):
    Admin    admin@cse.du.ac.bd           / Admin@123
    Teacher  <slug>@cse.du.ac.bd          / Teacher@123
    Student  <first>.<last><batch>@cs.du.ac.bd / Student@123
"""

import json
import random
from datetime import datetime, timedelta, date

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
from app.Emon.model.allowedEmail import AllowedEmail
from app.Rakib.model.student import Student
from app.Rakib.model.notice import Notice
from app.Rakib.model.event import Event
from app.Rakib.model.exam import Exam
from app.Rakib.model.equipment import Equipment, StudentEquipment
from app.Rakib.model.admissionform import AdmissionForm
from app.Rakib.model.missingClassOnMonth import MissingClassOnMonth
from app.Rakib.model.attendance import Attendance
from app.Rakib.model.class_session import ClassSession
from app.Rakib.model.batch_term import BatchTerm
from app.Rakib.model.announcement import Announcement
from app.Rakib.model.result import Result
from app.Rakib.model.message import Message
from app.Rakib.model.direct_message import DirectMessage
from app.Rakib.model.notification import Notification
from app.Rakib.model.routine import (
    RoutinePeriod, Routine, RoutineSlot, SlotChangeRequest, AcademicHoliday,
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

random.seed(42)
NOW = datetime.now()
TODAY = NOW.date()
SEM_START = date(2026, 2, 22)                 # 22.02.2026 (matches seed_routine)
DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"]

# CANONICAL batch → current semester. Single source of truth, identical to
# seed_full_routines' ROUTINES map. Every downstream artifact (students,
# courses, routine, attendance, results) is keyed off this so the whole
# lifecycle stays connected. Change it in ONE place only.
BATCH_SEM = {28: "4-1", 29: "3-2", 30: "2-2", 31: "1-2", 25: "1-1"}
BATCHES = (28, 29, 30, 31, 25)   # 25 = MSc cohort
MSC_BATCHES = (25,)
WEEKDAY_IDX = {"Sunday": 6, "Monday": 0, "Tuesday": 1, "Wednesday": 2,
               "Thursday": 3, "Friday": 4, "Saturday": 5}

DEMO_PDF_1 = "/resources/alex-rahman_(9)_fc21700b97294a23a1703d396c94d709.pdf"
DEMO_PDF_2 = "/resources/rakib.docx_8d746dd6c9e84481a724617320ccc744.pdf"


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


# ---------------- DU 4.00 grade scale (must match ResultApi / StudentCGPA) ----
def grade_from_marks(m):
    if m >= 80: return "A+", 4.00
    if m >= 75: return "A", 3.75
    if m >= 70: return "A-", 3.50
    if m >= 65: return "B+", 3.25
    if m >= 60: return "B", 3.00
    if m >= 55: return "B-", 2.75
    if m >= 50: return "C+", 2.50
    if m >= 45: return "C", 2.25
    if m >= 40: return "D", 2.00
    return "F", 0.00


# ---------------- Real CSE DU faculty (slug, first, last, work, initials, bio) -
TEACHERS = [
    ("razzaque", "Md. Abdur", "Razzaque", "Professor & Chairman", "MAR",
     "Professor and Chairman, Dept. of CSE, University of Dhaka. PhD (Kyung Hee "
     "University). Director, Green Networking Research Group. Research: wireless "
     "networking, IoT, edge computing, AI/ML in UAV networks."),
    ("suraiya", "Suraiya", "Pervin", "Professor", "SP",
     "Professor, Dept. of CSE, DU. Research: Natural Language Processing and "
     "Digital Signal Processing."),
    ("haider", "Md. Haider", "Ali", "Professor", "MHA",
     "Professor. D.Eng. (Toyohashi University of Technology, Japan). Research: "
     "Computer Graphics and Image Processing."),
    ("mhkamal", "Mosaddek Hossain", "Kamal", "Professor", "MHK",
     "Professor. Research: intelligent systems for EV cloud charging, embedded "
     "systems for industry."),
    ("farhan", "Chowdhury Farhan", "Ahmed", "Professor", "CFA",
     "Professor. Research: knowledge discovery, machine learning, data mining."),
    ("mamun", "Md.", "Mamun-Or-Rashid", "Professor", "MMR",
     "Professor, Dept. of CSE, University of Dhaka."),
    ("asif", "Muhammad Asif Hossain", "Khan", "Professor", "MAK",
     "Professor. Research: NLP, deep learning, feature selection, text mining."),
    ("mosarrat", "Mosarrat", "Jahan", "Associate Professor", "MJ",
     "Associate Professor. Research: blockchain, IoT/VANET/cloud security, "
     "applied cryptography."),
    ("rumee", "Sarker Tanveer Ahmed", "Rumee", "Associate Professor", "STR",
     "Associate Professor. Research: operating systems, program analysis, "
     "information security."),
    ("mmkhan", "Md. Mosaddek", "Khan", "Associate Professor", "MMK",
     "Associate Professor. Research: multi-agent systems, optimization."),
    ("ibrahim", "Muhammad", "Ibrahim", "Associate Professor", "MIb",
     "Associate Professor. Research: information retrieval, machine learning, "
     "metaheuristic optimization."),
    ("tanvir", "Md. Tanvir", "Alam", "Lecturer", "MTA",
     "Lecturer. Research: machine learning on graphs, graph neural networks."),
    ("palash", "Palash", "Roy", "Lecturer", "PR",
     "Lecturer. Research: edge/cloud computing, federated learning, AI for IoT."),
    ("fahim", "Md. Fahim", "Arefin", "Lecturer", "MFA",
     "Lecturer, Dept. of CSE, University of Dhaka."),
    ("jargis", "Jargis", "Ahmed", "Lecturer", "JA",
     "Lecturer. Research: computer networking, mobile edge computing, IoT."),
    ("rizvee", "Redwan Ahmed", "Rizvee", "Lecturer", "RAR",
     "Lecturer. Research: deep learning, programming systems, HPC."),
]
# Routine files use some initials we alias onto the faculty above.
INITIAL_ALIAS = {"SM": "MMR", "AAT": "STR", "AKB": "MAK", "MoR": "MMR"}

# ---------------- Student name pools (deterministic, realistic) --------------
FIRST_NAMES = [
    "Ariful", "Sadia", "Tanjil", "Nusrat", "Mahmudul", "Farhana", "Rakibul",
    "Sumaiya", "Tahsin", "Jannatul", "Sabbir", "Mehjabin", " Shafin".strip(),
    "Rubaiya", "Naimul", "Tasnia", "Fahad", "Anika", "Shakib", "Maliha",
    "Rezaul", "Ishrat", "Tawhid", "Samira", "Nafis", "Adiba", "Sifat",
    "Raisa", "Zubair", "Lamia", "Ashiqur", "Proma", "Mahin", "Tisha",
    "Ridwan", "Oishi", "Sabbor", "Sneha", "Imran", "Meherin",
]
LAST_NAMES = [
    "Islam", "Rahman", "Hasan", "Ahmed", "Chowdhury", "Khan", "Akter",
    "Hossain", "Sultana", "Karim", "Alam", "Uddin", "Siddiqui", "Mahmud",
    "Jahan", "Haque", "Talukder", "Sarker", "Bhuiyan", "Kabir",
]


def make_students(per_batch=25):
    """Deterministic synthetic students per batch, unique emails. Returns list
    of dicts: {email, first, last, batch, semester}.

    Batches 29 & 30 are populated from the REAL department rosters
    (seed_real_students) instead, so we only synthesise 28 & 31 here."""
    plan = {28: BATCH_SEM[28], 31: BATCH_SEM[31]}
    out, seen = [], set()
    for batch, sem in plan.items():
        for i in range(per_batch):
            first = FIRST_NAMES[(batch * 3 + i * 7) % len(FIRST_NAMES)]
            last = LAST_NAMES[(batch + i * 5) % len(LAST_NAMES)]
            slug = f"{first}.{last}{batch}".lower().replace(" ", "")
            email = f"{slug}@cs.du.ac.bd"
            n = 1
            while email in seen:
                n += 1
                email = f"{slug}{n}@cs.du.ac.bd"
            seen.add(email)
            out.append(dict(email=email, first=first, last=last,
                            batch=batch, semester=sem))
    return out


# ---------------- Running courses per batch (curated, catalog-linked) --------
# (join_code, title, credit, type, catalog_code|None)
RUNNING_COURSES = {
    28: [
        ("CSE-4101-B28", "Machine Learning", 3.0, "Theory", "CSE 4101"),
        ("CSE-4102-B28", "Machine Learning Lab", 1.5, "Lab", "CSE 4102"),
        ("CSE-4103-B28", "Internet of Things", 3.0, "Theory", "CSE 4103"),
        ("CSE-4104-B28", "Internet of Things Lab", 1.5, "Lab", "CSE 4104"),
        ("CSE-4113-B28", "Internet Programming Lab", 1.5, "Lab", None),
        ("CSE-4111-B28", "Natural Language Processing", 3.0, "Theory", None),
    ],
    29: [
        ("CSE-3101-B29", "Software Engineering", 3.0, "Theory", "CSE 3101"),
        ("CSE-3102-B29", "Software Design & Development Project", 1.5, "Lab", "CSE 3102"),
        ("CSE-3103-B29", "Web Engineering & Technology", 3.0, "Theory", "CSE 3103"),
        ("CSE-3104-B29", "Web Engineering & Technology Lab", 1.5, "Lab", "CSE 3104"),
        ("CSE-3105-B29", "Algorithm Engineering", 3.0, "Theory", "CSE 3105"),
        ("CSE-3109-B29", "Operating System", 3.0, "Theory", "CSE 3109"),
        ("CSE-3110-B29", "Operating System Lab", 1.5, "Lab", "CSE 3110"),
    ],
    30: [
        ("CSE-2101-B30", "Data Structures & Algorithms", 3.0, "Theory", "CSE 2101"),
        ("CSE-2102-B30", "Data Structures & Algorithms Lab", 1.5, "Lab", "CSE 2102"),
        ("CSE-2103-B30", "Object Oriented Design & Programming", 3.0, "Theory", "CSE 2103"),
        ("CSE-2104-B30", "OODP Lab", 1.5, "Lab", "CSE 2104"),
        ("CSE-2105-B30", "Computer Architecture & Microprocessor", 3.0, "Theory", "CSE 2105"),
        ("CSE-2106-B30", "Microprocessor & Assembly Lab", 1.5, "Lab", "CSE 2106"),
        ("CSE-2109-B30", "Data & Telecommunication", 3.0, "Theory", "CSE 2109"),
    ],
    31: [
        ("CSE-1101-B31", "Discrete Mathematics", 3.0, "Theory", "CSE 1101"),
        ("CSE-1103-B31", "Computational Problem Solving", 3.0, "Theory", "CSE 1103"),
        ("CSE-1104-B31", "Computational Problem Solving Lab", 1.5, "Lab", "CSE 1104"),
        ("MATH-1107-B31", "Differential & Integral Calculus", 3.0, "Theory", "MATH 1107"),
        ("EEE-1105-B31", "Electrical Circuits", 3.0, "Theory", "EEE 1105"),
    ],
}
# Past semesters whose results are published (CGPA history). Every entry is a
# completed semester strictly before the batch's current semester (BATCH_SEM).
PAST_SEMS = {
    28: ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2"],
    29: ["1-1", "1-2", "2-1", "2-2", "3-1"],
    30: ["1-1", "1-2", "2-1"],
    31: ["1-1"],
}
# Rooms per batch: (theory rooms, lab rooms) — disjoint across batches so
# generated routines never clash on a room.
BATCH_ROOMS = {
    28: (["429", "706"], ["707", "709"]),   # (28 uses the seeded official grid)
    29: (["301", "302"], ["731", "732"]),
    30: (["501", "502"], ["741", "742"]),
    31: (["601", "602"], ["751"]),
}


def seed():
    Base.metadata.create_all(bind=engine)
    from app.core.migrations import run_migrations
    run_migrations(engine)

    # Curriculum catalog (idempotent) — CGPA categories + course dropdown.
    import seed_curriculum
    seed_curriculum.seed()
    from seed_curriculum import CATALOG

    # Routine periods + academic calendar.
    import seed_routine
    seed_routine.seed_if_empty()

    db = SessionLocal()
    try:
        _seed(db, CATALOG)
        db.commit()
        print("Demo data seeded / verified successfully.")
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def catalog_for_sem(catalog, sem):
    out = []
    for code, title, credit, category, is_lab in catalog:
        d = code.split(" ")[1]
        if f"{d[0]}-{d[1]}" == sem:
            out.append((code, title, credit, "Lab" if is_lab else "Theory"))
    return out


def _seed(db, catalog):
    # ============================================================= legacy 27→28
    # Old demo rows (rakib/emon + official routine/courses/exams/finance) were
    # batch 27; fold them into batch 28 so nothing is orphaned.
    for model, col in ((Student, "batch"), (Course, "batch"), (Exam, "batch"),
                       (Routine, "batch")):
        for row in db.query(model).filter(getattr(model, col) == 27).all():
            row.batch = 28
    for fe in db.query(FinanceEvent).filter(FinanceEvent.batch == "27").all():
        fe.batch = "28"
    db.flush()

    # ============================================================= admin
    admin, _ = get_or_create(
        db, User, email="admin@cse.du.ac.bd",
        defaults=dict(hashed_password=hash_pw("Admin@123"), role="admin"))

    # ============================================================= teachers
    teachers = {}          # initials -> Teacher
    teacher_users = {}     # initials -> User
    for slug, first, last, work, ini, bio in TEACHERS:
        u, _ = get_or_create(
            db, User, email=f"{slug}@cse.du.ac.bd",
            defaults=dict(hashed_password=hash_pw("Teacher@123"), role="teacher"))
        db.flush()
        t, _ = get_or_create(
            db, Teacher, user_id=u.id,
            defaults=dict(first_name=first, last_name=last,
                          department="Computer Science & Engineering, University of Dhaka",
                          work=work, bio=bio))
        teachers[ini] = t
        teacher_users[ini] = u
    # Legacy demo teacher emails (razzaque/suraiya) already covered by slugs.

    def teacher_by_initial(ini):
        ini = ini.strip()
        return teachers.get(ini) or teachers.get(INITIAL_ALIAS.get(ini, ""), None) \
            or teachers["MAR"]

    teacher_list = list(teachers.values())

    # ============================================================= real routines
    # Build the REAL published routines NOW — after our faculty accounts exist and
    # are committed — so seed_full_routines matches them by name and reuses them
    # (no duplicate teacher accounts) instead of minting <initials>@cse.du.ac.bd.
    # It creates the current-semester Courses + BatchTerm + slots (course_id set)
    # that the enrolment / attendance / results below all build upon.
    db.commit()
    import seed_full_routines
    seed_full_routines.seed_if_empty()

    # ============================================================= students
    roster = make_students()
    # keep the two well-known logins as batch-28 members
    legacy = [
        ("rakib@cs.du.ac.bd", "Md. Rakib", "Hossain", 28, "4-1"),
        ("emon@cs.du.ac.bd", "Abdullah Al Arman", "Emon", 28, "4-1"),
    ]
    students_by_batch = {28: [], 29: [], 30: [], 31: [], 25: []}
    all_students = []          # (Student, User, dict)
    ability = {}               # student.id -> base marks

    def add_student(email, first, last, batch, sem, bio=None, profile=None,
                    program="bsc", msc_group=None):
        u, _ = get_or_create(
            db, User, email=email,
            defaults=dict(hashed_password=hash_pw("Student@123"), role="student"))
        db.flush()
        level = "Postgraduate" if program == "msc" else "Undergraduate"
        s, _ = get_or_create(
            db, Student, user_id=u.id,
            defaults=dict(first_name=first, last_name=last, batch=batch,
                          current_semester=sem, program=program, msc_group=msc_group,
                          phone=(profile or {}).get("phone")
                                or f"01{random.randint(5,9)}{random.randint(10**7,10**8-1)}",
                          bio=bio or f"{level} CSE student, Batch {batch}."))
        # keep semester/batch/program current on re-run for migrated legacy rows
        s.batch, s.current_semester, s.program = batch, sem, program
        if program == "msc":
            s.msc_group = msc_group
        # real-roster profile: set every provided column (idempotent overwrite)
        if profile:
            from seed_real_students import PROFILE_COLUMNS
            if profile.get("phone"):
                s.phone = profile["phone"]
            for col in PROFILE_COLUMNS:
                val = profile.get(col)
                if val not in (None, ""):
                    setattr(s, col, val)
        students_by_batch[batch].append((s, u))
        all_students.append((s, u))
        ability[s.id] = random.randint(58, 90)

    for email, first, last, batch, sem in legacy:
        add_student(email, first, last, batch, BATCH_SEM[batch])
    # fill each synthetic batch up to 25 (legacy already put 2 in batch 28)
    for r in roster:
        if len(students_by_batch[r["batch"]]) >= 25:
            continue
        add_student(r["email"], r["first"], r["last"], r["batch"], r["semester"])

    # ---- REAL batches 29 & 30 (department rosters, full profiles) ----
    # A few registration numbers stay pre-approved but WITHOUT an account, so the
    # admin allowlist shows a "pending" state and the sign-up flow can be demoed
    # live (email + these reg numbers will pass validation).
    PENDING_REG = {"2022-315-933", "2023-415-995", "2023-815-982"}
    from seed_real_students import get_real_students
    real_students = get_real_students()
    for rec in real_students:
        if rec["registration_number"] in PENDING_REG:
            continue
        add_student(rec["email"], rec["first_name"], rec["last_name"],
                    rec["batch"], rec["semester"], profile=rec)

    # ---- MSc cohort (batch 25) — every batch gets students, incl. postgraduate ----
    for i in range(16):
        first = FIRST_NAMES[(25 * 3 + i * 7) % len(FIRST_NAMES)]
        last = LAST_NAMES[(25 + i * 5) % len(LAST_NAMES)]
        email = f"{first}.{last}.msc25".lower().replace(" ", "") + "@cs.du.ac.bd"
        add_student(email, first, last, 25, BATCH_SEM[25],
                    program="msc", msc_group=("thesis" if i % 2 == 0 else "project"),
                    bio="MSc (CSE) student, University of Dhaka.")
    db.flush()

    # Self-heal: any pre-existing student in an active batch whose semester
    # doesn't match the canonical map (e.g. seeded before the map changed) is
    # realigned, so student/course/routine/attendance all agree.
    for s in db.query(Student).filter(Student.batch.in_(list(BATCH_SEM))).all():
        if s.current_semester != BATCH_SEM[s.batch]:
            s.current_semester = BATCH_SEM[s.batch]
        if not s.current_semester:
            s.current_semester = BATCH_SEM[s.batch]
        if not s.program:
            s.program = "bsc"
    db.flush()

    # ============================================================= allowlist
    existing_allow = {a.email for a in db.query(AllowedEmail).all()}
    # Real students first — their allowlist entry carries the registration
    # number the sign-up flow validates against (name/batch pre-fill the profile).
    # Every real student is allowlisted, including the few PENDING ones for whom
    # no account was created (so the live sign-up flow can be demoed).
    for rec in real_students:
        em = rec["email"]
        row = db.query(AllowedEmail).filter(AllowedEmail.email == em).first()
        if not row:
            row = AllowedEmail(email=em, role="student", created_at=NOW)
            db.add(row)
        row.registration_number = rec["registration_number"]
        row.full_name = rec["full_name"]
        row.batch = rec["batch"]
        existing_allow.add(em)
    for u in db.query(User).filter(User.role.in_(["student", "teacher"])).all():
        if u.email not in existing_allow:
            db.add(AllowedEmail(email=u.email, role=u.role, created_at=NOW))
            existing_allow.add(u.email)
    # a few pre-approved but not-yet-registered ("Pending") emails
    for em, role in [("tahmid.evan32@cs.du.ac.bd", "student"),
                     ("nabila.karim32@cs.du.ac.bd", "student"),
                     ("sadman.sakib32@cs.du.ac.bd", "student"),
                     ("arefin.rony32@cs.du.ac.bd", "student"),
                     ("mumtahina.rup32@cs.du.ac.bd", "student"),
                     ("newlecturer1@cse.du.ac.bd", "teacher"),
                     ("newlecturer2@cse.du.ac.bd", "teacher"),
                     ("visiting.faculty@cse.du.ac.bd", "teacher")]:
        if em not in existing_allow:
            db.add(AllowedEmail(email=em, role=role, created_at=NOW))
            existing_allow.add(em)

    # ============================================================= running courses
    # SINGLE SOURCE OF TRUTH: the current-semester courses are exactly the ones
    # seed_full_routines created for this batch/semester and that the published
    # routine slots reference by course_id. We do NOT mint parallel course rows —
    # we load the real ones so enrolment, routine, attendance and results all
    # attach to the same Course objects.
    running = {}          # batch -> [Course]
    course_teacher = {}   # course.id -> Teacher
    routine_by_batch = {} # batch -> Routine (current published)
    default_course_img = ("https://images.unsplash.com/photo-1517180102446-"
                          "f3ece451e9d8?w=1200")
    for batch in BATCHES:
        sem = BATCH_SEM[batch]
        routine = (db.query(Routine)
                   .filter_by(batch=batch, semester=sem, published=True)
                   .order_by(Routine.id.desc()).first())
        routine_by_batch[batch] = routine
        courses = (db.query(Course)
                   .filter(Course.batch == batch, Course.semester == sem).all())
        running[batch] = courses
        for c in courses:
            if not c.running:
                c.running, c.status = True, "active"
            if not c.image_url:
                c.image_url = default_course_img
            tchr = db.query(Teacher).filter_by(id=c.teacher_id).first() if c.teacher_id else None
            course_teacher[c.id] = tchr or teacher_list[0]
        # enrol every student of the batch into every running course
        for s, _u in students_by_batch[batch]:
            for c in courses:
                if s not in c.students:
                    c.students.append(s)
    db.flush()

    # ============================================================= past courses + results
    for batch, sems in PAST_SEMS.items():
        for sem in sems:
            for code, title, credit, ctype in catalog_for_sem(catalog, sem):
                join = f"{code.replace(' ', '')}-B{batch}"
                tchr = teacher_list[(batch + len(code)) % len(teacher_list)]
                c, created = get_or_create(
                    db, Course, code=join,
                    defaults=dict(title=title, semester=sem, batch=batch, type=ctype,
                                  credit=credit, course_code=code, teacher_id=tchr.id,
                                  running=False))
                db.flush()
                if db.query(Result).filter_by(course_id=c.id).first():
                    continue
                for s, _u in students_by_batch[batch]:
                    base = ability[s.id]
                    marks = max(0, min(100, base + random.randint(-10, 8)))
                    g, gp = grade_from_marks(marks)
                    db.add(Result(course_id=c.id, student_id=s.id, marks=float(marks),
                                  grade=g, grade_point=gp, published=True))
    db.flush()

    # current-semester draft (unpublished) results for the first theory course
    for batch in BATCHES:
        theory = next((c for c in running[batch] if c.type == "Theory"), None)
        if not theory or db.query(Result).filter_by(course_id=theory.id).first():
            continue
        for s, _u in students_by_batch[batch]:
            marks = max(0, min(100, ability[s.id] + random.randint(-8, 6)))
            g, gp = grade_from_marks(marks)
            db.add(Result(course_id=theory.id, student_id=s.id, marks=float(marks),
                          grade=g, grade_point=gp, published=False))
    db.flush()

    # ============================================================= routines
    # The published routines already exist (seed_full_routines). We only add the
    # teacher slot-change-request workflow demo on the real batch-28 grid.
    _seed_slot_changes(db)

    # ============================================================= assignments + submissions
    for batch in BATCHES:
        for c in running[batch]:
            _seed_assignments(db, c, students_by_batch[batch], course_teacher[c.id])
    db.flush()

    # ============================================================= attendance (ROUTINE-DERIVED)
    # Every attendance row is a real class from the batch's published routine:
    # each course's meeting weekdays come from its routine slots, expanded over
    # the term window (skipping holidays). Guarantees attendance ⊆ routine.
    holiday_ranges = [(h.start_date, h.end_date)
                      for h in db.query(AcademicHoliday).all()]
    for batch in BATCHES:
        _seed_attendance_from_routine(
            db, running[batch], students_by_batch[batch],
            routine_by_batch[batch], holiday_ranges, ability)
    db.flush()

    # ============================================================= announcements + notifications
    for batch in BATCHES:
        for c in running[batch]:
            _seed_announcements(db, c, students_by_batch[batch], course_teacher[c.id])
    db.flush()

    # ============================================================= chat
    for batch in BATCHES:
        for c in running[batch]:
            _seed_chat(db, c, students_by_batch[batch], course_teacher[c.id])
    db.flush()

    # ============================================================= direct messages
    # Universal cross-role DMs (admin <-> teacher <-> student) + presence, so
    # the Messenger looks like a department in daily use.
    _seed_direct_messages(db, admin, teacher_users, students_by_batch)
    db.flush()

    # ============================================================= finance
    _seed_finance(db, students_by_batch)

    # ============================================================= exams
    _seed_exams(db)

    # ============================================================= meetings
    _seed_meetings(db, admin, teacher_users)

    # ============================================================= equipment
    _seed_equipment(db, all_students)

    # ============================================================= events
    _seed_events(db)

    # ============================================================= notices + admission
    _seed_notices(db)
    get_or_create(db, AdmissionForm, email="applicant.demo@gmail.com",
                  defaults=dict(form_given_on=NOW - timedelta(days=2),
                                first_name="Nusrat", last_name="Jahan",
                                date_of_birth=datetime(2004, 5, 12),
                                program="BSc in Computer Science & Engineering",
                                highest_qualification="Higher Secondary Certificate (HSC)",
                                institution_name="Notre Dame College, Dhaka",
                                field_of_study="Science",
                                graduation_date=datetime(2022, 8, 1), grade_gpa="5.00",
                                required_doc="/resources/demo-doc.pdf",
                                transcript="/resources/demo-transcript.pdf",
                                status="shortlisted"))


# ------------------------------------------------------------------ slot changes
def _seed_slot_changes(db):
    """Teacher routine slot-change workflow demo (swap / move / applied) on the
    real published batch-28 grid. Idempotent: skips once any request exists."""
    if db.query(SlotChangeRequest).first():
        return
    r28 = (db.query(Routine)
           .filter_by(batch=28, published=True)
           .order_by(Routine.id.desc()).first())
    if not r28:
        return
    slots = db.query(RoutineSlot).filter_by(routine_id=r28.id).order_by(RoutineSlot.id).all()
    if len(slots) < 4:
        return

    def tid0(s):
        ids = json.loads(s.teacher_ids or "[]")
        return ids[0] if ids else None

    reqs = [
        dict(slot=slots[0], type="swap", target=slots[1], status="pending_teacher",
             reason="Requesting a swap due to a conference clash."),
        dict(slot=slots[2], type="move", target=None, status="pending_admin",
             reason="Room under maintenance; requesting a move."),
        dict(slot=slots[3], type="swap", target=slots[0], status="applied",
             reason="Adjusted for the guest lecture last month."),
    ]
    for rq in reqs:
        by = tid0(rq["slot"])
        tea = db.query(Teacher).filter_by(id=by).first() if by else None
        db.add(SlotChangeRequest(
            slot_id=rq["slot"].id, requested_by=(tea.id if tea else 1),
            type=rq["type"],
            target_slot_id=rq["target"].id if rq["target"] else None,
            proposed_day=("Monday" if rq["type"] == "move" else None),
            proposed_period_id=(rq["slot"].period_id if rq["type"] == "move" else None),
            reason=rq["reason"], status=rq["status"],
            created_at=NOW - timedelta(days=2)))
    db.flush()


# ------------------------------------------------------------------ assignments
def _seed_assignments(db, course, students, teacher):
    if db.query(Assignment).filter_by(course_id=course.id).first():
        return
    is_lab = course.type == "Lab"
    kind = "Lab report" if is_lab else "Assignment"
    # graded past ones
    for n in range(1, 4):
        given = NOW - timedelta(days=90 - n * 20)
        a = Assignment(title=f"{kind} {n}: {course.title.split('(')[0].strip()}",
                       description=f"{kind} {n} covering topics from weeks {n*3-2}-{n*3}.",
                       max_marks=20, course_id=course.id, given_date=given,
                       due_date=given + timedelta(days=10), type="Homework",
                       file_links={"spec.pdf": DEMO_PDF_1})
        db.add(a)
        db.flush()
        for s, _u in students:
            if random.random() < 0.90:
                db.add(Submission(assignment_id=a.id, student_id=s.id,
                                  submitted_at=given + timedelta(days=random.randint(2, 9)),
                                  checked=True,
                                  file_links={"submission.pdf": DEMO_PDF_2},
                                  marks=random.randint(11, 20)))
    # one due-soon, mostly unchecked
    given = NOW - timedelta(days=3)
    a = Assignment(title=f"{kind} 4 (current): apply the latest module",
                   description="Due this week. Submit a PDF report with your code.",
                   max_marks=20, course_id=course.id, given_date=given,
                   due_date=NOW + timedelta(days=5), type="Homework",
                   file_links={"spec.pdf": DEMO_PDF_1})
    db.add(a)
    db.flush()
    for s, _u in students:
        if random.random() < 0.55:
            db.add(Submission(assignment_id=a.id, student_id=s.id,
                              submitted_at=NOW - timedelta(days=1), checked=False,
                              file_links={"submission.pdf": DEMO_PDF_2}, marks=None))
    # a resource
    db.add(Assignment(title="Lecture slides & reading material",
                      description="Reference slides for the course.",
                      course_id=course.id, given_date=NOW - timedelta(days=40),
                      type="Resource", file_links={"slides.pdf": DEMO_PDF_1}))


# ------------------------------------------------------------------ attendance
_TOPIC_BANK = [
    "Course introduction & outline", "Foundations and motivation",
    "Core concepts — part I", "Core concepts — part II", "Worked problems",
    "Design principles", "Case study discussion", "Algorithms & analysis",
    "Hands-on walkthrough", "Mid-term review", "Advanced topics — part I",
    "Advanced topics — part II", "Applications in practice", "Group problem solving",
    "Optimization & trade-offs", "Real-world systems", "Revision & Q/A",
    "Project guidance", "Exam preparation", "Wrap-up & synthesis",
]


def _seed_attendance_from_routine(db, courses, students, routine, holiday_ranges, ability):
    """Generate attendance + class sessions DERIVED FROM THE ROUTINE.

    A course's meeting weekdays are exactly the days its routine slots fall on;
    those weekdays are expanded across the term window (SEM_START..today, minus
    holidays) into real class dates. So every Attendance/ClassSession row is a
    real class in the batch's published routine — attendance can never exist for
    a course/day that isn't in the routine.
    """
    if not routine:
        return

    def is_holiday(d):
        return any(a <= d <= b for a, b in holiday_ranges)

    # course_id -> (set of weekday names, first teacher_id seen on its slots)
    slots = db.query(RoutineSlot).filter_by(routine_id=routine.id).all()
    weekdays_by_course, teacher_by_course = {}, {}
    for sl in slots:
        if not sl.course_id:
            continue
        weekdays_by_course.setdefault(sl.course_id, set()).add(sl.day)
        if sl.course_id not in teacher_by_course:
            tids = json.loads(sl.teacher_ids or "[]")
            if tids:
                teacher_by_course[sl.course_id] = tids[0]

    for c in courses:
        if db.query(Attendance).filter_by(course_id=c.id).first():
            continue
        wd_names = weekdays_by_course.get(c.id)
        if not wd_names:
            continue  # course not on the routine -> intentionally no attendance
        wd_nums = {WEEKDAY_IDX[w] for w in wd_names if w in WEEKDAY_IDX}
        # expand meeting weekdays into real dates within the term window
        sessions = []
        d = SEM_START
        while d <= TODAY:
            if d.weekday() in wd_nums and not is_holiday(d):
                sessions.append(d)
            d += timedelta(days=1)
        if not sessions:
            continue
        tid = teacher_by_course.get(c.id) or c.teacher_id
        # one ClassSession per (course, date) — the held-class spine
        for i, sd in enumerate(sessions):
            get_or_create(db, ClassSession, course_id=c.id, date=sd,
                          defaults=dict(teacher_id=tid,
                                        topic=_TOPIC_BANK[i % len(_TOPIC_BANK)]))
        rows = []
        for s, _u in students:
            rate = 0.72 + (ability[s.id] - 58) / 32 * 0.25   # ~0.72..0.97
            if random.random() < 0.10:
                rate = random.uniform(0.55, 0.72)             # a few ineligible
            for sd in sessions:
                r = random.random()
                status = "present" if r < rate else ("late" if r < rate + 0.08 else "absent")
                rows.append(Attendance(course_id=c.id, student_id=s.id,
                                       date=sd, status=status))
        db.bulk_save_objects(rows)


# ------------------------------------------------------------------ announcements + notifications
def _seed_announcements(db, course, students, teacher):
    if not db.query(Announcement).filter_by(course_id=course.id).first():
        for n, txt in enumerate([
            f"Welcome to {course.title}! Please check the resources tab for slides.",
            "Reminder: assignment 4 is due this week. Start early.",
            "Next class we will cover the current module — bring your laptops.",
        ]):
            db.add(Announcement(course_id=course.id, teacher_id=teacher.id, text=txt,
                                created_at=NOW - timedelta(days=30 - n * 12)))
    # student notifications (announcement + assignment + result), some unread
    for s, u in students:
        if db.query(Notification).filter_by(user_id=u.id).first():
            continue
        items = [
            ("announcement", f"New announcement in {course.title}.", True, 20),
            ("assignment", f"New assignment posted in {course.title}.", True, 12),
            ("result", "Your results for last semester have been published.", True, 8),
            ("assignment", f"Assignment 4 in {course.title} is due soon.", False, 1),
            ("routine", "Today's class routine has been updated.", False, 0),
        ]
        for typ, txt, read, ago in items:
            db.add(Notification(user_id=u.id, type=typ, text=txt,
                                link="/student-dashboard", is_read=read,
                                created_at=NOW - timedelta(days=ago,
                                                           hours=random.randint(0, 12))))


# ------------------------------------------------------------------ chat
GROUP_MSGS = [
    ("t", "Assalamu alaikum everyone. Slides for this week are uploaded."),
    ("s", "Sir, will the assignment deadline be extended?"),
    ("t", "You get two extra days. Submit by Thursday night."),
    ("s", "Thank you sir."),
    ("s", "Is the lab report individual or group?"),
    ("t", "Individual. Plagiarism will be penalized."),
    ("s", "Sir, can you share last year's question pattern?"),
    ("t", "I'll discuss the pattern in the next class."),
]


def _seed_chat(db, course, students, teacher):
    if db.query(Message).filter_by(course_id=course.id).first():
        return
    if not students:
        return
    tuid = teacher.user_id
    base = NOW - timedelta(days=25)
    # group thread
    for i, (who, txt) in enumerate(GROUP_MSGS):
        sender = tuid if who == "t" else students[i % len(students)][1].id
        db.add(Message(course_id=course.id, sender_id=sender, recipient_id=None,
                       text=txt, created_at=base + timedelta(days=i, hours=1)))
        db.flush()
    # a couple of DM threads teacher <-> student
    for s, u in students[:2]:
        dm = [
            (u.id, "Sir, I could not attend today's class. Could you share the notes?"),
            (tuid, "Sure, check the resources tab. Also review section 3.2."),
            (u.id, "Thank you sir, that helps a lot."),
            (tuid, "Welcome. Let me know if anything is unclear."),
        ]
        for j, (sender, txt) in enumerate(dm):
            recip = tuid if sender == u.id else u.id
            db.add(Message(course_id=course.id, sender_id=sender, recipient_id=recip,
                           text=txt, created_at=base + timedelta(days=10 + j)))
            db.flush()


# ------------------------------------------------------------------ direct messages
def _seed_direct_messages(db, admin, teacher_users, students_by_batch):
    """Cross-role 1:1 conversations + presence for the universal Messenger.
    Idempotent: skips entirely once any direct message exists."""
    if db.query(DirectMessage).first():
        return

    tlist = list(teacher_users.values())          # Teacher-role Users
    all_students = [u for b in students_by_batch.values() for (_s, u) in b]
    if not tlist or not all_students:
        return

    def thread(a_uid, b_uid, lines, start_days_ago, read=True):
        """lines: list of (who, text) with who in {'a','b'}. 'a' sends first."""
        base = NOW - timedelta(days=start_days_ago)
        n = len(lines)
        for i, (who, txt) in enumerate(lines):
            sender = a_uid if who == "a" else b_uid
            recip = b_uid if who == "a" else a_uid
            ts = base + timedelta(hours=i * 5)
            # last inbound message of an "unread" thread stays unseen
            is_last_inbound = read is False and i >= n - 2 and who == "b"
            db.add(DirectMessage(
                sender_id=sender, recipient_id=recip, text=txt,
                created_at=ts,
                read_at=None if is_last_inbound else ts + timedelta(minutes=3),
            ))

    # ---- admin <-> teachers (department administration) ----
    admin_teacher_threads = [
        [("a", "Sir, could you please share the final marks for Machine Learning by Thursday?"),
         ("b", "Sure, I'll upload them to the portal by Wednesday evening."),
         ("a", "Great, thank you. Also please confirm your invigilation duty."),
         ("b", "Confirmed. I'm available for both slots.")],
        [("b", "Assalamu alaikum. The Network Lab needs two new switches for next semester."),
         ("a", "Noted. Please send a requisition and I'll forward it to the accounts office."),
         ("b", "Sending it now. Jazakallah.")],
        [("a", "Reminder: the Academic Committee meeting is on Monday at 11 AM in the seminar room."),
         ("b", "Thanks for the reminder, I'll be there.")],
    ]
    for i, lines in enumerate(admin_teacher_threads):
        thread(admin.id, tlist[i % len(tlist)].id, lines, 8 - i * 2, read=(i != 1))

    # ---- admin <-> students (office / support) ----
    admin_student_threads = [
        [("b", "Sir, I have not received my stipend for this month. Could you check?"),
         ("a", "Please share your bank account details at the accounts office; I'll follow up."),
         ("b", "Okay sir, thank you very much.")],
        [("b", "Assalamu alaikum sir, is the course registration deadline extended?"),
         ("a", "Yes, it is extended by three days. Clear your dues before registering."),
         ("b", "Understood, thank you.")],
        [("a", "Your admission verification is complete. Welcome to CSEDU!"),
         ("b", "Thank you so much sir!")],
    ]
    for i, lines in enumerate(admin_student_threads):
        thread(admin.id, all_students[i].id, lines, 6 - i, read=(i != 0))

    # ---- teacher <-> students (academic help) ----
    teacher_student_threads = [
        [("b", "Sir, I could not attend today's class. Could you share the notes?"),
         ("a", "Check the resources tab, and please review section 3.2 before next class."),
         ("b", "Thank you sir, that helps a lot."),
         ("a", "You're welcome. Let me know if anything is unclear.")],
        [("b", "Sir, my project partner dropped the course. Can I continue solo?"),
         ("a", "Yes, you may. Reduce the scope slightly and update your proposal."),
         ("b", "Okay sir, I'll submit the revised proposal tomorrow.")],
        [("a", "Your assignment 3 was excellent. Consider submitting it to the project showcase."),
         ("b", "Really? Thank you sir, I would love to!")],
    ]
    for i, lines in enumerate(teacher_student_threads):
        thread(tlist[i % len(tlist)].id, all_students[i + 3].id, lines, 5 - i, read=(i != 1))

    # ---- teacher <-> teacher (collaboration) ----
    if len(tlist) >= 2:
        thread(tlist[0].id, tlist[1].id, [
            ("a", "Are you free to co-supervise a thesis on federated learning?"),
            ("b", "Yes, sounds interesting. Let's discuss the scope over coffee."),
            ("a", "Perfect, tomorrow at 3 PM?"),
            ("b", "Works for me."),
        ], 4, read=True)

    # ---- presence: make a realistic mix of online / recently-active ----
    online_pool = [admin] + tlist[:3] + all_students[:5]
    for i, u in enumerate(online_pool):
        if i % 3 == 0:
            u.last_seen = NOW                                  # online now
        else:
            u.last_seen = NOW - timedelta(minutes=random.randint(3, 240))
    # everyone else: seen sometime in the last few days
    for u in db.query(User).all():
        if u.last_seen is None:
            u.last_seen = NOW - timedelta(days=random.randint(1, 6),
                                          hours=random.randint(0, 20))


# ------------------------------------------------------------------ finance
def _seed_finance(db, students_by_batch):
    for batch in BATCHES:
        sem = BATCH_SEM[batch]
        events = [
            (f"Semester Registration Fee ({sem})", 6500, NOW - timedelta(days=40)),
            ("Dining & Development Fee", 3000, NOW - timedelta(days=25)),
            ("Final Examination Fee", 2500, NOW + timedelta(days=12)),
        ]
        for title, amount, deadline in events:
            fe, _ = get_or_create(
                db, FinanceEvent, title=f"{title} — Batch {batch}",
                defaults=dict(amount=amount, batch=str(batch), deadline=deadline,
                              created_at=NOW - timedelta(days=45)))
            db.flush()
            for s, u in students_by_batch[batch]:
                if db.query(StudentPayment).filter_by(user_id=u.id, event_id=fe.id).first():
                    continue
                roll = random.random()
                if roll < 0.70:
                    db.add(StudentPayment(
                        user_id=u.id, event_id=fe.id,
                        transaction_id=f"BKASH{random.randint(10**9, 10**10-1)}",
                        status="paid", submitted_at=NOW - timedelta(days=random.randint(5, 30)),
                        verified_at=NOW - timedelta(days=random.randint(1, 4))))
                elif roll < 0.85:
                    db.add(StudentPayment(
                        user_id=u.id, event_id=fe.id,
                        transaction_id=f"NAGAD{random.randint(10**9, 10**10-1)}",
                        status="pending", submitted_at=NOW - timedelta(days=random.randint(1, 5))))


# ------------------------------------------------------------------ exams
def _seed_exams(db):
    for batch, sem in BATCH_SEM.items():
        for name, dt, dur, room, typ in [
            (f"Midterm — Core Theory ({sem})", NOW - timedelta(days=55), 90, "Room 305", "Midterm"),
            (f"Final Examination — {sem}", datetime(2026, 8, 4, 10, 0), 180, "Room 401", "Final"),
        ]:
            get_or_create(db, Exam, name=name, batch=batch,
                          defaults=dict(date=dt, duration=dur, room=room, type=typ))


# ------------------------------------------------------------------ meetings
def _seed_meetings(db, admin, teacher_users):
    tu = list(teacher_users.values())
    plan = [
        ("Monthly Academic Committee Meeting", NOW + timedelta(days=3), False),
        ("Examination Committee — Result Finalization", NOW + timedelta(days=6), False),
        ("Faculty Seminar: Advances in Edge AI", NOW + timedelta(days=9), False),
        ("Curriculum Review Meeting (2025)", NOW - timedelta(days=30), True),
        ("Departmental Board Meeting", NOW - timedelta(days=60), True),
    ]
    for i, (title, dt, archived) in enumerate(plan):
        m, created = get_or_create(
            db, Meeting, title=title,
            defaults=dict(date_time=dt, meeting_url=f"https://meet.google.com/dmo-{1000+i}-cse",
                          created_by=admin.id, is_archived=archived, created_at=NOW))
        db.flush()
        if created:
            for u in tu[:4]:
                db.add(RSVP(meeting_id=m.id, user_id=u.id,
                            response=random.choice(["Yes", "Yes", "No"])))


# ------------------------------------------------------------------ equipment
EQUIPMENT = [
    ("Arduino Uno R3", "Microcontroller board for lab projects.", 15),
    ("Raspberry Pi 4 (4GB)", "Single-board computer for IoT and networking labs.", 8),
    ("NVIDIA Jetson Nano", "Edge-AI development kit for ML labs.", 5),
    ("Digital Oscilloscope", "100 MHz dual-channel oscilloscope.", 4),
    ("Logic Analyzer", "16-channel USB logic analyzer.", 6),
    ("VR Headset (Meta Quest)", "For HCI and graphics coursework.", 3),
    ("ESP32 Dev Kit", "WiFi/BLE microcontroller for IoT projects.", 20),
    ("Breadboard & Component Kit", "Assorted resistors, LEDs, jumper wires.", 25),
]


def _seed_equipment(db, all_students):
    items = []
    for name, desc, qty in EQUIPMENT:
        e, _ = get_or_create(db, Equipment, name=name,
                             defaults=dict(description=desc, quantity_available=qty,
                                           image_url="https://images.unsplash.com/photo-1553406830-ef2513450d76?w=800"))
        items.append(e)
    db.flush()
    if db.query(StudentEquipment).count() > 3:
        return
    for i, (s, _u) in enumerate(all_students[:18]):
        e = items[i % len(items)]
        returned = i % 3 == 0
        start = NOW - timedelta(days=random.randint(10, 60))
        db.add(StudentEquipment(student_id=s.id, equipment_id=e.id,
                                start_date=start,
                                end_date=start + timedelta(days=14),
                                quantity=1, returned=returned))


# ------------------------------------------------------------------ events
def _seed_events(db):
    plan = [
        ("CSEDU Tech Fest 2026", NOW + timedelta(days=15), NOW + timedelta(days=16),
         NOW + timedelta(days=10),
         "Annual technology festival: hackathon, project showcase, seminars."),
        ("Intra-Department Programming Contest", NOW + timedelta(days=25),
         NOW + timedelta(days=25), NOW + timedelta(days=20),
         "ICPC-style contest to select the department teams."),
        ("Research Colloquium 2026", NOW - timedelta(days=20), NOW - timedelta(days=20),
         NOW - timedelta(days=27), "Faculty and graduate research presentations."),
        ("Freshers' Reception — Batch 31", NOW - timedelta(days=45),
         NOW - timedelta(days=45), NOW - timedelta(days=52),
         "Welcome program for the newest batch."),
    ]
    for name, sd, ed, reg, desc in plan:
        get_or_create(db, Event, name=name,
                      defaults=dict(description=desc, start_date=sd, end_date=ed,
                                    location="CSE Building, University of Dhaka",
                                    registration_deadline=reg,
                                    image_url="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200",
                                    registration_link="https://du.ac.bd/undergrad/cse"))


# ------------------------------------------------------------------ notices
NOTICES = [
    ("Semester Final Exam Routine Published", "Batch 28",
     "The final examination routine for 4-1 (Batch 28) has been published. Please "
     "check your dashboard and the notice board for details.", 28, -1, "Department", [DEMO_PDF_1], False),
    ("Message from the Chairman", "Welcome",
     "Welcome to the new academic session. The department wishes all students and "
     "faculty a productive semester. Reach out to your advisors early and often.",
     None, -4, "Chairman", [], True),
    ("MSc Admission Test Schedule (Session 2026-27)", "Graduate Admissions",
     "The written admission test for the MSc in CSE will be held at the department "
     "premises. Candidates must bring their admit card and a valid photo ID.",
     None, 5, "Department", [DEMO_PDF_2], True),
    ("Inter-University Programming Contest — Team Registration", "CSEDU Programming Club",
     "Team registration is now open. Each team has three members and one reserve. "
     "Register at the club room (Room 316) before the deadline.", None, 10, "Student-Club", [], False),
    ("Seminar: Large Language Models in Bengali NLP", "Guest Lecture Series",
     "A guest lecture on recent advances in LLMs for Bengali NLP. Open to all. "
     "Venue: Seminar Room, 4th floor.", None, 3, "Department", [], False),
    ("4th Year Thesis Proposal Submission Deadline", "Academic",
     "All 4th year students must submit their thesis/project proposals to their "
     "supervisors with a copy to the department office.", None, 7, "Chairman", [], False),
    ("Network Lab Closed for Equipment Maintenance", "Lab Operations",
     "The Network Lab (Room 214) will remain closed for maintenance. Affected classes "
     "will be shifted — check the routine page.", None, 2, "Admin", [], False),
    ("Dean's Award 2026 — Call for Nominations", "Faculty of Engineering and Technology",
     "Nominations are invited for the Dean's Award 2026. Students with CGPA 3.85+ are "
     "eligible. Submit forms to the Dean's office.", None, 12, "Central", [], False),
    ("Fall Semester Course Registration Window", "Registrar",
     "Course registration opens next week. Clear outstanding dues before registering.",
     None, 8, "Department", [], False),
    ("Class Suspension on 21 February", "International Mother Language Day",
     "All classes and office activities remain suspended on 21 February in observance "
     "of International Mother Language Day.", None, -20, "Central", [], False),
    ("CSEDU Alumni Homecoming 2026", "Alumni Association",
     "The annual alumni homecoming: reunion breakfast, tech talks, and a cultural "
     "evening. Students are welcome at the career networking session.", None, 20, "Student-Club", [], False),
    ("Stipend Disbursement Notice", "Accounts Office",
     "Merit and need-based stipends have been disbursed to registered bank accounts. "
     "Contact the accounts office if unpaid.", None, -6, "Admin", [], False),
    ("Workshop: Git & Modern Software Engineering Practice", "Hands-on Workshop",
     "A hands-on workshop on Git workflows, code review, CI/CD, conducted by alumni "
     "engineers. Limited seats — bring your laptop.", None, 15, "Student-Club", [], False),
    ("Industrial Tour Sign-up (Batch 29)", "Batch 29 only",
     "Batch 29 students interested in the industrial tour must sign up at the "
     "department office. Seats are limited.", 29, 9, "Department", [], False),
    ("Batch 30: Lab Group Reassignment", "Batch 30 only",
     "Lab groups (GA/GB) for Batch 30 have been reassigned. Check with the class "
     "representative for your updated group.", 30, 4, "Department", [], False),
    ("Batch 31 Orientation Materials", "Batch 31 only",
     "Orientation slides and the academic handbook for Batch 31 are available at the "
     "department office and on the portal.", 31, -2, "Department", [], False),
]


def _seed_notices(db):
    for title, sub, content, batch, day_off, src, atts, pinned in NOTICES:
        get_or_create(db, Notice, title=title,
                      defaults=dict(sub_title=sub, content=content, batch=batch,
                                    date=NOW + timedelta(days=day_off),
                                    notice_from=src, attachments=atts, is_pinned=pinned))


if __name__ == "__main__":
    seed()
