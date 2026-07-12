"""Read-only routine diagnostic — run against the REAL database to see, in a few
seconds, whether the routine data is present and whether a given teacher (default:
the Chairman) is actually linked to their classes.

    python diagnose_routine.py                 # summary + Chairman check
    python diagnose_routine.py ar@cse.du.ac.bd # check a specific teacher email

It writes NOTHING. It just prints counts and the exact slots a teacher would see
via /v1/routine/teacher/{id}/slots — so "kishui nai" becomes a definite answer.
"""
import importlib
import json
import sys

from app.core.database import SessionLocal

# Import the FULL model set first so SQLAlchemy can resolve every relationship
# (Teacher -> Schedule, etc.). Querying any mapper triggers configuration of all
# of them, so a partial import raises "failed to locate a name 'Schedule'".
for _m in (
    "app.Emon.model.userModel", "app.Emon.model.teacher", "app.Emon.model.course",
    "app.Emon.model.assignment", "app.Emon.model.submission", "app.Emon.model.activity_log",
    "app.Emon.model.schedule", "app.Emon.model.research_paper", "app.Rakib.model.equipment",
    "app.Rakib.model.student", "app.Rakib.model.exam", "app.Rakib.model.event",
    "app.Rakib.model.notice", "app.Rakib.model.missingClassOnMonth", "app.Emon.model.meeting",
    "app.Emon.model.rsvp", "app.Emon.model.finance_event", "app.Emon.model.student_payment",
    "app.Rakib.model.admissionform", "app.Rakib.model.attendance", "app.Rakib.model.announcement",
    "app.Rakib.model.notification", "app.Rakib.model.message", "app.Rakib.model.direct_message",
    "app.Rakib.model.result", "app.Emon.model.curriculum", "app.Emon.model.allowedEmail",
    "app.Rakib.model.publicsite", "app.Rakib.model.routine", "app.Rakib.model.batch_term",
    "app.Rakib.model.batch", "app.Rakib.model.semester_result", "app.Rakib.model.batch_change",
):
    importlib.import_module(_m)

from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Emon.model.course import Course
from app.Rakib.model.student import Student
from app.Rakib.model.routine import Routine, RoutineSlot


def _tids(slot):
    try:
        return [int(x) for x in json.loads(slot.teacher_ids or "[]")]
    except (ValueError, TypeError):
        return []


def main():
    db = SessionLocal()
    try:
        print("=== ROUTINE DATA SUMMARY ===")
        print(f"users:     {db.query(User).count()}")
        print(f"teachers:  {db.query(Teacher).count()}")
        print(f"courses:   {db.query(Course).count()}")
        print(f"routines:  {db.query(Routine).count()} "
              f"(published: {db.query(Routine).filter(Routine.published == True).count()})")
        print(f"slots:     {db.query(RoutineSlot).count()}")
        print(f"students:  {db.query(Student).count()}")

        print("\n=== ROUTINES PER BATCH/SEMESTER ===")
        for r in db.query(Routine).order_by(Routine.batch.desc(), Routine.semester).all():
            n = db.query(RoutineSlot).filter(RoutineSlot.routine_id == r.id).count()
            print(f"  Batch {r.batch} · {r.semester} · published={r.published} · {n} slots")

        # Show EVERY teacher whose name matches the search term (default: the
        # Chairman) — so a duplicate account vs the real one is visible side by side.
        term = (sys.argv[1] if len(sys.argv) > 1 else "razzaque").lower()
        print(f"\n=== TEACHER CHECK: name/email contains '{term}' ===")

        rows_all = (db.query(RoutineSlot, Routine)
                    .join(Routine, RoutineSlot.routine_id == Routine.id)
                    .filter(Routine.published == True).all())

        matches = []
        for t, u in db.query(Teacher, User).join(User, Teacher.user_id == User.id).all():
            nm = f"{t.first_name or ''} {t.last_name or ''}".lower()
            if term in nm or term in (u.email or "").lower():
                matches.append((t, u))

        if not matches:
            print("  No matching teacher found.")
            return

        for t, u in matches:
            owned = db.query(Course).filter(Course.teacher_id == t.id).all()
            my_course_ids = {c.id for c in owned}
            mine = [(r.batch, r.semester, s.day, s.course_code)
                    for s, r in rows_all
                    if t.id in _tids(s) or (s.course_id and s.course_id in my_course_ids)]
            print(f"\n  Teacher.id={t.id}  email={u.email}  work={t.work}")
            print(f"    name: {t.first_name} {t.last_name}")
            print(f"    owned courses ({len(owned)}): "
                  + (", ".join(f"{c.code}[b{c.batch} {c.semester}]" for c in owned) or "NONE"))
            print(f"    slots this account WOULD see: {len(mine)}")
            for batch, sem, day, code in mine:
                print(f"       - Batch {batch} {sem} · {day} · {code}")

        if len(matches) > 1:
            print("\n  >> MORE THAN ONE matching account — a duplicate exists. After a")
            print("     backend restart the seed repair pass binds the routine to the")
            print("     REAL (non-seed) account; re-run this to confirm slots move to it.")
        elif all(not db.query(Course).filter(Course.teacher_id == t.id).first() for t, u in matches):
            print("\n  >> EMPTY. Restart the backend so the seed repair pass runs, then re-check.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
