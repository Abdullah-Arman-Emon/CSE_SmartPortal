from sqlalchemy import Column, Integer, ForeignKey , String, Text
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
    profile_image = Column(String(255))  # image URL or file path
    

    user = relationship("User", back_populates="student")
    courses = relationship("Course", back_populates="students", secondary="student_courses", cascade="all, delete")
    equipment_orders = relationship("StudentEquipment", back_populates="student", cascade="all, delete-orphan")
    submissions = relationship("Submission", back_populates="student", cascade="all, delete-orphan")
    missing_classes = relationship("MissingClassOnMonth", back_populates="student", cascade="all, delete-orphan")