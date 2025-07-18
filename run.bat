@echo off
:: Data Pilot - Single Command Startup System for Windows
:: This script launches both the backend and frontend services concurrently

title Data Pilot Startup System

echo ===============================================================
echo.
echo    DATA PILOT - Application Startup System
echo.
echo ===============================================================
echo.

:: Create logs directory if it doesn't exist
if not exist logs mkdir logs

:: Check if required ports are available
echo Checking if ports are available...
netstat -ano | findstr ":8081" > nul
if %ERRORLEVEL% EQU 0 (
    echo Error: Port 8081 is already in use. Backend cannot start.
    echo Please close any application using port 8081 and try again.
    pause
    exit /b 1
)

netstat -ano | findstr ":3002" > nul
if %ERRORLEVEL% EQU 0 (
    echo Error: Port 3002 is already in use. Frontend cannot start.
    echo Please close any application using port 3002 and try again.
    pause
    exit /b 1
)

:: Start backend server
echo Starting backend server...
start "Data Pilot Backend" cmd /c "python -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload > logs\backend.log 2>&1"

:: Start frontend server
echo Starting frontend server...
pushd frontend
start "Data Pilot Frontend" cmd /c "npm start > ..\logs\frontend.log 2>&1"
popd

:: Wait for services to be healthy
echo Waiting for services to be ready...

:: Check backend health
echo Checking backend health (this may take a moment)...

set /a attempts=0
:checkBackend
if %attempts% geq 10 (
    echo Backend failed to start properly. Check logs\backend.log for details.
    pause
    exit /b 1
)

timeout /t 2 /nobreak > nul
curl -s -f http://localhost:8081/health > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set /a attempts+=1
    echo Waiting for backend to start... Attempt %attempts% of 10
    goto checkBackend
)

echo Backend is ready!

:: Check frontend health
echo Checking frontend health (this may take a moment)...

set /a attempts=0
:checkFrontend
if %attempts% geq 15 (
    echo Frontend failed to start properly. Check logs\frontend.log for details.
    pause
    exit /b 1
)

timeout /t 2 /nobreak > nul
curl -s -f http://localhost:3002 > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    set /a attempts+=1
    echo Waiting for frontend to start... Attempt %attempts% of 15
    goto checkFrontend
)

echo Frontend is ready!

:: All services are ready
echo All services are up and running!
echo.
echo Backend URL: http://localhost:8081
echo Frontend URL: http://localhost:3002
echo.

:: Open browser
echo Opening application in browser...
start "" http://localhost:3002

echo.
echo Press any key to stop all services and exit...
pause > nul

:: Kill processes when user presses a key
echo Shutting down services...
taskkill /f /fi "WINDOWTITLE eq Data Pilot Backend*" > nul 2>&1
taskkill /f /fi "WINDOWTITLE eq Data Pilot Frontend*" > nul 2>&1
echo Services stopped.

exit /b 0