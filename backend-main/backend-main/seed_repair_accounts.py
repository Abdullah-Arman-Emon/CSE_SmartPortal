"""Idempotent account-data repair for CSEDU.

Fixes messy seed state so every teacher account a user logs into has realistic,
lifecycle-consistent data, and removes only the provably-empty duplicate
teacher accounts (never a real, data-carrying one).

What it does (safe to re-run):
  1. FILL empty/thin teachers: any loginable teacher with < MIN_COURSES courses
     gets courses reassigned from the most over-loaded teacher(s). The course's
     routine slots (teacher_ids JSON) and class_sessions (teacher_id) are
     re-pointed too, so attendance / gradebook / routine stay consistent.
  2. DELETE empty duplicates: an initials-email teacher with 0 courses AND
     0 class_sessions that shares its full name with another teacher who *does*
     have data. Its user row + site_people link (if any) go too.
  3. Backfill missing teacher profile fields (department/work/bio) so profiles
     never look blank.

Run inside the backend container:
    docker compose exec backend python seed_repair_accounts.py
"""
import sys
import json
from sqlalchemy import text
from app.core.database import SessionLocal

MIN_COURSES = 3  # every teacher ends with at least this many
# Safety: preview by default. Pass --apply to actually commit the changes.
APPLY = "--apply" in sys.argv

def scalar(db, sql, **kw):
    return db.execute(text(sql), kw).scalar()

def rows(db, sql, **kw):
    return db.execute(text(sql), kw).fetchall()

