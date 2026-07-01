
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base


class AdmissionForm(Base):
    __tablename__ = "admission_form"
    
    id = Column(Integer, primary_key=True, index=True)
    form_given_on =  Column(DateTime, nullable=False)
    # Review workflow: pending | shortlisted | accepted | rejected
    status = Column(String(20), nullable=False, default="pending")
    
    # Personal Information
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    email = Column(String(100), nullable=False)
    date_of_birth = Column(DateTime, nullable=False)
    program = Column(String(255), nullable=False)
    profile_image = Column(String(255), nullable=True)  # File path or URL

    # Academic Background
    highest_qualification = Column(String(255), nullable=False)
    institution_name = Column(String(255), nullable=False)
    field_of_study = Column(String(255), nullable=False)
    graduation_date = Column(DateTime, nullable=False)
    grade_gpa = Column(String(50), nullable=True)

    # Documents (Paths or URLs to uploaded files)
    required_doc = Column(String(255), nullable=True)
    transcript = Column(String(255), nullable=True)
    recommendation_letter = Column(String(255), nullable=True)
    personal_essay = Column(String(255), nullable=True)