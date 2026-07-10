from sqlalchemy import Column, Integer, String, Boolean, Float, Enum
from app.core.database import Base


class CurriculumCourse(Base):
    """Official DU CSE curriculum catalog (BSc seeded from du.ac.bd; MSc admin-entered)."""
    __tablename__ = "curriculum_courses"

    id = Column(Integer, primary_key=True, index=True)
    program = Column(Enum("bsc", "msc", name="curriculum_program"), nullable=False, default="bsc")
    course_code = Column(String(20), nullable=False, unique=True, index=True)  # e.g., "CSE 1101"
    title = Column(String(255), nullable=False)
    credit = Column(Float, nullable=False)  # fractional: 0.75 / 1.0 / 1.5 / 2.0 / 3.0 / 4.0
    category = Column(
        Enum("general", "core", "elective1", "elective2", "elective3", "project",
             name="curriculum_category"),
        nullable=False, default="core",
    )
    # stored, not derived from the code: CSE 4100/4110/4210 end even but are not labs
    is_lab = Column(Boolean, nullable=False, default=False)
    year = Column(Integer, nullable=True)         # 1..4 for BSc; NULL for MSc (open credit)
    semester_no = Column(Integer, nullable=True)  # 1..2 for BSc; NULL for MSc

    @property
    def semester(self):
        if self.year and self.semester_no:
            return f"{self.year}-{self.semester_no}"
        return None
