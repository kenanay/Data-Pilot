"""
Centralized error handling for the application.
This module contains exception handlers and middleware for consistent error responses.
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError
from typing import Union, Dict, Any
import logging
import traceback
from datetime import datetime

# Set up logging
logger = logging.getLogger(__name__)

class AppException(Exception):
    """Base exception class for application-specific errors"""
    def __init__(self, message: str, status_code: int = 500, details: Dict[str, Any] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class ValidationException(AppException):
    """Exception for validation errors"""
    def __init__(self, message: str, details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_400_BAD_REQUEST, details)

class AuthenticationException(AppException):
    """Exception for authentication errors"""
    def __init__(self, message: str = "Authentication failed", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_401_UNAUTHORIZED, details)

class AuthorizationException(AppException):
    """Exception for authorization errors"""
    def __init__(self, message: str = "Access denied", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_403_FORBIDDEN, details)

class NotFoundException(AppException):
    """Exception for resource not found errors"""
    def __init__(self, message: str = "Resource not found", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_404_NOT_FOUND, details)

class DatabaseException(AppException):
    """Exception for database-related errors"""
    def __init__(self, message: str = "Database error occurred", details: Dict[str, Any] = None):
        super().__init__(message, status.HTTP_500_INTERNAL_SERVER_ERROR, details)

def create_error_response(
    status_code: int,
    message: str,
    details: Union[Dict[str, Any], None] = None,
    request_id: str = None
) -> JSONResponse:
    """Create a standardized error response"""
    error_response = {
        "error": True,
        "status_code": status_code,
        "message": message,
        # Include the current UTC time to aid debugging on the client side
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    
    if details:
        error_response["details"] = details
    
    if request_id:
        error_response["request_id"] = request_id
    
    return JSONResponse(
        status_code=status_code,
        content=error_response
    )

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application-specific exceptions"""
    logger.error(f"Application error: {exc.message}", extra={
        "status_code": exc.status_code,
        "details": exc.details,
        "path": request.url.path
    })
    
    return create_error_response(
        status_code=exc.status_code,
        message=exc.message,
        details=exc.details
    )

async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle FastAPI validation errors"""
    logger.warning(f"Validation error: {exc.errors()}", extra={
        "path": request.url.path,
        "errors": exc.errors()
    })
    
    # Format validation errors for better user experience
    formatted_errors = {}
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"][1:])  # Skip 'body' prefix
        formatted_errors[field] = error["msg"]
    
    return create_error_response(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        message="Validation failed",
        details={"validation_errors": formatted_errors}
    )

async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle database-related errors"""
    logger.error(f"Database error: {str(exc)}", extra={
        "path": request.url.path,
        "exception_type": type(exc).__name__
    })
    
    # Handle specific database errors
    if isinstance(exc, IntegrityError):
        message = "Data integrity constraint violated"
        if "UNIQUE constraint failed" in str(exc):
            message = "A record with this information already exists"
    else:
        message = "Database operation failed"
    
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message=message
    )

async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {str(exc)}", extra={
        "path": request.url.path,
        "exception_type": type(exc).__name__,
        "traceback": traceback.format_exc()
    })
    
    return create_error_response(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        message="An unexpected error occurred"
    )