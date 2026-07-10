from sqlalchemy import Column, Integer, String, Text, Float, Boolean, ForeignKey, DateTime
from datetime import datetime

from app.core.database import Base


class Person(Base):
    """Public /people directory entry (faculty / officer / staff), admin-managed."""
    __tablename__ = "site_people"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    role = Column(String(255), nullable=True)          # Professor / Associate Professor / ...
    category = Column(String(50), default="Faculty")    # Faculty / Officer / Staff
    expertise = Column(Text, nullable=True)             # JSON array string
    email = Column(String(255), nullable=True)
    phone = Column(String(100), nullable=True)
    office = Column(String(255), nullable=True)
    office_hours = Column(String(255), nullable=True)
    image_url = Column(String(500), nullable=True)
    bio = Column(Text, nullable=True)
    status = Column(String(100), nullable=True)         # e.g. "On Leave"
    publications = Column(Text, nullable=True)          # JSON array of {title, year, link}
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class SiteContent(Base):
    """Key-value store for page copy (chairman/about texts, contact, stats, campus life)."""
    __tablename__ = "site_content"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, index=True, nullable=False)
    value = Column(Text, nullable=True)                 # plain text or JSON string
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AdmissionProgram(Base):
    """Program card + details shown on /admission-hub and /program/:id."""
    __tablename__ = "admission_programs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    level = Column(String(50), nullable=False)          # Bachelor / Masters / Doctorate
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    credits = Column(String(50), nullable=True)
    duration = Column(String(100), nullable=True)
    students_enrolled = Column(String(50), nullable=True)
    application_deadline = Column(String(100), nullable=True)
    tuition_fee = Column(String(100), nullable=True)
    admission_requirements = Column(Text, nullable=True)  # JSON array string
    career_prospects = Column(Text, nullable=True)        # JSON array string
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)


class ProgramCourse(Base):
    """Course catalog entry under an admission program, with optional week-by-week syllabus."""
    __tablename__ = "program_courses"

    id = Column(Integer, primary_key=True, index=True)
    program_id = Column(Integer, ForeignKey("admission_programs.id"), nullable=False, index=True)
    code = Column(String(50), nullable=True)
    title = Column(String(255), nullable=False)
    semester = Column(String(100), nullable=True)       # e.g. "Fall 2025"
    year = Column(Integer, nullable=True)
    credits = Column(Float, nullable=True)
    description = Column(Text, nullable=True)
    image_url = Column(String(500), nullable=True)
    instructor = Column(String(255), nullable=True)
    syllabus_weeks = Column(Text, nullable=True)        # JSON array of {number, topic, date, description}


class GalleryImage(Base):
    """Homepage gallery carousel image, admin-managed."""
    __tablename__ = "gallery_images"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String(500), nullable=False)
    caption = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
