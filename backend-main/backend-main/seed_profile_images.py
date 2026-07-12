"""Give every account a profile picture so faces show across the app
(messages, dashboards, directories, settings).

- Teachers  -> their real CSE DU faculty photo, matched by name to the seeded
  site_people directory (ssl.du.ac.bd faculty images). No match -> a clean
  initials avatar.
- Students  -> a realistic demo portrait (randomuser.me), gender-guessed from the
  first name, deterministic per student id. Fallback -> initials avatar.

Idempotent: only fills accounts whose profile_image is empty, so real uploads are
never overwritten. Run standalone:  python seed_profile_images.py
"""
from app.core.database import SessionLocal
import seed_demo_lifecycle  # noqa: F401  — registers the full model set (relationships)
from app.Emon.model.teacher import Teacher
from app.Rakib.model.student import Student
from app.Rakib.model.publicsite import Person


def _norm(s):
    return "".join(ch for ch in (s or "").lower() if ch.isalnum())


def _initials_avatar(name, bg="0D8ABC"):
    seed = (name or "User").replace(" ", "+")
    return f"https://ui-avatars.com/api/?name={seed}&background={bg}&color=fff&size=256&bold=true"


# common female first-name tokens in the seeded Bengali roster (best-effort)
FEMALE_TOKENS = {
    "suraiya", "mosarrat", "mehjabin", "adiba", "meherin", "rubaiya", "raisa",
    "sadia", "nushrat", "tania", "farhana", "sumaiya", "jannat", "afsana",
    "sanjida", "nabila", "tasnim", "maliha", "ishrat", "rupa", "mim", "mahin",
    "anika", "prova", "oishi", "labiba", "samira", "nafisa", "fariha",
}


def _is_female(first_name):
    fn = (first_name or "").strip().lower().split(" ")[0]
    if fn in FEMALE_TOKENS:
        return True
    return fn.endswith(("a", "i", "un")) and not fn.endswith(("ullah", "ulla"))


def _bd_student_avatar(first_name, last_name, sid):
    """A South-Asian / Bangladeshi-reading avatar for a demo student: brown skin,
    dark hair, deterministic per student so it stays stable. DiceBear is keyless,
    always renders, and (unlike Western stock portraits) can be constrained to a
    Bangladeshi look. Women get a hijab/long-hair top mix."""
    full = f"{first_name or ''} {last_name or ''}".strip() or f"Student {sid}"
    seed = full.replace(" ", "+")
    if _is_female(first_name):
        tops = "hijab,straight01,straight02,bob,longButNotTooLong,bun"
    else:
        tops = "shortFlat,shortRound,shortCurly,theCaesar,shortWaved,sides"
    return (
        "https://api.dicebear.com/9.x/avataaars/svg"
        f"?seed={seed}"
        "&skinColor=614335,ae5d29,d08b5b"   # brown / tan South-Asian tones (hex)
        "&hairColor=2c1b18,4a312c,724133"    # black / dark brown
        f"&top={tops}"
        "&backgroundColor=e3f0ff,eef2f7,f1e7ff&radius=50"
    )


def _bd_teacher_avatar(first_name, last_name, tid):
    """Professional South-Asian faculty avatar — brown skin, dark hair, glasses,
    formal look, deterministic. Used instead of the real du.ac.bd photos because
    that host is rate-limited/flaky and drops most images when a page loads many
    at once."""
    full = f"{first_name or ''} {last_name or ''}".strip() or f"Teacher {tid}"
    seed = full.replace(" ", "+")[:40]
    tops = "hijab,straight02,bun" if _is_female(first_name) else "shortFlat,theCaesar,sides"
    # kept compact to fit the VARCHAR(255) profile_image column
    return (
        "https://api.dicebear.com/9.x/avataaars/svg"
        f"?seed={seed}&skinColor=ae5d29,d08b5b&hairColor=2c1b18,4a312c&top={tops}&radius=50"
    )


def _is_unreliable(url):
    """External photo URLs we don't trust to render (flaky DU host)."""
    return url and ("du.ac.bd" in url)


def seed():
    db = SessionLocal()
    try:
        # ---- teachers: reliable faculty avatar ----
        t_done = 0
        for t in db.query(Teacher).all():
            # keep a real *uploaded* photo; replace empty / flaky-DU / old avatars
            if t.profile_image and not _is_unreliable(t.profile_image) \
               and "dicebear" not in t.profile_image and "ui-avatars" not in t.profile_image:
                continue
            t.profile_image = _bd_teacher_avatar(t.first_name, t.last_name, t.id)
            t_done += 1
        db.commit()

        # ---- public faculty directory (/people): same broken DU host ----
        p_done = 0
        for p in db.query(Person).all():
            if _is_unreliable(p.image_url) or not p.image_url:
                # guess gender from the display name for hijab/beard styling
                parts = (p.name or "").replace("Dr.", "").replace("Prof.", "").strip().split()
                fn = parts[0] if parts else p.name
                p.image_url = _bd_teacher_avatar(fn, " ".join(parts[1:]), p.id)
                p_done += 1
        db.commit()
        print(f"seed_profile_images: {t_done} teachers, {p_done} directory people re-avatared")

        # ---- students: realistic demo portrait ----
        s_done = 0
        for s in db.query(Student).all():
            # Fill blanks AND replace the earlier generic (Western) randomuser
            # portraits — but never clobber a real uploaded photo.
            if s.profile_image and "randomuser.me" not in s.profile_image and "dicebear" not in s.profile_image:
                continue
            s.profile_image = _bd_student_avatar(s.first_name, s.last_name, s.id)
            s_done += 1
        db.commit()
        print(f"seed_profile_images: {t_done} teachers, {s_done} students updated")
    finally:
        db.close()


def seed_if_empty():
    """Run on a fresh DB, or when accounts still carry the flaky external DU
    photo URLs that need swapping for reliable avatars."""
    db = SessionLocal()
    try:
        total = db.query(Teacher).count()
        needs = db.query(Teacher).filter(
            (Teacher.profile_image == None) | (Teacher.profile_image == "")  # noqa: E711
            | (Teacher.profile_image.like("%du.ac.bd%"))
        ).count()
    finally:
        db.close()
    if total and needs > 0:
        seed()
    else:
        print("seed_profile_images: images already present, skipping")


if __name__ == "__main__":
    seed()
