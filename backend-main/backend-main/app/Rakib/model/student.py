from sqlalchemy import Column, Integer, ForeignKey , String, Text, Enum
from sqlalchemy.orm import relationship
from app.core.database import Base



class Student(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    # Core Info
    first_name = Column(String(100))
    last_name = Column(String(100))
    phone = Column(String(20))
    bio = Column(Text)
    batch = Column(Integer, nullable=False)  # e.g., "27"

    # Identity — registration_number uniquely identifies a student (from admission).
    # Set at sign-up (validated against the allowlist) and never changes.
    registration_number = Column(String(30), unique=True, index=True, nullable=True)

    # Extended profile (student-editable in Settings; visible to admin).
    nickname = Column(String(60))
    gender = Column(String(15))
    blood_group = Column(String(5))
    date_of_birth = Column(String(20))       # kept as string (admission data is free-form)
    roll = Column(String(20))                # class roll
    merit_rank = Column(String(15))          # merit of admission (rank)
    school = Column(String(200))
    college = Column(String(200))
    department = Column(String(120), default="Computer Science and Engineering")
    present_address = Column(Text)
    permanent_address = Column(Text)
    hall = Column(String(120))
    personal_email = Column(String(150))     # institutional email lives on User.email
    facebook_url = Column(String(400))
    other_social = Column(String(400))       # any other social handle/link
    guardian_mobile = Column(String(30))
    current_semester = Column(String(10), nullable=True)  # e.g., "3-1" (admin/student editable)
    program = Column(Enum("bsc", "msc", name="student_program"), nullable=False, default="bsc")
    msc_group = Column(Enum("thesis", "project", name="msc_group"), nullable=True)  # only for program="msc"
    # lifecycle: active (studying) | graduated (programme complete, read-only alumni)
    # | dropped (left) | on_leave (year drop / "dead"). Drives whether the student
    # appears in active class lists, dashboards and assignable pools.
    status = Column(String(15), nullable=False, default="active", index=True)
    profile_image = Column(String(255))  # image URL or file path
    

    user = relationship("User", back_populates="student")
    courses = relationship("Course", back_populates="students", secondary="student_courses", cascade="all, delete")
    equipment_orders = relationship("StudentEquipment", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
    missing_classes = relationship("MissingClassOnMonth", back_populates="student", cascade="all, delete-orphan")