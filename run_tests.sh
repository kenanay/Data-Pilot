#!/bin/bash
# Data Pilot - Comprehensive Test Script
# This script runs all tests and verifies the application works correctly

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
echo "║                   TEST SUITE                              ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Function to check if a command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if Python is installed
if ! command_exists python; then
  echo -e "${RED}Error: Python is not installed or not in PATH.${NC}"
  exit 1
fi

# Check if pytest is installed
if ! python -c "import pytest" &> /dev/null; then
  echo -e "${YELLOW}Installing pytest...${NC}"
  pip install pytest pytest-playwright &> /dev/null
  if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to install pytest.${NC}"
    exit 1
  fi
fi

# Check if the application is running
echo -e "${BLUE}Checking if the application is running...${NC}"
if ! curl -s -f http://localhost:8081/health &> /dev/null; then
  echo -e "${YELLOW}Application is not running. Starting the application...${NC}"
  
  # Start the application in the background
  ./run.sh &
  APP_PID=$!
  
  # Wait for the application to start
  echo -e "${YELLOW}Waiting for the application to start...${NC}"
  sleep 10
  
  # Check if the application started successfully
  if ! curl -s -f http://localhost:8081/health &> /dev/null; then
    echo -e "${RED}Error: Failed to start the application.${NC}"
    kill $APP_PID 2>/dev/null
    exit 1
  fi
  
  echo -e "${GREEN}Application started successfully.${NC}"
else
  echo -e "${GREEN}Application is already running.${NC}"
fi

echo
echo -e "${BLUE}Running unit tests...${NC}"
python -m pytest tests/test_auth.py tests/test_data.py -v > logs/unit_tests.log 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Unit tests failed. Check logs/unit_tests.log for details.${NC}"
  cat logs/unit_tests.log
else
  echo -e "${GREEN}Unit tests passed successfully.${NC}"
fi

echo
echo -e "${BLUE}Running integration tests...${NC}"
python -m pytest tests/test_integration.py -v > logs/integration_tests.log 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: Integration tests failed. Check logs/integration_tests.log for details.${NC}"
  cat logs/integration_tests.log
else
  echo -e "${GREEN}Integration tests passed successfully.${NC}"
fi

echo
echo -e "${BLUE}Running end-to-end tests...${NC}"
python -m pytest tests/test_e2e.py -v > logs/e2e_tests.log 2>&1
if [ $? -ne 0 ]; then
  echo -e "${RED}Error: End-to-end tests failed. Check logs/e2e_tests.log for details.${NC}"
  cat logs/e2e_tests.log
else
  echo -e "${GREEN}End-to-end tests passed successfully.${NC}"
fi

echo
echo -e "${GREEN}All tests completed. Check the logs for details.${NC}"
echo

# Make the script executable
chmod +x run_tests.sh