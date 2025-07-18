from fastapi import APIRouter, Depends, status, Response
from app.core.error_handlers import ValidationException, AuthenticationException, DatabaseException
import logging
from sqlalchemy.ext.asyncio import AsyncSession

from app.schemas.auth import LoginRequest, Token, UserInfo
from app.schemas.user import UserCreate, UserRead
from app.core.database import get_async_session
from app.services.auth_service import authenticate_user, create_access_token, register_user, get_user_info_dict
from app.core.security import get_current_user
from app.models.user import User

router = APIRouter()


@router.post("/login", response_model=Token)
async def login(
    request: LoginRequest,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Authenticate user and return JWT token with user information
    """
    user = await authenticate_user(db, request.email, request.password)
    if not user:
        raise AuthenticationException(
            message="Invalid email or password",
            details={"email": request.email}
        )
    
    # Create token with expiration
    access_token, expires_at = create_access_token(data={"sub": user.email})
    
    # Get user info for response
    user_info = get_user_info_dict(user)
    
    # Return token with user info
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_at=expires_at,
        user=UserInfo(**user_info)
    )


@router.post("/register", response_model=UserRead, status_code=201)
async def register(
    user: UserCreate,
    db: AsyncSession = Depends(get_async_session)
):
    """
    Register a new user
    """
    from app.crud.user_crud import get_user_by_email
    existing_user = await get_user_by_email(db, user.email)
    if existing_user:
        raise ValidationException(
            message="Email already registered",
            details={"email": user.email}
        )
    created_user = await register_user(db, user)
    if not created_user:
        raise DatabaseException(
            message="Failed to create user",
            details={"email": user.email}
        )
    return created_user


@router.post("/logout")
async def logout(response: Response):
    """
    Logout endpoint - clears cookies if used
    
    Note: For JWT tokens, actual logout happens on the client side
    by removing the token, but this endpoint can be used for
    server-side session tracking if implemented later
    """
    # Clear any cookies if using cookie-based auth
    response.delete_cookie(key="session")
    return {"message": "Successfully logged out"}


@router.get("/me", response_model=UserInfo)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    Get current authenticated user information
    """
    return UserInfo(**get_user_info_dict(current_user))


@router.post("/refresh", response_model=Token)
async def refresh_token(
    current_user: User = Depends(get_current_user),
):
    """
    Refresh the access token
    """
    # Create new token with the same user
    access_token, expires_at = create_access_token(data={"sub": current_user.email})
    
    # Get user info for response
    user_info = get_user_info_dict(current_user)
    
    # Return new token with user info
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_at=expires_at,
        user=UserInfo(**user_info)
    )
