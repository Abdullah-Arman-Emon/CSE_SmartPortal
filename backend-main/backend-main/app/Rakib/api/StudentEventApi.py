from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List
from datetime import datetime

from app.Rakib.model.event import Event
from app.Rakib.model.student import Student

from app.Rakib.schema.adminEventSchema import EventOut

router = APIRouter(
    prefix="/student/events",
    tags=["Student Events"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.get("/upcoming", response_model=List[EventOut])
def get_upcoming_events(db: Session = Depends(get_db)):
    now = datetime.now()
    events = db.query(Event).filter(Event.start_date > now).order_by(Event.start_date.asc()).all()
    
    my_events = []
    for event in events:
        my_events.append(
            EventOut(
                id=event.id,
                name=event.name,
                description=event.description,
                start_date=event.start_date,
                end_date=event.end_date,
                location=event.location,
                registration_deadline=event.registration_deadline,
                image_url=event.image_url,
                video_url=event.video_url,
                registration_link=event.registration_link
            )
        )
    return my_events

@router.get("/running", response_model=List[EventOut])
def get_upcoming_events(db: Session = Depends(get_db)):
    now = datetime.now()
    events = db.query(Event).filter(Event.start_date >= now , Event.end_date <= now).order_by(Event.start_date.asc()).all()
    
    my_events = []
    for event in events:
        my_events.append(
            EventOut(
                id=event.id,
                name=event.name,
                description=event.description,
                start_date=event.start_date,
                end_date=event.end_date,
                location=event.location,
                registration_deadline=event.registration_deadline,
                image_url=event.image_url,
                video_url=event.video_url,
                registration_link=event.registration_link
            )
        )
    return my_events


# NOTE: /all must be declared BEFORE /{event_id}, otherwise "all" is parsed as an event id.
@router.get("/all", response_model=List[EventOut])
def get_all_events(db: Session = Depends(get_db)):
    events = db.query(Event).order_by(Event.start_date.asc()).all()

    my_events = []
    for event in events:
        my_events.append(
            EventOut(
                id=event.id,
                name=event.name,
                description=event.description,
                start_date=event.start_date,
                end_date=event.end_date,
                location=event.location,
                registration_deadline=event.registration_deadline,
                image_url=event.image_url,
                video_url=event.video_url,
                registration_link=event.registration_link
            )
        )
    return my_events


@router.get("/{event_id}", response_model=EventOut)
def get_specific_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return EventOut(
        id=event.id,
        name=event.name,
        description=event.description,
        start_date=event.start_date,
        end_date=event.end_date,
        location=event.location,
        registration_deadline=event.registration_deadline,
        image_url=event.image_url,
        video_url=event.video_url,
        registration_link=event.registration_link
    )
