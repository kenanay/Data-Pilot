/*
Data Pipeline Dashboard - AI Prompt Interface Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import AIPromptInterface from '../AIPromptInterface.jsx';

import { createMockProps } from '../../test/mocks/index.jsx';

// Mock API Service - using factory function to avoid hoisting issues
vi.mock('../../services/api', () => ({
  default: {
    interpretPrompt: vi.fn().mockResolvedValue({
      success: true,
      steps: []
    })
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

describe('AIPromptInterface', () => {
  const mockProps = createMockProps({
    onPromptExecute: vi.fn(),
    onError: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('renders AI prompt interface', () => {
    render(<AIPromptInterface {...mockProps} />);
    
    expect(screen.getByText('🤖 AI Pipeline Assistant')).toBeInTheDocument();
    expect(screen.getByText('Describe what you want to do with your data in natural language')).toBeInTheDocument();
  });

  it('allows user to enter prompt text', () => {
    render(<AIPromptInterface {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/Example: Clean my data/);
    fireEvent.change(textarea, { target: { value: 'Clean my data and create visualizations' } });
    
    expect(textarea.value).toBe('Clean my data and create visualizations');
  });

  it('shows character count', () => {
    render(<AIPromptInterface {...mockProps} />);
    
    const textarea = screen.getByPlaceholderText(/Example: Clean my data/);
    fireEvent.change(textarea, { target: { value: 'Test prompt' } });
    
    expect(screen.getByText('11/1000 characters')).toBeInTheDocument();
  });

  it('displays all tabs', () => {
    render(<AIPromptInterface {...mockProps} />);
    
    expect(screen.getByText('💬 Prompt Input')).toBeInTheDocument();
    expect(screen.getByText('📋 Templates')).toBeInTheDocument();
    expect(screen.getByText('🕒 History')).toBeInTheDocument();
    expect(screen.getByText('⭐ Favorites')).toBeInTheDocument();
  });
});