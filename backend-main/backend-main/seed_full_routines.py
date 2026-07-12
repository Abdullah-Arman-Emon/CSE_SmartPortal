"""Seed the department's real published routines — every running batch/semester —
with proper architectural links:

    Teacher (User+account)  ->  Course (batch, semester, credit, type)  ->  RoutineSlot
                                       |
                                   BatchTerm (batch, semester timeline spine)

So a teacher's routine reflects the courses they run, a student sees their batch's
routine, and closing a term (BatchTermApi) promotes the batch cleanly.

Idempotent: teachers keyed by email, courses by code, routines by (batch, semester).
Re-running never duplicates and never overwrites admin edits.

Batch map (2024-2025 session, classes start 22.02.2026):
    4-1 = Batch 28 · 3-2 = Batch 29 · 2-2 = Batch 30 · 1-2 = Batch 31 · MSc = Batch 25
"""
import json

from app.core.database import SessionLocal
from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Emon.model.course import Course
from app.Rakib.model.routine import RoutinePeriod, Routine, RoutineSlot
from app.Rakib.model.batch_term import BatchTerm

try:
    from passlib.context import CryptContext
    _pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")
    _hash = lambda p: _pwd.hash(p[:72])
except Exception:  # passlib/bcrypt unavailable — accounts still seed, reset later
    _hash = lambda p: p

DEFAULT_TEACHER_PASSWORD = "Cse@du2026"   # placeholder — teachers/admin should reset

# ---------------------------------------------------------------- teachers
# initials -> (full name, department, title)
TEACHERS = {
    "AAF":  ("Abu Ahmed Ferdaus", "CSE", "Lecturer"),
    "MTA":  ("Md. Tanvir Alam", "CSE", "Lecturer"),
    "MHK":  ("Mosaddek Hossain Kamal", "CSE", "Professor"),
    "AAT":  ("Md. Ahasanul Alam Tishat", "CSE", "Lecturer"),
    "STA":  ("Sarker Tanveer Ahmed Rumee", "CSE", "Associate Professor"),
    "MMR":  ("Md. Mustafizur Rahman", "CSE", "Professor"),
    "SMT":  ("Saifuddin Md. Tareeq", "CSE", "Professor"),
    "JA":   ("Jargis Ahmed", "CSE", "Lecturer"),
    "SM":   ("Shabab Murshed", "CSE", "Lecturer"),
    "MFA":  ("Md. Fahim Arefin", "CSE", "Lecturer"),
    "SP":   ("Suraiya Pervin", "CSE", "Associate Professor"),
    "SMSI": ("Sazzad M. S. Imran", "EEE", "Professor"),
    "AHK":  ("Mohammad Asif Hossain Khan", "CSE", "Professor"),
    "SA":   ("Shabbir Ahmed", "CSE", "Associate Professor"),
    "PR":   ("Palash Roy", "CSE", "Lecturer"),
    "MRR":  ("Mahmudur Rahman", "CSE", "Lecturer"),
    "AKB":  ("Md. Aminul Kader Bulbul", "CSE", "Lecturer"),
    "HMHB": ("Hafiz Md. Hasan Babu", "CSE", "Professor"),
    "KA":   ("Khaleda Ali", "EEE", "Associate Professor"),
    "MSP":  ("Shahin Parvej", "EEE", "Lecturer"),
    "MRK":  ("Md. Rezaul Karim", "CSE", "Professor"),
    "UK":   ("Upama Kabir", "CSE", "Professor"),
    "MoR":  ("Md. Mamun Or Rashid", "CSE", "Professor"),
    "AR":   ("Md. Abdur Razzaque", "CSE", "Professor"),
    "MMK":  ("Md. Mosaddek Khan", "CSE", "Associate Professor"),
    "MIb":  ("Muhammad Ibrahim", "CSE", "Associate Professor"),
    "CFA":  ("Chowdhury Farhan Ahmed", "CSE", "Professor"),
    "MJ":   ("Mosarrat Jahan", "CSE", "Associate Professor"),
    "JHK":  ("Md. Jamil Hasan Karami", "Statistics", "Professor"),
    "IsR":  ("Ismat Rahman", "CSE", "Associate Professor"),
}


def _email(initials):
    return f"{initials.lower()}@cse.du.ac.bd"


