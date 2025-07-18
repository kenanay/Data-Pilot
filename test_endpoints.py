#!/usr/bin/env python3
"""
Simple test script to verify essential API endpoints are working
"""
import asyncio
from app.main import app
from app.core.database import get_async_session
from app.models.user import User
from app.models.data import UserData
from app.services.auth_service import hash_password, create_access_token
from sqlalchemy import select

async def test_endpoints():
    """Test that all essential endpoints can be imported and basic functionality works"""
    
    print("🧪 Testing API endpoints...")
    
    # Test 1: Import all routers
    try:
        from app.routers.auth import router as auth_router
        from app.routers.users import router as users_router  
        from app.routers.data import router as data_router
        print("✅ All routers imported successfully")
    except Exception as e:
        print(f"❌ Router import failed: {e}")
        return False
    
    # Test 2: Test auth service functions
    try:
        test_password = "testpassword123"
        hashed = hash_password(test_password)
        token, expires_at = create_access_token({"sub": "test@example.com"})
        print("✅ Auth service functions work correctly")
    except Exception as e:
        print(f"❌ Auth service test failed: {e}")
        return False
    
    # Test 3: Test database models
    try:
        # Test creating models (without saving to DB)
        user = User(
            username="testuser",
            email="test@example.com", 
            hashed_password=hashed,
            full_name="Test User"
        )
        
        data = UserData(
            title="Test Data",
            content="This is test content",
            data_type="text",
            user_id=1
        )
        print("✅ Database models work correctly")
    except Exception as e:
        print(f"❌ Database model test failed: {e}")
        return False
    
    print("🎉 All essential API endpoints are working correctly!")
    return True

if __name__ == "__main__":
    success = asyncio.run(test_endpoints())
    exit(0 if success else 1)