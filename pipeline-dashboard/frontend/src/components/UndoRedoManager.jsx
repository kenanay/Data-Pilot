/*
Data Pipeline Dashboard - Undo/Redo Manager Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import { usePipelineUndoRedo } from '../hooks/useUndoRedo';
import { useNotifications } from '../hooks/useNotifications';
import { UndoRedoButtons } from './UndoRedoButtons';
import HistoryPanel from './HistoryPanel';
import RollbackConfirmation from './RollbackConfirmation';

const UndoRedoManager = ({ 
  pipelineState,
  onStateChange,
  sessionId,
  className = ""
}) => {
  const notifications = useNotifications();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingOperation, setPendingOperation] = useState(null);
  const [loading, setLoading] = useState(false);

  const {
    currentState,
    currentIndex,
    history,
    canUndo,
    canRedo,
    pushPipelineState,
    undoPipelineOperation,
    redoPipelineOperation,
    jumpToState,
    clearHistory,
    undoPreview,
    redoPreview,
    isUndoing,
    isRedoing
  } = usePipelineUndoRedo(pipelineState);

  // Update pipeline state when it changes externally
  useEffect(() => {
    if (pipelineState && !isUndoing && !isRedoing) {
      // Only push state if it's actually different
      if (JSON.stringify(currentState) !== JSON.stringify(pipelineState)) {
        const stepName = getStepName(pipelineState.current_step || 0);
        pushPipelineState(
          pipelineState,
          stepName,
          pipelineState.current_step || 0,
          'update'
        );
      }
    }
  }, [pipelineState, currentState, pushPipelineState, isUndoing, isRedoing]);

  // Get step name helper
  const getStepName = (stepId) => {
    const stepNames = [
      'Upload', 'Preview', 'Clean', 'Analyze', 
      'Visualize', 'Model', 'Report', 'Convert', 'Schema'
    ];
    return stepNames[stepId] || `Step ${stepId}`;
  };

  // Handle undo operation
  const handleUndo = () => {
    if (!canUndo) return;

    const rollbackInfo = {
      type: 'undo',
      targetDescription: undoPreview?.description || 'Previous state',
      currentDescription: `Current state (${getStepName(pipelineState?.current_step || 0)})`,
      timestamp: undoPreview?.timestamp,
      stepsAffected: 1,
      dataLoss: false
    };

    setPendingOperation({
      type: 'undo',
      operation: undoPipelineOperation,
      info: rollbackInfo
    });
    setShowConfirmation(true);
  };

  // Handle redo operation
  const handleRedo = () => {
    if (!canRedo) return;

    const rollbackInfo = {
      type: 'redo',
      targetDescription: redoPreview?.description || 'Next state',
      currentDescription: `Current state (${getStepName(pipelineState?.current_step || 0)})`,
      timestamp: redoPreview?.timestamp,
      stepsAffected: 1,
      dataLoss: false
    };

    setPendingOperation({
      type: 'redo',
      operation: redoPipelineOperation,
      info: rollbackInfo
    });
    setShowConfirmation(true);
  };

  // Handle jump to state
  const handleJumpToState = (index) => {
    if (index === currentIndex) return;

    const targetEntry = history[index];
    const stepsAffected = Math.abs(index - currentIndex);
    const isGoingBack = index < currentIndex;

    const rollbackInfo = {
      type: 'jump',
      targetDescription: targetEntry?.description || `State #${index + 1}`,
      currentDescription: `Current state #${currentIndex + 1}`,
      timestamp: targetEntry?.timestamp,
      stepsAffected,
      dataLoss: isGoingBack && stepsAffected > 2
    };

    setPendingOperation({
      type: 'jump',
      operation: () => jumpToState(index),
      info: rollbackInfo,
      targetIndex: index
    });
    setShowConfirmation(true);
  };

  // Handle clear history
  const handleClearHistory = () => {
    const rollbackInfo = {
      type: 'clear',
      targetDescription: 'Empty history',
      currentDescription: `${history.length} actions in history`,
      stepsAffected: history.length,
      dataLoss: true
    };

    setPendingOperation({
      type: 'clear',
      operation: clearHistory,
      info: rollbackInfo
    });
    setShowConfirmation(true);
  };

  // Execute pending operation
  const executePendingOperation = async () => {
    if (!pendingOperation) return;

    setLoading(true);
    
    try {
      const result = pendingOperation.operation();
      
      if (result && result.state) {
        onStateChange?.(result.state);
        notifications.success(`Successfully ${pendingOperation.type === 'undo' ? 'undid' : pendingOperation.type === 'redo' ? 'redid' : 'jumped to'} operation`);
      } else if (pendingOperation.type === 'clear') {
        notifications.success('History cleared successfully');
      } else if (result) {
        onStateChange?.(result);
        notifications.success(`Operation ${pendingOperation.type} completed`);
      }
    } catch (error) {
      console.error('Failed to execute operation:', error);
      notifications.error(`Failed to ${pendingOperation.type}: ${error.message}`);
    } finally {
      setLoading(false);
      setShowConfirmation(false);
      setPendingOperation(null);
    }
  };

  // Cancel pending operation
  const cancelPendingOperation = () => {
    setShowConfirmation(false);
    setPendingOperation(null);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Undo/Redo Controls */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Undo/Redo Controls</h3>
            <p className="text-sm text-gray-600">
              Navigate through your action history
            </p>
          </div>
          
          <UndoRedoButtons
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={canUndo}
            canRedo={canRedo}
            undoPreview={undoPreview}
            redoPreview={redoPreview}
            loading={loading}
            showKeyboardShortcuts={true}
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-4 flex items-center space-x-6 text-sm text-gray-600">
          <div>
            <span className="font-medium">{history.length}</span> actions in history
          </div>
          <div>
            Position <span className="font-medium">{currentIndex + 1}</span> of {history.length}
          </div>
          {canUndo && (
            <div className="text-blue-600">
              Can undo to: {undoPreview?.stepName || 'Previous state'}
            </div>
          )}
          {canRedo && (
            <div className="text-green-600">
              Can redo to: {redoPreview?.stepName || 'Next state'}
            </div>
          )}
        </div>
      </div>

      {/* History Panel */}
      <HistoryPanel
        history={history}
        currentIndex={currentIndex}
        onJumpToState={handleJumpToState}
        onClearHistory={handleClearHistory}
        loading={loading}
      />

      {/* Rollback Confirmation Modal */}
      <RollbackConfirmation
        isOpen={showConfirmation}
        onClose={cancelPendingOperation}
        onConfirm={executePendingOperation}
        rollbackInfo={pendingOperation?.info}
        loading={loading}
      />
    </div>
  );
};

export default UndoRedoManager;