# ---------------------------------------------------------------- courses
# code (hyphen, also the passcode) -> (title, type Theory|Lab, primary initials)
def T(title, initials):  return (title, "Theory", initials)
def L(title, initials):  return (title, "Lab", initials)

# ---------------------------------------------------------------- routines
# slot = (day, period_index 1..5, code, initials_str, room, group)
ROUTINES = [
    # ===================================================== 4th Year 1st Sem
    dict(batch=28, semester="4-1", program="bsc", room="429",
         title="4th Year 1st Semester B.Sc 2024-2025", year_label="2024-2025",
         courses={
             "CSE-4101": T("Artificial Intelligence", "MMK"),
             "CSE-4102": T("Mathematical and Statistical Analysis for Engineers", "SM"),
             "CSE-4125": T("Introduction to Machine Learning (Option A)", "MIb"),
             "CSE-4126": T("Introduction to Data Science (Option B)", "CFA"),
             "CSE-4111": L("Artificial Intelligence Lab", "MMK"),
             "CSE-4113": L("Internet Programming Lab", "MFA"),
             "CSE-4155": L("Introduction to Machine Learning Lab (Option A)", "MJ"),
         },
         slots=[
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
         ]),

    # ===================================================== 3rd Year 2nd Sem
    dict(batch=29, semester="3-2", program="bsc", room="430",
         title="3rd Year 2nd Semester B.Sc 2024-2025", year_label="2024-2025",
         courses={
             "CSE-3201": T("Operating Systems", "JA"),
             "CSE-3202": T("Numerical Methods", "PR"),
             "CSE-3203": T("Design and Analysis of Algorithms - II", "MRK"),
             "CSE-3204": T("Formal Language, Automata, and Computability", "MJ"),
             "STAT-3205": T("Introduction to Probability and Statistics", "JHK"),
             "CSE-3211": L("Operating Systems Lab", "JA"),
             "CSE-3212": L("Numerical Methods Lab", "PR"),
             "CSE-3216": L("Software Design Patterns Lab", "STA"),
             "ENG-3217": L("Technical Writing and Presentation Lab", "IsR"),
         },
         slots=[
             ("Sunday", 2, "CSE-3204", "MJ", "430", None),
             ("Sunday", 3, "CSE-3202", "PR", "430", None),
             ("Sunday", 4, "ENG-3217", "IsR+SM", "709", None),
             ("Monday", 1, "STAT-3205", "JHK", "430", None),
             ("Monday", 2, "CSE-3203", "MRK", "430", None),
             ("Monday", 3, "CSE-3201", "JA", "430", None),
             ("Tuesday", 2, "CSE-3204", "MJ", "430", None),
             ("Tuesday", 3, "CSE-3202", "PR", "430", None),
             ("Tuesday", 4, "CSE-3212", "PR+AAT", "706", None),
             ("Wednesday", 1, "STAT-3205", "JHK", "430", None),
             ("Wednesday", 2, "CSE-3203", "MRK", "430", None),
             ("Thursday", 1, "CSE-3201", "JA", "430", None),
             ("Thursday", 2, "CSE-3211", "JA+AKB", "709", "GB"),
             ("Thursday", 2, "CSE-3216", "STA+MTA", "707", "GA"),
             ("Thursday", 4, "CSE-3211", "JA+AKB", "709", "GA"),
             ("Thursday", 4, "CSE-3216", "STA+MTA", "707", "GB"),
         ]),

    # ===================================================== 2nd Year 2nd Sem
    dict(batch=30, semester="2-2", program="bsc", room="416",
         title="2nd Year 2nd Semester B.Sc 2024-2025", year_label="2024-2025",
         courses={
             "CSE-2201": T("Database Management System", "AAF"),
             "CSE-2203": T("Design and Analysis of Algorithms", "MTA"),
             "CSE-2205": T("Microcontroller and Embedded System", "MHK"),
             "STAT-2207": T("Probability and Statistics", "AAT"),
             "CSE-2209": T("Numerical Methods", "STA"),
             "CSE-2202": L("Database Management System Lab", "AAF"),
             "CSE-2204": L("Design and Analysis of Algorithms Lab", "MTA"),
             "CSE-2206": L("Microcontroller and Embedded System Lab", "MHK"),
         },
         slots=[
             ("Sunday", 1, "CSE-2205", "MHK", "416", None),
             ("Sunday", 2, "CSE-2203", "MTA", "416", None),
             ("Sunday", 3, "STAT-2207", "AAT", "416", None),
             ("Sunday", 4, "CSE-2206", "MHK+JA", "704", "GB"),
             ("Monday", 2, "CSE-2209", "STA", "416", None),
             ("Monday", 3, "CSE-2201", "AAF", "416", None),
             ("Tuesday", 1, "CSE-2209", "STA", "416", None),
             ("Tuesday", 2, "CSE-2206", "JA+SM", "706", "GA"),
             ("Tuesday", 2, "CSE-2204", "MTA+MMR", "704", "GB"),
             ("Wednesday", 1, "CSE-2203", "MTA", "416", None),
             ("Wednesday", 2, "CSE-2204", "MTA+SMT", "706", "GA"),
             ("Wednesday", 4, "CSE-2202", "AAF+AAT", "704", "GA"),
             ("Thursday", 1, "CSE-2205", "MHK", "416", None),
             ("Thursday", 2, "STAT-2207", "AAT", "416", None),
             ("Thursday", 3, "CSE-2201", "AAF", "416", None),
             ("Thursday", 4, "CSE-2202", "AAF+AAT", "704", "GB"),
         ]),

    # ===================================================== 1st Year 2nd Sem
    dict(batch=31, semester="1-2", program="bsc", room="417",
         title="1st Year 2nd Semester B.Sc 2024-2025", year_label="2024-2025",
         courses={
             "CSE-1201": T("Structured Programming", "MFA"),
             "CSE-1203": T("Digital Logic Design", "SP"),
             "PHY-1205": T("Physics", "SMSI"),
             "MATH-1207": T("Linear Algebra", "AHK"),
             "EEE-1209": T("Electronic Devices and Circuits", "SA"),
             "CSE-1202": L("Structured Programming Lab", "MFA"),
             "CSE-1204": L("Digital Logic Design Lab", "SP"),
             "PHY-1206": L("Physics Lab", "KA"),
             "EEE-1210": L("Electronic Devices and Circuits Lab", "MRK"),
         },
         slots=[
             ("Sunday", 1, "CSE-1202", "MFA+PR", "707", "GA"),
             ("Sunday", 1, "CSE-1202", "MRR+AKB", "706", "GB"),
             ("Sunday", 3, "CSE-1201", "MFA", "417", None),
             ("Monday", 1, "PHY-1205", "SMSI", "417", None),
             ("Monday", 2, "EEE-1209", "SA", "417", None),
             ("Monday", 3, "CSE-1203", "SP", "417", None),
             ("Tuesday", 2, "CSE-1201", "MFA", "417", None),
             ("Tuesday", 3, "MATH-1207", "AHK", "417", None),
             ("Tuesday", 4, "PHY-1206", "KA+MSP", None, None),
             ("Wednesday", 1, "PHY-1205", "SMSI", "417", None),
             ("Wednesday", 2, "EEE-1209", "SA", "417", None),
             ("Wednesday", 3, "CSE-1203", "SP", "417", None),
             ("Wednesday", 4, "MATH-1207", "AHK", "417", None),
             ("Thursday", 2, "EEE-1210", "MRK+SA", "705", None),
             ("Thursday", 4, "CSE-1204", "SP+HMHB", "705", None),
         ]),

    # ===================================================== MSc Fall 2025
    dict(batch=25, semester="1-1", program="msc", room="713",
         title="MSc Fall 2025 Semester", year_label="Fall 2025",
         courses={
             "CSE-503": T("Network QoS", "UK"),
             "CSE-507": T("Wireless Mesh Network", "MMR"),
             "CSE-514": T("Web Application Engineering", "MoR"),
             "CSE-522": T("Introduction to Bioinformatics", "SMT"),
             "CSE-528": T("Network Performance Analysis", "AR"),
             "CSE-532": T("Decision Diagram for VLSI Design", "HMHB"),
         },
         slots=[
             ("Sunday", 1, "CSE-503", "UK", "713", None),
             ("Sunday", 2, "CSE-532", "HMHB", "713", None),
             ("Sunday", 3, "CSE-522", "SMT", "713", None),
             ("Monday", 1, "CSE-528", "AR", "713", None),
             ("Monday", 2, "CSE-507", "MMR", "713", None),
             ("Monday", 3, "CSE-514", "MoR", "713", None),
             ("Tuesday", 1, "CSE-503", "UK", "713", None),
             ("Tuesday", 2, "CSE-532", "HMHB", "713", None),
             ("Tuesday", 3, "CSE-522", "SMT", "713", None),
             ("Wednesday", 1, "CSE-528", "AR", "713", None),
             ("Wednesday", 2, "CSE-507", "MMR", "713", None),
             ("Wednesday", 3, "CSE-514", "MoR", "713", None),
         ]),
]


