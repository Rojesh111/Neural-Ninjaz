from odmantic import Model, Field
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PersonalDocument(Model):
    document_name: str
    original_filename: str
    saved_filepath: str
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    doc_type: str = "personal"
    status: str = "uploaded"

class LegalPage(BaseModel):
    page_number: int
    filepath: str

class LegalBatch(Model):
    batch_name: str
    upload_timestamp: datetime = Field(default_factory=datetime.utcnow)
    doc_type: str = "legal"
    status: str = "uploaded" # uploaded, indexing, completed, error
    pages: List[LegalPage]
    total_pages: int = 0
    processed_pages: int = 0

class ChatMessage(Model):
    user_id: str
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_secure: bool = True
