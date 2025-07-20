# Pipeline Dashboard Design Document

## Overview

Pipeline Dashboard is a comprehensive data processing platform that enables users to upload, process, analyze, and export data through a 9-step pipeline. The system consists of a modern React frontend with real-time updates and a robust FastAPI backend with state management and file processing capabilities.

The architecture follows a client-server model where all data processing occurs on the backend, with the frontend serving as an interactive dashboard for monitoring and controlling the pipeline operations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────┐    WebSocket/HTTP    ┌─────────────────────────────┐
│     React Frontend          │◄────────────────────►│      FastAPI Backend       │
│  - PipelineStepper          │                      │  - Pipeline Engine          │
│  - PipelineCard             │                      │  - File Processing          │
│  - LogPanel                 │                      │  - State Management         │
│  - AI Prompt Interface      │                      │  - ML/Analytics Engine      │
└─────────────────────────────┘                      └──────────────┬──────────────┘
                                                                     │
                                                      ┌──────────────▼──────────────┐
                                                      │     Storage Layer           │
                                                      │  - File Storage             │
                                                      │  - Snapshots                │
                                                      │  - Pipeline State           │
                                                      │  - Session Data             │
                                                      └─────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Radix UI for accessible components
- Lucide React for icons
- Axios for HTTP requests
- WebSocket for real-time updates

**Backend:**
- FastAPI with Python 3.11+
- Pydantic for data validation
- SQLModel for database operations
- Pandas for data processing
- Scikit-learn for ML operations
- Matplotlib/Plotly for visualizations
- WebSocket support for real-time logs

**Storage:**
- Local filesystem (development)
- S3/MinIO (production)
- SQLite (development) / PostgreSQL (production)

## Components and Interfaces

### Frontend Components

#### PipelineStepper Component

```typescript
interface PipelineStepperProps {
  currentStep: number;
  completedSteps: number[];
  errorSteps: number[];
  onStepClick: (stepIndex: number) => void;
  loading: boolean;
}

const PIPELINE_STEPS = [
  { id: 0, name: 'Upload', icon: '📁', description: 'Upload data file' },
  { id: 1, name: 'Preview', icon: '👁️', description: 'Preview data structure' },
  { id: 2, name: 'Clean', icon: '🧹', description: 'Clean and prepare data' },
  { id: 3, name: 'Analyze', icon: '📊', description: 'Statistical analysis' },
  { id: 4, name: 'Visualize', icon: '📈', description: 'Create visualizations' },
  { id: 5, name: 'Model', icon: '🤖', description: 'Machine learning models' },
  { id: 6, name: 'Report', icon: '📄', description: 'Generate reports' },
  { id: 7, name: 'Convert', icon: '🔄', description: 'Format conversion' },
  { id: 8, name: 'Schema', icon: '✅', description: 'Schema validation' }
];
```

**Features:**
- Horizontal stepper with progress indicators
- Click navigation to completed steps
- Visual status indicators (completed, active, error, pending)
- Responsive design for mobile devices
- Tooltips with step descriptions
- Loading states during operations

#### PipelineCard Component

```typescript
interface PipelineCardProps {
  stepTitle: string;
  status: 'pending' | 'active' | 'completed' | 'error';
  timestamp?: string;
  details: string;
  metrics?: Record<string, any>;
  onRollback?: () => void;
  onShowLog?: () => void;
  onRetry?: () => void;
}
```

**Features:**
- Status-based color coding
- Expandable details section
- Action buttons (rollback, retry, view logs)
- Metrics display for analysis steps
- Time tracking for operations
- Error message display with solutions

#### LogPanel Component

```typescript
interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: Record<string, any>;
  stepId?: number;
}

interface LogPanelProps {
  logs: LogEntry[];
  onLogClick: (log: LogEntry) => void;
  maxEntries?: number;
}
```

**Features:**
- Real-time log streaming via WebSocket
- Color-coded log levels
- Expandable log details
- Auto-scroll to latest entries
- Search and filter capabilities
- Export log functionality

#### AI Prompt Interface

```typescript
interface AIPromptProps {
  onPromptSubmit: (prompt: string) => void;
  isProcessing: boolean;
  suggestedPrompts: string[];
}
```

