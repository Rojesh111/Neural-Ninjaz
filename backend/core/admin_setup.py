from starlette_admin.contrib.odmantic import Admin, ModelView
from starlette_admin import JSONField
from .db import get_engine
from models.schemas import PersonalDocument, LegalBatch, ChatMessage

class LegalBatchView(ModelView):
    fields = [
        "id", 
        "batch_name", 
        "upload_timestamp", 
        "doc_type", 
        "status", 
        JSONField("pages")
    ]

def setup_admin(app):
    engine = get_engine()
    admin = Admin(engine, title="Zero-Trust Admin", base_url="/admin")
    
    # Add views
    admin.add_view(ModelView(PersonalDocument))
    admin.add_view(LegalBatchView(LegalBatch))
    admin.add_view(ModelView(ChatMessage))
    
    admin.mount_to(app)
    return admin
