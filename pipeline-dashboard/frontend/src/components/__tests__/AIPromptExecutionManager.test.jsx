/*
Data Pipeline Dashboard - AI Prompt Execution Manager Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AIPromptExecutionManager from '../AIPromptExecutionManager.jsx';

import { createMockProps } from '../../test/mocks/index.js';

// Mock API Service
vi.mock('../../services/api', () => ({
  default: {
    cleanData: vi.fn().mockResolvedValue({ success: true }),
    analyzeData: vi.fn().mockResolvedValue({ success: true }),
    visualizeData: vi.fn().mockResolvedValue({ success: true }),
    modelData: vi.fn().mockResolvedValue({ success: true }),
    generateReport: vi.fn().mockResolvedValue({ success: true }),
    convertData: vi.fn().mockResolvedValue({ success: true }),
    validateSchema: vi.fn().mockResolvedValue({ success: true }),
    executeStep: vi.fn().mockResolvedValue({ success: true })
  }
}));

// Mock notifications hook
vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn()
  }))
}));

const mockSteps = [
  {
    id: 'step_1',
    name: 'Data Cleaning',
    description: 'Clean and prepare data',
    type: 'clean',
    parameters: { operations: [] },
    estimatedDuration: 30
  },
  {
    id: 'step_2',
    name: 'Data Analysis',
    description: 'Analyze data statistics',
    type: 'analyze',
    parameters: { analyses: ['descriptive_statistics'] },
    estimatedDuration: 45
  }
];

describe('AIPromptExecutionManager', () => {
  const mockProps = createMockProps({
    steps: mockSteps,
    onComplete: vi.fn(),
    onCancel: vi.fn()
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Set up API service mock return values
    const { default: ApiService } = await import('../../services/api');
    ApiService.cleanData.mockResolvedValue({ success: true, data: {} });
    ApiService.analyzeData.mockResolvedValue({ success: true, data: {} });
    ApiService.visualizeData.mockResolvedValue({ success: true, data: {} });
    ApiService.executeStep.mockResolvedValue({ success: true, data: {} });
  });

  it('renders execution manager', () => {
    render(<AIPromptExecutionManager {...mockProps} />);
    
    expect(screen.getByText('🚀 AI Pipeline Execution')).toBeInTheDocument();
    expect(screen.getByText('Ready to execute pipeline')).toBeInTheDocument();
  });

  it('shows confirmation dialog on mount', async () => {
    render(<AIPromptExecutionManager {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('🚀 Execute AI Pipeline')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Ready to execute 2 pipeline steps automatically')).toBeInTheDocument();
  });

  it('displays all steps in confirmation', async () => {
    render(<AIPromptExecutionManager {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Data Cleaning')).toHaveLength(2); // Appears in both main view and confirmation dialog
    });
    
    expect(screen.getAllByText('Data Analysis')).toHaveLength(2);
  });

  it('starts execution when confirmed', async () => {
    render(<AIPromptExecutionManager {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Execute Pipeline')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Execute Pipeline'));
    
    // Wait for execution to start - look for progress or status change
    await waitFor(() => {
      expect(screen.getByText(/Failed at step|Executing step|Completed/)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('cancels execution when cancel is clicked', async () => {
    render(<AIPromptExecutionManager {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Cancel'));
    
    expect(mockProps.onCancel).toHaveBeenCalled();
  });
});