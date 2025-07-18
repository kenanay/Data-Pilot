from datetime import datetime, timedelta
from typing import Optional, Dict, Tuple
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.crud.user_crud import get_user_by_username
import time

from app.config import settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> Tuple[str, int]:
    """
    Create a JWT access token with expiration
    
    Args:
        data: Data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Tuple containing the token string and expiration timestamp
    """
    to_encode = data.copy()
    expire_delta = expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expire_delta
    expire_timestamp = int(expire.timestamp())
    to_encode.update({"exp": expire_timestamp})
    
    # Add issued at time for token refresh validation
    to_encode.update({"iat": int(datetime.utcnow().timestamp())})
    
    token = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, expire_timestamp * 1000  # Convert to milliseconds for frontend

def decode_access_token(token: str) -> Optional[dict]:
    """
    Decode and validate a JWT token
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError:
        return None

async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
    """
    Authenticate a user with email and password
    
    Args:
        db: Database session
        email: User email
        password: User password
        
    Returns:
        User object if authentication successful, None otherwise
    """
    from app.crud.user_crud import get_user_by_email
    user = await get_user_by_email(db, email)
    if not user or not verify_password(password, str(user.hashed_password)):
        return None
    return user

async def register_user(db: AsyncSession, user_create) -> Optional[User]:
    """
    Register a new user
    
    Args:
        db: Database session
        user_create: User creation data
        
    Returns:
        Created user object or None if failed
    """
    from app.crud.user_crud import create_user
    # Hash the password before creating user
    hashed_password = hash_password(user_create.password)
    user_create.password = hashed_password
    return await create_user(db, user_create)

def get_user_info_dict(user: User) -> Dict:
    """
    Convert User model to dictionary for token response
    
    Args:
        user: User model instance
        
    Returns:
        Dictionary with user information
    """
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name
    }
