from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.core.database import Base


class AllowedEmail(Base):
    """Sign-up allowlist: only these pre-approved emails can register.

    Admin adds CSE DU student/teacher emails from the admin panel; the
    /v1/auth/register endpoint rejects any email not present here.
    """
    __tablename__ = "allowed_emails"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)  # stored lowercase
    role = Column(String(20), nullable=False, default="student")           # student | teacher
    # Students are pre-provisioned by admin with their admission registration
    # number; sign-up must present a matching (email, registration_number) pair.
    registration_number = Column(String(30), index=True, nullable=True)
    full_name = Column(String(150), nullable=True)   # pre-filled onto the profile at sign-up
    batch = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
