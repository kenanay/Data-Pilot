/*
API Service Mocks

Author: Kiro AI Assistant
Project: Data Pipeline Dashboard Test Infrastructure
*/

import { vi } from 'vitest'

/**
 * Mock API responses for different scenarios
 */
export const mockApiResponses = {
  success: {
    previewData: {
      success: true,
      data: {
        columns: [
          { name: 'id', data_type: 'integer', null_count: 0, non_null_count: 100 },
          { name: 'name', data_type: 'string', null_count: 5, non_null_count: 95 },
          { name: 'email', data_type: 'string', null_count: 2, non_null_count: 98 }
        ],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
        ],
        total_rows: 100,
        sample_size: 2
      }
    },

    validateSchema: {
      success: true,
      valid: true,
      errors: [],
      warnings: [],
      schema: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          email: { type: 'string', format: 'email' }
        }
      }
    },

    fileInfo: {
      success: true,
      file_id: 'test-file-123',
      filename: 'sample-data.csv',
      size: 2048,
      columns: 3,
      rows: 100,
      upload_date: '2025-01-19T12:00:00Z'
    }
  },

  error: {
    previewData: {
      success: false,
      error: 'File not found',
      code: 'FILE_NOT_FOUND'
    },

    validateSchema: {
      success: false,
      valid: false,
      errors: [
        { field: 'email', message: 'Invalid email format', row: 5 },
        { field: 'age', message: 'Value out of range', row: 12 }
      ],
      warnings: [
        { field: 'name', message: 'Contains special characters', count: 3 }
      ]
    }
  }
}

/**
 * Create API service mock with configurable responses
 */
export const createApiServiceMock = (scenario = 'success') => {
  const responses = mockApiResponses[scenario] || mockApiResponses.success

  return {
    // Data preview and file operations
    previewData: vi.fn().mockResolvedValue(responses.previewData || mockApiResponses.success.previewData),
    getFileInfo: vi.fn().mockResolvedValue(responses.fileInfo || mockApiResponses.success.fileInfo),
    uploadFile: vi.fn().mockResolvedValue({ success: true, file_id: 'uploaded-file-123' }),

    // Schema validation
    validateSchema: vi.fn().mockResolvedValue(responses.validateSchema || mockApiResponses.success.validateSchema),
    generateSchema: vi.fn().mockResolvedValue({ success: true, schema: {} }),

    // Pipeline operations
    cleanData: vi.fn().mockResolvedValue({
      success: true,
      message: 'Data cleaned successfully',
      affected_rows: 15,
      operations: ['remove_duplicates', 'fill_missing_values']
    }),

    analyzeData: vi.fn().mockResolvedValue({
      success: true,
      statistics: {
        numerical: {
          mean: 25.5,
          median: 24.0,
          std: 5.2,
          min: 18,
          max: 65
        },
        categorical: {
          unique_values: 5,
          most_frequent: 'Category A'
        }
      },
      correlations: [
        { field1: 'age', field2: 'income', correlation: 0.75 }
      ]
    }),

    visualizeData: vi.fn().mockResolvedValue({
      success: true,
      chart_url: '/api/charts/test-chart-123.png',
      chart_type: 'bar',
      data_points: 50
    }),

    // AI and ML operations
    interpretPrompt: vi.fn().mockResolvedValue({
      success: true,
      steps: [
        {
          id: 'step-1',
          type: 'clean',
          name: 'Data Cleaning',
          description: 'Remove missing values and duplicates',
          parameters: {
            operations: ['remove_duplicates', 'fill_missing']
          }
        }
      ],
      confidence: 0.85
    }),

    trainModel: vi.fn().mockResolvedValue({
      success: true,
      model_id: 'model-123',
      accuracy: 0.92,
      metrics: {
        precision: 0.89,
        recall: 0.94,
        f1_score: 0.91
      }
    }),

    // Report and export operations
    generateReport: vi.fn().mockResolvedValue({
      success: true,
      report_id: 'report-123',
      download_url: '/api/reports/report-123.pdf'
    }),

    convertFormat: vi.fn().mockResolvedValue({
      success: true,
      converted_file_id: 'converted-123',
      download_url: '/api/files/converted-123.json'
    })
  }
}

/**
 * Create API mock that simulates network delays
 */
export const createDelayedApiMock = (delay = 100) => {
  const baseMock = createApiServiceMock()
  
  // Wrap all methods with delay
  Object.keys(baseMock).forEach(key => {
    const originalMethod = baseMock[key]
    baseMock[key] = vi.fn().mockImplementation((...args) => {
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(originalMethod.mockReturnValue)
        }, delay)
      })
    })
  })
  
  return baseMock
}

/**
 * Create API mock that simulates errors
 */
export const createErrorApiMock = () => {
  return createApiServiceMock('error')
}

export default {
  createApiServiceMock,
  createDelayedApiMock,
  createErrorApiMock,
  mockApiResponses
}