**Features:**
- Natural language input field
- Suggested prompt templates
- Prompt history and favorites
- Real-time parsing feedback
- Step sequence preview before execution

### Backend API Design

#### Core API Endpoints

```python
# File Management
POST /api/upload
GET /api/files/{file_id}/info
DELETE /api/files/{file_id}

# Pipeline Operations
GET /api/pipeline/state/{session_id}
POST /api/pipeline/preview
POST /api/pipeline/clean
POST /api/pipeline/analyze
POST /api/pipeline/visualize
POST /api/pipeline/model
POST /api/pipeline/report
POST /api/pipeline/convert
POST /api/pipeline/schema-validate

# State Management
POST /api/pipeline/rollback
GET /api/pipeline/snapshots/{session_id}
POST /api/pipeline/snapshot

# AI Integration
POST /api/ai/interpret
GET /api/ai/suggestions

# Real-time Communication
WebSocket /ws/logs/{session_id}
WebSocket /ws/pipeline/{session_id}
```

#### Pipeline State Schema

```python
class PipelineState(BaseModel):
    session_id: str
    user_id: str
    current_file_id: Optional[str]
    current_step: int
    steps: List[PipelineStep]
    snapshots: List[SnapshotInfo]
    created_at: datetime
    updated_at: datetime

class PipelineStep(BaseModel):
    step_id: int
    step_name: str
    status: StepStatus
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    parameters: Dict[str, Any]
    results: Optional[Dict[str, Any]]
    error_message: Optional[str]
    snapshot_id: Optional[str]

class SnapshotInfo(BaseModel):
    snapshot_id: str
    step_id: int
    timestamp: datetime
    file_path: str
    metadata: Dict[str, Any]
```

## Data Models

### File Processing Models

```python
class DataFile(BaseModel):
    file_id: str
    original_name: str
    file_type: str
    file_size: int
    upload_timestamp: datetime
    columns: List[str]
    row_count: int
    file_path: str

class CleaningOperation(BaseModel):
    operation_type: str  # 'fillna', 'drop_duplicates', 'remove_outliers'
    columns: List[str]
    parameters: Dict[str, Any]
    
class AnalysisResult(BaseModel):
    analysis_type: str
    results: Dict[str, Any]
    visualizations: List[str]
    
class ModelResult(BaseModel):
    model_type: str
    target_column: str
    feature_columns: List[str]
    metrics: Dict[str, float]
    model_path: str
```

### WebSocket Message Models

```python
class LogMessage(BaseModel):
    type: str = "log"
    level: str
    message: str
    timestamp: datetime
    session_id: str
    step_id: Optional[int]

class StateUpdateMessage(BaseModel):
    type: str = "state_update"
    session_id: str
    current_step: int
    step_status: str
    
class ProgressMessage(BaseModel):
    type: str = "progress"
    session_id: str
    step_id: int
    progress: float  # 0.0 to 1.0
    message: str
```

## Error Handling

### Error Classification

```python
class PipelineError(Exception):
    def __init__(self, code: str, message: str, details: Dict = None):
        self.code = code
        self.message = message
        self.details = details or {}

# Error Categories
class FileError(PipelineError):
    """File upload, reading, or format errors"""
    
class DataError(PipelineError):
    """Data processing and validation errors"""
    
class ModelError(PipelineError):
    """Machine learning model errors"""
    
class SystemError(PipelineError):
    """System and infrastructure errors"""
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILE_FORMAT",
    "message": "The uploaded file format is not supported",
    "details": {
      "supported_formats": ["csv", "xlsx", "json", "parquet"],
      "received_format": "txt"
    },
    "suggestions": [
      "Convert your file to CSV format",
      "Check file extension matches content"
    ]
  }
}
```

### Frontend Error Handling Strategy

1. **Global Error Boundary**: Catch and display unexpected React errors
2. **API Error Interceptor**: Standardize API error handling
3. **Toast Notifications**: Show user-friendly error messages
4. **Retry Mechanisms**: Automatic retry for transient errors
5. **Fallback UI**: Graceful degradation when components fail

