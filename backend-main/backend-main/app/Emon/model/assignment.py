from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Table
from app.core.database import Base
from sqlalchemy.orm import relationship
from sqlalchemy import Enum, JSON




class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Integer, primary_key=True)
    title = Column(String(255), nullable=False)  # title of the assignment
    description = Column(String(1000), nullable=True)  # description of the assignment
    max_marks = Column(Integer, nullable=True)  # maximum marks for the assignment - null if not graded
    course_id = Column(Integer, ForeignKey("courses.id"))
    given_date = Column(DateTime, nullable=False)  # date when the assignment was given
    due_date = Column(DateTime, nullable=True)  # due date for homeworks
    type = Column(Enum("Homework", "Resource", name="assignment_type"), nullable=False)  # Enum-like behavior for assignment type
    file_links = Column(JSON, nullable=True)  
    
    submissions = relationship("Submission", back_populates="assignment", cascade="all, delete-orphan")