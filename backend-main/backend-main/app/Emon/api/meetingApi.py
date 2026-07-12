from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.Emon.model.userModel import User
from app.Emon.model.meeting import Meeting
from app.Emon.model.rsvp import RSVP
from app.Emon.schema.meeting import MeetingCreate, MeetingResponse, RSVPRequest
from datetime import datetime
from app.Emon.model.teacher import Teacher
from typing import List
# from app.Faiak.api.UtilityApi import create_google_meet_event

router = APIRouter(prefix="/v1/meetings", tags=["Meetings"])


@router.post("/create", response_model=MeetingResponse)
def create_meeting(data: MeetingCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == data.created_by).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can create meetings")
    
    # if data.meeting_url is None:
    #     data.meeting_url = create_google_meet_event(title=data.title, start_time=data.date_time)
    
    if not data.meeting_url:
        raise HTTPException(status_code=400, detail="A meeting link (URL) is required.")
    
    print(f"meeting url : {data.meeting_url}")

    meeting = Meeting(**data.model_dump())
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@router.delete("/delete/{meeting_id}", response_model=dict)
def delete_meeting(meeting_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    # Verify user is admin
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can delete meetings")

    # Find meeting
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    # Delete meeting
    db.delete(meeting)
    db.commit()
    
    return {"message": "Meeting deleted successfully"}



@router.get("/upcoming", response_model=list[MeetingResponse])
def upcoming_meetings(user_id: int = Query(None), db: Session = Depends(get_db)):
    meetings = db.query(Meeting).filter(Meeting.date_time >= datetime.now()).order_by(Meeting.date_time.asc()).all()

    # meeting_url is only for teachers/admins — guests (and unknown user_ids)
    # get the schedule without the join link.
    privileged = False
    if user_id is not None:
        user = db.query(User).filter(User.id == user_id).first()
        privileged = bool(user and user.role in ("teacher", "admin"))

    if privileged:
        return meetings

    return [
        MeetingResponse(
            id=m.id,
            title=m.title,
            date_time=m.date_time,
            meeting_url=None,
            created_by=m.created_by,
            is_archived=m.is_archived,
        )
        for m in meetings
    ]


@router.post("/rsvp")
def submit_rsvp(rsvp: RSVPRequest, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == rsvp.meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    user = db.query(User).filter(User.id == rsvp.user_id).first()
    if not user or user.role != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can RSVP")

    existing = db.query(RSVP).filter(
        RSVP.meeting_id == rsvp.meeting_id,
        RSVP.user_id == rsvp.user_id
    ).first()

    if existing:
        existing.response = rsvp.response
    else:
        db.add(RSVP(**rsvp.model_dump()))

    db.commit()

    if rsvp.response.lower() == "yes":
        return {
            "message": "RSVP submitted",
            "meeting_url": meeting.meeting_url
        }
    else:
        return {"message": "RSVP submitted"}
    

@router.get("/{meeting_id}/accepted", response_model=List[dict])
def get_accepted_teachers(meeting_id: int, db: Session = Depends(get_db)):
    meeting = db.query(Meeting).filter(Meeting.id == meeting_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")

    accepted = (
        db.query(Teacher)
        .join(User, Teacher.user_id == User.id)
        .join(RSVP, RSVP.user_id == User.id)
        .filter(RSVP.meeting_id == meeting_id, RSVP.response.ilike("yes"))
        .all()
    )

    return [
        {
            "id": t.id,
            "first_name": t.first_name,
            "last_name": t.last_name,
            "email": t.user.email,
            "department": t.department,
            "work": t.work,
            "profile_image": t.profile_image
        }
        for t in accepted
    ]

@router.get("/rsvp-status/{user_id}", response_model=List[dict])
def get_rsvp_status(user_id: int, db: Session = Depends(get_db)):
    rsvps = db.query(RSVP).filter(RSVP.user_id == user_id).all()
    return [{"meeting_id": r.meeting_id, "response": r.response} for r in rsvps]
