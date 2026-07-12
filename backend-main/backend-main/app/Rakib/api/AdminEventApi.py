from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List
from datetime import datetime

from app.Rakib.model.event import Event
from app.Rakib.model.student import Student

from app.Rakib.schema.adminEventSchema import EventCreate, EventOut, EventUpdate

router = APIRouter(
    prefix="/admin/events",
    tags=["Admin Events"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()



@router.post("/create", response_model=EventOut)
def create_event(event_data: EventCreate, db: Session = Depends(get_db)):
    data = event_data.model_dump()
    # end_date is optional in the API but NOT NULL in the DB — fall back to
    # start_date for single-point events so creation never 500s.
    if data.get("end_date") is None:
        data["end_date"] = data["start_date"]
    event = Event(**data)
    db.add(event)
    db.commit()
    db.refresh(event)
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


@router.put("/update/{event_id}", response_model=EventOut)
def update_event(event_id: int, update_data: EventUpdate, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    if update_data.name is not None:
        event.name = update_data.name
    if update_data.description is not None:
        event.description = update_data.description
    if update_data.start_date is not None:
        event.start_date = update_data.start_date
    if update_data.end_date is not None:
        event.end_date = update_data.end_date
    if update_data.location is not None:
        event.location = update_data.location
    if update_data.registration_deadline is not None:
        event.registration_deadline = update_data.registration_deadline
    if update_data.image_url is not None:
        event.image_url = update_data.image_url
    if update_data.video_url is not None:
        event.video_url = update_data.video_url
    if update_data.registration_link is not None:
        event.registration_link = update_data.registration_link
        
    db.commit()
    db.refresh(event)

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



@router.delete("/delete/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    db.delete(event)
    db.commit()
    return {"message": "Event deleted successfully"}


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


@router.get("/get/by-id/{event_id}", response_model=EventOut)
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


@router.get("/get/all", response_model=List[EventOut])
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


