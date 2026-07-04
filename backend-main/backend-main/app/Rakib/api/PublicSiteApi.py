import json
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.Emon.model.userModel import User
from app.Rakib.model.publicsite import (
    Person, SiteContent, AdmissionProgram, ProgramCourse, GalleryImage,
)
from app.Rakib.schema.PublicSiteSchema import (
    PersonIn, PersonUpdate, ContentUpsert,
    ProgramIn, ProgramUpdate, ProgramCourseIn, ProgramCourseUpdate,
    GalleryIn, GalleryUpdate,
)

guest_router = APIRouter(prefix="/guest/site", tags=["Public Site"])
admin_router = APIRouter(prefix="/admin/site", tags=["Admin Site Content"])


def require_admin(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can manage site content")
    return user


def _loads(raw, default):
    if not raw:
        return default
    try:
        return json.loads(raw)
    except (ValueError, TypeError):
        return default


def _dumps(value):
    return json.dumps(value, ensure_ascii=False) if value is not None else None


def _person_out(p: Person):
    return {
        "id": p.id, "name": p.name, "role": p.role, "category": p.category,
        "expertise": _loads(p.expertise, []), "email": p.email, "phone": p.phone,
        "office": p.office, "officeHours": p.office_hours, "image": p.image_url,
        "bio": p.bio, "status": p.status,
        "publications": _loads(p.publications, []),
        "display_order": p.display_order, "is_active": p.is_active,
    }


def _program_out(p: AdmissionProgram):
    return {
        "id": p.id, "title": p.title, "level": p.level, "description": p.description,
        "imageUrl": p.image_url, "credits": p.credits, "duration": p.duration,
        "studentsEnrolled": p.students_enrolled, "applicationDeadline": p.application_deadline,
        "tuitionFee": p.tuition_fee,
        "admissionRequirements": _loads(p.admission_requirements, []),
        "careerProspects": _loads(p.career_prospects, []),
        "display_order": p.display_order, "is_active": p.is_active,
    }


def _course_out(c: ProgramCourse):
    return {
        "id": c.id, "program_id": c.program_id, "code": c.code, "title": c.title,
        "semester": c.semester, "year": c.year, "credits": c.credits,
        "description": c.description, "imageUrl": c.image_url,
        "instructor": c.instructor, "weeks": _loads(c.syllabus_weeks, []),
    }


def _gallery_out(g: GalleryImage):
    return {
        "id": g.id, "image_url": g.image_url, "caption": g.caption,
        "display_order": g.display_order, "is_active": g.is_active,
    }


# ---------------------------------------------------------------- public reads

@guest_router.get("/people")
def list_people(include_inactive: bool = False, db: Session = Depends(get_db)):
    q = db.query(Person)
    if not include_inactive:
        q = q.filter(Person.is_active == True)
    rows = q.order_by(Person.display_order, Person.id).all()
    return [_person_out(p) for p in rows]


@guest_router.get("/content")
def get_content(keys: Optional[str] = Query(None), db: Session = Depends(get_db)):
    q = db.query(SiteContent)
    if keys:
        q = q.filter(SiteContent.key.in_([k.strip() for k in keys.split(",") if k.strip()]))
    return {row.key: row.value for row in q.all()}


@guest_router.get("/programs")
def list_programs(include_inactive: bool = False, db: Session = Depends(get_db)):
    q = db.query(AdmissionProgram)
    if not include_inactive:
        q = q.filter(AdmissionProgram.is_active == True)
    rows = q.order_by(AdmissionProgram.display_order, AdmissionProgram.id).all()
    return [_program_out(p) for p in rows]


@guest_router.get("/programs/{program_id}")
def get_program(program_id: int, db: Session = Depends(get_db)):
    row = db.query(AdmissionProgram).filter(AdmissionProgram.id == program_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    return _program_out(row)


@guest_router.get("/programs/{program_id}/courses")
def list_program_courses(program_id: int, db: Session = Depends(get_db)):
    rows = (
        db.query(ProgramCourse)
        .filter(ProgramCourse.program_id == program_id)
        .order_by(ProgramCourse.year, ProgramCourse.id)
        .all()
    )
    return [_course_out(c) for c in rows]


@guest_router.get("/courses/{course_id}")
def get_program_course(course_id: int, db: Session = Depends(get_db)):
    row = db.query(ProgramCourse).filter(ProgramCourse.id == course_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    return _course_out(row)


@guest_router.get("/gallery")
def list_gallery(include_inactive: bool = False, db: Session = Depends(get_db)):
    q = db.query(GalleryImage)
    if not include_inactive:
        q = q.filter(GalleryImage.is_active == True)
    rows = q.order_by(GalleryImage.display_order, GalleryImage.id).all()
    return [_gallery_out(g) for g in rows]


# ---------------------------------------------------------------- admin: people

@admin_router.post("/people")
def create_person(data: PersonIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    payload = data.model_dump()
    payload["expertise"] = _dumps(payload.get("expertise"))
    payload["publications"] = _dumps(payload.get("publications"))
    row = Person(**payload)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _person_out(row)


@admin_router.put("/people/{person_id}")
def update_person(person_id: int, data: PersonUpdate, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(Person).filter(Person.id == person_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Person not found")
    updates = data.model_dump(exclude_unset=True)
    for jf in ("expertise", "publications"):
        if jf in updates:
            updates[jf] = _dumps(updates[jf])
    for k, v in updates.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _person_out(row)


@admin_router.delete("/people/{person_id}")
def delete_person(person_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(Person).filter(Person.id == person_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Person not found")
    db.delete(row)
    db.commit()
    return {"message": "Person deleted"}


# ---------------------------------------------------------------- admin: content

@admin_router.put("/content/{key}")
def upsert_content(key: str, data: ContentUpsert, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(SiteContent).filter(SiteContent.key == key).first()
    if row:
        row.value = data.value
    else:
        row = SiteContent(key=key, value=data.value)
        db.add(row)
    db.commit()
    return {"key": key, "value": data.value}


# ---------------------------------------------------------------- admin: programs

@admin_router.post("/programs")
def create_program(data: ProgramIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    payload = data.model_dump()
    payload["admission_requirements"] = _dumps(payload.get("admission_requirements"))
    payload["career_prospects"] = _dumps(payload.get("career_prospects"))
    row = AdmissionProgram(**payload)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _program_out(row)


@admin_router.put("/programs/{program_id}")
def update_program(program_id: int, data: ProgramUpdate, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(AdmissionProgram).filter(AdmissionProgram.id == program_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    updates = data.model_dump(exclude_unset=True)
    for jf in ("admission_requirements", "career_prospects"):
        if jf in updates:
            updates[jf] = _dumps(updates[jf])
    for k, v in updates.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _program_out(row)


@admin_router.delete("/programs/{program_id}")
def delete_program(program_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(AdmissionProgram).filter(AdmissionProgram.id == program_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Program not found")
    db.query(ProgramCourse).filter(ProgramCourse.program_id == program_id).delete()
    db.delete(row)
    db.commit()
    return {"message": "Program and its courses deleted"}


# ---------------------------------------------------------------- admin: program courses

@admin_router.post("/courses")
def create_course(data: ProgramCourseIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    program = db.query(AdmissionProgram).filter(AdmissionProgram.id == data.program_id).first()
    if not program:
        raise HTTPException(status_code=404, detail="Program not found")
    payload = data.model_dump()
    weeks = payload.pop("syllabus_weeks", None)
    payload["syllabus_weeks"] = _dumps([w for w in weeks] if weeks is not None else None)
    row = ProgramCourse(**payload)
    db.add(row)
    db.commit()
    db.refresh(row)
    return _course_out(row)


@admin_router.put("/courses/{course_id}")
def update_course(course_id: int, data: ProgramCourseUpdate, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(ProgramCourse).filter(ProgramCourse.id == course_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    updates = data.model_dump(exclude_unset=True)
    if "syllabus_weeks" in updates:
        updates["syllabus_weeks"] = _dumps(updates["syllabus_weeks"])
    for k, v in updates.items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _course_out(row)


@admin_router.delete("/courses/{course_id}")
def delete_course(course_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(ProgramCourse).filter(ProgramCourse.id == course_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Course not found")
    db.delete(row)
    db.commit()
    return {"message": "Course deleted"}


# ---------------------------------------------------------------- admin: gallery

@admin_router.post("/gallery")
def create_gallery_image(data: GalleryIn, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = GalleryImage(**data.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return _gallery_out(row)


@admin_router.put("/gallery/{image_id}")
def update_gallery_image(image_id: int, data: GalleryUpdate, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(GalleryImage).filter(GalleryImage.id == image_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Image not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(row, k, v)
    db.commit()
    db.refresh(row)
    return _gallery_out(row)


@admin_router.delete("/gallery/{image_id}")
def delete_gallery_image(image_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(GalleryImage).filter(GalleryImage.id == image_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Image not found")
    db.delete(row)
    db.commit()
    return {"message": "Image deleted"}