def _credit(ctype, code):
    if ctype == "Lab":
        return 0.75
    if code.startswith(("MATH", "STAT", "PHY", "ENG")):
        return 3.0
    return 3.0


def _split_name(full):
    parts = full.split()
    return (" ".join(parts[:-1]) or parts[0], parts[-1]) if len(parts) > 1 else (full, "")


def _initials_list(s):
    return [x.strip() for x in (s or "").replace("/", "+").split("+") if x.strip()]


def _norm_name(s):
    """Normalise a full name for matching: lowercase, drop dots/extra spaces."""
    return " ".join((s or "").replace(".", " ").split()).lower()


def _name_key(full):
    """Loose identity of a name: (last-token, first-initial). Survives different
    first/last splits and honorific prefixes so 'Md. Abdur Razzaque' stored as
    'Abdur'/'Razzaque' still matches 'Md. Abdur'/'Razzaque'."""
    toks = _norm_name(full).split()
    # drop common honorifics that get shuffled between first_name/last_name
    toks = [t for t in toks if t not in ("md", "mohammad", "mohammed", "muhammad", "mr", "dr")]
    if not toks:
        toks = _norm_name(full).split()
    if not toks:
        return ("", "")
    return (toks[-1], toks[0][0] if toks[0] else "")


def _find_existing_teacher(db, full):
    """Return an existing Teacher whose name matches `full`, else None.

    Real department accounts (e.g. the Chairman) are created outside this seed
    with their own email, so we must attach the routine to *them* instead of
    minting a duplicate `<initials>@cse.du.ac.bd` account that owns nothing.

    Resolution order (first hit wins):
      1. exact normalised full-name among REAL external accounts (email is not
         one of this seed's own `<initials>@cse.du.ac.bd` addresses),
      2. exact normalised full-name among ALL accounts (idempotent reuse of the
         seed's own account on re-runs),
      3. loose last-token + first-initial among REAL external accounts only.

    Preferring external accounts means that if a duplicate seed account AND the
    real department account (e.g. the Chairman) both carry the same name, we bind
    the routine to the REAL one. Restricting the loose pass to external accounts
    stops two seed teachers who share a last name + first initial (Mustafizur
    Rahman vs Mahmudur Rahman) from collapsing onto one account."""
    from app.Emon.model.teacher import Teacher
    seed_emails = {_email(i) for i in TEACHERS}
    rows = db.query(Teacher, User).join(User, Teacher.user_id == User.id).all()
    external = [(t, u) for t, u in rows if (u.email or "").lower() not in seed_emails]
    target = _norm_name(full)

    def _exact(pool):
        for t, u in pool:
            name = _norm_name(f"{t.first_name or ''} {t.last_name or ''}")
            if name and name == target:
                return t
        return None

    hit = _exact(external) or _exact(rows)
    if hit:
        return hit
    tkey = _name_key(full)
    if tkey != ("", ""):
        for t, u in external:
            if _name_key(f"{t.first_name or ''} {t.last_name or ''}") == tkey:
                return t
    return None


