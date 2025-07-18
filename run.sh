#!/bin/bash
# Data Pilot - Single Command Startup System
# This script launches both the backend and frontend services concurrently

# Color codes for terminal output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# ASCII Art Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║   ██████╗  █████╗ ████████╗ █████╗     ██████╗ ██╗██╗     ║"
echo "║   ██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗    ██╔══██╗██║██║     ║"
echo "║   ██║  ██║███████║   ██║   ███████║    ██████╔╝██║██║     ║"
echo "║   ██║  ██║██╔══██║   ██║   ██╔══██║    ██╔═══╝ ██║██║     ║"
echo "║   ██████╔╝██║  ██║   ██║   ██║  ██║    ██║     ██║███████╗║"
echo "║   ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝    ╚═╝     ╚═╝╚══════╝║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Function to check if a port is in use
port_in_use() {
  if command_exists lsof; then
    lsof -i:"$1" >/dev/null 2>&1
  elif command_exists netstat; then
    netstat -tuln | grep ":$1 " >/dev/null 2>&1
  else
    echo -e "${YELLOW}Warning: Cannot check if port $1 is in use. Missing lsof and netstat.${NC}"
    return 1
  fi
}

# Function to check if a service is healthy
check_health() {
  local url=$1
  local max_attempts=$2
  local attempt=1
  
  echo -e "${YELLOW}Checking health of $url...${NC}"
  
  while [ $attempt -le $max_attempts ]; do
    if curl -s -f "$url" >/dev/null 2>&1; then
      echo -e "${GREEN}Service at $url is healthy!${NC}"
      return 0
    fi
    
    echo -e "${YELLOW}Attempt $attempt/$max_attempts: Service at $url not ready yet...${NC}"
    attempt=$((attempt + 1))
    sleep 2
  done
  
  echo -e "${RED}Service at $url failed to become healthy after $max_attempts attempts.${NC}"
  return 1
}

# Function to open browser
open_browser() {
  local url=$1
  
  # Try to detect the OS and use the appropriate command
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$url"
  elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    # Windows
    start "$url"
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command_exists xdg-open; then
      xdg-open "$url"
    elif command_exists gnome-open; then
      gnome-open "$url"
    else
      echo -e "${YELLOW}Cannot open browser automatically. Please open $url manually.${NC}"
    fi
  else
    echo -e "${YELLOW}Cannot open browser automatically. Please open $url manually.${NC}"
  fi
}

# Check for required tools
echo -e "${BLUE}Checking required tools...${NC}"

if ! command_exists python; then
  echo -e "${RED}Error: Python is not installed or not in PATH.${NC}"
  exit 1
fi

if ! command_exists npm; then
  echo -e "${RED}Error: npm is not installed or not in PATH.${NC}"
  exit 1
fi

# Check if ports are already in use
BACKEND_PORT=8081
FRONTEND_PORT=3002

if port_in_use $BACKEND_PORT; then
  echo -e "${RED}Error: Port $BACKEND_PORT is already in use. Backend cannot start.${NC}"
  exit 1
fi

if port_in_use $FRONTEND_PORT; then
  echo -e "${RED}Error: Port $FRONTEND_PORT is already in use. Frontend cannot start.${NC}"
  exit 1
fi

# Create log directory if it doesn't exist
mkdir -p logs

# Start backend
echo -e "${BLUE}Starting backend server...${NC}"
if command_exists poetry; then
  # Use poetry if available
  poetry run uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > logs/backend.log 2>&1 &
else
  # Fall back to pip
  python -m uvicorn app.main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > logs/backend.log 2>&1 &
fi
BACKEND_PID=$!
echo -e "${GREEN}Backend started with PID: $BACKEND_PID${NC}"

# Start frontend
echo -e "${BLUE}Starting frontend server...${NC}"
cd frontend && npm start > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo -e "${GREEN}Frontend started with PID: $FRONTEND_PID${NC}"

# Return to the root directory
cd ..

# Wait for services to be healthy
echo -e "${BLUE}Waiting for services to be ready...${NC}"

# Check backend health
if check_health "http://localhost:$BACKEND_PORT/health" 10; then
  echo -e "${GREEN}Backend is ready!${NC}"
else
  echo -e "${RED}Backend failed to start properly. Check logs/backend.log for details.${NC}"
  # Kill processes if they're still running
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 1
fi

# Check frontend health
if check_health "http://localhost:$FRONTEND_PORT" 15; then
  echo -e "${GREEN}Frontend is ready!${NC}"
else
  echo -e "${RED}Frontend failed to start properly. Check logs/frontend.log for details.${NC}"
  # Kill processes if they're still running
  kill $BACKEND_PID 2>/dev/null
  kill $FRONTEND_PID 2>/dev/null
  exit 1
fi

# All services are ready
echo -e "${GREEN}All services are up and running!${NC}"
echo -e "${BLUE}Backend URL: ${NC}http://localhost:$BACKEND_PORT"
echo -e "${BLUE}Frontend URL: ${NC}http://localhost:$FRONTEND_PORT"

# Open browser
echo -e "${BLUE}Opening application in browser...${NC}"
open_browser "http://localhost:$FRONTEND_PORT"

# Setup trap to kill processes on script exit
trap 'echo -e "${YELLOW}Shutting down services...${NC}"; kill $BACKEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null; echo -e "${GREEN}Services stopped.${NC}"; exit 0' INT TERM

# Keep the script running to maintain the processes
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
wait