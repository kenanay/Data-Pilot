import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base
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
    "username": "datauser",
    "email": "data@example.com",
    "password": "Password123!",
    "full_name": "Data User"
}

test_data_item = {
    "title": "Test Data",
    "content": "This is test content for data operations",
    "data_type": "text"
}

# Fixtures
@pytest.fixture
def auth_token():
    # Register a test user
    client.post("/api/auth/register", json=test_user)
    
    # Login and get token
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    return response.json()["access_token"]

@pytest.fixture
def created_data_item(auth_token):
    # Create a data item
    response = client.post(
        "/api/data",
        json=test_data_item,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    return response.json()

# Tests

def test_create_data(auth_token):
    """Test creating a data item"""
    response = client.post(
        "/api/data",
        json=test_data_item,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["title"] == test_data_item["title"]
    assert data["content"] == test_data_item["content"]
    assert data["data_type"] == test_data_item["data_type"]
    assert "created_at" in data
    assert "user_id" in data

def test_create_data_unauthorized():
    """Test creating data without authentication"""
    response = client.post("/api/data", json=test_data_item)
    assert response.status_code == 401

def test_get_all_data(auth_token, created_data_item):
    """Test getting all data items"""
    response = client.get(
        "/api/data",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    
    # Check if the created item is in the list
    item_ids = [item["id"] for item in data]
    assert created_data_item["id"] in item_ids

def test_get_data_by_id(auth_token, created_data_item):
    """Test getting a specific data item by ID"""
    response = client.get(
        f"/api/data/{created_data_item['id']}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_data_item["id"]
    assert data["title"] == created_data_item["title"]
    assert data["content"] == created_data_item["content"]

def test_get_nonexistent_data(auth_token):
    """Test getting a non-existent data item"""
    response = client.get(
        "/api/data/999999",  # Non-existent ID
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 404

def test_update_data(auth_token, created_data_item):
    """Test updating a data item"""
    updated_data = {
        "title": "Updated Title",
        "content": "This content has been updated",
        "data_type": "note"
    }
    response = client.put(
        f"/api/data/{created_data_item['id']}",
        json=updated_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_data_item["id"]
    assert data["title"] == updated_data["title"]
    assert data["content"] == updated_data["content"]
    assert data["data_type"] == updated_data["data_type"]

def test_partial_update_data(auth_token, created_data_item):
    """Test partially updating a data item"""
    updated_data = {
        "title": "Partially Updated Title"
    }
    response = client.patch(
        f"/api/data/{created_data_item['id']}",
        json=updated_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == created_data_item["id"]
    assert data["title"] == updated_data["title"]
    # Content should remain unchanged
    assert data["content"] == created_data_item["content"]

def test_delete_data(auth_token, created_data_item):
    """Test deleting a data item"""
    response = client.delete(
        f"/api/data/{created_data_item['id']}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    
    # Verify it's deleted
    response = client.get(
        f"/api/data/{created_data_item['id']}",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 404

def test_delete_nonexistent_data(auth_token):
    """Test deleting a non-existent data item"""
    response = client.delete(
        "/api/data/999999",  # Non-existent ID
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 404

def test_filter_data_by_type(auth_token, created_data_item):
    """Test filtering data by type"""
    # Create another data item with different type
    other_data = {
        "title": "Another Test Data",
        "content": "This is another test content",
        "data_type": "note"
    }
    client.post(
        "/api/data",
        json=other_data,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # Filter by text type
    response = client.get(
        "/api/data?data_type=text",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert all(item["data_type"] == "text" for item in data)
    
    # Filter by note type
    response = client.get(
        "/api/data?data_type=note",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert all(item["data_type"] == "note" for item in data)

def test_search_data(auth_token):
    """Test searching data by title or content"""
    # Create data items with specific content for searching
    search_data1 = {
        "title": "Unique Title",
        "content": "Regular content",
        "data_type": "text"
    }
    search_data2 = {
        "title": "Regular Title",
        "content": "Unique content",
        "data_type": "text"
    }
    client.post(
        "/api/data",
        json=search_data1,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    client.post(
        "/api/data",
        json=search_data2,
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    
    # Search by title
    response = client.get(
        "/api/data?search=Unique Title",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert any(item["title"] == "Unique Title" for item in data)
    
    # Search by content
    response = client.get(
        "/api/data?search=Unique content",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert any(item["content"] == "Unique content" for item in data)