def seed_if_empty():
    db = SessionLocal()
    try:
        periods = db.query(RoutinePeriod).order_by(
            RoutinePeriod.display_order, RoutinePeriod.id).all()
        if len(periods) < 5:
            db.close()
            return  # periods not ready yet (seed_routine runs first) — try next boot

        # 1) resolve each initials -> teacher_id. Prefer an EXISTING account whose
        # name matches (so real dept accounts like the Chairman get their classes),
        # else the seed's own <initials>@cse.du.ac.bd account, else create one.
        tid_by_initials = {}
        made_t = 0
        for initials, (full, dept, title) in TEACHERS.items():
            existing = _find_existing_teacher(db, full)
            if existing:
                tid_by_initials[initials] = existing.id
                continue
            email = _email(initials)
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(email=email, hashed_password=_hash(DEFAULT_TEACHER_PASSWORD),
                         role="teacher", is_active=True)
                db.add(u)
                db.commit()
                db.refresh(u)
                made_t += 1
            t = db.query(Teacher).filter(Teacher.user_id == u.id).first()
            if not t:
                fn, ln = _split_name(full)
                t = Teacher(user_id=u.id, first_name=fn, last_name=ln,
                            department=dept, work=title)
                db.add(t)
                db.commit()
                db.refresh(t)
            tid_by_initials[initials] = t.id
        if made_t:
            print(f"seed_full_routines: created {made_t} teacher accounts "
                  f"(default password '{DEFAULT_TEACHER_PASSWORD}' — reset advised)")

        # 1b) REPAIR pass — earlier runs may have linked courses/slots to a
        # duplicate seed account before a real teacher existed. Re-point every
        # seeded course + slot at the now-correct teacher id. Idempotent.
        fixed_c = fixed_s = 0
        for R in ROUTINES:
            for code, (title, ctype, primary) in R["courses"].items():
                correct = tid_by_initials.get(primary)
                if not correct:
                    continue
                course = db.query(Course).filter(Course.code == code).first()
                if course and course.teacher_id != correct:
                    tobj = db.query(Teacher).filter(Teacher.id == correct).first()
                    tname = f"{tobj.first_name} {tobj.last_name}".strip() if tobj else f"#{correct}"
                    print(f"seed_full_routines: repointing {code} -> {tname} (teacher #{correct})")
                    course.teacher_id = correct
                    fixed_c += 1
            routine = (db.query(Routine)
                       .filter(Routine.batch == R["batch"],
                               Routine.semester == R["semester"]).first())
            if not routine:
                continue
            for slot in db.query(RoutineSlot).filter(
                    RoutineSlot.routine_id == routine.id).all():
                want = [tid_by_initials[i] for i in _initials_list(slot.teacher_initials)
                        if i in tid_by_initials]
                if json.dumps(want) != (slot.teacher_ids or ""):
                    slot.teacher_ids = json.dumps(want)
                    fixed_s += 1
        if fixed_c or fixed_s:
            db.commit()
            print(f"seed_full_routines: repaired teacher links "
                  f"({fixed_c} courses, {fixed_s} slots)")

        pmap = {i + 1: periods[i].id for i in range(len(periods))}
        made_r = 0
        for R in ROUTINES:
            # skip if this batch+semester routine already exists (admin owns it)
            if db.query(Routine).filter(Routine.batch == R["batch"],
                                        Routine.semester == R["semester"]).first():
                continue

            # BatchTerm spine
            if not db.query(BatchTerm).filter(BatchTerm.batch == R["batch"],
                                              BatchTerm.semester == R["semester"]).first():
                db.add(BatchTerm(batch=R["batch"], semester=R["semester"],
                                 program=R["program"], year_label=R["year_label"],
                                 status="running"))

            # Courses (idempotent by code) -> code -> Course.id
            cid_by_code = {}
            for code, (title, ctype, primary) in R["courses"].items():
                course = db.query(Course).filter(Course.code == code).first()
                if not course:
                    course = Course(
                        title=title, code=code,
                        course_code=code.replace("-", " "),  # catalog form
                        semester=R["semester"], batch=R["batch"], type=ctype,
                        credit=_credit(ctype, code),
                        teacher_id=tid_by_initials.get(primary),
                        running=True, status="active",
                    )
                    db.add(course)
                    db.commit()
                    db.refresh(course)
                cid_by_code[code] = course.id

            routine = Routine(
                batch=R["batch"], semester=R["semester"], title=R["title"],
                room_note=f"Room No.: {R['room']}", class_start_date="22.02.2026",
                published=True,
            )
            db.add(routine)
            db.commit()
            db.refresh(routine)

            for day, pidx, code, initials, room, group in R["slots"]:
                tids = [tid_by_initials[i] for i in _initials_list(initials)
                        if i in tid_by_initials]
                title = R["courses"].get(code, (code,))[0]
                db.add(RoutineSlot(
                    routine_id=routine.id, day=day, period_id=pmap[pidx],
                    course_id=cid_by_code.get(code),
                    course_code=code, course_title=title,
                    teacher_ids=json.dumps(tids), teacher_initials=initials,
                    room=room, group_label=group,
                ))
            db.commit()
            made_r += 1
            print(f"seed_full_routines: seeded Batch {R['batch']} ({R['semester']}) "
                  f"— {len(R['courses'])} courses, {len(R['slots'])} slots")

        if made_r == 0:
            print("seed_full_routines: routines already present — nothing to do")
    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()
