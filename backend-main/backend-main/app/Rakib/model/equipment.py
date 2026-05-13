
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.core.database import Base



# Association table with extra attributes
class StudentEquipment(Base):
    
    __tablename__ = "student_equipments"
    
    id = Column(Integer, primary_key=True)
    student_id = Column(Integer, ForeignKey("students.id"))
    equipment_id = Column(Integer, ForeignKey("equipments.id"))
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    quantity = Column(Integer, nullable=False)
    returned = Column(Boolean, default=False)

    student = relationship("Student", back_populates="equipment_orders")
    equipment = relationship("Equipment", back_populates="student_orders")


class Equipment(Base):
    __tablename__ = "equipments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    quantity_available = Column(Integer, default=1)
    image_url = Column(String(255), nullable=True)  # URL or file path for the equipment image
    
    student_orders = relationship("StudentEquipment", back_populates="equipment", cascade="all, delete-orphan")
    
    

