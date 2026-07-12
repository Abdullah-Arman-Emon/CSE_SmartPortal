"""Idempotent per-student data fill for CSEDU.

seed_demo grades each course ONCE, so any student added to a batch after the
course was already graded stays empty (no results / attendance / enrolment).
This script backfills EVERY such student so no student account is ever blank —
following the same lifecycle as seed_demo (past-semester published results with
a grade-correlated attendance register, and enrolment in the running courses).

Safe to re-run. Preview by default; pass --apply to commit.
    docker compose exec backend python seed_fill_students.py            # dry run
    docker compose exec backend python seed_fill_students.py --apply    # commit
"""
import sys
import random
from sqlalchemy import text
from app.core.database import SessionLocal

# full model surface so mappers resolve
from app.Emon.model.userModel import User  # noqa: F401
from app.Emon.model.teacher import Teacher  # noqa: F401
from app.Emon.model.course import Course
from app.Rakib.model.student import Student
from app.Rakib.model.result import Result
from app.Rakib.model.attendance import Attendance
from app.Rakib.model.class_session import ClassSession

# reuse seed_demo's grading table + per-batch past-semester map
from seed_demo import grade_from_marks, PAST_SEMS

APPLY = "--apply" in sys.argv
SEM_ORDER = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"]
MIN_RESULTS = 4  # a student with fewer than this is treated as "empty" and filled


def past_semesters(student):
    if student.batch in PAST_SEMS:
        return PAST_SEMS[student.batch]
    cur = student.current_semester
    if cur in SEM_ORDER:
        return SEM_ORDER[: SEM_ORDER.index(cur)]  # everything strictly before now
    return SEM_ORDER[:6]


def fill():
    db = SessionLocal()
    r_added = a_added = e_added = touched = 0
    try:
        students = db.query(Student).all()
        for s in students:
            have = db.query(Result).filter_by(student_id=s.id).count()
            if have >= MIN_RESULTS:
                continue  # already has a real academic history
            touched += 1
            rng = random.Random(s.id)                 # deterministic per student
            ability = rng.randint(58, 90)
            rate = 0.72 + (ability - 58) / 32 * 0.25  # 0.72..0.97 attendance
            if rng.random() < 0.10:
                rate = rng.uniform(0.55, 0.72)

            # ---- past-semester published results + attendance register ----
            for sem in past_semesters(s):
                courses = db.query(Course).filter(
                    Course.batch == s.batch, Course.semester == sem
                ).all()
                for c in courses:
                    if not db.query(Result).filter_by(student_id=s.id, course_id=c.id).first():
                        marks = max(0, min(100, ability + rng.randint(-10, 8)))
                        g, gp = grade_from_marks(marks)
                        db.add(Result(course_id=c.id, student_id=s.id, marks=float(marks),
                                      grade=g, grade_point=gp, published=True))
                        r_added += 1
                    # attendance rows keyed to the course's real class dates
                    sessions = db.query(ClassSession.date).filter_by(course_id=c.id).all()
                    for (sd,) in sessions:
                        exists = db.query(Attendance).filter_by(
                            student_id=s.id, course_id=c.id, date=sd).first()
                        if exists:
                            continue
                        rr = rng.random()
                        status = "present" if rr < rate else ("late" if rr < rate + 0.08 else "absent")
                        db.add(Attendance(course_id=c.id, student_id=s.id, date=sd, status=status))
                        a_added += 1

            # ---- enrol in the running (current-semester) courses ----------
            running = db.query(Course).filter(
                Course.batch == s.batch, Course.running == True  # noqa: E712
            ).all()
            for c in running:
                ex = db.execute(text(
                    "SELECT 1 FROM student_courses WHERE student_id=:s AND course_id=:c"
                ), {"s": s.id, "c": c.id}).first()
                if not ex:
                    db.execute(text(
                        "INSERT INTO student_courses (student_id, course_id) VALUES (:s,:c)"
                    ), {"s": s.id, "c": c.id})
                    e_added += 1

        print(f"[fill] students touched: {touched}")
        print(f"[fill] results added:    {r_added}")
        print(f"[fill] attendance added: {a_added}")
        print(f"[fill] enrolments added: {e_added}")
        if APPLY:
            db.commit()
            print(">>> COMMITTED changes to the database.")
        else:
            db.rollback()
            print(">>> DRY RUN — no changes saved. Re-run with --apply to commit.")

        still_empty = db.execute(text(
            "SELECT COUNT(*) FROM students s WHERE (SELECT COUNT(*) FROM results r WHERE r.student_id=s.id)=0"
        )).scalar()
        print(f"DONE. Students still with 0 results: {still_empty}")
    finally:
        db.close()


if __name__ == "__main__":
    fill()
