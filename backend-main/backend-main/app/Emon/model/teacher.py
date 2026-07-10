from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Core Info
    first_name = Column(String(100))
    last_name = Column(String(100))
    department = Column(String(255))
    phone = Column(String(20))
    work = Column(String(255))  # title or position
    bio = Column(Text)
    profile_image = Column(String(255))  # image URL or file path

    # Profile Links
    website = Column(String(255))
    google_scholar = Column(String(255))
    academia = Column(String(255))
    linkedin = Column(String(255))
    twitter = Column(String(255))
    whatsapp = Column(String(20))
    researchgate = Column(String(255))

    # Relationships
    user = relationship("User", back_populates="teacher", uselist=False)
    courses = relationship("Course", back_populates="teacher", cascade="all, delete")
    schedules = relationship("Schedule", back_populates="teacher", cascade="all, delete")