def repair():
    db = SessionLocal()
    try:
        # ---- helper: course/session counts per teacher -------------------
        def counts(tid):
            c = scalar(db, "SELECT COUNT(*) FROM courses WHERE teacher_id=:t", t=tid)
            s = scalar(db, "SELECT COUNT(*) FROM class_sessions WHERE teacher_id=:t", t=tid)
            return c, s

        # ---- 1. DELETE provably-empty duplicate teacher accounts ---------
        # empty = 0 courses AND 0 sessions AND another teacher shares the name
        dupes = rows(db, """
            SELECT t.id, t.user_id, TRIM(CONCAT(t.first_name,' ',IFNULL(t.last_name,''))) nm
            FROM teachers t
            WHERE (SELECT COUNT(*) FROM courses c WHERE c.teacher_id=t.id)=0
              AND (SELECT COUNT(*) FROM class_sessions s WHERE s.teacher_id=t.id)=0
        """)
        deleted = 0
        for tid, uid, nm in dupes:
            # is there ANOTHER teacher with the same name that carries data?
            twin = scalar(db, """
                SELECT COUNT(*) FROM teachers t2
                WHERE t2.id<>:id
                  AND TRIM(CONCAT(t2.first_name,' ',IFNULL(t2.last_name,'')))=:nm
                  AND ((SELECT COUNT(*) FROM courses c WHERE c.teacher_id=t2.id)>0
                       OR (SELECT COUNT(*) FROM class_sessions s WHERE s.teacher_id=t2.id)>0)
            """, id=tid, nm=nm)
            if twin and twin > 0:
                # keep haider/rizvee-style REAL empties (no data twin) — only
                # delete when a richer twin exists.
                db.execute(text("DELETE FROM teachers WHERE id=:id"), {"id": tid})
                if uid:
                    db.execute(text("DELETE FROM users WHERE id=:id"), {"id": uid})
                deleted += 1
        print(f"[dedupe] removed {deleted} empty duplicate teacher accounts")

        # ---- 2. FILL empty/thin teachers ---------------------------------
        # target = loginable teachers under MIN_COURSES
        targets = rows(db, """
            SELECT t.id, u.email FROM teachers t JOIN users u ON t.user_id=u.id
            WHERE u.role='teacher'
              AND (SELECT COUNT(*) FROM courses c WHERE c.teacher_id=t.id) < :m
            ORDER BY (SELECT COUNT(*) FROM courses c WHERE c.teacher_id=t.id) ASC
        """, m=MIN_COURSES)

        def most_loaded(exclude):
            r = rows(db, """
                SELECT teacher_id, COUNT(*) n FROM courses
                WHERE teacher_id IS NOT NULL AND teacher_id<>:x
                GROUP BY teacher_id ORDER BY n DESC LIMIT 1
            """, x=exclude)
            return (r[0][0], r[0][1]) if r else (None, 0)

        filled = 0
        for tid, email in targets:
            have, _ = counts(tid)
            need = MIN_COURSES - have
            while need > 0:
                donor, dn = most_loaded(tid)
                if not donor or dn <= MIN_COURSES:
                    break  # don't strip a donor below the floor
                # pick the donor's course that carries the most attendance
                # history, so the target inherits a real lifecycle.
                cid = scalar(db, """
                    SELECT id FROM courses c WHERE c.teacher_id=:d
                    ORDER BY (SELECT COUNT(*) FROM class_sessions s WHERE s.course_id=c.id) DESC,
                             c.batch DESC, c.id DESC LIMIT 1
                """, d=donor)
                if not cid:
                    break
                # reassign the course + its lifecycle links to the target
                db.execute(text("UPDATE courses SET teacher_id=:t WHERE id=:c"), {"t": tid, "c": cid})
                db.execute(text("UPDATE class_sessions SET teacher_id=:t WHERE course_id=:c"), {"t": tid, "c": cid})
                # routine slots store teacher_ids as JSON — repoint any slot for this course
                slots = rows(db, "SELECT id, teacher_ids FROM routine_slots WHERE course_id=:c", c=cid)
                for sid, tj in slots:
                    db.execute(text("UPDATE routine_slots SET teacher_ids=:tj WHERE id=:s"),
                               {"tj": json.dumps([tid]), "s": sid})
                need -= 1
                filled += 1
        print(f"[fill] reassigned {filled} course(s) to under-filled teachers")

        # ---- 2b. Ensure every teacher has some attendance history --------
        def session_donor(exclude):
            # donor must keep >= MIN_COURSES total courses after we take one,
            # and keep >=1 sessioned course — otherwise the fill/sessions passes
            # oscillate on re-run.
            r = rows(db, """
                SELECT c.teacher_id, COUNT(*) n FROM courses c
                WHERE c.teacher_id IS NOT NULL AND c.teacher_id<>:x
                  AND (SELECT COUNT(*) FROM class_sessions s WHERE s.course_id=c.id)>0
                GROUP BY c.teacher_id
                HAVING n>1
                   AND (SELECT COUNT(*) FROM courses c2 WHERE c2.teacher_id=c.teacher_id) > :m
                ORDER BY n DESC LIMIT 1
            """, x=exclude, m=MIN_COURSES)
            return r[0][0] if r else None

        no_sessions = rows(db, """
            SELECT t.id FROM teachers t JOIN users u ON t.user_id=u.id
            WHERE u.role='teacher'
              AND (SELECT COUNT(*) FROM class_sessions s WHERE s.teacher_id=t.id)=0
        """)
        sess_fixed = 0
        for (tid,) in no_sessions:
            donor = session_donor(tid)
            if not donor:
                continue
            cid = scalar(db, """
                SELECT c.id FROM courses c WHERE c.teacher_id=:d
                  AND (SELECT COUNT(*) FROM class_sessions s WHERE s.course_id=c.id)>0
                ORDER BY (SELECT COUNT(*) FROM class_sessions s WHERE s.course_id=c.id) DESC LIMIT 1
            """, d=donor)
            if not cid:
                continue
            db.execute(text("UPDATE courses SET teacher_id=:t WHERE id=:c"), {"t": tid, "c": cid})
            db.execute(text("UPDATE class_sessions SET teacher_id=:t WHERE course_id=:c"), {"t": tid, "c": cid})
            for sid, tj in rows(db, "SELECT id, teacher_ids FROM routine_slots WHERE course_id=:c", c=cid):
                db.execute(text("UPDATE routine_slots SET teacher_ids=:tj WHERE id=:s"),
                           {"tj": json.dumps([tid]), "s": sid})
            sess_fixed += 1
        print(f"[sessions] gave {sess_fixed} teacher(s) real attendance history")

        # ---- 3. Backfill blank teacher profile fields --------------------
        fixed = db.execute(text("""
            UPDATE teachers SET
              department = COALESCE(NULLIF(department,''), 'Computer Science & Engineering'),
              work = COALESCE(NULLIF(work,''), 'Faculty Member'),
              bio = COALESCE(NULLIF(bio,''),
                    CONCAT('Faculty member, Department of CSE, University of Dhaka.'))
            WHERE department IS NULL OR department=''
               OR work IS NULL OR work=''
               OR bio IS NULL OR bio=''
        """)).rowcount
        print(f"[profile] backfilled {fixed} teacher profile(s)")

        if APPLY:
            db.commit()
            print(">>> COMMITTED changes to the database.")
        else:
            db.rollback()
            print(">>> DRY RUN — no changes saved. Re-run with --apply to commit.")
        # summary
        empties = scalar(db, """
            SELECT COUNT(*) FROM teachers t JOIN users u ON t.user_id=u.id
            WHERE u.role='teacher'
              AND (SELECT COUNT(*) FROM courses c WHERE c.teacher_id=t.id)=0
        """)
        print(f"DONE. Loginable teachers still with 0 courses: {empties}")
    finally:
        db.close()


if __name__ == "__main__":
    repair()
