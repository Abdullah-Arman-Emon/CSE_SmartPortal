from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.database import SessionLocal
from passlib.context import CryptContext
from fastapi import Query
from app.core.jwt_utils import create_access_token
from app.core.auth import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt


from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Emon.model.allowedEmail import AllowedEmail
from app.Rakib.model.student import Student
from sqlalchemy import func
from pydantic import BaseModel
from typing import List, Optional


from app.Emon.schema.userSchema import UserCreate, UserLogin, UserResponse, UserPasswordChange
from app.Rakib.schema.studentSchema import StudentSchema


router = APIRouter(prefix="/v1/auth", tags=["Auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/password_change", response_model=dict)
def change_password(user_req: UserPasswordChange, db: Session = Depends(get_db)):
    
    print(f"email {user_req.email} oldpass {user_req.old_pass} newpass : {user_req.new_pass}")
    
    db_user = db.query(User).filter(User.email == user_req.email).first()
    
    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email")

    if not pwd_context.verify(user_req.old_pass, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid password")
    
    if user_req.new_pass is not None:
        hashed_password = pwd_context.hash(user_req.new_pass[:72])
        db_user.hashed_password = hashed_password
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return {"message" : "password change successful" }
    


@router.post("/register", response_model=UserResponse)
def register(user: UserCreate, db: Session = Depends(get_db)):

    print("Registering user:", user.email, "with role:", user.role)

    email_norm = user.email.strip().lower()
    user.role = user.role.lower()

    if db.query(User).filter(func.lower(User.email) == email_norm).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Sign-up is restricted to pre-approved CSE DU students/teachers.
    # Admin accounts are never created from public sign-up.
    if user.role not in ("student", "teacher"):
        raise HTTPException(status_code=403, detail="Only student and teacher accounts can sign up")
    allowed = db.query(AllowedEmail).filter(AllowedEmail.email == email_norm).first()
    if not allowed:
        raise HTTPException(
            status_code=403,
            detail="This email is not approved for sign-up. Only pre-approved CSE DU "
                   "students and teachers can register — contact the department admin.",
        )
    if allowed.role and allowed.role != user.role:
        raise HTTPException(
            status_code=400,
            detail=f"This email is approved as a {allowed.role} — please select the '{allowed.role}' role.",
        )

    # Students must present the registration number the admin pre-approved for
    # this email — this is what uniquely identifies the student.
    if user.role == "student":
        given_reg = (user.registration_number or "").strip()
        if not given_reg:
            raise HTTPException(status_code=400, detail="Registration number is required.")
        approved_reg = (allowed.registration_number or "").strip()
        if not approved_reg:
            raise HTTPException(
                status_code=403,
                detail="No registration number is on record for this email — contact the department admin.",
            )
        # tolerant compare: ignore dashes/spaces/case ("2022-715-876" == "2022715876")
        norm = lambda s: s.replace("-", "").replace(" ", "").lower()
        if norm(given_reg) != norm(approved_reg):
            raise HTTPException(
                status_code=400,
                detail="The registration number does not match our records for this email.",
            )
        # a registration number can only ever back one account
        if db.query(Student).filter(Student.registration_number == approved_reg).first():
            raise HTTPException(status_code=400, detail="This registration number is already registered.")

    hashed_password = pwd_context.hash(user.password[:72])

    new_user = User(
        email=email_norm,
        hashed_password=hashed_password,
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)


    if new_user.role == "teacher":
        teacher = Teacher(
            user_id=new_user.id,
        )
        db.add(teacher)
        db.commit()
    elif new_user.role == "student":
        # Pre-fill identity from the admin-provisioned allowlist entry.
        first_name = last_name = None
        if allowed.full_name:
            parts = allowed.full_name.strip().split()
            first_name = parts[0] if parts else None
            last_name = " ".join(parts[1:]) if len(parts) > 1 else None
        student = Student(
            user_id=new_user.id,
            batch=user.batch or allowed.batch or 0,
            registration_number=(allowed.registration_number or "").strip() or None,
            first_name=first_name,
            last_name=last_name,
        )
        db.add(student)
        db.commit()
    elif new_user.role == "admin":
        # HTTPException(status_code=400, detail="Admin role is not allowed for registration")
        pass

    return UserResponse(
        id=new_user.id,
        email=new_user.email,
        role=new_user.role 
    )


# @router.post("/login", response_model=UserResponse)
# def login(user: UserLogin, db: Session = Depends(get_db)):
    
#     print("Logging in user:", user.email)
    
#     db_user = db.query(User).filter(User.email == user.email).first()

#     if not db_user:
#         raise HTTPException(status_code=400, detail="Invalid email")

#     if not pwd_context.verify(user.password, db_user.hashed_password):
#         raise HTTPException(status_code=400, detail="Invalid password")

#     return UserResponse(
#         id=db_user.id,
#         email=db_user.email,
#         role=db_user.role  
#     )


from jose import jwt

@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    
    if not db_user or not pwd_context.verify(user.password, db_user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if db_user.is_active is False:
        raise HTTPException(status_code=403, detail="Account is deactivated. Contact the admin.")

    # ✅ Encode email & role in token
    payload = {
        "user_id": db_user.id,
        "email": db_user.email,
        "role": db_user.role,
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "id": db_user.id,
        "email": db_user.email,
        "role": db_user.role,
        "access_token": token  # send this to frontend
    }

    
    
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


security = HTTPBearer()

@router.get("/get/user/from-token", response_model=UserResponse)
def get_current_user_from_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials  # Automatically extracts token from header

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        email = payload.get("email")
        role = payload.get("role")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    return UserResponse(
        id=user_id,
        email=email,
        role=role
    )
    

    
@router.get("/get/student")
def get_student_using_userId(user_id:int = Query(...), db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.id == user_id).first()
    
    print(f"user : {user}")
    
    if not user:
        raise HTTPException(status_code=400, detail="not a valid user id")
    
    student = db.query(Student).filter(Student.user_id == user.id).first()
    
    print(f"student : {student}")

    if not student:
        raise HTTPException(status_code=404, detail="Student record not found for this user ID")
    
    from app.Rakib.api.StudentSettingsApi import _to_schema
    return_student = _to_schema(student)

    return return_student


# ---------------- Admin: Sign-up allowlist ----------------

def require_admin(user_id: int, db: Session):
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admin can manage the sign-up allowlist")
    return user


class AllowedEntry(BaseModel):
    email: str
    registration_number: Optional[str] = None
    full_name: Optional[str] = None
    batch: Optional[int] = None


class AllowedEmailsAdd(BaseModel):
    # Two input modes:
    #   * emails:  plain list (teachers, or students without reg numbers)
    #   * entries: structured rows carrying the registration number (students)
    emails: Optional[List[str]] = None
    entries: Optional[List[AllowedEntry]] = None
    role: str = "student"             # student | teacher


@router.get("/allowed-emails")
def list_allowed_emails(user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    registered = {e for (e,) in db.query(func.lower(User.email)).all()}
    rows = db.query(AllowedEmail).order_by(AllowedEmail.id.desc()).all()
    return [
        {
            "id": r.id,
            "email": r.email,
            "role": r.role,
            "registration_number": r.registration_number,
            "full_name": r.full_name,
            "batch": r.batch,
            "registered": r.email in registered,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        }
        for r in rows
    ]


@router.post("/allowed-emails")
def add_allowed_emails(data: AllowedEmailsAdd, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    role = data.role.strip().lower()
    if role not in ("student", "teacher"):
        raise HTTPException(status_code=400, detail="role must be student or teacher")
    added, skipped, invalid = 0, [], []
    existing = {e for (e,) in db.query(AllowedEmail.email).all()}

    # normalise both modes into a common list of AllowedEntry-like dicts
    rows = []
    if data.entries:
        for e in data.entries:
            rows.append(dict(email=e.email, registration_number=e.registration_number,
                             full_name=e.full_name, batch=e.batch))
    for raw in (data.emails or []):
        rows.append(dict(email=raw, registration_number=None, full_name=None, batch=None))

    for row in rows:
        email = (row["email"] or "").strip().lower()
        if not email:
            continue
        if "@" not in email or " " in email:
            invalid.append(email)
            continue
        if email in existing:
            skipped.append(email)
            continue
        db.add(AllowedEmail(
            email=email, role=role,
            registration_number=(row["registration_number"] or "").strip() or None,
            full_name=(row["full_name"] or "").strip() or None,
            batch=row["batch"],
        ))
        existing.add(email)
        added += 1
    db.commit()
    return {"added": added, "skipped": skipped, "invalid": invalid}


@router.delete("/allowed-emails/{allowed_id}")
def delete_allowed_email(allowed_id: int, user_id: int = Query(...), db: Session = Depends(get_db)):
    require_admin(user_id, db)
    row = db.query(AllowedEmail).filter(AllowedEmail.id == allowed_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Entry not found")
    db.delete(row)
    db.commit()
    return {"message": "Removed from allowlist"}


# ---------------- Admin: User Management ----------------

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id).all()
    teachers = {t.user_id: t for t in db.query(Teacher).all() if t.user_id}
    students = {s.user_id: s for s in db.query(Student).all() if s.user_id}
    out = []
    for u in users:
        t, s = teachers.get(u.id), students.get(u.id)
        if t:
            name = f"{t.first_name or ''} {t.last_name or ''}".strip()
        elif s:
            name = f"{s.first_name or ''} {s.last_name or ''}".strip()
        else:
            name = (u.email or "").split("@")[0]
        out.append({
            "id": u.id, "email": u.email, "role": u.role, "is_active": u.is_active,
            "name": name or (u.email or "").split("@")[0],
            "batch": s.batch if s else None,
            "student_id": s.id if s else None,
            "registration_number": s.registration_number if s else None,
            "last_seen": u.last_seen.isoformat() if u.last_seen else None,
        })
    return out


@router.get("/students/{user_id}/profile")
def admin_student_profile(user_id: int, db: Session = Depends(get_db)):
    """Full student profile for the admin user-management view — everything the
    student can fill in on their Settings page, so admins see the whole record."""
    s = db.query(Student).filter(Student.user_id == user_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Student profile not found")
    u = db.query(User).filter(User.id == user_id).first()
    return {
        "id": s.id, "user_id": s.user_id,
        "first_name": s.first_name, "last_name": s.last_name,
        "nickname": s.nickname, "gender": s.gender, "blood_group": s.blood_group,
        "date_of_birth": s.date_of_birth,
        "phone": s.phone, "guardian_mobile": s.guardian_mobile,
        "batch": s.batch, "current_semester": s.current_semester,
        "program": s.program, "status": s.status,
        "registration_number": s.registration_number, "roll": s.roll,
        "merit_rank": s.merit_rank, "department": s.department,
        "school": s.school, "college": s.college,
        "present_address": s.present_address, "permanent_address": s.permanent_address,
        "hall": s.hall,
        "personal_email": s.personal_email,
        "institutional_email": u.email if u else None,
        "facebook_url": s.facebook_url, "other_social": s.other_social,
        "bio": s.bio, "profile_image": s.profile_image,
    }


@router.get("/users/stats")
def user_stats(db: Session = Depends(get_db)):
    rows = db.query(User.role, func.count(User.id)).group_by(User.role).all()
    counts = {role or "unknown": n for role, n in rows}
    return {
        "total": sum(counts.values()),
        "students": counts.get("student", 0),
        "teachers": counts.get("teacher", 0),
        "admins": counts.get("admin", 0),
    }


@router.delete("/users/{user_id}")
def delete_user(user_id: int, actor_id: int = Query(...), db: Session = Depends(get_db)):
    """Hard-delete a user. Guards: can't delete yourself, can't delete the last
    admin, and a teacher who still owns courses must have them reassigned/removed
    first (protects routine, attendance, enrolment integrity)."""
    actor = db.query(User).filter(User.id == actor_id).first()
    if not actor or actor.role != "admin":
        raise HTTPException(status_code=403, detail="Only an admin can delete users")
    if user_id == actor_id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account")
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    if u.role == "admin" and db.query(User).filter(User.role == "admin").count() <= 1:
        raise HTTPException(status_code=400, detail="Cannot delete the last remaining admin")

    from app.Emon.model.course import Course
    from app.Emon.model.activity_log import ActivityLog
    from app.Rakib.model.announcement import Announcement
    teacher = db.query(Teacher).filter(Teacher.user_id == user_id).first()
    if teacher:
        owned = db.query(Course).filter(Course.teacher_id == teacher.id).count()
        if owned:
            raise HTTPException(
                status_code=400,
                detail=f"This teacher still owns {owned} course(s). Reassign or delete those courses first.",
            )
        # no ORM cascade/ondelete on these FKs — delete manually or the final commit hits an IntegrityError
        db.query(ActivityLog).filter(ActivityLog.teacher_id == teacher.id).delete(synchronize_session=False)
        db.query(Announcement).filter(Announcement.teacher_id == teacher.id).delete(synchronize_session=False)
        db.delete(teacher)

    from app.Rakib.model.attendance import Attendance
    from app.Rakib.model.result import Result
    from app.Rakib.model.semester_result import SemesterResult
    from app.Rakib.model.batch_change import BatchChangeRequest
    student = db.query(Student).filter(Student.user_id == user_id).first()
    if student:
        student.courses = []      # drop enrolment links (student_courses rows)
        db.flush()
        # same as above: attendance/results/batch-change requests have no cascade
        db.query(Attendance).filter(Attendance.student_id == student.id).delete(synchronize_session=False)
        db.query(Result).filter(Result.student_id == student.id).delete(synchronize_session=False)
        db.query(SemesterResult).filter(SemesterResult.student_id == student.id).delete(synchronize_session=False)
        db.query(BatchChangeRequest).filter(BatchChangeRequest.student_id == student.id).delete(synchronize_session=False)
        db.delete(student)

    # tidy up personal rows that key off the user id (no hard FK)
    from app.Rakib.model.notification import Notification
    db.query(Notification).filter(Notification.user_id == user_id).delete(synchronize_session=False)

    db.delete(u)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Could not delete this user: related records still reference their account.",
        )
    return {"message": "User deleted", "id": user_id}


@router.put("/users/{user_id}/active")
def set_user_active(user_id: int, active: bool = Query(...), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.is_active = active
    db.commit()
    return {"message": "updated", "is_active": u.is_active}


@router.put("/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, new_password: str = Query(..., min_length=6), db: Session = Depends(get_db)):
    u = db.query(User).filter(User.id == user_id).first()
    if not u:
        raise HTTPException(status_code=404, detail="User not found")
    u.hashed_password = pwd_context.hash(new_password[:72])
    db.commit()
    return {"message": "Password reset successfully"}
