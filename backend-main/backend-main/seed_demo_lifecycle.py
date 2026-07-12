"""Seed realistic academic-lifecycle demo data for CSE DU accounts.

What it fills (idempotent — safe to re-run, never duplicates):

1. class_sessions  — one row per (course, class-date) that has attendance, bound
   to the teacher who ran it (co-teachers rotate for lab courses) plus a
   plausible topic. This makes the "which teacher took how many classes / what
   was covered" view real instead of falling back to the course's owner.

2. Historical attendance — students only had attendance for their *current*
   semester, so the attendance life-cycle only ever showed the 4th year. Here we
   backfill every *past* semester the student already has grades for, with a
   day-by-day register whose present/late/absent pattern is correlated to the
   grade they actually earned (an A+ student ~95% attendance, a D student ~70%,
   an F ~55%). Dates land on DU class days (Sun–Thu) within that semester's
   historical window, so the full 1st→4th year cycle reads believably.

Run standalone against the configured DB:
    python seed_demo_lifecycle.py
"""
import random
from datetime import date, timedelta

from app.core.database import SessionLocal
# Register the FULL model set first so SQLAlchemy can resolve every cross-model
# relationship (Course->Teacher, Teacher->Schedule, …) before any mapper is
# configured — same import surface main.py uses at startup.
from app.Emon.model.userModel import User  # noqa: F401
from app.Emon.model.teacher import Teacher  # noqa: F401
from app.Emon.model.assignment import Assignment  # noqa: F401
from app.Emon.model.submission import Submission  # noqa: F401
from app.Emon.model.activity_log import ActivityLog  # noqa: F401
from app.Emon.model.schedule import Schedule  # noqa: F401
from app.Emon.model.research_paper import ResearchPaper  # noqa: F401
from app.Emon.model.meeting import Meeting  # noqa: F401
from app.Emon.model.rsvp import RSVP  # noqa: F401
from app.Emon.model.finance_event import FinanceEvent  # noqa: F401
from app.Emon.model.student_payment import StudentPayment  # noqa: F401
from app.Emon.model.curriculum import CurriculumCourse  # noqa: F401
from app.Emon.model.allowedEmail import AllowedEmail  # noqa: F401
from app.Rakib.model.equipment import Equipment, StudentEquipment  # noqa: F401
from app.Rakib.model.exam import Exam  # noqa: F401
from app.Rakib.model.event import Event  # noqa: F401
from app.Rakib.model.notice import Notice  # noqa: F401
from app.Rakib.model.missingClassOnMonth import MissingClassOnMonth  # noqa: F401
from app.Rakib.model.admissionform import AdmissionForm  # noqa: F401
from app.Rakib.model.announcement import Announcement  # noqa: F401
from app.Rakib.model.notification import Notification  # noqa: F401
from app.Rakib.model.message import Message  # noqa: F401
from app.Rakib.model.direct_message import DirectMessage  # noqa: F401
from app.Rakib.model.publicsite import Person, SiteContent  # noqa: F401
from app.Rakib.model.batch_term import BatchTerm  # noqa: F401
from app.Rakib.model.batch import Batch  # noqa: F401
from app.Rakib.model.semester_result import SemesterResult  # noqa: F401
from app.Rakib.model.batch_change import BatchChangeRequest  # noqa: F401
from app.Emon.model.course import Course
from app.Rakib.model.student import Student
from app.Rakib.model.result import Result
from app.Rakib.model.attendance import Attendance
from app.Rakib.model.class_session import ClassSession
from app.Rakib.model.routine import RoutinePeriod, Routine, RoutineSlot, SlotChangeRequest, AcademicHoliday  # noqa: F401
from app.Rakib.model.batch_term import BSC_SEMESTER_ORDER, semester_rank

# The current semester's real attendance window (from the seeded live data).
CURRENT_START = date(2026, 2, 22)
CURRENT_END = date(2026, 7, 10)

# DU class days = Sunday..Thursday. Python weekday(): Mon=0 … Sun=6.
DU_CLASS_WEEKDAYS = {6, 0, 1, 2, 3}

# Plausible lecture topics — cycled deterministically so a course's register
# reads like a real term progressing week by week.
TOPIC_BANK = [
    "Course introduction & outline", "Foundations and motivation",
    "Core concepts — part I", "Core concepts — part II", "Worked problems",
    "Design principles", "Case study discussion", "Algorithms & analysis",
    "Hands-on walkthrough", "Mid-term review", "Advanced topics — part I",
    "Advanced topics — part II", "Applications in practice", "Group problem solving",
    "Optimization & trade-offs", "Real-world systems", "Guest-style deep dive",
    "Revision & Q/A", "Project guidance", "Exam preparation",
    "Recent research overview", "Wrap-up & synthesis",
]

# grade_point -> target attendance ratio (attended = present + late).
def _target_ratio(gp):
    if gp is None:
        return 0.85
    table = [(4.00, 0.95), (3.75, 0.92), (3.50, 0.90), (3.25, 0.87),
             (3.00, 0.84), (2.75, 0.80), (2.50, 0.77), (2.25, 0.74),
             (2.00, 0.70), (0.01, 0.58)]
    for thr, ratio in table:
        if gp >= thr:
            return ratio
    return 0.55


