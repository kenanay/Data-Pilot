# 🚀 Data Pilot v1.0.0

**A Modern Data Management Application with Authentication & Pipeline Processing**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/kenanay/data-pilot)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](COPYRIGHT_NOTICE.md)
[![Author](https://img.shields.io/badge/author-Kenan%20AY-green.svg)](mailto:kenanay34@gmail.com)

> **⚠️ IMPORTANT:** This is proprietary software developed by Kenan AY. Unauthorized use is prohibited.

## Features

- User authentication with JWT tokens
- Data management with CRUD operations
- Responsive React frontend
- FastAPI backend with SQLite database
- Single-command startup system
- Comprehensive testing suite

## Prerequisites

- Python 3.12 or higher
- Node.js 18 or higher
- npm 9 or higher

## Quick Start

### Windows

```bash
# Start the application (both backend and frontend)
run.bat
```

### macOS/Linux

```bash
# Make the script executable (first time only)
chmod +x run.sh

# Start the application (both backend and frontend)
./run.sh
```

The application will automatically:
1. Start the backend server on port 8081
2. Start the frontend server on port 3000
3. Check if both services are healthy
4. Open the application in your default browser

## Manual Setup

If you prefer to start the services manually:

### Backend

```bash
# Using Poetry (recommended)
poetry install
poetry run uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload

# Using pip
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

### Frontend

```bash
cd frontend
npm install
npm start
```

## Testing

The application includes a comprehensive testing suite to ensure all components work correctly.

### Running Tests

#### Windows

```bash
# Run all tests
run_tests.bat
```

#### macOS/Linux

```bash
# Make the script executable (first time only)
chmod +x run_tests.sh

# Run all tests
./run_tests.sh
```

### Test Types

- **Unit Tests**: Test individual components
- **Integration Tests**: Test API endpoints and database operations
- **End-to-End Tests**: Test complete user workflows
- **System Integration Tests**: Test the entire application stack

Test reports are generated in the `logs` directory.

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:8081/docs
- ReDoc: http://localhost:8081/redoc

## Project Structure

```
data_pilot/
├── app/                    # Backend application
│   ├── core/               # Core functionality
│   ├── crud/               # Database operations
│   ├── models/             # SQLAlchemy models
│   ├── routers/            # API routes
│   ├── schemas/            # Pydantic schemas
│   └── services/           # Business logic
├── frontend/               # React frontend
│   ├── public/             # Static files
│   └── src/                # React components
├── logs/                   # Application logs
├── tests/                  # Test files
│   ├── test_auth.py        # Authentication tests
│   ├── test_data.py        # Data management tests
│   ├── test_integration.py # API integration tests
│   ├── test_e2e.py         # End-to-end tests
│   └── test_system_integration.py # System integration tests
├── run.bat                 # Windows startup script
├── run.sh                  # Unix startup script
├── run_tests.bat           # Windows test script
└── run_tests.sh            # Unix test script
```

## Development

### Backend Development

The backend is built with FastAPI and SQLAlchemy. The main components are:

- **app/main.py**: Application entry point
- **app/routers/**: API endpoints
- **app/models/**: Database models
- **app/schemas/**: Request/response schemas
- **app/services/**: Business logic

### Frontend Development

The frontend is built with React and uses:

- **axios**: For API requests
- **react-router-dom**: For routing
- **tailwindcss**: For styling

## License

This project is licensed under the MIT License.