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
]


def run_migrations(engine):
    for stmt in STATEMENTS:
        try:
            with engine.begin() as conn:
                conn.execute(text(stmt))
            print(f"  migrated: {stmt}")
        except Exception:
            pass  # column/index already exists — safe to ignore