def _class_dates(anchor_end: date, n: int):
    """`n` DU class-days walking backwards from anchor_end, ~2 per week."""
    out = []
    d = anchor_end
    while len(out) < n and d > anchor_end - timedelta(days=250):
        if d.weekday() in DU_CLASS_WEEKDAYS:
            out.append(d)
            d -= timedelta(days=3)      # next class ~mid-week gap
        else:
            d -= timedelta(days=1)
    return sorted(out)


def _teacher_pool(db, course: Course):
    """Teachers who run this course: its owner + any co-teachers seen on the
    routine slots for it (labs are commonly co-taught)."""
    pool = []
    if course.teacher_id:
        pool.append(course.teacher_id)
    import json
    slots = db.query(RoutineSlot).filter(RoutineSlot.course_id == course.id).all()
    for s in slots:
        try:
            for t in json.loads(s.teacher_ids or "[]"):
                if int(t) not in pool:
                    pool.append(int(t))
        except (ValueError, TypeError):
            pass
    return pool or [None]


def _statuses(n: int, ratio: float, rng: random.Random):
    """A length-n present/late/absent list hitting ~ratio attended."""
    attended = max(0, min(n, round(n * ratio)))
    absent = n - attended
    late = round(n * rng.uniform(0.04, 0.10))
    late = min(late, attended)
    statuses = (["present"] * (attended - late)) + (["late"] * late) + (["absent"] * absent)
    rng.shuffle(statuses)
    return statuses


def seed():
    db = SessionLocal()
    try:
        courses = {c.id: c for c in db.query(Course).all()}
        # topic index cache so re-touching a course/date stays deterministic
        existing_session_keys = {
            (cs.course_id, cs.date) for cs in db.query(ClassSession.course_id, ClassSession.date).all()
        }
        teacher_pools = {}

        def ensure_session(course_id, d, seq):
            key = (course_id, d)
            if key in existing_session_keys:
                return
            c = courses.get(course_id)
            if not c:
                return
            pool = teacher_pools.setdefault(course_id, _teacher_pool(db, c))
            tid = pool[seq % len(pool)]
            db.add(ClassSession(
                course_id=course_id, date=d, teacher_id=tid,
                topic=TOPIC_BANK[seq % len(TOPIC_BANK)],
            ))
            existing_session_keys.add(key)

        # ---- 1. Backfill class_sessions for EXISTING attendance dates ----
        rows = (db.query(Attendance.course_id, Attendance.date)
                .distinct().order_by(Attendance.course_id, Attendance.date).all())
        per_course_seq = {}
        made = 0
        for cid, d in rows:
            seq = per_course_seq.get(cid, 0)
            ensure_session(cid, d, seq)
            per_course_seq[cid] = seq + 1
            made += 1
        db.commit()
        print(f"[sessions] ensured sessions for {made} existing (course,date) pairs")

        # ---- 2. Backfill HISTORICAL attendance for past semesters ----
        students = db.query(Student).all()
        att_added = 0
        for st in students:
            if not st.current_semester or st.current_semester not in BSC_SEMESTER_ORDER:
                continue
            cur_rank = semester_rank(st.current_semester)

            # student's graded courses grouped by their course-semester
            grades = (
                db.query(Result, Course)
                .join(Course, Course.id == Result.course_id)
                .filter(Result.student_id == st.id)
                .all()
            )
            by_sem = {}
            for r, co in grades:
                by_sem.setdefault(co.semester, []).append((r, co))

            # which (student,course) already have attendance -> skip (idempotent)
            done_courses = {
                cid for (cid,) in db.query(Attendance.course_id)
                .filter(Attendance.student_id == st.id).distinct().all()
            }

            for sem, items in by_sem.items():
                if sem not in BSC_SEMESTER_ORDER:
                    continue
                step = cur_rank - semester_rank(sem)
                if step <= 0:
                    continue  # current/future: already has (or will get) live data

                # cap to a realistic course load: dedup by catalog code, keep <=6
                seen_codes, picked = set(), []
                for r, co in sorted(items, key=lambda x: (x[1].type or "", x[1].id)):
                    code = (co.course_code or f"__{co.id}")
                    if code in seen_codes:
                        continue
                    seen_codes.add(code)
                    picked.append((r, co))
                    if len(picked) >= 6:
                        break

                anchor_end = CURRENT_END - timedelta(days=182 * step)
                for r, co in picked:
                    if co.id in done_courses:
                        continue
                    is_lab = (co.type == "Lab")
                    n = random.randint(11, 14) if is_lab else random.randint(23, 27)
                    dates = _class_dates(anchor_end, n)
                    rng = random.Random(hash((st.id, co.id)) & 0xffffffff)
                    ratio = min(0.99, max(0.45, _target_ratio(r.grade_point) + rng.uniform(-0.03, 0.03)))
                    statuses = _statuses(len(dates), ratio, rng)
                    for seq, (d, status) in enumerate(zip(dates, statuses)):
                        db.add(Attendance(course_id=co.id, student_id=st.id, date=d, status=status))
                        ensure_session(co.id, d, seq)
                        att_added += 1
                db.commit()
        print(f"[attendance] added {att_added} historical attendance rows")
        print("seed_demo_lifecycle: done")
    finally:
        db.close()


def seed_if_empty():
    """Run once: only when no class_sessions exist yet (heavy generation, so we
    don't re-walk it on every boot). The seed itself is still idempotent."""
    db = SessionLocal()
    try:
        has_any = db.query(ClassSession.id).first() is not None
    finally:
        db.close()
    if has_any:
        print("seed_demo_lifecycle: class_sessions already present, skipping")
        return
    seed()


if __name__ == "__main__":
    seed()
