"""Seed the class-routine system with the official CSE DU data:
- the 5 standard periods of the department routine grid
- the published 4th Year 1st Semester (Batch 27) B.Sc 2024-2025 routine
- holidays/vacations/exam window from the Tentative Academic Calendar (Feb 2026)

Runs at startup (main.py); each part only seeds when its table is empty, so
admin edits are never overwritten. Teacher links (teacher_ids) are left empty —
initials are display-only until admin attaches real teacher accounts per slot.
"""
from datetime import date

from app.core.database import SessionLocal
from app.Rakib.model.routine import (
    RoutinePeriod, Routine, RoutineSlot, AcademicHoliday,
)

PERIODS = [
    ("8:30-10:00 AM", "08:30", "10:00"),
    ("10:00-11:30 AM", "10:00", "11:30"),
    ("11:30-1:00 PM", "11:30", "13:00"),
    ("2:00-3:30 PM", "14:00", "15:30"),
    ("3:30-5:00 PM", "15:30", "17:00"),
]

COURSES = {
    "CSE-4101": "Artificial Intelligence",
    "CSE-4102": "Mathematical and Statistical Analysis for Engineers",
    "CSE-4125": "Introduction to Machine Learning (Option A)",
    "CSE-4126": "Introduction to Data Science (Option B)",
    "CSE-4111": "Artificial Intelligence Lab",
    "CSE-4113": "Internet Programming Lab",
    "CSE-4155": "Introduction to Machine Learning Lab (Option A)",
}

# (day, period_index 1-5, code, initials, room, group)
SLOTS = [
    ("Sunday", 2, "CSE-4102", "SM", "429", None),
    ("Sunday", 3, "CSE-4125", "MIb", "429", None),
    ("Sunday", 4, "CSE-4113", "MFA+AAT", "706", "GA"),
    ("Sunday", 5, "CSE-4113", "MFA+AAT", "706", "GA"),
    ("Monday", 2, "CSE-4125", "MIb", "429", None),
    ("Monday", 3, "CSE-4126", "CFA", "429", None),
    ("Wednesday", 1, "CSE-4111", "MMK+PR", "707", "GA"),
    ("Wednesday", 2, "CSE-4111", "MMK+PR", "707", "GA"),
    ("Wednesday", 1, "CSE-4155", "MJ+MIb", "709", "GA"),
    ("Wednesday", 2, "CSE-4155", "MJ+MIb", "709", "GA"),
    ("Wednesday", 3, "CSE-4101", "MMK", "429", None),
    ("Wednesday", 4, "CSE-4111", "MMK+PR", "707", "GB"),
    ("Wednesday", 5, "CSE-4111", "MMK+PR", "707", "GB"),
    ("Wednesday", 4, "CSE-4155", "AKB+MIb", "709", "GB"),
    ("Wednesday", 5, "CSE-4155", "AKB+MIb", "709", "GB"),
    ("Thursday", 1, "CSE-4102", "SM", "429", None),
    ("Thursday", 2, "CSE-4101", "MMK", "429", None),
    ("Thursday", 3, "CSE-4126", "CFA", "429", None),
    ("Thursday", 4, "CSE-4113", "MFA+MoR", "706", "GB"),
    ("Thursday", 5, "CSE-4113", "MFA+MoR", "706", "GB"),
]

HOLIDAYS = [
    ("Eid Ul Fitr Vacation", "vacation", date(2026, 3, 15), date(2026, 3, 26)),
    ("Independence Day", "holiday", date(2026, 3, 26), date(2026, 3, 26)),
    ("Easter Sunday", "holiday", date(2026, 4, 5), date(2026, 4, 5)),
    ("Bangla New Year", "holiday", date(2026, 4, 14), date(2026, 4, 14)),
    ("May Day / Buddha Purnima", "holiday", date(2026, 5, 1), date(2026, 5, 1)),
    ("Annual Cultural Programme", "holiday", date(2026, 5, 12), date(2026, 5, 12)),
    ("Eid Ul Azha Vacation", "vacation", date(2026, 5, 25), date(2026, 5, 30)),
    ("Ashura", "holiday", date(2026, 6, 26), date(2026, 6, 26)),
    ("Preparatory Leave", "pl", date(2026, 7, 26), date(2026, 8, 1)),
    ("Final Examination", "exam", date(2026, 8, 2), date(2026, 8, 29)),
    ("July Day / Janmashtami", "holiday", date(2026, 8, 5), date(2026, 8, 5)),
]


def seed_if_empty():
    db = SessionLocal()
    try:
        if db.query(RoutinePeriod).first() is None:
            for order, (label, start, end) in enumerate(PERIODS):
                db.add(RoutinePeriod(label=label, start_time=start, end_time=end,
                                     display_order=order))
            db.commit()
            print(f"seed_routine: seeded {len(PERIODS)} periods")

        # NOTE: the full published routines (all batches/semesters), with real
        # teacher accounts and course links, are seeded by seed_full_routines.py.
        # This file now only owns the shared periods and the academic calendar.

        if db.query(AcademicHoliday).first() is None:
            for title, kind, start, end in HOLIDAYS:
                db.add(AcademicHoliday(title=title, kind=kind,
                                       start_date=start, end_date=end))
            db.commit()
            print(f"seed_routine: seeded {len(HOLIDAYS)} academic-calendar entries")
    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()
