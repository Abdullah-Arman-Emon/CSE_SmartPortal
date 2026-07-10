from sqlalchemy import Column, Integer, String
from app.core.database import Base

class RSVP(Base):
    __tablename__ = "rsvps"

    id = Column(Integer, primary_key=True)
    meeting_id = Column(Integer)
    user_id = Column(Integer)
    response = Column(String(10))  # "Yes" or "No"
