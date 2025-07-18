"""
Data Pilot - Main Application Entry Point

Author: Kenan AY
Project: Data Pilot
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
"""

from fastapi import FastAPI
from app.core.database import Base, engine
from app.models import user, data  # Import models to ensure they're included in metadata
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
import datetime

# Import error handlers
from app.core.error_handlers import (
    AppException,
    app_exception_handler,
    validation_exception_handler,
    database_exception_handler,
    general_exception_handler
)

# Initialize FastAPI application
app = FastAPI(
    title="Data Pilot API",
    version="1.0.0",
    description="Simplified API for Data Pilot application"
)

# Add exception handlers
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Create database tables on startup
@app.on_event("startup")
async def on_startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

# Include essential routers only
from app.routers import auth, users, data
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(data.router, prefix="/data", tags=["Data"])

# Root endpoint for API health check
@app.get("/")
def read_root():
    return {
        "status": "online",
        "message": "🚀 Data Pilot API is running with SQLite!",
        "version": "1.0.0"
    }

# Health check endpoint for monitoring
@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.datetime.now().isoformat(),
        "services": {
            "database": "connected",
            "api": "running"
        }
    }

# CORS ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:8080"],  # React frontend addresses
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)