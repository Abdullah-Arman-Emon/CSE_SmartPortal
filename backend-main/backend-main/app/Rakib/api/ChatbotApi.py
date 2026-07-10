from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.Emon.model.teacher import Teacher
from app.Emon.model.curriculum import CurriculumCourse
from app.Rakib.model.event import Event
from app.Rakib.model.notice import Notice

router = APIRouter(prefix="/v1/chatbot", tags=["Chatbot"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ChatbotQuery(BaseModel):
    intent: str
    query: Optional[str] = None


@router.post("/query")
def chatbot_query(payload: ChatbotQuery, db: Session = Depends(get_db)):
    """Return structured DB context for the frontend chatbot (Chatbot.jsx).

    Response shape is {"intent": ..., "data": [...]} — the frontend renders
    events as {name, start_date} and faculty as {name, designation}; everything
    else is passed to the LLM as JSON context.
    """
    intent = (payload.intent or "").lower()

    if intent in ("faculty", "teachers"):
        teachers = db.query(Teacher).limit(10).all()
        data = [
            {
                "name": f"{t.first_name or ''} {t.last_name or ''}".strip() or "Faculty member",
                "designation": t.work or t.department or "Faculty, CSE, University of Dhaka",
            }
            for t in teachers
        ]
    elif intent in ("courses", "curriculum"):
        courses = (
            db.query(CurriculumCourse)
            .filter(CurriculumCourse.program == "bsc")
            .order_by(CurriculumCourse.course_code)
            .limit(20)
            .all()
        )
        data = [
            {
                "code": c.course_code,
                "title": c.title,
                "credit": c.credit,
                "category": c.category,
                "semester": c.semester,
            }
            for c in courses
        ]
    elif intent == "events":
        events = (
            db.query(Event)
            .filter(Event.start_date >= datetime.now())
            .order_by(Event.start_date.asc())
            .limit(5)
            .all()
        )
        data = [
            {"name": e.name, "start_date": e.start_date.isoformat(), "location": e.location}
            for e in events
        ]
    elif intent in ("admission", "apply"):
        data = [{
            "info": "BSc in CSE admission follows the DU Science Unit admission test. "
                    "Minimum GPA 3.50 in both SSC and HSC (total 8.0) from science background; "
                    "at least 60% in the Physics and Mathematics parts of the test. "
                    "Apply from the Admissions page of this portal.",
        }]
    elif intent in ("about", "alumni"):
        data = [{
            "info": "Department of Computer Science and Engineering, University of Dhaka — "
                    "4-year 150-credit BSc, MSc (thesis/project), MPhil and PhD programs. "
                    "Contact: office@cse.du.ac.bd, +88 09666 911 463 (Ext 7421).",
        }]
    else:
        data = []

    return {"intent": intent, "data": data}
