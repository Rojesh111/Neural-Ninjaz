from pydantic_settings import BaseSettings
from typing import Optional

import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "Zero-Trust Document Organizer"
    MONGODB_URI: str = "mongodb://localhost:27017"
    DATABASE_NAME: str = "zerotrust_db"
    SECRET_KEY: str = "supersecretkey"
    
    # Base directory of the project
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # Media storage paths (Relative to project root)
    PROJECT_ROOT: str = os.path.dirname(BASE_DIR)
    PERSONAL_STORAGE: str = os.path.join(PROJECT_ROOT, "media/personal")
    LEGAL_STORAGE: str = os.path.join(PROJECT_ROOT, "media/legal")
    JSON_STORAGE: str = os.path.join(PROJECT_ROOT, "media/json")

    # Azure OpenAI Settings
    AZURE_OPENAI_API_KEY: Optional[str] = None
    AZURE_OPENAI_ENDPOINT: Optional[str] = None
    AZURE_OPENAI_API_VERSION: Optional[str] = "2025-01-01-preview"
    AZURE_OPENAI_DEPLOYMENT_NAME: Optional[str] = "gpt-image-1.5"

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
