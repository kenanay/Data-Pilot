# 🔄 Data Pipeline Dashboard v1.0.0

**Advanced Data Processing Pipeline with Visual Workflow Management**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/kenanay/data-pipeline-dashboard)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](../COPYRIGHT_NOTICE.md)
[![Author](https://img.shields.io/badge/author-Kenan%20AY-green.svg)](mailto:kenanay34@gmail.com)

> **⚠️ IMPORTANT:** This is proprietary software developed by Kenan AY. Part of Data Pilot Suite.

## Features

- 📊 **9-Step Pipeline**: Upload → Preview → Clean → Analyze → Visualize → Model → Report → Convert → Schema
- 🔄 **Visual Stepper**: Real-time progress tracking with interactive steps
- 📝 **Live Logging**: WebSocket-based real-time operation logs
- ↶ **Undo/Redo**: Snapshot-based rollback system
- 🤖 **AI Assistant**: Natural language command chains
- 🎨 **Modern UI**: React + Tailwind + Shadcn/UI components
- 🔒 **Secure**: JWT-based authentication
- 🧪 **Tested**: Comprehensive test suite with Storybook

## Architecture

```
┌─────────────────────┐    WebSocket    ┌──────────────────────┐
│   React Dashboard   │ ◄─────────────► │    FastAPI Backend   │
│ (Stepper + Cards)   │                 │   (Pipeline Engine)  │
└─────────────────────┘                 └──────────┬───────────┘
                                                   │
                                                   ▼
                                        ┌──────────────────────┐
                                        │   File Storage       │
                                        │ (Snapshots/Uploads)  │
                                        └──────────────────────┘
```

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm/yarn

### Installation

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8082

# Frontend
cd frontend
npm install
npm run dev
```

### Single Command Start

```bash
# Windows
run-pipeline.bat

# Linux/Mac
./run-pipeline.sh
```

## Pipeline Steps

| Step | Endpoint | Description |
|------|----------|-------------|
| 1. Upload | `POST /api/upload` | File upload with validation |
| 2. Preview | `GET /api/preview` | Data preview and summary |
| 3. Clean | `POST /api/clean` | Data cleaning operations |
| 4. Analyze | `POST /api/analyze` | Statistical analysis |
| 5. Visualize | `POST /api/visualize` | Chart generation |
| 6. Model | `POST /api/model` | ML model training |
| 7. Report | `POST /api/report` | PDF/HTML report generation |
| 8. Convert | `POST /api/convert` | Format conversion |
| 9. Schema | `POST /api/schema-validate` | Schema validation |

## AI Command Examples

```
"Upload sales.csv, clean missing values, create bar chart for revenue, generate PDF report"
```

Automatically converts to:
```json
{
  "steps": [
    {"endpoint": "/api/upload", "files": ["sales.csv"]},
    {"endpoint": "/api/clean", "body": {"action": "fillna"}},
    {"endpoint": "/api/visualize", "body": {"chart": "bar", "column": "revenue"}},
    {"endpoint": "/api/report", "body": {"format": "pdf"}}
  ]
}
```

## Development

### Storybook
```bash
npm run storybook
```

### Testing
```bash
# Backend tests
pytest

# Frontend tests
npm test

# E2E tests
npx playwright test
```

## Documentation

- [Complete Pipeline Documentation](../DATA_PILOT_PIPELINE_DOCUMENTATION.md)
- [API Reference](docs/api.md)
- [Component Library](docs/components.md)
- [Testing Guide](docs/testing.md)

---

**© 2025 Kenan AY - Data Pipeline Dashboard**
**Part of Data Pilot Suite - All Rights Reserved**