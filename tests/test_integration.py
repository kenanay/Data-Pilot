import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.models.base import Base
from app.dependencies import get_db

# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create tables in the test database
Base.metadata.create_all(bind=engine)

# Override the get_db dependency to use the test database
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

# Test data
test_user = {
    "username": "integrationuser",
    "email": "integration@example.com",
    "password": "Password123!",
    "full_name": "Integration Test User"
}

test_data_items = [
    {
        "title": "First Test Item",
        "content": "This is the first test item content",
        "data_type": "text"
    },
    {
        "title": "Second Test Item",
        "content": "This is the second test item content",
        "data_type": "note"
    },
    {
        "title": "Third Test Item",
        "content": "This is the third test item content",
        "data_type": "idea"
    }
]

def test_full_user_workflow():
    """Test complete user workflow from registration to data management"""
    
    # Step 1: Register a new user
    register_response = client.post("/api/auth/register", json=test_user)
    assert register_response.status_code == 201
    user_data = register_response.json()
    assert user_data["username"] == test_user["username"]
    assert user_data["email"] == test_user["email"]
    
    # Step 2: Login with the new user
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    login_response = client.post("/api/auth/login", json=login_data)
    assert login_response.status_code == 200
    login_result = login_response.json()
    assert "access_token" in login_result
    token = login_result["access_token"]
    
    # Step 3: Get user profile
    profile_response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert profile_response.status_code == 200
    profile_data = profile_response.json()
    assert profile_data["email"] == test_user["email"]
    
    # Step 4: Create multiple data items
    created_items = []
    for item in test_data_items:
        create_response = client.post(
            "/api/data",
            json=item,
            headers={"Authorization": f"Bearer {token}"}
        )
        assert create_response.status_code == 201
        created_item = create_response.json()
        assert created_item["title"] == item["title"]
        assert created_item["content"] == item["content"]
        created_items.append(created_item)
    
    # Step 5: Get all data items
    get_all_response = client.get(
        "/api/data",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert get_all_response.status_code == 200
    all_items = get_all_response.json()
    assert len(all_items) >= len(created_items)
    
    # Step 6: Update a data item
    update_data = {
        "title": "Updated Integration Test Item",
        "content": "This content has been updated during integration testing",
        "data_type": "task"
    }
    update_response = client.put(
        f"/api/data/{created_items[0]['id']}",
        json=update_data,
        headers={"Authorization": f"Bearer {token}"}
    )
    assert update_response.status_code == 200
    updated_item = update_response.json()
    assert updated_item["title"] == update_data["title"]
    assert updated_item["content"] == update_data["content"]
    
    # Step 7: Filter data by type
    filter_response = client.get(
        "/api/data?data_type=note",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert filter_response.status_code == 200
    filtered_items = filter_response.json()
    assert all(item["data_type"] == "note" for item in filtered_items)
    
    # Step 8: Search data
    search_response = client.get(
        "/api/data?search=third",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert search_response.status_code == 200
    search_results = search_response.json()
    assert any("third" in item["title"].lower() or "third" in item["content"].lower() 
               for item in search_results)
    
    # Step 9: Delete a data item
    delete_response = client.delete(
        f"/api/data/{created_items[1]['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert delete_response.status_code == 200
    
    # Step 10: Verify deletion
    verify_response = client.get(
        f"/api/data/{created_items[1]['id']}",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert verify_response.status_code == 404
    
    # Step 11: Logout
    logout_response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert logout_response.status_code == 200
    
    # Step 12: Verify token is invalidated
    invalid_token_response = client.get(
        "/api/data",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert invalid_token_response.status_code == 401