## Testing Strategy

### Frontend Testing

**Unit Tests (Vitest)**
- Component rendering and props
- Hook functionality
- Utility functions
- State management

**Integration Tests (React Testing Library)**
- Component interactions
- API integration
- WebSocket connections
- User workflows

**E2E Tests (Playwright)**
- Complete pipeline workflows
- Cross-browser compatibility
- Mobile responsiveness
- Error scenarios

### Backend Testing

**Unit Tests (pytest)**
- Individual function testing
- Data processing logic
- Model training and evaluation
- Utility functions

**Integration Tests (FastAPI TestClient)**
- API endpoint testing
- Database operations
- File processing workflows
- WebSocket functionality

**Load Tests (Locust)**
- Concurrent user handling
- File upload performance
- Pipeline processing under load
- WebSocket scalability

### Test Data Strategy

```python
# Test fixtures for different data scenarios
@pytest.fixture
def sample_csv_data():
    return pd.DataFrame({
        'age': [25, 30, None, 45, 35],
        'income': [50000, 60000, 55000, None, 70000],
        'category': ['A', 'B', 'A', 'C', 'B']
    })

@pytest.fixture
def corrupted_data():
    # Data with various quality issues
    pass

@pytest.fixture
def large_dataset():
    # Performance testing data
    pass
```

## Security Considerations

### Authentication and Authorization

```python
# JWT Token Structure
{
  "sub": "user_id",
  "exp": 1234567890,
  "iat": 1234567890,
  "permissions": ["upload", "process", "export"],
  "session_id": "session_uuid"
}

# Route Protection
@router.post("/api/pipeline/clean")
async def clean_data(
    request: CleanRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session)
):
    # Verify user owns the session
    if session.user_id != current_user.id:
        raise HTTPException(403, "Access denied")
```

### Data Security

1. **File Storage**: Encrypted at rest, user-isolated directories
2. **Data Processing**: In-memory processing with secure cleanup
3. **Snapshots**: Encrypted and time-limited retention
4. **Logs**: Sanitized to remove sensitive data
5. **API Security**: Rate limiting, input validation, CORS configuration

### Privacy Considerations

- No data stored in browser localStorage
- Automatic session cleanup after inactivity
- User data isolation and access controls
- Audit logging for compliance
- GDPR-compliant data deletion

## Performance Optimization

### Frontend Optimization

1. **Code Splitting**: Lazy load pipeline step components
2. **Memoization**: React.memo for expensive components
3. **Virtual Scrolling**: For large log displays
4. **Debounced Updates**: Reduce WebSocket message frequency
5. **Progressive Loading**: Show partial results during processing

### Backend Optimization

1. **Async Processing**: Non-blocking I/O for file operations
2. **Caching**: Redis for session state and frequent queries
3. **Streaming**: Large file processing with generators
4. **Connection Pooling**: Database and external service connections
5. **Background Tasks**: Celery for long-running operations

### Scalability Design

```python
# Horizontal scaling considerations
class PipelineProcessor:
    def __init__(self, worker_id: str):
        self.worker_id = worker_id
        self.redis_client = Redis()
        
    async def process_step(self, session_id: str, step_id: int):
        # Distributed lock for session processing
        async with self.redis_client.lock(f"session:{session_id}"):
            # Process step
            pass
```

## Monitoring and Observability

### Metrics Collection

```python
# Key metrics to track
- Pipeline completion rates by step
- Average processing time per step
- Error rates and types
- User session duration
- File upload success rates
- WebSocket connection stability
```

### Logging Strategy

```python
import structlog

logger = structlog.get_logger()

# Structured logging example
logger.info(
    "pipeline_step_completed",
    session_id=session_id,
    step_name="clean",
    duration_ms=1250,
    rows_processed=10000,
    user_id=user.id
)
```

### Health Checks

```python
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "version": "1.0.0",
        "services": {
            "database": await check_database(),
            "storage": await check_storage(),
            "redis": await check_redis()
        }
    }
```

This design provides a solid foundation for building a scalable, maintainable, and user-friendly pipeline dashboard that meets all the specified requirements while following modern development best practices.