from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from passlib.context import CryptContext
from fastapi import Query
from app.core.jwt_utils import create_access_token
from app.core.auth import SECRET_KEY, ALGORITHM
from jose import JWTError, jwt


from app.Emon.model.userModel import User
from app.Emon.model.teacher import Teacher
from app.Rakib.model.student import Student


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
    
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed_password = pwd_context.hash(user.password[:72])
    
    user.role = user.role.lower()
    
    new_user = User(
        email=user.email,
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
        student = Student(
            user_id=new_user.id,
            batch=user.batch  
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
    
    return_student = StudentSchema(
        id=student.id,
        first_name=student.first_name or "",
        last_name=student.last_name or "",
        phone=student.phone or "",
        bio=student.bio or "",
        batch=student.batch,
        current_semester=student.current_semester,
        program=student.program or "bsc",
        msc_group=student.msc_group,
        profile_image=student.profile_image or ""
    )
    
    print(return_student)
    
    return return_student


# ---------------- Admin: User Management ----------------

@router.get("/users")
def list_users(db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id).all()
    return [
        {"id": u.id, "email": u.email, "role": u.role, "is_active": u.is_active}
        for u in users
    ]


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
