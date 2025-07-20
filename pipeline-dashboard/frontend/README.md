# Data Pipeline Dashboard Frontend

A modern React application for data processing pipeline management with real-time monitoring and interactive workflow control.

## 🚀 Features

- **Interactive Pipeline Stepper**: Visual progress tracking through 9 pipeline steps
- **Real-time Logging**: WebSocket-based live log streaming
- **File Upload & Processing**: Support for CSV, Excel, JSON, and Parquet files
- **Data Analysis & Visualization**: Built-in analytics and chart generation
- **Schema Validation**: JSON Schema and custom rule validation
- **Machine Learning**: Integrated ML model training and evaluation
- **Report Generation**: Automated report creation with multiple formats

## 🛠️ Tech Stack

- **React 18** - Modern React with hooks
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **Axios** - HTTP client with interceptors
- **Lucide React** - Beautiful icons
- **WebSocket** - Real-time communication

## 📦 Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔧 Development Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint errors automatically
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting

# Testing & Documentation
npm run test             # Run unit tests
npm run test:ui          # Run tests with UI
npm run storybook        # Start Storybook
npm run build-storybook  # Build Storybook
```

## 🌐 Environment Configuration

Copy `.env.example` to `.env` and configure:

```env
# API Configuration
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000

# Development Configuration
VITE_DEV_MODE=true
VITE_LOG_LEVEL=debug

# Feature Flags
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_ADVANCED_ANALYTICS=true
```

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── PipelineStepper.jsx
│   ├── PipelineCard.jsx
│   ├── LogPanel.jsx
│   ├── FileUpload.jsx
│   ├── DataPreview.jsx
│   ├── DataCleaning.jsx
│   ├── DataAnalysis.jsx
│   ├── DataVisualization.jsx
│   ├── MachineLearning.jsx
│   ├── ReportGeneration.jsx
│   ├── DataConversion.jsx
│   └── SchemaValidation.jsx
├── hooks/               # Custom React hooks
│   ├── usePipelineState.js
│   └── useLogs.js
├── services/            # API services
│   └── api.js
├── App.jsx             # Main application component
├── main.jsx            # Application entry point
└── App.css             # Global styles with Tailwind
```

## 🎨 Styling

This project uses **Tailwind CSS** with custom design tokens:

- **Colors**: Custom color palette with CSS variables
- **Components**: Reusable component classes
- **Utilities**: Custom utility classes for pipeline-specific styling

## 🔌 API Integration

The frontend communicates with a FastAPI backend:

- **REST API**: HTTP requests for data operations
- **WebSocket**: Real-time log streaming and state updates
- **File Upload**: Multipart form data handling
- **Error Handling**: Comprehensive error management with retry logic

## 📱 Responsive Design

- **Mobile-first**: Responsive design for all screen sizes
- **Touch-friendly**: Optimized for touch interactions
- **Accessibility**: ARIA labels and keyboard navigation

## 🧪 Testing

- **Unit Tests**: Component and hook testing with Vitest
- **Integration Tests**: API and WebSocket integration testing
- **Storybook**: Component documentation and visual testing

## 🚀 Deployment

```bash
# Build for production
npm run build

# The dist/ folder contains the built application
# Deploy to your preferred hosting service
```

## 📄 License

Proprietary - © 2025 Kenan AY - All rights reserved

## 👨‍💻 Author

**Kenan AY** - [kenanay34@gmail.com](mailto:kenanay34@gmail.com)