from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from core.db import connect_to_mongo, close_mongo_connection, get_db
from api.routes_upload import router as upload_router
from api.routes_chat import router as chat_router
from api.routes_test import router as test_router
from core.admin_setup import setup_admin
from core.config import settings
import os

app = FastAPI(
    title="Zero-Trust Document Organizer & AI Chat",
    description="High-stakes hackathon project featuring a dual-layer AI firewall and vectorless indexing.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For demo purposes, allowing all. Restrict in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Templates setup
templates = Jinja2Templates(directory="backend/templates")

@app.on_event("startup")
async def startup_db_client():
    await connect_to_mongo()
    setup_admin(app)

@app.on_event("shutdown")
async def shutdown_db_client():
    await close_mongo_connection()

# Include routers
app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(chat_router, tags=["Chat"])
app.include_router(test_router, prefix="/api", tags=["Test"])

@app.get("/")
async def root(request: Request):
    return {"message": "Zero-Trust Document Organizer API is running", "admin_panel": "/admin"}

@app.get("/debug")
async def debug_interface(request: Request):
    return templates.TemplateResponse("debug.html", {"request": request, "logs": []})
