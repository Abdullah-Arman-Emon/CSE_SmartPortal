from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base
from datetime import datetime


# admin needs to insert this field
class MissingClassOnMonth(Base):
    
    __tablename__ = "missing_classes_on_month"
    
    id = Column(Integer, primary_key=True, index=True)
    percentage = Column(Integer, nullable=False)  # e.g., 20 for 20%
    month = Column(String(20), nullable=False)  # e.g., "January"
    year = Column(Integer, nullable=False)  # e.g., 2023
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    
    student = relationship("Student", back_populates="missing_classes")
    
    