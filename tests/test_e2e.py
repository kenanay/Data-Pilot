import pytest
from playwright.sync_api import Page, expect
import time

# Base URL for the application
BASE_URL = "http://localhost:3000"

# Test user credentials
TEST_USER = {
    "username": "e2euser",
    "email": "e2e@example.com",
    "password": "Password123!",
    "full_name": "E2E Test User"
}

# Test data
TEST_DATA = {
    "title": "E2E Test Data",
    "content": "This is a test data item created during E2E testing",
    "data_type": "text"
}

@pytest.fixture(scope="module")
def registered_user(page: Page):
    """Register a test user for E2E tests"""
    # Navigate to the registration page
    page.goto(f"{BASE_URL}/register")
    
    # Fill the registration form
    page.fill("input[name='username']", TEST_USER["username"])
    page.fill("input[name='email']", TEST_USER["email"])
    page.fill("input[name='full_name']", TEST_USER["full_name"])
    page.fill("input[name='password']", TEST_USER["password"])
    
    # Submit the form
    page.click("button[type='submit']")
    
    # Wait for registration to complete and redirect to login
    page.wait_for_url(f"{BASE_URL}/login")
    
    # Check for success message
    expect(page.locator("text=Registration successful")).to_be_visible()
    
    yield TEST_USER

@pytest.fixture(scope="module")
def logged_in_user(page: Page, registered_user):
    """Log in the test user"""
    # Navigate to the login page
    page.goto(f"{BASE_URL}/login")
    
    # Fill the login form
    page.fill("input[name='email']", TEST_USER["email"])
    page.fill("input[name='password']", TEST_USER["password"])
    
    # Submit the form
    page.click("button[type='submit']")
    
    # Wait for login to complete and redirect to dashboard
    page.wait_for_url(f"{BASE_URL}/dashboard")
    
    # Check for user welcome message
    expect(page.locator(f"text=Welcome, {TEST_USER['username']}")).to_be_visible()
    
    yield TEST_USER

def test_user_registration(page: Page):
    """Test user registration flow"""
    # Navigate to the registration page
    page.goto(f"{BASE_URL}/register")
    
    # Check if registration form is displayed
    expect(page.locator("text=Create your account")).to_be_visible()
    
    # Fill the registration form with unique username and email
    unique_username = f"user_{int(time.time())}"
    unique_email = f"user_{int(time.time())}@example.com"
    
    page.fill("input[name='username']", unique_username)
    page.fill("input[name='email']", unique_email)
    page.fill("input[name='full_name']", "Test User")
    page.fill("input[name='password']", "Password123!")
    
    # Submit the form
    page.click("button[type='submit']")
    
    # Wait for registration to complete and redirect to login
    page.wait_for_url(f"{BASE_URL}/login")
    
    # Check for success message
    expect(page.locator("text=Registration successful")).to_be_visible()

def test_user_login(page: Page, registered_user):
    """Test user login flow"""
    # Navigate to the login page
    page.goto(f"{BASE_URL}/login")
    
    # Check if login form is displayed
    expect(page.locator("text=Sign in to your account")).to_be_visible()
    
    # Fill the login form
    page.fill("input[name='email']", registered_user["email"])
    page.fill("input[name='password']", registered_user["password"])
    
    # Submit the form
    page.click("button[type='submit']")
    
    # Wait for login to complete and redirect to dashboard
    page.wait_for_url(f"{BASE_URL}/dashboard")
    
    # Check for user welcome message
    expect(page.locator(f"text=Welcome, {registered_user['username']}")).to_be_visible()

def test_create_data(page: Page, logged_in_user):
    """Test creating a data item"""
    # Navigate to the dashboard
    page.goto(f"{BASE_URL}/dashboard")
    
    # Fill the data form
    page.fill("input[name='title']", TEST_DATA["title"])
    page.fill("textarea[name='content']", TEST_DATA["content"])
    page.select_option("select[name='data_type']", TEST_DATA["data_type"])
    
    # Submit the form
    page.click("button:has-text('Save Data')")
    
    # Check for success message
    expect(page.locator("text=Data saved successfully")).to_be_visible()
    
    # Check if the data item is displayed in the list
    expect(page.locator(f"text={TEST_DATA['title']}")).to_be_visible()
    expect(page.locator(f"text={TEST_DATA['content']}")).to_be_visible()

def test_filter_data(page: Page, logged_in_user):
    """Test filtering data by type"""
    # Navigate to the dashboard
    page.goto(f"{BASE_URL}/dashboard")
    
    # Create a note type data item
    note_data = {
        "title": "E2E Test Note",
        "content": "This is a test note created during E2E testing",
        "data_type": "note"
    }
    
    # Fill the data form
    page.fill("input[name='title']", note_data["title"])
    page.fill("textarea[name='content']", note_data["content"])
    page.select_option("select[name='data_type']", note_data["data_type"])
    
    # Submit the form
    page.click("button:has-text('Save Data')")
    
    # Wait for the data to be saved
    expect(page.locator("text=Data saved successfully")).to_be_visible()
    
    # Filter by note type
    page.click("button:has-text('Filter')")
    page.select_option("select[name='filter_type']", "note")
    page.click("button:has-text('Apply')")
    
    # Check if only note type items are displayed
    expect(page.locator(f"text={note_data['title']}")).to_be_visible()
    expect(page.locator(f"text={TEST_DATA['title']}")).not_to_be_visible()

def test_search_data(page: Page, logged_in_user):
    """Test searching data"""
    # Navigate to the dashboard
    page.goto(f"{BASE_URL}/dashboard")
    
    # Search for the test data
    page.fill("input[name='search']", TEST_DATA["title"])
    page.press("input[name='search']", "Enter")
    
    # Check if only matching items are displayed
    expect(page.locator(f"text={TEST_DATA['title']}")).to_be_visible()

def test_delete_data(page: Page, logged_in_user):
    """Test deleting a data item"""
    # Navigate to the dashboard
    page.goto(f"{BASE_URL}/dashboard")
    
    # Find and click the delete button for the test data
    delete_button = page.locator(f"text={TEST_DATA['title']}").locator("xpath=../..").locator("button:has-text('Delete')")
    delete_button.click()
    
    # Confirm deletion in the modal
    page.click("button:has-text('Confirm')")
    
    # Check for success message
    expect(page.locator("text=Data deleted successfully")).to_be_visible()
    
    # Check if the data item is no longer displayed
    expect(page.locator(f"text={TEST_DATA['title']}")).not_to_be_visible()

def test_user_logout(page: Page, logged_in_user):
    """Test user logout flow"""
    # Navigate to the dashboard
    page.goto(f"{BASE_URL}/dashboard")
    
    # Click the logout button
    page.click("button:has-text('Logout')")
    
    # Wait for logout to complete and redirect to login
    page.wait_for_url(f"{BASE_URL}/login")
    
    # Check if login form is displayed
    expect(page.locator("text=Sign in to your account")).to_be_visible()
    
    # Try to access the dashboard again
    page.goto(f"{BASE_URL}/dashboard")
    
    # Should be redirected to login
    expect(page.url).to_contain("/login")
    expect(page.locator("text=Sign in to your account")).to_be_visible()