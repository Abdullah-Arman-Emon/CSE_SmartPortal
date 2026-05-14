from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.orm import Session, joinedload
from app.core.database import SessionLocal
from typing import List
import uuid
import os
from app.core.config import settings  
from fastapi.responses import FileResponse
from urllib.parse import urlparse


router = APIRouter(
    prefix="/utility",
    tags=["Utility"]
)



def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
        

RESOURCE_PATH= settings.resource_hub


from fastapi import Request

@router.post("/upload")
def upload_file(request: Request, file: UploadFile = File(...)):
    file_path = get_file_link(file)
    file_name = os.path.basename(file_path)
    file_url = f"{request.base_url}resources/{file_name}"
    return {"url": file_url}

def get_file_link(file: UploadFile) -> str:
    if not file:
        raise HTTPException(status_code=400, detail="No file provided")

    if not RESOURCE_PATH:
        raise HTTPException(status_code=500, detail="RESOURCE_HUB not set in .env")

    os.makedirs(RESOURCE_PATH, exist_ok=True)

    # Get original filename without extension
    base_name, ext = os.path.splitext(file.filename)
    safe_base_name = base_name.replace(" ", "_")  # optional: replace spaces

    # Generate unique filename
    unique_name = f"{safe_base_name}_{uuid.uuid4().hex}{ext}"
    full_path = os.path.join(RESOURCE_PATH, unique_name)

    # Save file
    with open(full_path, "wb") as buffer:
        buffer.write(file.file.read())

    return full_path


@router.get("/download-via-url")
def download_from_url_path(url: str):
    parsed = urlparse(url)
    filename = os.path.basename(parsed.path)
    file_path = os.path.join(settings.resource_hub, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )
    
@router.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(settings.resource_hub, filename)

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type='application/octet-stream'
    )
    
    
