/*
Data Pipeline Dashboard - UndoRedoManager Component Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import UndoRedoManager from '../UndoRedoManager.jsx';
import { ToastProvider } from '../../contexts/ToastContext';
import { createMockProps } from '../../test/mocks/index.jsx';

// Mock the hooks
vi.mock('../../hooks/useUndoRedo', () => ({
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
    },
    redoPreview: null,
    isUndoing: false,
    isRedoing: false
  }))
}));

vi.mock('../../hooks/useNotifications', () => ({
  useNotifications: vi.fn(() => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  }))
}));

// Mock child components
vi.mock('../UndoRedoButtons', () => ({
  UndoRedoButtons: ({ onUndo, onRedo, canUndo, canRedo }) => (
    <div data-testid="undo-redo-buttons">
      <button 
        onClick={onUndo} 
        disabled={!canUndo}
        data-testid="undo-button"
      >
        Undo
      </button>
      <button 
        onClick={onRedo} 
        disabled={!canRedo}
        data-testid="redo-button"
      >
        Redo
      </button>
    </div>
  )
}));

vi.mock('../HistoryPanel', () => ({
  default: ({ history, currentIndex, onJumpToState, onClearHistory }) => (
    <div data-testid="history-panel">
      <div>History Length: {history.length}</div>
      <div>Current Index: {currentIndex}</div>
      <button onClick={() => onJumpToState(0)} data-testid="jump-button">
        Jump to State
      </button>
      <button onClick={onClearHistory} data-testid="clear-history-button">
        Clear History
      </button>
    </div>
  )
}));

vi.mock('../RollbackConfirmation', () => ({
  default: ({ isOpen, onClose, onConfirm, rollbackInfo }) => (
    isOpen ? (
      <div data-testid="rollback-confirmation">
        <div>Type: {rollbackInfo?.type}</div>
        <div>Target: {rollbackInfo?.targetDescription}</div>
        <button onClick={onConfirm} data-testid="confirm-button">
          Confirm
        </button>
        <button onClick={onClose} data-testid="cancel-button">
          Cancel
        </button>
      </div>
    ) : null
  )
}));

const renderWithToast = (component) => {
  return render(
    <ToastProvider>
      {component}
    </ToastProvider>
  );
};

describe('UndoRedoManager', () => {
  const mockProps = createMockProps({
    pipelineState: {
      current_step: 2,
      current_file_id: 'test-file-id',
      steps: []
    },
    onStateChange: vi.fn()
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    expect(screen.getByText('Undo/Redo Controls')).toBeInTheDocument();
    expect(screen.getByText('Navigate through your action history')).toBeInTheDocument();
  });

  it('displays undo/redo buttons', () => {
    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    expect(screen.getByTestId('undo-redo-buttons')).toBeInTheDocument();
    expect(screen.getByTestId('undo-button')).toBeInTheDocument();
    expect(screen.getByTestId('redo-button')).toBeInTheDocument();
  });

  it('displays history panel', () => {
    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    expect(screen.getByTestId('history-panel')).toBeInTheDocument();
  });

  it('shows confirmation dialog when undo is clicked', async () => {
    const { usePipelineUndoRedo } = await import('../../hooks/useUndoRedo');
    usePipelineUndoRedo.mockReturnValue({
      currentState: mockProps.pipelineState,
      currentIndex: 1,
      history: [
        { description: 'Initial state', timestamp: Date.now() },
        { description: 'After cleaning', timestamp: Date.now() }
      ],
      canUndo: true,
      canRedo: false,
      pushPipelineState: vi.fn(),
      undoPipelineOperation: vi.fn(),
      redoPipelineOperation: vi.fn(),
      jumpToState: vi.fn(),
      clearHistory: vi.fn(),
      undoPreview: { description: 'Initial state', timestamp: Date.now() },
      redoPreview: null,
      isUndoing: false,
      isRedoing: false
    });

    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    await waitFor(() => {
      expect(screen.getByTestId('rollback-confirmation')).toBeInTheDocument();
    });

    expect(screen.getByText('Type: undo')).toBeInTheDocument();
  });

  it('shows confirmation dialog when redo is clicked', async () => {
    const { usePipelineUndoRedo } = await import('../../hooks/useUndoRedo');
    usePipelineUndoRedo.mockReturnValue({
      currentState: mockProps.pipelineState,
      currentIndex: 0,
      history: [
        { description: 'Initial state', timestamp: Date.now() },
        { description: 'After cleaning', timestamp: Date.now() }
      ],
      canUndo: false,
      canRedo: true,
      pushPipelineState: vi.fn(),
      undoPipelineOperation: vi.fn(),
      redoPipelineOperation: vi.fn(),
      jumpToState: vi.fn(),
      clearHistory: vi.fn(),
      undoPreview: null,
      redoPreview: { description: 'After cleaning', timestamp: Date.now() },
      isUndoing: false,
      isRedoing: false
    });

    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    const redoButton = screen.getByTestId('redo-button');
    fireEvent.click(redoButton);

    await waitFor(() => {
      expect(screen.getByTestId('rollback-confirmation')).toBeInTheDocument();
    });

    expect(screen.getByText('Type: redo')).toBeInTheDocument();
  });

  it('executes undo operation when confirmed', async () => {
    const mockUndoOperation = vi.fn().mockReturnValue({
      state: { current_step: 1 }
    });

    const { usePipelineUndoRedo } = await import('../../hooks/useUndoRedo');
    usePipelineUndoRedo.mockReturnValue({
      currentState: mockProps.pipelineState,
      currentIndex: 1,
      history: [
        { description: 'Initial state', timestamp: Date.now() },
        { description: 'After cleaning', timestamp: Date.now() }
      ],
      canUndo: true,
      canRedo: false,
      pushPipelineState: vi.fn(),
      undoPipelineOperation: mockUndoOperation,
      redoPipelineOperation: vi.fn(),
      jumpToState: vi.fn(),
      clearHistory: vi.fn(),
      undoPreview: { description: 'Initial state', timestamp: Date.now() },
      redoPreview: null,
      isUndoing: false,
      isRedoing: false
    });

    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    // Click undo button
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('rollback-confirmation')).toBeInTheDocument();
    });

    // Click confirm
    const confirmButton = screen.getByTestId('confirm-button');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockUndoOperation).toHaveBeenCalled();
      expect(mockProps.onStateChange).toHaveBeenCalledWith({ current_step: 1 });
    });
  });

  it('cancels operation when cancel is clicked', async () => {
    const { usePipelineUndoRedo } = await import('../../hooks/useUndoRedo');
    usePipelineUndoRedo.mockReturnValue({
      currentState: mockProps.pipelineState,
      currentIndex: 1,
      history: [
        { description: 'Initial state', timestamp: Date.now() },
        { description: 'After cleaning', timestamp: Date.now() }
      ],
      canUndo: true,
      canRedo: false,
      pushPipelineState: vi.fn(),
      undoPipelineOperation: vi.fn(),
      redoPipelineOperation: vi.fn(),
      jumpToState: vi.fn(),
      clearHistory: vi.fn(),
      undoPreview: { description: 'Initial state', timestamp: Date.now() },
      redoPreview: null,
      isUndoing: false,
      isRedoing: false
    });

    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    // Click undo button
    const undoButton = screen.getByTestId('undo-button');
    fireEvent.click(undoButton);

    // Wait for confirmation dialog
    await waitFor(() => {
      expect(screen.getByTestId('rollback-confirmation')).toBeInTheDocument();
    });

    // Click cancel
    const cancelButton = screen.getByTestId('cancel-button');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByTestId('rollback-confirmation')).not.toBeInTheDocument();
    });
  });

  it('displays history statistics correctly', async () => {
    const { usePipelineUndoRedo } = await import('../../hooks/useUndoRedo');
    usePipelineUndoRedo.mockReturnValue({
      currentState: mockProps.pipelineState,
      currentIndex: 2,
      history: [
        { description: 'Initial state', timestamp: Date.now() },
        { description: 'After cleaning', timestamp: Date.now() },
        { description: 'After analysis', timestamp: Date.now() }
      ],
      canUndo: true,
      canRedo: false,
      pushPipelineState: vi.fn(),
      undoPipelineOperation: vi.fn(),
      redoPipelineOperation: vi.fn(),
      jumpToState: vi.fn(),
      clearHistory: vi.fn(),
      undoPreview: { description: 'After cleaning', stepName: 'Clean' },
      redoPreview: null,
      isUndoing: false,
      isRedoing: false
    });

    renderWithToast(<UndoRedoManager {...mockProps} />);
    
    expect(screen.getByText('actions in history')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return content.includes('Position') && content.includes('of 3');
    })).toBeInTheDocument();
    expect(screen.getByText('Can undo to: Clean')).toBeInTheDocument();
  });
});