@echo off
:: Data Pilot - Comprehensive Test Script for Windows
:: This script runs all tests and verifies the application works correctly

title Data Pilot Test Suite

echo ===============================================================
echo.
echo    DATA PILOT - Comprehensive Test Suite
echo.
echo ===============================================================
echo.

:: Create logs directory if it doesn't exist
if not exist logs mkdir logs

:: Check if Python is installed
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Python is not installed or not in PATH.
    pause
    exit /b 1
)

:: Check if pytest is installed
python -c "import pytest" > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Installing pytest...
    pip install pytest pytest-playwright > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to install pytest.
        pause
        exit /b 1
    )
)

:: Check if the application is running
echo Checking if the application is running...
curl -s -f http://localhost:8081/health > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Application is not running. Starting the application...
    start "Data Pilot Startup" cmd /c "run.bat"
    
    :: Wait for the application to start
    echo Waiting for the application to start...
    timeout /t 10 /nobreak > nul
    
    :: Check if the application started successfully
    curl -s -f http://localhost:8081/health > nul 2>&1
    if %ERRORLEVEL% NEQ 0 (
        echo Error: Failed to start the application.
        pause
        exit /b 1
    )
    
    echo Application started successfully.
) else (
    echo Application is already running.
)

echo.
echo Running unit tests...
python -m pytest tests\test_auth.py tests\test_data.py -v > logs\unit_tests.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Unit tests failed. Check logs\unit_tests.log for details.
    type logs\unit_tests.log
) else (
    echo Unit tests passed successfully.
)

echo.
echo Running integration tests...
python -m pytest tests\test_integration.py -v > logs\integration_tests.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: Integration tests failed. Check logs\integration_tests.log for details.
    type logs\integration_tests.log
) else (
    echo Integration tests passed successfully.
)

echo.
echo Running end-to-end tests...
python -m pytest tests\test_e2e.py -v > logs\e2e_tests.log 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Error: End-to-end tests failed. Check logs\e2e_tests.log for details.
    type logs\e2e_tests.log
) else (
    echo End-to-end tests passed successfully.
)

echo.
echo All tests completed. Check the logs for details.
echo.

pause