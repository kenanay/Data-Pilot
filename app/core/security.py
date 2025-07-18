# app/core/security.py

from fastapi import Depends, status
from app.core.error_handlers import AuthenticationException
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.models.user import User
from app.core.database import get_async_session
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_async_session)) -> User:
    """
    Get the current authenticated user from the JWT token
    
    Args:
        token: JWT token from Authorization header
        db: Database session
        
    Returns:
        User: The authenticated user
        
    Raises:
        HTTPException: If token is invalid or user not found
    """
    credentials_exception = AuthenticationException(
        message="Could not validate credentials",
        details={"headers": {"WWW-Authenticate": "Bearer"}}
    )
    
    expired_exception = AuthenticationException(
        message="Token has expired",
        details={"headers": {"WWW-Authenticate": "Bearer"}}
    )
    
    try:
        from app.config import settings
        import time
        
        # Decode token without verification first to check expiration
        # This is more efficient than catching ExpiredSignatureError
        try:
            unverified_payload = jwt.decode(
                token, 
                options={"verify_signature": False}
            )
            
            # Check if token has expired
            if unverified_payload.get("exp") and time.time() > unverified_payload.get("exp"):
                raise expired_exception
                
        except JWTError:
            # If we can't even decode without verification, it's malformed
            raise credentials_exception
        
        # Now do the full verification
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        email = payload.get("sub")
        if email is None:
            raise credentials_exception
        if not isinstance(email, str):
            raise credentials_exception
            
    except JWTError:
        raise credentials_exception

    # Get user from database
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    
    if user is None:
        raise credentials_exception
        
    return user

