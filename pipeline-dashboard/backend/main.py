"""
Data Pipeline Dashboard - Backend Main Application

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import json
import asyncio
from datetime import datetime
from typing import Dict, List, Optional
import uuid
import re
import hashlib
import time
from collections import defaultdict

# Pipeline state management
pipeline_sessions: Dict[str, dict] = {}
websocket_connections: Dict[str, WebSocket] = {}

# Security configuration
security = HTTPBearer()
rate_limiter = defaultdict(list)
RATE_LIMITS = {
    'upload': {'max_requests': 5, 'window': 60},  # 5 uploads per minute
    'api': {'max_requests': 100, 'window': 60},   # 100 API calls per minute
}

# Input validation patterns with Turkish character support
VALIDATION_PATTERNS = {
    'session_id': re.compile(r'^[a-zA-Z0-9-]{36}$'),
    'file_id': re.compile(r'^[a-zA-Z0-9_-]+$'),
    'filename': re.compile(r'^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9._\s-]+$'),
    'alphanumeric': re.compile(r'^[a-zA-Z0-9_-]+$'),
    'alphanumeric_turkish': re.compile(r'^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9_-]+$'),
    'turkish_text': re.compile(r'^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9\s.,;:!?\'"()\-_]+$'),
}

# Security headers
SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; object-src 'none'",
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Permitted-Cross-Domain-Policies': 'none'
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("🚀 Data Pipeline Dashboard Backend Starting...")
    yield
    # Shutdown
    print("🛑 Data Pipeline Dashboard Backend Shutting Down...")

app = FastAPI(
    title="Data Pipeline Dashboard API",
    version="1.0.0",
    description="Advanced Data Processing Pipeline with Visual Workflow Management",
    lifespan=lifespan
)

# Security middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    
    # Add security headers
    for header, value in SECURITY_HEADERS.items():
        response.headers[header] = value
    
    return response

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    current_time = time.time()
    
    # Determine rate limit type based on endpoint
    path = request.url.path
    limit_type = 'upload' if '/upload' in path else 'api'
    
    # Clean old requests
    rate_limiter[client_ip] = [
        req_time for req_time in rate_limiter[client_ip]
        if current_time - req_time < RATE_LIMITS[limit_type]['window']
    ]
    
    # Check rate limit
    if len(rate_limiter[client_ip]) >= RATE_LIMITS[limit_type]['max_requests']:
        return JSONResponse(
            status_code=429,
            content={"error": "Rate limit exceeded", "retry_after": RATE_LIMITS[limit_type]['window']}
        )
    
    # Add current request
    rate_limiter[client_ip].append(current_time)
    
    response = await call_next(request)
    return response

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security validation functions
def validate_session_id(session_id: str) -> bool:
    """Validate session ID format"""
    return bool(VALIDATION_PATTERNS['session_id'].match(session_id))

def validate_file_id(file_id: str) -> bool:
    """Validate file ID format"""
    return bool(VALIDATION_PATTERNS['file_id'].match(file_id))

def validate_filename(filename: str) -> bool:
    """Validate filename format with Turkish character support"""
    if not filename or len(filename) > 255:
        return False
    
    # Check Turkish character pattern
    if not VALIDATION_PATTERNS['filename'].match(filename):
        return False
    
    # Ensure UTF-8 encoding is valid
    try:
        filename.encode('utf-8').decode('utf-8')
        return True
    except UnicodeError:
        return False

def sanitize_input(text: str) -> str:
    """Sanitize text input while preserving Turkish characters"""
    if not isinstance(text, str):
        return ""
    
    # Remove potentially dangerous characters but preserve Turkish characters
    sanitized = re.sub(r'[<>"\']', '', text)
    sanitized = sanitized.strip()
    
    # Normalize Turkish characters to composed form
    try:
        import unicodedata
        sanitized = unicodedata.normalize('NFC', sanitized)
    except ImportError:
        pass
    
    return sanitized[:1000]  # Limit length

def validate_turkish_text(text: str) -> bool:
    """Validate text with Turkish character support"""
    if not text or not isinstance(text, str):
        return False
    
    # Check Turkish text pattern
    if not VALIDATION_PATTERNS['turkish_text'].match(text):
        return False
    
    # Ensure UTF-8 encoding is valid
    try:
        text.encode('utf-8').decode('utf-8')
        return True
    except UnicodeError:
        return False

def log_security_event(event_type: str, details: dict, client_ip: Optional[str] = None):
    """Log security events"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "details": details,
        "client_ip": client_ip
    }
    print(f"SECURITY EVENT: {json.dumps(log_entry)}")

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify JWT token (placeholder - integrate with main app)"""
    # This would integrate with the main Data Pilot authentication
    # For now, we'll accept any token for development
    if not credentials or not credentials.credentials:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    return {"user_id": "test_user", "token": credentials.credentials}

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket
        await self.send_log(session_id, "info", "WebSocket connected")

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_log(self, session_id: str, log_type: str, message: str):
        if session_id in self.active_connections:
            log_entry = {
                "type": log_type,
                "message": message,
                "timestamp": datetime.now().isoformat(),
                "session_id": session_id
            }
            try:
                await self.active_connections[session_id].send_text(json.dumps(log_entry))
            except:
                # Connection might be closed
                self.disconnect(session_id)

manager = ConnectionManager()

# Root endpoint
@app.get("/")
async def root():
    return {
        "status": "online",
        "message": "🔄 Data Pipeline Dashboard API is running!",
        "version": "1.0.0",
        "endpoints": {
            "upload": "/api/upload",
            "preview": "/api/preview",
            "clean": "/api/clean",
            "analyze": "/api/analyze",
            "visualize": "/api/visualize",
            "model": "/api/model",
            "report": "/api/report",
            "convert": "/api/convert",
            "schema": "/api/schema-validate",
            "state": "/api/state",
            "rollback": "/api/rollback",
            "websocket": "/ws/logs/{session_id}"
        }
    }

# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "active_sessions": len(pipeline_sessions),
        "active_websockets": len(manager.active_connections)
    }

# WebSocket endpoint for live logs
@app.websocket("/ws/logs/{session_id}")
async def websocket_logs(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    try:
        while True:
            # Keep connection alive
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        manager.disconnect(session_id)

# Pipeline state endpoint
@app.get("/api/state")
async def get_pipeline_state(session_id: str):
    if session_id not in pipeline_sessions:
        # Initialize new session
        pipeline_sessions[session_id] = {
            "session_id": session_id,
            "current_file_id": None,
            "current_step": 0,
            "steps": [],
            "undo_stack": [],
            "redo_stack": [],
            "logs": [],
            "created_at": datetime.now().isoformat()
        }
    
    return pipeline_sessions[session_id]

# Security logging endpoint
@app.post("/api/security/log")
async def log_security_event_endpoint(request: Request, user: dict = Depends(verify_token)):
    """Endpoint for frontend to send security logs"""
    try:
        body = await request.json()
        client_ip = request.client.host if request.client else "unknown"
        
        log_security_event(
            event_type=body.get("event", "UNKNOWN"),
            details=body.get("details", {}),
            client_ip=client_ip
        )
        
        return {"status": "logged"}
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": str(e)})

# Mock pipeline endpoints (to be implemented)
@app.post("/api/upload")
async def upload_file(request: Request, session_id: str = "default", user: dict = Depends(verify_token)):
    client_ip = request.client.host if request.client else "unknown"
    
    try:
        # Validate session ID
        if not validate_session_id(session_id):
            log_security_event("INVALID_SESSION_ID", {"session_id": session_id}, client_ip)
            raise HTTPException(status_code=400, detail="Invalid session ID format")
        
        # Mock implementation
        file_id = f"file_{uuid.uuid4().hex[:8]}"
        
        # Log upload attempt
        log_security_event("FILE_UPLOAD_ATTEMPT", {
            "session_id": session_id,
            "file_id": file_id,
            "user_id": user.get("user_id")
        }, client_ip)
        
        # Update pipeline state
        if session_id not in pipeline_sessions:
            pipeline_sessions[session_id] = {
                "session_id": session_id,
                "current_file_id": file_id,
                "current_step": 1,
                "steps": [],
                "undo_stack": [],
                "redo_stack": [],
                "logs": [],
                "created_at": datetime.now().isoformat(),
                "user_id": user.get("user_id")
            }
        
        # Add step to pipeline
        step = {
            "step": "upload",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "file_id": file_id,
            "details": "Mock file uploaded successfully"
        }
        
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_file_id"] = file_id
        pipeline_sessions[session_id]["current_step"] = 1
        
        # Send log via WebSocket
        await manager.send_log(session_id, "success", f"File uploaded: {file_id}")
        
        # Log successful upload
        log_security_event("FILE_UPLOAD_SUCCESS", {
            "session_id": session_id,
            "file_id": file_id
        }, client_ip)
        
        return {"file_id": file_id, "status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("FILE_UPLOAD_ERROR", {
            "session_id": session_id,
            "error": str(e)
        }, client_ip)
        raise HTTPException(status_code=500, detail="Upload failed")

@app.get("/api/preview")
async def preview_data(request: Request, file_id: str, session_id: str = "default", user: dict = Depends(verify_token)):
    client_ip = request.client.host if request.client else "unknown"
    
    try:
        # Validate inputs
        if not validate_file_id(file_id):
            log_security_event("INVALID_FILE_ID", {"file_id": file_id}, client_ip)
            raise HTTPException(status_code=400, detail="Invalid file ID format")
        
        if not validate_session_id(session_id):
            log_security_event("INVALID_SESSION_ID", {"session_id": session_id}, client_ip)
            raise HTTPException(status_code=400, detail="Invalid session ID format")
        
        # Check if user owns the session
        if session_id in pipeline_sessions:
            session_user = pipeline_sessions[session_id].get("user_id")
            if session_user and session_user != user.get("user_id"):
                log_security_event("UNAUTHORIZED_SESSION_ACCESS", {
                    "session_id": session_id,
                    "user_id": user.get("user_id"),
                    "session_owner": session_user
                }, client_ip)
                raise HTTPException(status_code=403, detail="Access denied to session")
        
        # Mock implementation
        await manager.send_log(session_id, "info", f"Previewing file: {file_id}")
        
        # Update pipeline state
        if session_id in pipeline_sessions:
            step = {
                "step": "preview",
                "status": "completed",
                "timestamp": datetime.now().isoformat(),
                "file_id": file_id,
                "details": "Data preview generated"
            }
            pipeline_sessions[session_id]["steps"].append(step)
            pipeline_sessions[session_id]["current_step"] = 2
        
        await manager.send_log(session_id, "success", "Preview completed")
        
        return {
            "columns": ["id", "name", "age", "salary"],
            "sample": [
                [1, "John Doe", 30, 50000],
                [2, "Jane Smith", 25, 45000],
                [3, "Bob Johnson", 35, 60000]
            ],
            "summary": {
                "rows": 1000,
                "columns": 4,
                "missing_values": 15
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        log_security_event("PREVIEW_ERROR", {
            "file_id": file_id,
            "session_id": session_id,
            "error": str(e)
        }, client_ip)
        raise HTTPException(status_code=500, detail="Preview failed")

@app.post("/api/clean")
async def clean_data(session_id: str = "default"):
    # Mock implementation
    await manager.send_log(session_id, "info", "Starting data cleaning...")
    
    # Simulate processing time
    await asyncio.sleep(1)
    
    # Update pipeline state
    if session_id in pipeline_sessions:
        step = {
            "step": "clean",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "action": "fillna",
            "params": {"method": "mean", "columns": ["age", "salary"]},
            "details": "Missing values filled with mean"
        }
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_step"] = 3
    
    await manager.send_log(session_id, "success", "Data cleaning completed")
    
    return {"status": "success", "affected_rows": 15}

# Additional mock endpoints
@app.post("/api/analyze")
async def analyze_data(session_id: str = "default"):
    await manager.send_log(session_id, "info", "Running statistical analysis...")
    await asyncio.sleep(1)
    
    if session_id in pipeline_sessions:
        step = {
            "step": "analyze",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "analysis_type": "correlation",
            "details": "Correlation analysis completed"
        }
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_step"] = 4
    
    await manager.send_log(session_id, "success", "Analysis completed")
    return {"correlation_matrix": [[1.0, 0.8], [0.8, 1.0]]}

@app.post("/api/visualize")
async def visualize_data(session_id: str = "default"):
    await manager.send_log(session_id, "info", "Generating visualization...")
    await asyncio.sleep(1)
    
    if session_id in pipeline_sessions:
        step = {
            "step": "visualize",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "chart_type": "bar",
            "details": "Bar chart generated"
        }
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_step"] = 5
    
    await manager.send_log(session_id, "success", "Visualization completed")
    return {"chart_url": "/static/charts/chart_123.png"}

@app.post("/api/model")
async def train_model(session_id: str = "default"):
    await manager.send_log(session_id, "info", "Training ML model...")
    await asyncio.sleep(2)
    
    if session_id in pipeline_sessions:
        step = {
            "step": "model",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "model_type": "RandomForest",
            "details": "Model trained successfully"
        }
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_step"] = 6
    
    await manager.send_log(session_id, "success", "Model training completed")
    return {"accuracy": 0.95, "model_id": "model_123"}

@app.post("/api/report")
async def generate_report(session_id: str = "default"):
    await manager.send_log(session_id, "info", "Generating report...")
    await asyncio.sleep(1)
    
    if session_id in pipeline_sessions:
        step = {
            "step": "report",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "format": "PDF",
            "details": "PDF report generated"
        }
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_step"] = 7
    
    await manager.send_log(session_id, "success", "Report generated")
    return {"report_url": "/static/reports/report_123.pdf"}

@app.post("/api/convert")
async def convert_format(session_id: str = "default"):
    await manager.send_log(session_id, "info", "Converting file format...")
    await asyncio.sleep(1)
    
    if session_id in pipeline_sessions:
        step = {
            "step": "convert",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "from_format": "CSV",
            "to_format": "Parquet",
            "details": "File converted to Parquet"
        }
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_step"] = 8
    
    await manager.send_log(session_id, "success", "Format conversion completed")
    return {"download_url": "/static/converted/file_123.parquet"}

@app.post("/api/schema-validate")
async def validate_schema(session_id: str = "default"):
    await manager.send_log(session_id, "info", "Validating schema...")
    await asyncio.sleep(1)
    
    if session_id in pipeline_sessions:
        step = {
            "step": "schema",
            "status": "completed",
            "timestamp": datetime.now().isoformat(),
            "schema_type": "JSON",
            "details": "Schema validation passed"
        }
        pipeline_sessions[session_id]["steps"].append(step)
        pipeline_sessions[session_id]["current_step"] = 9
    
    await manager.send_log(session_id, "success", "Schema validation completed")
    return {"valid": True, "errors": []}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8082)