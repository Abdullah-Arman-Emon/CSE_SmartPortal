from sqlalchemy import Column, Integer, String
from app.core.database import Base

class ResearchPaper(Base):
    __tablename__ = "research_papers"

    id = Column(Integer, primary_key=True)
    teacher_id = Column(Integer)
    paper_link = Column(String(255))
