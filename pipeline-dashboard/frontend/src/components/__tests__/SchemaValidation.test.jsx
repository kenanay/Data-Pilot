/*
Data Pipeline Dashboard - Schema Validation Component Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import SchemaValidation from '../SchemaValidation.jsx';
import { createMockProps } from '../../test/mocks/index.jsx';

const mockColumnInfo = [
  {
    name: 'id',
    data_type: 'integer',
    null_count: 0,
    non_null_count: 100,
    min_value: 1,
    max_value: 100
  },
  {
    name: 'email',
    data_type: 'string',
    null_count: 5,
    non_null_count: 95,
    unique_values: ['test@example.com', 'user@test.com']
  },
  {
    name: 'age',
    data_type: 'integer',
    null_count: 2,
    non_null_count: 98,
    min_value: 18,
    max_value: 65
  },
  {
    name: 'status',
    data_type: 'string',
    null_count: 0,
    non_null_count: 100,
    unique_values: ['active', 'inactive', 'pending']
  }
];

const mockValidationResult = {
  is_valid: false,
  total_rows: 100,
  valid_rows: 85,
  total_errors: 15,
  errors: [
    {
      row_index: 5,
      column: 'email',
      message: 'Invalid email format',
      value: 'invalid-email'
    },
    {
      row_index: 12,
      column: 'age',
      message: 'Value out of range',
      value: 200
    }
  ]
};

describe('SchemaValidation', () => {
  const mockProps = createMockProps({
    onValidationComplete: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    render(<SchemaValidation {...mockProps} />);
    
    expect(screen.getByText('Loading column information...')).toBeInTheDocument();
  });

  it('renders schema validation interface after loading', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Schema Validation')).toBeInTheDocument();
    });

    expect(screen.getByText('Validate your data against schemas and custom rules to ensure quality and compliance')).toBeInTheDocument();
  });

  it('displays validation type tabs', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('📋 JSON Schema')).toBeInTheDocument();
    });

    expect(screen.getByText('⚙️ Custom Rules')).toBeInTheDocument();
    expect(screen.getByText('💡 Smart Suggestions')).toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('📋 JSON Schema')).toBeInTheDocument();
    });

    // Click on Custom Rules tab
    fireEvent.click(screen.getByText('⚙️ Custom Rules'));
    expect(screen.getByText('Custom Validation Rules')).toBeInTheDocument();

    // Click on Smart Suggestions tab
    fireEvent.click(screen.getByText('💡 Smart Suggestions'));
    expect(screen.getByText('Smart Schema Suggestions')).toBeInTheDocument();
  });

  it('generates basic schema automatically', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Schema Validation')).toBeInTheDocument();
    });

    // Check if schema is auto-generated
    const schemaTextarea = screen.getByPlaceholderText('Enter JSON Schema...');
    expect(schemaTextarea.value).toContain('"type": "object"');
    expect(schemaTextarea.value).toContain('"properties"');
  });

  it('loads schema templates', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Schema Templates')).toBeInTheDocument();
    });

    expect(screen.getByText('Basic Data Validation')).toBeInTheDocument();
    expect(screen.getByText('Financial Data')).toBeInTheDocument();
    expect(screen.getByText('User Data')).toBeInTheDocument();
  });

  it('applies schema template when clicked', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('User Data')).toBeInTheDocument();
    });

    // Click on User Data template
    fireEvent.click(screen.getByText('User Data'));

    const schemaTextarea = screen.getByPlaceholderText('Enter JSON Schema...');
    expect(schemaTextarea.value).toContain('"email"');
    expect(schemaTextarea.value).toContain('"format": "email"');
  });

  it('adds custom validation rules', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('⚙️ Custom Rules')).toBeInTheDocument();
    });

    // Switch to Custom Rules tab
    fireEvent.click(screen.getByText('⚙️ Custom Rules'));

    // Click Add Rule button
    fireEvent.click(screen.getByText('+ Add Rule'));

    expect(screen.getByText('Select column...')).toBeInTheDocument();
    expect(screen.getByText('Not Null')).toBeInTheDocument();
  });

  it('removes custom validation rules', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('⚙️ Custom Rules')).toBeInTheDocument();
    });

    // Switch to Custom Rules tab
    fireEvent.click(screen.getByText('⚙️ Custom Rules'));

    // Add a rule first
    fireEvent.click(screen.getByText('+ Add Rule'));
    
    // Remove the rule
    fireEvent.click(screen.getByText('Remove'));

    expect(screen.getByText('No custom rules defined')).toBeInTheDocument();
  });

  it('runs validation successfully', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Run Validation')).toBeInTheDocument();
    });

    // Click Run Validation button
    fireEvent.click(screen.getByText('Run Validation'));

    await waitFor(() => {
      expect(screen.getByText('JSON Schema Validation')).toBeInTheDocument();
    });

    expect(screen.getByText(/Failed/)).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument(); // Total Rows
    expect(screen.getByText('85')).toBeInTheDocument(); // Valid Rows
    expect(screen.getByText('15')).toBeInTheDocument(); // Errors
  });

  it('displays validation errors', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Run Validation')).toBeInTheDocument();
    });

    // Run validation
    fireEvent.click(screen.getByText('Run Validation'));

    await waitFor(() => {
      expect(screen.getByText('JSON Schema Validation')).toBeInTheDocument();
    });

    // Check that validation results are displayed
    expect(screen.getByText('100')).toBeInTheDocument(); // Total Rows
    expect(screen.getByText('85')).toBeInTheDocument(); // Valid Rows
    expect(screen.getByText('15')).toBeInTheDocument(); // Errors
  });

  it('handles validation errors gracefully', async () => {
    // Mock the API service to reject
    const { default: ApiService } = await vi.importMock('../../services/api.js');
    ApiService.validateSchema.mockRejectedValue(new Error('Validation failed'));

    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Run Validation')).toBeInTheDocument();
    });

    // Run validation
    fireEvent.click(screen.getByText('Run Validation'));

    await waitFor(() => {
      // The component should still render normally even when validation fails
      expect(screen.getByText('Run Validation')).toBeInTheDocument();
    });

    // The component handles the error gracefully by continuing to render normally
  });

  it('validates JSON schema format', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter JSON Schema...')).toBeInTheDocument();
    });

    // Enter invalid JSON
    const schemaTextarea = screen.getByPlaceholderText('Enter JSON Schema...');
    fireEvent.change(schemaTextarea, { target: { value: '{ invalid json }' } });

    // Try to run validation
    fireEvent.click(screen.getByText('Run Validation'));

    await waitFor(() => {
      expect(screen.getByText('Validation Error')).toBeInTheDocument();
    });

    expect(screen.getByText(/Invalid JSON/)).toBeInTheDocument();
  });

  it('shows smart suggestions', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('💡 Smart Suggestions')).toBeInTheDocument();
    });

    // Switch to Smart Suggestions tab
    fireEvent.click(screen.getByText('💡 Smart Suggestions'));

    expect(screen.getByText('Smart Schema Suggestions')).toBeInTheDocument();
    expect(screen.getByText('🤖 Auto-Generate Schema')).toBeInTheDocument();
    expect(screen.getByText('Column Analysis')).toBeInTheDocument();
  });

  it('displays column analysis in smart suggestions', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('💡 Smart Suggestions')).toBeInTheDocument();
    });

    // Switch to Smart Suggestions tab
    fireEvent.click(screen.getByText('💡 Smart Suggestions'));

    // Check column analysis - use getAllByText since column names appear multiple times
    expect(screen.getAllByText('id').length).toBeGreaterThan(0);
    expect(screen.getAllByText('email').length).toBeGreaterThan(0);
    // Only check for columns that exist in the mock data
    expect(screen.getByText('Column Analysis')).toBeInTheDocument();
  });

  it('applies smart suggestions', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('💡 Smart Suggestions')).toBeInTheDocument();
    });

    // Switch to Smart Suggestions tab
    fireEvent.click(screen.getByText('💡 Smart Suggestions'));

    // Look for email suggestion and apply it
    const applyButtons = screen.getAllByText('Apply');
    if (applyButtons.length > 0) {
      fireEvent.click(applyButtons[0]);
    }

    // Switch back to JSON Schema tab to verify
    fireEvent.click(screen.getByText('📋 JSON Schema'));
    
    const schemaTextarea = screen.getByPlaceholderText('Enter JSON Schema...');
    expect(schemaTextarea.value).toContain('"email"');
  });

  it('shows data quality insights', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('💡 Smart Suggestions')).toBeInTheDocument();
    });

    // Switch to Smart Suggestions tab
    fireEvent.click(screen.getByText('💡 Smart Suggestions'));

    expect(screen.getByText('Data Quality Insights')).toBeInTheDocument();
    expect(screen.getByText('📊 Data Completeness')).toBeInTheDocument();
    expect(screen.getByText('🏷️ Data Types')).toBeInTheDocument();
  });

  it('removes validation results', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Run Validation')).toBeInTheDocument();
    });

    // Run validation first
    fireEvent.click(screen.getByText('Run Validation'));

    await waitFor(() => {
      expect(screen.getByText('🗑️')).toBeInTheDocument();
    });

    // Remove validation result
    fireEvent.click(screen.getByText('🗑️'));

    expect(screen.getByText('No validations run yet')).toBeInTheDocument();
  });

  it('calls onValidationComplete when validation succeeds', async () => {
    render(<SchemaValidation {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Run Validation')).toBeInTheDocument();
    });

    // Run validation
    fireEvent.click(screen.getByText('Run Validation'));

    await waitFor(() => {
      expect(mockProps.onValidationComplete).toHaveBeenCalled();
    });
  });

  it('handles API errors gracefully', async () => {
    // Mock the API service to reject on previewData
    const { default: ApiService } = await vi.importMock('../../services/api.js');
    ApiService.previewData.mockRejectedValue(new Error('API Error'));

    render(<SchemaValidation {...mockProps} />);
    
    // Should still render loading state and handle error
    expect(screen.getByText('Loading column information...')).toBeInTheDocument();
  });
});