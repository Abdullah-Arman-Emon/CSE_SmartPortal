from sqlalchemy import Column, Integer, String, Date, Enum, UniqueConstraint
from app.core.database import Base


# Canonical progression of a B.Sc batch through the department. Ordering is used
# to split a student's/teacher's terms into "past" vs "current" and to promote.
BSC_SEMESTER_ORDER = ["1-1", "1-2", "2-1", "2-2", "3-1", "3-2", "4-1", "4-2"]


def semester_rank(semester: str) -> int:
    """Sortable rank for a "year-term" string. Unknown values sort last."""
    try:
        return BSC_SEMESTER_ORDER.index(semester)
    except ValueError:
        # fall back to numeric parse so MSc / custom terms still order sensibly
        try:
            year, term = semester.split("-")
            return int(year) * 10 + int(term)
        except Exception:
            return 999


class BatchTerm(Base):
    """The timeline spine: one instance of (batch running a semester).

    A batch passes through each semester exactly once, so (batch, semester) is a
    natural unique key. Every time-bound feature — routines, course offerings,
    exams, semester results — hangs off this row via that pair, which lets
    student/teacher history be *derived* rather than duplicated.
    """
    __tablename__ = "batch_terms"

    id = Column(Integer, primary_key=True, index=True)
    batch = Column(Integer, nullable=False, index=True)     # e.g. 27
    semester = Column(String(10), nullable=False)           # "3-1"
    program = Column(Enum("bsc", "msc", name="batch_term_program"),
                     nullable=False, default="bsc")
    year_label = Column(String(20), nullable=True)          # "2024-2025" (display)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    # upcoming (not started) | running (active) | completed (results finalised)
    status = Column(String(15), nullable=False, default="running", index=True)

    __table_args__ = (
        UniqueConstraint("batch", "semester", name="uq_batch_term_batch_semester"),
    )

    @property
    def rank(self) -> int:
        return semester_rank(self.semester)
