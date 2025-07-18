from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from app.core.database import get_async_session
from app.core.security import get_current_user
from app.core.error_handlers import NotFoundException, DatabaseException, ValidationException
from app.models.user import User
from app.models.data import UserData
from pydantic import BaseModel, validator
from sqlalchemy import select
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

# Simple data model for user data input
class DataInput(BaseModel):
    title: str
    content: str
    data_type: str = "text"

class DataResponse(BaseModel):
    id: int
    title: str
    content: str
    data_type: str
    created_at: datetime
    user_id: int

    class Config:
        from_attributes = True

@router.post("/", response_model=DataResponse)
async def create_data(
    data: DataInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    try:
        # Validate data type
        valid_types = ["text", "note", "idea", "task"]
        if data.data_type not in valid_types:
            raise ValidationException(
                message="Invalid data type",
                details={"data_type": f"Must be one of: {', '.join(valid_types)}"}
            )
            
        new_data = UserData(
            title=data.title,
            content=data.content,
            data_type=data.data_type,
            user_id=current_user.id
        )
        
        db.add(new_data)
        await db.commit()
        await db.refresh(new_data)
        
        logger.info(f"New data created by user {current_user.id}: {new_data.id}")
        return new_data
    except Exception as e:
        await db.rollback()
        logger.error(f"Error creating data: {str(e)}")
        raise DatabaseException(message="Failed to create data", details={"error": str(e)})

@router.get("/", response_model=List[DataResponse])
async def get_user_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    result = await db.execute(
        select(UserData).where(UserData.user_id == current_user.id)
    )
    user_data = result.scalars().all()
    return user_data

@router.get("/{data_id}", response_model=DataResponse)
async def get_data(
    data_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    result = await db.execute(
        select(UserData).where(UserData.id == data_id, UserData.user_id == current_user.id)
    )
    data = result.scalars().first()
    
    if not data:
        logger.warning(f"Data with ID {data_id} not found for user {current_user.id}")
        raise NotFoundException(message="Data not found", details={"data_id": data_id})
    
    return data

@router.put("/{data_id}", response_model=DataResponse)
async def update_data(
    data_id: int,
    data_update: DataInput,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    from sqlalchemy import update
    
    # First check if the data exists and belongs to the user
    result = await db.execute(
        select(UserData).where(UserData.id == data_id, UserData.user_id == current_user.id)
    )
    existing_data = result.scalars().first()
    
    if not existing_data:
        logger.warning(f"Data with ID {data_id} not found for user {current_user.id} during update")
        raise NotFoundException(message="Data not found", details={"data_id": data_id})
    
    try:
        # Validate data type
        valid_types = ["text", "note", "idea", "task"]
        if data_update.data_type not in valid_types:
            raise ValidationException(
                message="Invalid data type",
                details={"data_type": f"Must be one of: {', '.join(valid_types)}"}
            )
            
        # Update the data using SQLAlchemy update statement
        await db.execute(
            update(UserData)
            .where(UserData.id == data_id, UserData.user_id == current_user.id)
            .values(
                title=data_update.title,
                content=data_update.content,
                data_type=data_update.data_type
            )
        )
        await db.commit()
        
        # Fetch the updated data
        result = await db.execute(
            select(UserData).where(UserData.id == data_id)
        )
        updated_data = result.scalars().first()
        logger.info(f"Data with ID {data_id} updated successfully by user {current_user.id}")
        return updated_data
    except Exception as e:
        await db.rollback()
        logger.error(f"Error updating data with ID {data_id}: {str(e)}")
        raise DatabaseException(message="Failed to update data", details={"data_id": data_id, "error": str(e)})

@router.delete("/{data_id}")
async def delete_data(
    data_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_async_session)
):
    result = await db.execute(
        select(UserData).where(UserData.id == data_id, UserData.user_id == current_user.id)
    )
    data = result.scalars().first()
    
    if not data:
        logger.warning(f"Data with ID {data_id} not found for user {current_user.id} during delete")
        raise NotFoundException(message="Data not found", details={"data_id": data_id})
    
    try:
        await db.delete(data)
        await db.commit()
        logger.info(f"Data with ID {data_id} deleted successfully by user {current_user.id}")
        return {"message": "Data deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting data with ID {data_id}: {str(e)}")
        await db.rollback()
        raise DatabaseException(message="Failed to delete data", details={"data_id": data_id})

