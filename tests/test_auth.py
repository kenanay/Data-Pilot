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
    "username": "testuser",
    "email": "test@example.com",
    "password": "Password123!",
    "full_name": "Test User"
}

# Fixtures
@pytest.fixture
def registered_user():
    # Register a test user
    response = client.post("/api/auth/register", json=test_user)
    assert response.status_code == 201
    return response.json()

@pytest.fixture
def auth_token(registered_user):
    # Login and get token
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    return response.json()["access_token"]

# Tests
def test_register_user():
    """Test user registration"""
    # Clear any existing users with the same email
    response = client.post("/api/auth/register", json={
        "username": "newuser",
        "email": "new@example.com",
        "password": "Password123!",
        "full_name": "New User"
    })
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["username"] == "newuser"
    assert data["email"] == "new@example.com"
    assert "password" not in data  # Password should not be returned

def test_register_duplicate_email():
    """Test registration with duplicate email"""
    # First registration
    client.post("/api/auth/register", json=test_user)
    
    # Second registration with same email
    response = client.post("/api/auth/register", json=test_user)
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()

def test_login_success(registered_user):
    """Test successful login"""
    login_data = {
        "email": test_user["email"],
        "password": test_user["password"]
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "token_type" in data
    assert data["token_type"] == "bearer"
    assert "user" in data
    assert data["user"]["email"] == test_user["email"]

def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    login_data = {
        "email": "wrong@example.com",
        "password": "WrongPassword123!"
    }
    response = client.post("/api/auth/login", json=login_data)
    assert response.status_code == 401
    assert "invalid" in response.json()["detail"].lower()

def test_get_current_user(auth_token):
    """Test getting current user info"""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["username"] == test_user["username"]

def test_get_current_user_invalid_token():
    """Test getting user info with invalid token"""
    response = client.get(
        "/api/auth/me",
        headers={"Authorization": "Bearer invalid_token"}
    )
    assert response.status_code == 401

def test_refresh_token(auth_token):
    """Test token refresh"""
    response = client.post(
        "/api/auth/refresh",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "user" in data

def test_logout(auth_token):
    """Test logout endpoint"""
    response = client.post(
        "/api/auth/logout",
        headers={"Authorization": f"Bearer {auth_token}"}
    )
    assert response.status_code == 200
    assert "success" in response.json()["message"].lower()