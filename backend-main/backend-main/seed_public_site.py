"""Seed the admin-managed public-site content (people / chairman-about copy /
admission programs+courses / gallery) from seed_data/public_site.json.

Called automatically at backend startup (main.py) — each table is seeded only
if it is empty, so admin edits are never overwritten. Can also be run manually:
    python seed_public_site.py
"""
import json
from pathlib import Path

from app.core.database import SessionLocal
from app.Rakib.model.publicsite import (
    Person, SiteContent, AdmissionProgram, ProgramCourse, GalleryImage,
)

DATA_FILE = Path(__file__).parent / "seed_data" / "public_site.json"


def _dumps(v):
    return json.dumps(v, ensure_ascii=False) if v is not None else None


def seed_if_empty():
    if not DATA_FILE.exists():
        print(f"seed_public_site: {DATA_FILE} missing, skipping")
        return

    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    db = SessionLocal()
    try:
        # Insert any people whose name isn't already present (so newly added
        # officers/staff land in an existing DB without wiping faculty).
        existing_names = {n for (n,) in db.query(Person.name).all()}
        added = 0
        for p in data.get("people", []):
            if p["name"] in existing_names:
                continue
            db.add(Person(
                name=p["name"], role=p.get("role"), category=p.get("category", "Faculty"),
                expertise=_dumps(p.get("expertise")), email=p.get("email"),
                phone=p.get("phone"), office=p.get("office"),
                office_hours=p.get("office_hours"), image_url=p.get("image_url"),
                bio=p.get("bio"), status=p.get("status"),
                publications=_dumps(p.get("publications")),
                display_order=p.get("display_order", 0), is_active=True,
            ))
            added += 1
        if added:
            db.commit()
        print(f"seed_public_site: seeded {added} new people")

        # Content keys: insert any that are missing (never overwrite existing
        # values, so admin edits survive). Also covers the empty-table case,
        # and ensures newly shipped keys reach databases seeded before them.
        existing_keys = {k for (k,) in db.query(SiteContent.key).all()}
        added = 0
        for key, value in data.get("content", {}).items():
            if key not in existing_keys:
                db.add(SiteContent(key=key, value=value))
                added += 1
        if added:
            db.commit()
            print(f"seed_public_site: added {added} missing content keys")

        # Self-heal dept_stats: if the stored value is empty / an empty list, the
        # homepage silently falls back to raw live DB counts (inflated by test
        # accounts → "700 students"). Restore the curated default in that case,
        # but never overwrite a value an admin has actually filled in.
        stats_row = db.query(SiteContent).filter(SiteContent.key == "dept_stats").first()
        default_stats = data.get("content", {}).get("dept_stats")
        if stats_row is not None and default_stats:
            current = (stats_row.value or "").strip()
            is_empty = current in ("", "[]", "null")
            if not is_empty:
                try:
                    is_empty = not (json.loads(current) or [])
                except (ValueError, TypeError):
                    is_empty = False
            if is_empty:
                stats_row.value = default_stats
                db.commit()
                print("seed_public_site: restored empty dept_stats to curated default")

        if db.query(AdmissionProgram).first() is None:
            for p in data.get("programs", []):
                db.add(AdmissionProgram(
                    id=p["id"], title=p["title"], level=p["level"],
                    description=p.get("description"), image_url=p.get("image_url"),
                    credits=p.get("credits"), duration=p.get("duration"),
                    students_enrolled=p.get("students_enrolled"),
                    application_deadline=p.get("application_deadline"),
                    tuition_fee=p.get("tuition_fee"),
                    admission_requirements=_dumps(p.get("admission_requirements")),
                    career_prospects=_dumps(p.get("career_prospects")),
                    display_order=p.get("display_order", 0), is_active=True,
                ))
            db.commit()
            for c in data.get("courses", []):
                db.add(ProgramCourse(
                    id=c["id"], program_id=c["program_id"], code=c.get("code"),
                    title=c["title"], semester=c.get("semester"), year=c.get("year"),
                    credits=c.get("credits"), description=c.get("description"),
                    image_url=c.get("image_url"), instructor=c.get("instructor"),
                    syllabus_weeks=_dumps(c.get("syllabus_weeks")),
                ))
            db.commit()
            print(f"seed_public_site: seeded {len(data.get('programs', []))} programs, "
                  f"{len(data.get('courses', []))} courses")

        if db.query(GalleryImage).first() is None:
            for g in data.get("gallery", []):
                db.add(GalleryImage(
                    image_url=g["image_url"], caption=g.get("caption"),
                    display_order=g.get("display_order", 0), is_active=True,
                ))
            db.commit()
            print(f"seed_public_site: seeded {len(data.get('gallery', []))} gallery images")
    finally:
        db.close()


if __name__ == "__main__":
    seed_if_empty()
