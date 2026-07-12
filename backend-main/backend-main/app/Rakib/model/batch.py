from sqlalchemy import Column, Integer, String, Enum
from app.core.database import Base


class Batch(Base):
    """Master lifecycle record for a whole batch (cohort).

    The BatchTerm spine tracks *time* (one row per semester a batch runs). This
    table tracks *lifecycle*: where a batch is right now and whether it is still
    studying, has graduated, or is archived. It is the single source of truth for
    "where is batch 28" instead of inferring it from every student's
    current_semester. New-batch admission and whole-batch graduation are explicit
    events that mutate this row; every other feature reads its status so nothing
    keeps showing a finished batch as active.
    """
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False, unique=True, index=True)  # e.g. 28
    name = Column(String(80), nullable=True)          # display, e.g. "Batch 28 (2022 intake)"
    program = Column(Enum("bsc", "msc", name="batch_program"),
                     nullable=False, default="bsc")
    admission_year = Column(Integer, nullable=True)    # e.g. 2022
    # the semester the (regular) batch is currently in; NULL once graduated
    current_semester = Column(String(10), nullable=True)  # "3-2"
    # active (studying) | graduated (programme complete) | archived (hidden)
    status = Column(String(15), nullable=False, default="active", index=True)
