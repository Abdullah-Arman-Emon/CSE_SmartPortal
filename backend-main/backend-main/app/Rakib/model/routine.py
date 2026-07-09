from sqlalchemy import Column, Integer, String, Text, Boolean, ForeignKey, DateTime, Date
from datetime import datetime

from app.core.database import Base


class RoutinePeriod(Base):
    """A column of the weekly routine grid (e.g. 8:30-10:00AM). Admin-customizable."""
    __tablename__ = "routine_periods"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(50), nullable=False)          # "8:30-10:00 AM"
    start_time = Column(String(10), nullable=False)     # "08:30" (24h, for sorting/notifications)
    end_time = Column(String(10), nullable=False)       # "10:00"
    display_order = Column(Integer, default=0)


class Routine(Base):
    """One published class routine for a batch+semester (e.g. Batch 27, 4-1)."""
    __tablename__ = "routines"

    id = Column(Integer, primary_key=True, index=True)
    batch = Column(Integer, nullable=False, index=True)
    semester = Column(String(10), nullable=False)        # "4-1"
    title = Column(String(255), nullable=True)           # "4th Year 1st Semester B.Sc 2024-2025"
    room_note = Column(String(100), nullable=True)       # "Room No.: 429"
    class_start_date = Column(String(20), nullable=True) # "22.02.2026" (display only)
    published = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class RoutineSlot(Base):
    """One class entry in a routine cell (day × period). A cell may hold several
    slots (parallel option-course labs, GA/GB groups)."""
    __tablename__ = "routine_slots"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(Integer, ForeignKey("routines.id"), nullable=False, index=True)
    day = Column(String(20), nullable=False)             # "Sunday".."Thursday" (full English name)
    period_id = Column(Integer, ForeignKey("routine_periods.id"), nullable=False)
    course_code = Column(String(50), nullable=True)      # "CSE-4101"
    course_title = Column(String(255), nullable=True)    # "Artificial Intelligence"
    teacher_ids = Column(Text, nullable=True)            # JSON array of Teacher.id (may be empty)
    teacher_initials = Column(String(100), nullable=True)  # display, e.g. "MMK+PR"
    room = Column(String(50), nullable=True)             # "429"
    group_label = Column(String(20), nullable=True)      # "GA"/"GB"/None (whole batch)


class SlotChangeRequest(Base):
    """Teacher-initiated reschedule. type=swap: both teachers must agree (then
    auto-applied). type=move to a free cell: admin must approve."""
    __tablename__ = "slot_change_requests"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("routine_slots.id"), nullable=False, index=True)
    requested_by = Column(Integer, nullable=False)       # Teacher.id of requester
    type = Column(String(10), nullable=False)            # "move" | "swap"
    target_slot_id = Column(Integer, nullable=True)      # swap: the other teacher's slot
    proposed_day = Column(String(20), nullable=True)     # move
    proposed_period_id = Column(Integer, nullable=True)  # move
    proposed_room = Column(String(50), nullable=True)    # move (optional room change)
    reason = Column(Text, nullable=True)
    status = Column(String(20), default="pending", index=True)
    # swap: pending_teacher -> applied/declined ; move: pending_admin -> applied/declined
    decided_by = Column(Integer, nullable=True)          # User.id who accepted/declined
    created_at = Column(DateTime, default=datetime.utcnow)
    decided_at = Column(DateTime, nullable=True)


class AcademicHoliday(Base):
    """Holiday / vacation / exam window. Suppresses the daily class digest and
    shows a banner on routine pages."""
    __tablename__ = "academic_holidays"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    kind = Column(String(20), default="holiday")         # holiday|vacation|exam|pl|incourse
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
