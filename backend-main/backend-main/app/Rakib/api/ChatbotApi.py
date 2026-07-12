import os
import json
import urllib.request
import urllib.error
from datetime import datetime
from typing import Optional, List

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


# Server-side owner key — kept in backend env ONLY (never shipped to the browser).
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

CSEDU_FACTS = (
    "Department of Computer Science & Engineering (CSEDU), University of Dhaka. Established 1992 "
    "(DU founded 1921). Programs: 4-year BSc Honours (150 credits, 8 semesters, min CGPA 2.00, no 'F'), "
    "MSc (1.5 yr, 36 credits; thesis 18+18 or project 30+6, min CGPA 2.50), MPhil (2 yr: coursework "
    "2x100 or 4x50 mark theory + viva), PhD (4 yr FT/5 yr PT: 3 theory courses + viva, thesis after 2 yr; "
    "codes mirror MPhil). Admission: DU Science-unit exam, merit-based; min GPA 3.50 each in SSC & HSC "
    "(Science), total >= 8.0. Contact: office@cse.du.ac.bd, +88 09666 911 463 (Ext 7421). Alumni: cseduaa.org."
)


def _static_fallback() -> str:
    return (
        "Here's what I can share:\n\n"
        "• CSEDU offers a 4-year BSc (Honours), MSc, MPhil and PhD in Computer Science & Engineering.\n"
        "• Admission is merit-based through the University of Dhaka Science-unit exam.\n"
        "• Browse the Curriculum and Admission Hub pages, or use Apply to start an application.\n\n"
        "For exact fees and dates, please contact the department office (office@cse.du.ac.bd)."
    )


def _build_grounding(db: Session) -> str:
    parts = []
    try:
        courses = (
            db.query(CurriculumCourse)
            .order_by(CurriculumCourse.course_code)
            .all()
        )
        if courses:
            parts.append(
                "Curriculum courses:\n"
                + "\n".join(
                    f"- {c.course_code}: {c.title} ({c.credit} cr, {c.category}"
                    + (f", sem {c.semester}" if c.semester else "")
                    + ")"
                    for c in courses[:120]
                )
            )
    except Exception:
        pass
    try:
        teachers = db.query(Teacher).limit(30).all()
        if teachers:
            parts.append(
                "Faculty:\n"
                + "\n".join(
                    f"- {(t.first_name or '')} {(t.last_name or '')}".strip()
                    + (f" — {t.work}" if t.work else "")
                    for t in teachers
                )
            )
    except Exception:
        pass
    try:
        events = (
            db.query(Event)
            .filter(Event.start_date >= datetime.now())
            .order_by(Event.start_date.asc())
            .limit(5)
            .all()
        )
        if events:
            parts.append(
                "Upcoming events:\n"
                + "\n".join(f"- {e.name} ({e.start_date.date()})" for e in events)
            )
    except Exception:
        pass
    try:
        notices = db.query(Notice).order_by(Notice.id.desc()).limit(5).all()
        if notices:
            parts.append(
                "Recent notices:\n" + "\n".join(f"- {n.title}" for n in notices if getattr(n, "title", None))
            )
    except Exception:
        pass
    return "\n\n".join(parts)


class ChatMessage(BaseModel):
    role: str  # "user" | "model"
    text: str


class AskPayload(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = None


@router.post("/ask")
def chatbot_ask(payload: AskPayload, db: Session = Depends(get_db)):
    """World-class CSEDU assistant. Calls Gemini server-side with the owner key
    (never exposed to the client) and grounds answers in live DB data."""
    message = (payload.message or "").strip()
    if not message:
        return {"reply": "Please type a question about CSEDU.", "grounded": False}
    if not GEMINI_API_KEY:
        return {"reply": _static_fallback(), "grounded": False}

    grounding = _build_grounding(db)
    system_text = (
        "You are the official CSEDU Assistant for the Department of Computer Science & Engineering, "
        "University of Dhaka. Answer warmly, accurately and concisely (2-5 short paragraphs or bullets "
        "with '•'). Avoid heavy markdown. For exact fees/deadlines/contacts, advise contacting the "
        "department office. Never invent faculty names or figures not given below.\n\n"
        f"Authoritative facts:\n{CSEDU_FACTS}\n\n"
        + (f"Live portal data (prefer for specifics):\n{grounding}" if grounding else "")
    )

    contents = []
    for m in (payload.history or [])[-8:]:
        role = "user" if m.role == "user" else "model"
        contents.append({"role": role, "parts": [{"text": m.text}]})
    contents.append({"role": "user", "parts": [{"text": message}]})

    body = {
        "system_instruction": {"parts": [{"text": system_text}]},
        "contents": contents,
        "generationConfig": {"temperature": 0.4, "maxOutputTokens": 900, "topP": 0.9},
    }
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                # Newer Gemini "auth keys" (AQ.*) work via this header.
                "x-goog-api-key": GEMINI_API_KEY,
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=25) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        return {"reply": text, "grounded": bool(grounding)}
    except Exception as e:
        print(f"[chatbot_ask] Gemini call failed: {e}")
        return {"reply": _static_fallback(), "grounded": False}


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
