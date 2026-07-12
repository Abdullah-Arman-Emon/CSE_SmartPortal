"""Idempotent schema migrations for columns create_all() cannot add.

Runs automatically at backend startup (main.py) so prod deploys never break
from schema drift. Each statement fails harmlessly if already applied.
"""

from sqlalchemy import text

STATEMENTS = [
    "ALTER TABLE admission_form ADD COLUMN status VARCHAR(20) DEFAULT 'pending'",
    "ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
    "ALTER TABLE courses ADD COLUMN credit INT DEFAULT 3",
    "ALTER TABLE courses ADD COLUMN course_code VARCHAR(20) NULL AFTER code",
    "ALTER TABLE courses ADD INDEX idx_courses_course_code (course_code)",
    "ALTER TABLE courses MODIFY COLUMN credit FLOAT NULL DEFAULT 3",
    "ALTER TABLE students ADD COLUMN current_semester VARCHAR(10) NULL AFTER batch",
    "ALTER TABLE students ADD COLUMN program ENUM('bsc','msc') NOT NULL DEFAULT 'bsc' AFTER current_semester",
    "ALTER TABLE students ADD COLUMN msc_group ENUM('thesis','project') NULL AFTER program",
    "ALTER TABLE messages ADD COLUMN attachment_url VARCHAR(500) NULL AFTER text",
    "ALTER TABLE messages ADD COLUMN attachment_name VARCHAR(255) NULL AFTER attachment_url",
    "ALTER TABLE notices ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE",
    "ALTER TABLE users ADD COLUMN last_seen DATETIME NULL",
    "ALTER TABLE courses ADD COLUMN status VARCHAR(20) NULL",
    # backfill only untouched rows (NULL) so teacher-set values survive re-runs
    "UPDATE courses SET status = CASE WHEN running = 1 THEN 'active' ELSE 'completed' END WHERE status IS NULL",
    # link routine slots to the actual course offering (connects curriculum ->
    # course -> routine so a teacher's routine reflects the courses they teach)
    "ALTER TABLE routine_slots ADD COLUMN course_id INT NULL",
    "ALTER TABLE routine_slots ADD INDEX idx_routine_slots_course (course_id)",
    # backfill: match a slot's course_code to a course of the same batch
    ("UPDATE routine_slots rs JOIN routines r ON rs.routine_id = r.id "
     "JOIN courses c ON c.batch = r.batch AND (c.code = rs.course_code OR c.course_code = rs.course_code) "
     "SET rs.course_id = c.id WHERE rs.course_id IS NULL AND rs.course_code IS NOT NULL"),
    # --- BatchTerm spine (Phase 1) --------------------------------------------
    # Backfill one term per distinct (batch, semester) already implied by routines
    # and single-semester course offerings. Skip comma-lists (legacy multi-sem
    # course.semester values) so we never mint a garbage term. Idempotent via
    # NOT EXISTS on the unique (batch, semester) key.
    ("INSERT INTO batch_terms (batch, semester, program, status) "
     "SELECT t.batch, t.semester, 'bsc', 'completed' FROM ("
     "  SELECT batch, semester FROM routines "
     "  UNION SELECT batch, semester FROM courses"
     ") t WHERE t.semester NOT LIKE '%,%' AND t.batch IS NOT NULL "
     "AND NOT EXISTS (SELECT 1 FROM batch_terms bt "
     "  WHERE bt.batch = t.batch AND bt.semester = t.semester)"),
    # Mark a term 'running' when it still has an active course offering.
    ("UPDATE batch_terms bt SET bt.status = 'running' WHERE EXISTS ("
     "  SELECT 1 FROM courses c WHERE c.batch = bt.batch "
     "  AND c.semester = bt.semester AND c.status = 'active')"),
    # Carry a routine's display title/start date onto its term where present.
    ("UPDATE batch_terms bt JOIN routines r "
     "  ON r.batch = bt.batch AND r.semester = bt.semester "
     "SET bt.year_label = COALESCE(bt.year_label, r.title) "
     "WHERE bt.year_label IS NULL AND r.title IS NOT NULL"),
    # --- Lifecycle layer ------------------------------------------------------
    # Student lifecycle status (active | graduated | dropped | on_leave).
    "ALTER TABLE students ADD COLUMN status VARCHAR(15) NOT NULL DEFAULT 'active'",
    "ALTER TABLE students ADD INDEX idx_students_status (status)",
    # Backfill the Batch master table from every batch that already has students,
    # so lifecycle control works for legacy data. program/current_semester are
    # taken from the batch's students (most common values); status starts 'active'.
    ("INSERT INTO batches (number, program, current_semester, status) "
     "SELECT s.batch, "
     "  COALESCE(MAX(s.program), 'bsc'), "
     "  MAX(s.current_semester), "
     "  'active' "
     "FROM students s WHERE s.batch IS NOT NULL "
     "AND NOT EXISTS (SELECT 1 FROM batches b WHERE b.number = s.batch) "
     "GROUP BY s.batch"),
    # Also register any batch that exists only via BatchTerm (routine-seeded, no
    # students yet), so admin can see/manage it. current_semester = latest running.
    ("INSERT INTO batches (number, program, current_semester, status) "
     "SELECT bt.batch, MAX(bt.program), NULL, 'active' "
     "FROM batch_terms bt WHERE bt.batch IS NOT NULL "
     "AND NOT EXISTS (SELECT 1 FROM batches b WHERE b.number = bt.batch) "
     "GROUP BY bt.batch"),
    # --- Student identity + extended profile ----------------------------------
    "ALTER TABLE students ADD COLUMN registration_number VARCHAR(30) NULL",
    "ALTER TABLE students ADD UNIQUE INDEX uq_students_registration (registration_number)",
    "ALTER TABLE students ADD COLUMN nickname VARCHAR(60) NULL",
    "ALTER TABLE students ADD COLUMN gender VARCHAR(15) NULL",
    "ALTER TABLE students ADD COLUMN blood_group VARCHAR(5) NULL",
    "ALTER TABLE students ADD COLUMN date_of_birth VARCHAR(20) NULL",
    "ALTER TABLE students ADD COLUMN roll VARCHAR(20) NULL",
    "ALTER TABLE students ADD COLUMN merit_rank VARCHAR(15) NULL",
    "ALTER TABLE students ADD COLUMN school VARCHAR(200) NULL",
    "ALTER TABLE students ADD COLUMN college VARCHAR(200) NULL",
    "ALTER TABLE students ADD COLUMN department VARCHAR(120) NULL",
    "ALTER TABLE students ADD COLUMN present_address TEXT NULL",
    "ALTER TABLE students ADD COLUMN permanent_address TEXT NULL",
    "ALTER TABLE students ADD COLUMN hall VARCHAR(120) NULL",
    "ALTER TABLE students ADD COLUMN personal_email VARCHAR(150) NULL",
    "ALTER TABLE students ADD COLUMN facebook_url VARCHAR(400) NULL",
    "ALTER TABLE students ADD COLUMN other_social VARCHAR(400) NULL",
    "ALTER TABLE students ADD COLUMN guardian_mobile VARCHAR(30) NULL",
    # --- Allowlist: pre-provisioned registration number + name + batch --------
    "ALTER TABLE allowed_emails ADD COLUMN registration_number VARCHAR(30) NULL",
    "ALTER TABLE allowed_emails ADD INDEX idx_allowed_registration (registration_number)",
    "ALTER TABLE allowed_emails ADD COLUMN full_name VARCHAR(150) NULL",
    "ALTER TABLE allowed_emails ADD COLUMN batch INT NULL",
]


def run_migrations(engine):
    for stmt in STATEMENTS:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
            print(f"  migrated: {stmt}")
        except Exception:
            pass  # column/index already exists — safe to ignore
