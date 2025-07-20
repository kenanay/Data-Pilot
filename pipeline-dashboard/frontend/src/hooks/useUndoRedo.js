/*
Data Pipeline Dashboard - Undo/Redo Functionality Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for implementing undo/redo functionality
 * @param {Object} initialState - Initial state
 * @param {number} maxHistorySize - Maximum number of states to keep in history
 * @returns {Object} - Undo/redo state and functions
 */
export const useUndoRedo = (initialState = null, maxHistorySize = 50) => {
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isUndoing, setIsUndoing] = useState(false);
  const [isRedoing, setIsRedoing] = useState(false);
  const lastActionRef = useRef(null);

  // Get current state
  const currentState = history[currentIndex];

  // Check if undo is possible
  const canUndo = currentIndex > 0;

  // Check if redo is possible
  const canRedo = currentIndex < history.length - 1;

  // Add new state to history
  const pushState = useCallback((newState, actionType = 'unknown', metadata = {}) => {
    if (isUndoing || isRedoing) return; // Don't add to history during undo/redo operations

    setHistory(prevHistory => {
      // Remove any future states if we're not at the end
      const newHistory = prevHistory.slice(0, currentIndex + 1);
      
      // Add the new state with metadata
      const stateEntry = {
        state: newState,
        timestamp: Date.now(),
        actionType,
        metadata: {
          description: metadata.description || `Action: ${actionType}`,
          stepId: metadata.stepId,
          stepName: metadata.stepName,
          ...metadata
        }
      };
      
      newHistory.push(stateEntry);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });

    setCurrentIndex(prevIndex => {
      const newIndex = Math.min(prevIndex + 1, maxHistorySize - 1);
      return newIndex;
    });

    lastActionRef.current = {
      type: 'push',
      actionType,
      timestamp: Date.now()
    };
  }, [currentIndex, maxHistorySize, isUndoing, isRedoing]);

  // Undo operation
  const undo = useCallback(() => {
    if (!canUndo) return null;

    setIsUndoing(true);
    const previousIndex = currentIndex - 1;
    setCurrentIndex(previousIndex);
    
    const previousState = history[previousIndex];
    lastActionRef.current = {
      type: 'undo',
      fromIndex: currentIndex,
      toIndex: previousIndex,
      timestamp: Date.now()
    };

    // Reset undo flag after a short delay
    setTimeout(() => setIsUndoing(false), 100);

    return previousState;
  }, [canUndo, currentIndex, history]);

  // Redo operation
  const redo = useCallback(() => {
    if (!canRedo) return null;

    setIsRedoing(true);
    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    
    const nextState = history[nextIndex];
    lastActionRef.current = {
      type: 'redo',
      fromIndex: currentIndex,
      toIndex: nextIndex,
      timestamp: Date.now()
    };

    // Reset redo flag after a short delay
    setTimeout(() => setIsRedoing(false), 100);

    return nextState;
  }, [canRedo, currentIndex, history]);

  // Jump to specific state in history
  const jumpToState = useCallback((index) => {
    if (index < 0 || index >= history.length) return null;

    const wasUndoing = index < currentIndex;
    const wasRedoing = index > currentIndex;

    if (wasUndoing) setIsUndoing(true);
    if (wasRedoing) setIsRedoing(true);

    setCurrentIndex(index);
    
    const targetState = history[index];
    lastActionRef.current = {
      type: 'jump',
      fromIndex: currentIndex,
      toIndex: index,
      timestamp: Date.now()
    };

    // Reset flags after a short delay
    setTimeout(() => {
      setIsUndoing(false);
      setIsRedoing(false);
    }, 100);

    return targetState;
  }, [currentIndex, history]);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([initialState]);
    setCurrentIndex(0);
    lastActionRef.current = {
      type: 'clear',
      timestamp: Date.now()
    };
  }, [initialState]);

  // Get history summary
  const getHistorySummary = useCallback(() => {
    return history.map((entry, index) => ({
      index,
      isCurrent: index === currentIndex,
      timestamp: entry.timestamp,
      actionType: entry.actionType,
      description: entry.metadata?.description || 'Unknown action',
      stepName: entry.metadata?.stepName,
      stepId: entry.metadata?.stepId
    }));
  }, [history, currentIndex]);

  // Get undo/redo preview
  const getUndoPreview = useCallback(() => {
    if (!canUndo) return null;
    const previousEntry = history[currentIndex - 1];
    return {
      actionType: previousEntry.actionType,
      description: previousEntry.metadata?.description,
      stepName: previousEntry.metadata?.stepName,
      timestamp: previousEntry.timestamp
    };
  }, [canUndo, currentIndex, history]);

  const getRedoPreview = useCallback(() => {
    if (!canRedo) return null;
    const nextEntry = history[currentIndex + 1];
    return {
      actionType: nextEntry.actionType,
      description: nextEntry.metadata?.description,
      stepName: nextEntry.metadata?.stepName,
      timestamp: nextEntry.timestamp
    };
  }, [canRedo, currentIndex, history]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Z or Cmd+Z for undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
        }
      }
      
      // Ctrl+Shift+Z or Ctrl+Y or Cmd+Shift+Z for redo
      if (((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'Z') ||
          (event.ctrlKey && event.key === 'y')) {
        event.preventDefault();
        if (canRedo) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  return {
    // Current state
    currentState: currentState?.state || currentState,
    currentIndex,
    
    // History info
    history: getHistorySummary(),
    historyLength: history.length,
    
    // Capabilities
    canUndo,
    canRedo,
    
    // Operations
    pushState,
    undo,
    redo,
    jumpToState,
    clearHistory,
    
    // Previews
    undoPreview: getUndoPreview(),
    redoPreview: getRedoPreview(),
    
    // Status
    isUndoing,
    isRedoing,
    lastAction: lastActionRef.current
  };
};

/**
 * Hook specifically for pipeline state undo/redo
 */
export const usePipelineUndoRedo = (initialPipelineState) => {
  const undoRedo = useUndoRedo(initialPipelineState, 30); // Smaller history for pipeline states

  // Pipeline-specific push state
  const pushPipelineState = useCallback((newState, stepName, stepId, operation) => {
    undoRedo.pushState(newState, `${stepName}_${operation}`, {
      description: `${operation} operation in ${stepName} step`,
      stepName,
      stepId,
      operation
    });
  }, [undoRedo]);

  // Pipeline-specific undo with step context
  const undoPipelineOperation = useCallback(() => {
    const previousState = undoRedo.undo();
    if (previousState) {
      return {
        state: previousState.state || previousState,
        metadata: previousState.metadata
      };
    }
    return null;
  }, [undoRedo]);

  // Pipeline-specific redo with step context
  const redoPipelineOperation = useCallback(() => {
    const nextState = undoRedo.redo();
    if (nextState) {
      return {
        state: nextState.state || nextState,
        metadata: nextState.metadata
      };
    }
    return null;
  }, [undoRedo]);

  return {
    ...undoRedo,
    pushPipelineState,
    undoPipelineOperation,
    redoPipelineOperation
  };
};

export default useUndoRedo;