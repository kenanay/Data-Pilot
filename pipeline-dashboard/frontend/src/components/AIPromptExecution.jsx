/*
Data Pipeline Dashboard - AI Prompt Execution Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import { useAIPrompt } from '../hooks/useAIPrompt';
import { useNotifications } from '../hooks/useNotifications';

const AIPromptExecution = ({ 
  sessionId, 
  fileId, 
  steps = [], 
  onComplete,
  onError,
  onCancel,
  className = ""
}) => {
  const [executionLogs, setExecutionLogs] = useState([]);
  const [showDetails, setShowDetails] = useState(false);
  
  const notifications = useNotifications();
  
  const {
    executeSteps,
    cancelExecution,
    executionStatus,
    currentStepIndex,
    executionResults,
    error,
    getExecutionProgress,
    isExecuting,
    isCompleted,
    hasError
  } = useAIPrompt(sessionId, fileId);

  const progress = getExecutionProgress();

  // Execute steps when component mounts
  useEffect(() => {
    if (steps.length > 0 && executionStatus === 'idle') {
      handleExecution();
    }
  }, [steps]);

  // Handle execution with progress tracking
  const handleExecution = async () => {
    setExecutionLogs([]);
    
    try {
      const result = await executeSteps(steps, (progressInfo) => {
        // Add progress log
        const logEntry = {
          id: Date.now() + Math.random(),
          timestamp: new Date().toISOString(),
          stepIndex: progressInfo.stepIndex,
          stepName: progressInfo.currentStep.name,
          status: progressInfo.status,
          message: getProgressMessage(progressInfo),
          details: progressInfo.result || progressInfo.error
        };
        
        setExecutionLogs(prev => [...prev, logEntry]);
      });

      if (result.success) {
        notifications.success(`Pipeline completed successfully! ${result.completedSteps}/${result.totalSteps} steps executed.`);
        onComplete?.(result);
      } else {
        notifications.error(`Pipeline failed: ${result.error}`);
        onError?.(result.error);
      }
    } catch (err) {
      notifications.error(`Execution failed: ${err.message}`);
      onError?.(err.message);
    }
  };

  // Generate progress message
  const getProgressMessage = (progressInfo) => {
    switch (progressInfo.status) {
      case 'executing':
        return `Executing ${progressInfo.currentStep.name}...`;
      case 'completed':
        return `✅ ${progressInfo.currentStep.name} completed successfully`;
      case 'error':
        return `❌ ${progressInfo.currentStep.name} failed: ${progressInfo.error}`;
      default:
        return `Processing ${progressInfo.currentStep.name}`;
    }
  };

  // Handle cancellation
  const handleCancel = () => {
    cancelExecution();
    notifications.warning('Pipeline execution cancelled');
    onCancel?.();
  };

  // Get step status icon
  const getStepStatusIcon = (stepIndex) => {
    if (stepIndex < currentStepIndex) return '✅';
    if (stepIndex === currentStepIndex && isExecuting) return '⏳';
    if (stepIndex === currentStepIndex && hasError) return '❌';
    return '⭕';
  };

  // Get step status color
  const getStepStatusColor = (stepIndex) => {
    if (stepIndex < currentStepIndex) return 'text-green-600';
    if (stepIndex === currentStepIndex && isExecuting) return 'text-blue-600';
    if (stepIndex === currentStepIndex && hasError) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🚀 AI Pipeline Execution
            </h3>
            <p className="text-sm text-gray-600">
              {isExecuting && `Executing step ${currentStepIndex + 1} of ${steps.length}`}
              {isCompleted && `Completed all ${steps.length} steps successfully`}
              {hasError && `Failed at step ${currentStepIndex + 1} of ${steps.length}`}
              {!isExecuting && !isCompleted && !hasError && `Ready to execute ${steps.length} steps`}
            </p>
          </div>
          
          {isExecuting && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">
            {progress.current}/{progress.total} steps
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              hasError ? 'bg-red-500' : isCompleted ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress.percentage}%` }}
          ></div>
        </div>
      </div>

      {/* Steps List */}
      <div className="p-6">
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={index} className="flex items-start space-x-3">
              <div className={`flex-shrink-0 text-lg ${getStepStatusColor(index)}`}>
                {getStepStatusIcon(index)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{step.name}</h4>
                  {index === currentStepIndex && isExecuting && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-blue-600">Processing...</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                
                {/* Show result for completed steps */}
                {executionResults[index] && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    {executionResults[index].success ? (
                      <span className="text-green-700">✅ Completed successfully</span>
                    ) : (
                      <span className="text-red-700">❌ {executionResults[index].error}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <div className="text-red-500 text-sm">❌</div>
              <div>
                <p className="text-red-800 text-sm font-medium">Execution Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {executionLogs.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Execution Logs</h4>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </button>
            </div>
            
            <div className={`space-y-2 ${showDetails ? 'max-h-64 overflow-y-auto' : 'max-h-32 overflow-hidden'}`}>
              {executionLogs.map((log) => (
                <div key={log.id} className="text-xs p-2 bg-gray-50 rounded">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{log.message}</span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {showDetails && log.details && (
                    <div className="mt-1 text-gray-600">
                      {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isExecuting && 'Execution in progress...'}
            {isCompleted && 'All steps completed successfully!'}
            {hasError && 'Execution stopped due to error'}
          </div>
          
          <div className="flex items-center space-x-3">
            {(isCompleted || hasError) && (
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Reset Pipeline
              </button>
            )}
            
            {hasError && (
              <button
                onClick={handleExecution}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Retry Execution
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPromptExecution;