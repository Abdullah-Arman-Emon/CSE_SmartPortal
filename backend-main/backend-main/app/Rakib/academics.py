"""Central academic computation: DU 4.00 scale, semester GPA, CGPA with retake
dedup. Single source of truth so backend endpoints and the frontend never drift.

Retake rule (confirmed): **latest attempt** wins. Attempts of the "same course"
are matched by catalog code (Course.course_code, e.g. "CSE 4101"); the newest
attempt (highest Result.id) replaces earlier ones in the CGPA. A per-semester
GPA snapshot still reflects whatever was earned *that* term (an early F stays on
that semester's record even after a later retake clears the CGPA).
"""

from app.Rakib.model.batch_term import semester_rank

# DU standard 4.00 scale — keep in sync with the frontend display only.
GRADE_SCALE = [
    (80, "A+", 4.00), (75, "A", 3.75), (70, "A-", 3.50), (65, "B+", 3.25),
    (60, "B", 3.00), (55, "B-", 2.75), (50, "C+", 2.50), (45, "C", 2.25),
    (40, "D", 2.00),
]


def grade_from_marks(marks):
    """Marks -> (grade, grade_point). None-safe. Below 40 = F."""
    if marks is None:
        return None, None
    for threshold, grade, point in GRADE_SCALE:
        if marks >= threshold:
            return grade, point
    return "F", 0.00


def _dedup_key(r: dict):
    """Identity of a course across attempts: prefer catalog code, else the unique
    course passcode (which never dedups — distinct real courses)."""
    return r.get("catalog_code") or f"__uid_{r.get('course_id')}"


def latest_attempts(results: list) -> list:
    """Keep only the newest attempt per course identity (highest result_id)."""
    best = {}
    for r in results:
        k = _dedup_key(r)
        cur = best.get(k)
        if cur is None or (r.get("result_id") or 0) > (cur.get("result_id") or 0):
            best[k] = r
    return list(best.values())


def weighted_gpa(results: list) -> tuple:
    """(gpa, total_credits) credit-weighted over the given results (as-is)."""
    cr = qp = 0.0
    for r in results:
        c = r.get("credit") or 0
        cr += c
        qp += c * (r.get("grade_point") or 0)
    return (qp / cr if cr else 0.0), cr


def compute_cgpa(results: list) -> dict:
    """CGPA over latest attempts. Returns cgpa, attempted/earned credits, hasF."""
    deduped = latest_attempts(results)
    cgpa, attempted = weighted_gpa(deduped)
    earned = sum((r.get("credit") or 0) for r in deduped if r.get("grade") != "F")
    return {
        "cgpa": round(cgpa, 4),
        "attempted_credits": attempted,
        "earned_credits": earned,
        "has_f": any(r.get("grade") == "F" for r in deduped),
    }


def group_by_semester(results: list) -> list:
    """Per-(batch,semester) GPA snapshots, chronological. No cross-term dedup —
    each term shows what was earned that term."""
    buckets = {}
    for r in results:
        key = (r.get("batch"), r.get("semester"))
        buckets.setdefault(key, []).append(r)
    out = []
    for (batch, semester), rows in buckets.items():
        gpa, cr = weighted_gpa(rows)
        out.append({
            "batch": batch,
            "semester": semester,
            "gpa": round(gpa, 4),
            "total_credits": cr,
            "courses": rows,
        })
    out.sort(key=lambda x: (x["batch"] or 0, semester_rank(x["semester"] or "")))
    return out
