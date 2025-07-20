/*
Centralized Mock Factory for Test Infrastructure

Author: Kiro AI Assistant
Project: Data Pipeline Dashboard Test Infrastructure
*/

import React from 'react'
import { vi } from 'vitest'

/**
 * Create standardized API service mock
 */
export const createApiMock = () => ({
  // Data operations
  previewData: vi.fn().mockResolvedValue({
    success: true,
    data: {
      columns: [
        { name: 'id', data_type: 'integer' },
        { name: 'name', data_type: 'string' },
        { name: 'email', data_type: 'string' }
      ],
      rows: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
      ],
      total_rows: 2
    }
  }),

  // Schema validation
  validateSchema: vi.fn().mockResolvedValue({
    success: true,
    valid: true,
    errors: [],
    warnings: []
  }),

  // File operations
  getFileInfo: vi.fn().mockResolvedValue({
    success: true,
    file_id: 'test-file-id',
    filename: 'test-data.csv',
    size: 1024,
    columns: 3,
    rows: 100
  }),

  // Pipeline operations
  cleanData: vi.fn().mockResolvedValue({
    success: true,
    message: 'Data cleaned successfully',
    affected_rows: 10
  }),

  analyzeData: vi.fn().mockResolvedValue({
    success: true,
    statistics: {
      mean: 25.5,
      median: 24.0,
      std: 5.2
    }
  }),

  visualizeData: vi.fn().mockResolvedValue({
    success: true,
    chart_url: '/api/charts/test-chart.png'
  }),

  // AI prompt operations
  interpretPrompt: vi.fn().mockResolvedValue({
    success: true,
    steps: [
      {
        id: 'step-1',
        type: 'clean',
        name: 'Data Cleaning',
        parameters: {}
      }
    ]
  }),

  // Additional API methods for comprehensive coverage
  uploadFile: vi.fn().mockResolvedValue({
    success: true,
    file_id: 'test-file-id',
    filename: 'test-data.csv',
    message: 'File uploaded successfully'
  }),

  deleteFile: vi.fn().mockResolvedValue({
    success: true,
    message: 'File deleted successfully'
  }),

  getPipelineState: vi.fn().mockResolvedValue({
    success: true,
    state: 'ready',
    current_step: null,
    progress: 0
  }),

  modelData: vi.fn().mockResolvedValue({
    success: true,
    model_type: 'regression',
    accuracy: 0.95,
    metrics: {
      mse: 0.05,
      r2: 0.95
    }
  }),

  generateReport: vi.fn().mockResolvedValue({
    success: true,
    report_url: '/api/reports/test-report.pdf',
    report_id: 'test-report-id'
  }),

  convertData: vi.fn().mockResolvedValue({
    success: true,
    output_format: 'json',
    converted_file_id: 'converted-file-id'
  }),

  // State management methods
  rollbackToSnapshot: vi.fn().mockResolvedValue({
    success: true,
    message: 'Rolled back to snapshot successfully'
  }),

  getSnapshots: vi.fn().mockResolvedValue({
    success: true,
    snapshots: [
      {
        id: 'snapshot-1',
        name: 'After Data Cleaning',
        timestamp: Date.now(),
        step: 'clean'
      }
    ]
  }),

  createSnapshot: vi.fn().mockResolvedValue({
    success: true,
    snapshot_id: 'new-snapshot-id',
    message: 'Snapshot created successfully'
  }),

  // AI and suggestions
  getAISuggestions: vi.fn().mockResolvedValue({
    success: true,
    suggestions: [
      {
        type: 'data_quality',
        message: 'Consider removing null values',
        confidence: 0.8
      }
    ]
  }),

  // Health and monitoring
  healthCheck: vi.fn().mockResolvedValue({
    success: true,
    status: 'healthy',
    timestamp: Date.now()
  }),

  // Generic execution
  executeStep: vi.fn().mockResolvedValue({
    success: true,
    step_result: 'completed',
    message: 'Step executed successfully'
  })
})

/**
 * Create standardized hook mocks
 */
export const createHookMocks = () => ({
  useNotifications: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  })),

  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    user: {
      id: 'test-user-id',
      email: 'test@example.com',
      name: 'Test User'
    },
    login: vi.fn(),
    logout: vi.fn(),
    redirectToLogin: vi.fn()
  })),

  usePipelineUndoRedo: vi.fn(() => ({
    currentState: null,
    currentIndex: 0,
    history: [
      { id: 'state-1', name: 'Clean', timestamp: Date.now() },
      { id: 'state-2', name: 'Analyze', timestamp: Date.now() },
      { id: 'state-3', name: 'Visualize', timestamp: Date.now() }
    ],
    canUndo: true,
    canRedo: false,
    pushPipelineState: vi.fn(),
    undoPipelineOperation: vi.fn(),
    redoPipelineOperation: vi.fn(),
    jumpToState: vi.fn(),
    clearHistory: vi.fn(),
    undoPreview: {
      name: 'Clean',
      description: 'Undo data cleaning operation'
    }
  })),

  // Additional hook mocks
  usePipeline: vi.fn(() => ({
    currentStep: null,
    isLoading: false,
    error: null,
    executeStep: vi.fn(),
    resetPipeline: vi.fn(),
    getPipelineState: vi.fn()
  })),

  useFileUpload: vi.fn(() => ({
    uploadFile: vi.fn(),
    isUploading: false,
    uploadProgress: 0,
    uploadError: null
  })),

  useDataPreview: vi.fn(() => ({
    previewData: null,
    isLoading: false,
    error: null,
    loadPreview: vi.fn(),
    refreshPreview: vi.fn()
  })),

  useTheme: vi.fn(() => ({
    theme: 'light',
    toggleTheme: vi.fn(),
    setTheme: vi.fn()
  }))
})

/**
 * Create component mocks for complex dependencies
 */
export const createComponentMocks = () => ({
  ProtectedRoute: ({ children }) => children,
  AuthProvider: ({ children }) => children,
  ToastProvider: ({ children }) => children,
  ThemeProvider: ({ children }) => children,
  PipelineProvider: ({ children }) => children,
  ErrorBoundary: ({ children }) => children,
  LoadingSpinner: () => <div data-testid="loading-spinner">Loading...</div>,
  Modal: ({ children, isOpen }) => isOpen ? <div data-testid="modal">{children}</div> : null,
  Tooltip: ({ children, content }) => (
    <div data-testid="tooltip" title={content}>
      {children}
    </div>
  ),
  Chart: ({ data, type }) => (
    <div data-testid="chart" data-type={type}>
      Chart: {JSON.stringify(data)}
    </div>
  )
})

/**
 * Create browser API mocks
 */
export const createBrowserMocks = () => ({
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },

  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },

  fetch: vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({ success: true })
  }),

  WebSocket: vi.fn().mockImplementation(() => ({
    send: vi.fn(),
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    readyState: 1 // OPEN
  }))
})

/**
 * Reset all mocks - useful for test cleanup
 */
export const resetAllMocks = () => {
  vi.clearAllMocks()
}

/**
 * Create mock props factory for consistent test props
 */
export const createMockProps = (overrides = {}) => ({
  fileId: 'test-file-id',
  sessionId: 'test-session-id',
  onSuccess: vi.fn(),
  onError: vi.fn(),
  onComplete: vi.fn(),
  className: 'test-class',
  ...overrides
})

export default {
  createApiMock,
  createHookMocks,
  createComponentMocks,
  createBrowserMocks,
  resetAllMocks,
  createMockProps
}