"""
System Integration Tests for Data Pilot Application

This module contains tests that verify the complete system integration,
including startup scripts, backend API, frontend UI, and database operations.

Author: Kenan AY
Project: Data Pilot
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
"""

# pyright: reportAttributeAccessIssue=false

import os
import time
import subprocess
import requests
import pytest
import signal
import platform
import sys
from typing import Any, Optional, cast
from playwright.sync_api import sync_playwright, expect

# Configuration
BACKEND_URL = "http://localhost:8081"
FRONTEND_URL = "http://localhost:3002"
HEALTH_CHECK_URL = f"{BACKEND_URL}/health"
API_PREFIX = "/api"

# Test user credentials
TEST_USER = {
    "username": "systemtest",
    "email": "system@example.com",
    "password": "SystemTest123!",
    "full_name": "System Test User"
}

# Test data
TEST_DATA = {
    "title": "System Test Data",
    "content": "This is test data created during system integration testing",
    "data_type": "text"
}

@pytest.fixture(scope="module")
def start_application():
    """Start the application using the appropriate startup script"""
    # Determine the appropriate startup script based on the platform
    if platform.system() == "Windows":
        startup_script = "run.bat"
        # Windows-specific command to run the batch file
        process = subprocess.Popen(
            ["cmd", "/c", startup_script],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            creationflags=subprocess.CREATE_NEW_CONSOLE
        )
    else:
        startup_script = "./run.sh"
        # Make sure the script is executable
        os.chmod(startup_script, 0o755)
        # Create process with platform-specific settings
        try:
            # Try Unix-specific approach first
            if platform.system() != "Windows":
                process = subprocess.Popen(
                    [startup_script],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    preexec_fn=os.setsid if hasattr(os, 'setsid') else None
                )
            else:
                # Windows approach
                process = subprocess.Popen(
                    [startup_script],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE
                )
        except AttributeError:
            # Fallback if any attribute error occurs
            process = subprocess.Popen(
                [startup_script],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
    
    # Wait for the application to start
    print(f"Waiting for application to start...")
    max_attempts = 30
    attempts = 0
    
    while attempts < max_attempts:
        try:
            response = requests.get(HEALTH_CHECK_URL, timeout=2)
            if response.status_code == 200:
                print(f"Application started successfully after {attempts + 1} attempts")
                break
        except requests.RequestException:
            pass
        
        attempts += 1
        time.sleep(1)
        
    if attempts >= max_attempts:
        # Kill the process if it failed to start
        if platform.system() == "Windows":
            process.terminate()
        else:
            # Check if killpg is available (Unix systems)
            if hasattr(os, 'killpg') and hasattr(os, 'getpgid'):
                os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            else:
                process.terminate()
        pytest.fail("Application failed to start within the timeout period")
    
    # Return the process so it can be terminated after the tests
    yield process
    
    # Terminate the process after the tests
    print("Terminating application...")
    if platform.system() == "Windows":
        # On Windows, we need to use taskkill to terminate the process tree
        subprocess.run(["taskkill", "/F", "/T", "/PID", str(process.pid)])
    else:
        # On Unix, we can use the process group ID to terminate all processes
        if hasattr(os, 'killpg') and hasattr(os, 'getpgid'):
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
        else:
            process.terminate()
    
    print("Application terminated")

def test_health_check(start_application):
    """Test that the health check endpoint returns a 200 status code"""
    response = requests.get(HEALTH_CHECK_URL)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data["services"]
    assert "api" in data["services"]

def test_api_root():
    """Test that the API root endpoint returns a 200 status code"""
    response = requests.get(BACKEND_URL)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert "message" in data
    assert "version" in data

def test_frontend_loads():
    """Test that the frontend loads correctly"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to the frontend
        page.goto(FRONTEND_URL)
        
        # Check that the page loaded successfully
        assert page.title() != ""
        
        # Check for common elements that should be present
        assert page.locator("text=Login").count() > 0 or page.locator("text=Register").count() > 0
        
        browser.close()

def test_complete_user_workflow():
    """Test the complete user workflow from registration to data management"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Step 1: Register a new user
        page.goto(f"{FRONTEND_URL}/register")
        
        # Generate a unique username and email to avoid conflicts
        unique_suffix = str(int(time.time()))
        unique_username = f"{TEST_USER['username']}_{unique_suffix}"
        unique_email = f"system_{unique_suffix}@example.com"
        
        # Fill the registration form
        page.fill("input[name='username']", unique_username)
        page.fill("input[name='email']", unique_email)
        page.fill("input[name='full_name']", TEST_USER['full_name'])
        page.fill("input[name='password']", TEST_USER['password'])
        
        # Submit the form
        page.click("button[type='submit']")
        
        # Wait for registration to complete and redirect to login
        page.wait_for_url(f"{FRONTEND_URL}/login")
        
        # Step 2: Login with the new user
        page.fill("input[name='email']", unique_email)
        page.fill("input[name='password']", TEST_USER['password'])
        page.click("button[type='submit']")
        
        # Wait for login to complete and redirect to dashboard
        page.wait_for_url(f"{FRONTEND_URL}/dashboard")
        
        # Step 3: Create a new data item
        page.fill("input[name='title']", TEST_DATA['title'])
        page.fill("textarea[name='content']", TEST_DATA['content'])
        page.select_option("select[name='data_type']", TEST_DATA['data_type'])
        page.click("button:has-text('Save Data')")
        
        # Wait for the data to be saved
        page.wait_for_selector("text=Data saved successfully")
        
        # Step 4: Verify the data is displayed
        assert page.locator(f"text={TEST_DATA['title']}").count() > 0
        assert page.locator(f"text={TEST_DATA['content']}").count() > 0
        
        # Step 5: Update the data
        updated_title = f"{TEST_DATA['title']} (Updated)"
        updated_content = f"{TEST_DATA['content']} (Updated)"
        
        # Click the edit button
        page.click("button:has-text('Edit')")
        
        # Fill the edit form
        page.fill("input[name='title']", updated_title)
        page.fill("textarea[name='content']", updated_content)
        page.click("button:has-text('Update')")
        
        # Wait for the data to be updated
        page.wait_for_selector("text=Data updated successfully")
        
        # Verify the updated data is displayed
        assert page.locator(f"text={updated_title}").count() > 0
        assert page.locator(f"text={updated_content}").count() > 0
        
        # Step 6: Delete the data
        page.click("button:has-text('Delete')")
        page.click("button:has-text('Confirm')")
        
        # Wait for the data to be deleted
        page.wait_for_selector("text=Data deleted successfully")
        
        # Verify the data is no longer displayed
        assert page.locator(f"text={updated_title}").count() == 0
        
        # Step 7: Logout
        page.click("button:has-text('Logout')")
        
        # Wait for logout to complete and redirect to login
        page.wait_for_url(f"{FRONTEND_URL}/login")
        
        browser.close()

def test_error_handling():
    """Test that the application handles errors correctly"""
    # Test API error handling
    response = requests.get(f"{BACKEND_URL}/api/nonexistent")
    assert response.status_code == 404
    
    # Test authentication error handling
    response = requests.get(f"{BACKEND_URL}/api/data", headers={"Authorization": "Bearer invalid_token"})
    assert response.status_code == 401
    
    # Test frontend error handling
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        # Navigate to a non-existent page
        page.goto(f"{FRONTEND_URL}/nonexistent")
        
        # Check that we're redirected to a 404 page or the home page
        assert page.url == f"{FRONTEND_URL}/404" or page.url == FRONTEND_URL
        
        browser.close()

def test_responsive_design():
    """Test that the frontend is responsive"""
    with sync_playwright() as p:
        browser = p.chromium.launch()
        
        # Test on desktop
        desktop_page = browser.new_page(viewport={"width": 1280, "height": 800})
        desktop_page.goto(FRONTEND_URL)
        desktop_elements = desktop_page.locator("main").count()
        assert desktop_elements > 0
        
        # Test on tablet
        tablet_page = browser.new_page(viewport={"width": 768, "height": 1024})
        tablet_page.goto(FRONTEND_URL)
        tablet_elements = tablet_page.locator("main").count()
        assert tablet_elements > 0
        
        # Test on mobile
        mobile_page = browser.new_page(viewport={"width": 375, "height": 667})
        mobile_page.goto(FRONTEND_URL)
        mobile_elements = mobile_page.locator("main").count()
        assert mobile_elements > 0
        
        browser.close()

def test_performance():
    """Test the performance of the application"""
    # Test backend API response time
    start_time = time.time()
    requests.get(HEALTH_CHECK_URL)
    api_response_time = time.time() - start_time
    
    # API should respond within 500ms
    assert api_response_time < 0.5, f"API response time too slow: {api_response_time:.2f}s"
    
    # Test frontend load time
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        
        start_time = time.time()
        page.goto(FRONTEND_URL)
        frontend_load_time = time.time() - start_time
        
        # Frontend should load within 3 seconds
        assert frontend_load_time < 3, f"Frontend load time too slow: {frontend_load_time:.2f}s"
        
        browser.close()

if __name__ == "__main__":
    pytest.main(["-v", __file__])