from fastapi import APIRouter, Depends
from app.core.error_handlers import DatabaseException
import logging

logger = logging.getLogger(__name__)
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_current_user
from app.schemas.user import UserResponse, UserUpdate
from app.models.user import User
from app.core.database import get_async_session
from sqlalchemy import select

router = APIRouter()

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """Get the current authenticated user's information"""
    return current_user

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_async_session)
):
    """Update the current authenticated user's information"""
    try:
        if user_update.username is not None:
            current_user.username = user_update.username
        if user_update.full_name is not None:
            current_user.full_name = user_update.full_name

        session.add(current_user)
        await session.commit()
        await session.refresh(current_user)
        logger.info(f"User {current_user.id} updated their profile")
        return current_user
    except Exception as e:
        await session.rollback()
        logger.error(f"Error updating user {current_user.id}: {str(e)}")
        raise DatabaseException(
            message="Failed to update user profile",
            details={"error": str(e)}
        )
