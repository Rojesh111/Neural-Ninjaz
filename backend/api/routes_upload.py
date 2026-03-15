from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from models.schemas import PersonalDocument, LegalBatch, LegalPage
from core.db import get_engine
from core.config import settings
from datetime import datetime
import shutil
import os
import uuid
import re

router = APIRouter()

def sanitize_filename(name: str) -> str:
    # Separate extension first
    base, ext = os.path.splitext(name)
    # Sanitize base name only
    clean_base = re.sub(r'[^a-zA-Z0-9_-]', '_', base)
    return f"{clean_base}{ext}"

@router.post("/upload/personal")
async def upload_personal_document(
    document_name: str = Form(...),
    file: UploadFile = File(...)
):
    # 1. Validation: Check if image
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")
    
    # 2. File System Storage (Sanitized Naming)
    save_dir = settings.PERSONAL_STORAGE
    os.makedirs(save_dir, exist_ok=True)
    
    # Preserve extension and sanitize base name
    file_extension = os.path.splitext(file.filename)[1]
    sanitized_name = re.sub(r'[^a-zA-Z0-9_-]', '_', document_name.lower())
    target_filename = f"{sanitized_name}{file_extension}"
    file_path = os.path.join(save_dir, target_filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # 3. MongoDB Storage
    doc = PersonalDocument(
        document_name=document_name,
        original_filename=file.filename,
        saved_filepath=file_path,
        upload_timestamp=datetime.utcnow(),
        doc_type="personal",
        status="uploaded"
    )
    
    engine = get_engine()
    await engine.save(doc)
    
    return {
        "message": "Personal document uploaded successfully",
        "doc_id": str(doc.id),
        "data": doc
    }

@router.post("/upload/legal")
async def upload_legal_documents(
    batch_name: str = Form(...),
    files: list[UploadFile] = File(...)
):
    # 1. Validation
    allowed_types = ["image/jpeg", "image/png", "application/pdf"]
    for file in files:
        if file.content_type not in allowed_types:
            raise HTTPException(status_code=400, detail=f"Invalid format: {file.filename}")
    
    # 2. Folder Creation & Disk Storage
    # Sanitize batch name (replacing spaces/special chars)
    sanitized_batch = re.sub(r'[^a-zA-Z0-9_-]', '_', batch_name)
    batch_dir = os.path.join(settings.LEGAL_STORAGE, sanitized_batch)
    os.makedirs(batch_dir, exist_ok=True)
    
    pages = []
    file_paths = []
    
    for index, file in enumerate(files, start=1):
        # Prefix with index for order preservation (e.g., 01_filename.jpg)
        filename = f"{index:02d}_{sanitize_filename(file.filename)}"
        file_path = os.path.join(batch_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_paths.append(file_path)
        pages.append(LegalPage(
            page_number=index,
            filepath=file_path
        ))
    
    # 3. MongoDB Batch Insertion
    batch = LegalBatch(
        batch_name=sanitized_batch,
        upload_timestamp=datetime.utcnow(),
        doc_type="legal",
        status="uploaded",
        pages=pages,
        total_pages=len(files),
        processed_pages=0
    )
    
    engine = get_engine()
    await engine.save(batch)
    
    # 4. Trigger AI Indexing (Vision)
    from services.index_service import index_service
    import asyncio
    asyncio.create_task(index_service.process_legal_batch(batch_name, file_paths))
    
    return {
        "message": "Legal batch uploaded successfully. AI Indexing started.",
        "batch_id": str(batch.id),
        "data": batch
    }

@router.get("/upload/progress/{batch_name}")
async def get_upload_progress(batch_name: str):
    """
    Returns the current indexing progress for a legal batch.
    """
    engine = get_engine()
    # Batch name in DB is usually sanitized (underscores)
    sanitized_name = re.sub(r'[^a-zA-Z0-9_-]', '_', batch_name)
    batch = await engine.find_one(LegalBatch, LegalBatch.batch_name == sanitized_name)
    
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
        
    return {
        "batch_name": batch.batch_name,
        "status": batch.status,
        "total_pages": batch.total_pages,
        "processed_pages": batch.processed_pages,
        "percentage": (batch.processed_pages / batch.total_pages * 100) if batch.total_pages > 0 else 0
    }
