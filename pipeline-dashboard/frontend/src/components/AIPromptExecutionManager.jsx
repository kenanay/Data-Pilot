/*
Data Pipeline Dashboard - AI Prompt Execution Manager

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import ApiService from '../services/api';

const AIPromptExecutionManager = ({ 
  sessionId, 
  fileId, 
  steps = [], 
  onComplete,
  onError,
  onCancel,
  onStepComplete,
  className = ""
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle, executing, paused, completed, error
  const [stepResults, setStepResults] = useState([]);
  const [executionLogs, setExecutionLogs] = useState([]);
  const [error, setError] = useState(null);
  const [pausedAt, setPausedAt] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingStep, setPendingStep] = useState(null);
  
  const notifications = useNotifications();

  // Auto-start execution when steps are provided
  useEffect(() => {
    if (steps.length > 0 && executionStatus === 'idle') {
      setShowConfirmation(true);
    }
  }, [steps, executionStatus]);

  // Execute a single step
  const executeStep = useCallback(async (step, stepIndex) => {
    addLog(`Starting ${step.name}...`, 'info', stepIndex);
    
    try {
      let result;
      
      switch (step.type) {
        case 'clean':
          result = await ApiService.cleanData(sessionId, fileId, step.parameters);
          break;
        case 'analyze':
          result = await ApiService.analyzeData(sessionId, fileId, step.parameters);
          break;
        case 'visualize':
          result = await ApiService.visualizeData(sessionId, fileId, step.parameters);
          break;
        case 'model':
          result = await ApiService.modelData(sessionId, fileId, step.parameters);
          break;
        case 'convert':
          result = await ApiService.convertData(sessionId, fileId, step.parameters);
          break;
        case 'validate':
          result = await ApiService.validateSchema(sessionId, fileId, step.parameters);
          break;
        case 'report':
          result = await ApiService.generateReport(sessionId, fileId, step.parameters);
          break;
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      const stepResult = {
        stepIndex,
        step,
        result,
        success: true,
        timestamp: new Date().toISOString(),
        duration: step.estimatedDuration
      };

      setStepResults(prev => [...prev, stepResult]);
      addLog(`✅ ${step.name} completed successfully`, 'success', stepIndex);
      
      // Notify parent component
      onStepComplete?.(stepResult);
      
      return stepResult;
      
    } catch (err) {
      const stepResult = {
        stepIndex,
        step,
        error: err.message || 'Step execution failed',
        success: false,
        timestamp: new Date().toISOString()
      };

      setStepResults(prev => [...prev, stepResult]);
      addLog(`❌ ${step.name} failed: ${err.message}`, 'error', stepIndex);
      
      throw stepResult;
    }
  }, [sessionId, fileId, onStepComplete]);

  // Execute all steps sequentially
  const executeAllSteps = useCallback(async () => {
    if (steps.length === 0) return;

    setExecutionStatus('executing');
    setCurrentStepIndex(0);
    setError(null);
    setStepResults([]);
    setExecutionLogs([]);

    try {
      for (let i = 0; i < steps.length; i++) {
        // Check if execution was cancelled
        if (executionStatus === 'idle') {
          throw new Error('Execution was cancelled');
        }

        setCurrentStepIndex(i);
        const step = steps[i];

        // Check for manual intervention requirement
        if (step.requiresConfirmation) {
          setPendingStep({ step, index: i });
          setExecutionStatus('paused');
          addLog(`⏸️ Execution paused for manual confirmation: ${step.name}`, 'warning', i);
          return; // Wait for user confirmation
        }

        try {
          await executeStep(step, i);
          
          // Add delay between steps to prevent overwhelming the backend
          if (i < steps.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (stepError) {
          // Handle step failure
          if (step.continueOnError) {
            addLog(`⚠️ ${step.name} failed but continuing execution`, 'warning', i);
            continue;
          } else {
            // Stop execution on error
            setExecutionStatus('error');
            setError(`Execution stopped at step ${i + 1}: ${stepError.error}`);
            onError?.(stepError.error);
            return;
          }
        }
      }

      // All steps completed successfully
      setExecutionStatus('completed');
      setCurrentStepIndex(-1);
      addLog('🎉 All steps completed successfully!', 'success');
      
      const finalResult = {
        success: true,
        completedSteps: steps.length,
        totalSteps: steps.length,
        results: stepResults,
        executionTime: stepResults.reduce((total, result) => total + (result.duration || 0), 0)
      };
      
      onComplete?.(finalResult);
      notifications.success(`Pipeline completed! ${steps.length} steps executed successfully.`);
      
    } catch (err) {
      setExecutionStatus('error');
      setError(err.message);
      onError?.(err.message);
      notifications.error(`Pipeline execution failed: ${err.message}`);
    }
  }, [steps, executeStep, stepResults, executionStatus, onComplete, onError, notifications]);

  // Resume execution from paused state
  const resumeExecution = useCallback(async () => {
    if (!pendingStep || executionStatus !== 'paused') return;

    setExecutionStatus('executing');
    const { step, index } = pendingStep;
    setPendingStep(null);

    try {
      await executeStep(step, index);
      
      // Continue with remaining steps
      const remainingSteps = steps.slice(index + 1);
      if (remainingSteps.length > 0) {
        // Recursively execute remaining steps
        setTimeout(() => {
          setCurrentStepIndex(index + 1);
          executeRemainingSteps(index + 1);
        }, 1000);
      } else {
        // All steps completed
        setExecutionStatus('completed');
        setCurrentStepIndex(-1);
        onComplete?.({
          success: true,
          completedSteps: steps.length,
          totalSteps: steps.length,
          results: stepResults
        });
      }
      
    } catch (stepError) {
      setExecutionStatus('error');
      setError(stepError.error);
      onError?.(stepError.error);
    }
  }, [pendingStep, executionStatus, executeStep, steps, stepResults, onComplete, onError]);

  // Execute remaining steps after resume
  const executeRemainingSteps = useCallback(async (startIndex) => {
    for (let i = startIndex; i < steps.length; i++) {
      setCurrentStepIndex(i);
      const step = steps[i];

      try {
        await executeStep(step, i);
        
        if (i < steps.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (stepError) {
        if (!step.continueOnError) {
          setExecutionStatus('error');
          setError(stepError.error);
          onError?.(stepError.error);
          return;
        }
      }
    }

    // All remaining steps completed
    setExecutionStatus('completed');
    setCurrentStepIndex(-1);
    onComplete?.({
      success: true,
      completedSteps: steps.length,
      totalSteps: steps.length,
      results: stepResults
    });
  }, [steps, executeStep, stepResults, onComplete, onError]);

  // Cancel execution
  const cancelExecution = useCallback(() => {
    setExecutionStatus('idle');
    setCurrentStepIndex(-1);
    setError('Execution cancelled by user');
    setPendingStep(null);
    addLog('🛑 Execution cancelled by user', 'warning');
    onCancel?.();
    notifications.warning('Pipeline execution cancelled');
  }, [onCancel, notifications]);

  // Add log entry
  const addLog = useCallback((message, level = 'info', stepIndex = null) => {
    const logEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      message,
      level,
      stepIndex
    };
    
    setExecutionLogs(prev => [...prev, logEntry]);
  }, []);

  // Confirm execution start
  const confirmExecution = () => {
    setShowConfirmation(false);
    executeAllSteps();
  };

  // Cancel execution start
  const cancelExecutionStart = () => {
    setShowConfirmation(false);
    onCancel?.();
  };

  // Get step status
  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex && executionStatus === 'executing') return 'executing';
    if (stepIndex === currentStepIndex && executionStatus === 'paused') return 'paused';
    if (stepIndex === currentStepIndex && executionStatus === 'error') return 'error';
    return 'pending';
  };

  // Get step icon
  const getStepIcon = (stepIndex) => {
    const status = getStepStatus(stepIndex);
    switch (status) {
      case 'completed': return '✅';
      case 'executing': return '⏳';
      case 'paused': return '⏸️';
      case 'error': return '❌';
      default: return '⭕';
    }
  };

  // Get progress percentage
  const getProgress = () => {
    if (steps.length === 0) return 0;
    if (executionStatus === 'completed') return 100;
    return Math.round((currentStepIndex / steps.length) * 100);
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
              {executionStatus === 'idle' && 'Ready to execute pipeline'}
              {executionStatus === 'executing' && `Executing step ${currentStepIndex + 1} of ${steps.length}`}
              {executionStatus === 'paused' && `Paused at step ${currentStepIndex + 1} - Manual confirmation required`}
              {executionStatus === 'completed' && `Completed all ${steps.length} steps successfully`}
              {executionStatus === 'error' && `Failed at step ${currentStepIndex + 1}`}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {executionStatus === 'executing' && (
              <button
                onClick={cancelExecution}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
              >
                Cancel
              </button>
            )}
            
            {executionStatus === 'paused' && (
              <button
                onClick={resumeExecution}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Resume
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Progress</span>
          <span className="text-sm text-gray-500">{getProgress()}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              executionStatus === 'error' ? 'bg-red-500' : 
              executionStatus === 'completed' ? 'bg-green-500' : 
              executionStatus === 'paused' ? 'bg-yellow-500' : 'bg-blue-500'
            }`}
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>
      </div>

      {/* Steps List */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">Pipeline Steps</h4>
        <div className="space-y-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-start space-x-3">
              <div className="flex-shrink-0 text-lg">
                {getStepIcon(index)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h5 className="font-medium text-gray-900">{step.name}</h5>
                  {getStepStatus(index) === 'executing' && (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-blue-600">Processing...</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                
                {/* Step Parameters */}
                {Object.keys(step.parameters).length > 0 && (
                  <div className="mt-2 text-xs text-gray-500">
                    <details className="cursor-pointer">
                      <summary>Parameters</summary>
                      <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                        {JSON.stringify(step.parameters, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}

                {/* Step Result */}
                {stepResults.find(r => r.stepIndex === index) && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                    {stepResults.find(r => r.stepIndex === index).success ? (
                      <span className="text-green-700">✅ Completed successfully</span>
                    ) : (
                      <span className="text-red-700">
                        ❌ {stepResults.find(r => r.stepIndex === index).error}
                      </span>
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
            <h4 className="font-medium text-gray-900 mb-3">Execution Logs</h4>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {executionLogs.map((log) => (
                <div key={log.id} className={`text-xs p-2 rounded ${
                  log.level === 'error' ? 'bg-red-50 text-red-700' :
                  log.level === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                  log.level === 'success' ? 'bg-green-50 text-green-700' :
                  'bg-gray-50 text-gray-700'
                }`}>
                  <div className="flex items-center justify-between">
                    <span>{log.message}</span>
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Execution Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                🚀 Execute AI Pipeline
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Ready to execute {steps.length} pipeline steps automatically
              </p>
            </div>
            
            <div className="p-6">
              <div className="space-y-3">
                {steps.map((step, index) => (
                  <div key={step.id} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                    <span className="text-sm font-medium text-gray-600">{index + 1}.</span>
                    <div>
                      <span className="text-sm font-medium text-gray-900">{step.name}</span>
                      <p className="text-xs text-gray-600">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <p className="text-sm text-blue-800">
                  ℹ️ Steps will be executed automatically. You can cancel at any time during execution.
                </p>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={cancelExecutionStart}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmExecution}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Execute Pipeline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Intervention Modal */}
      {executionStatus === 'paused' && pendingStep && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                ⏸️ Manual Confirmation Required
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                The next step requires your confirmation before proceeding
              </p>
            </div>
            
            <div className="p-6">
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
                <h4 className="font-medium text-yellow-900">{pendingStep.step.name}</h4>
                <p className="text-sm text-yellow-800 mt-1">{pendingStep.step.description}</p>
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                Do you want to continue with this step?
              </p>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={cancelExecution}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel Execution
              </button>
              <button
                onClick={resumeExecution}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPromptExecutionManager;