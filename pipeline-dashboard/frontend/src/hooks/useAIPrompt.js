/*
Data Pipeline Dashboard - AI Prompt Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import { useState, useCallback, useRef } from 'react';
import ApiService from '../services/api';

/**
 * Custom hook for AI prompt functionality
 * @param {string} sessionId - Current session ID
 * @param {string} fileId - Current file ID
 * @returns {Object} - AI prompt state and functions
 */
export const useAIPrompt = (sessionId, fileId) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSteps, setParsedSteps] = useState([]);
  const [executionStatus, setExecutionStatus] = useState('idle'); // idle, executing, completed, error
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const [executionResults, setExecutionResults] = useState([]);
  const [error, setError] = useState(null);
  
  const abortControllerRef = useRef(null);

  // Parse natural language prompt into pipeline steps
  const parsePrompt = useCallback(async (prompt) => {
    if (!prompt.trim()) {
      throw new Error('Prompt cannot be empty');
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await ApiService.interpretPrompt(prompt);
      
      if (response.success && response.steps) {
        setParsedSteps(response.steps);
        return {
          success: true,
          steps: response.steps,
          suggestions: response.suggestions || []
        };
      } else {
        throw new Error(response.message || 'Failed to parse prompt');
      }
    } catch (err) {
      const errorMessage = err.message || 'Failed to parse prompt';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Execute a single pipeline step
  const executeStep = useCallback(async (step, stepIndex) => {
    if (!fileId || !sessionId) {
      throw new Error('File ID and Session ID are required');
    }

    try {
      let result;
      
      switch (step.type) {
        case 'preview':
          result = await ApiService.previewData(fileId);
          break;
          
        case 'clean':
          result = await ApiService.cleanData(sessionId, fileId, step.parameters || {});
          break;
          
        case 'analyze':
          result = await ApiService.analyzeData(sessionId, fileId, step.parameters || {});
          break;
          
        case 'visualize':
          result = await ApiService.visualizeData(sessionId, fileId, step.parameters || {});
          break;
          
        case 'model':
          result = await ApiService.modelData(sessionId, fileId, step.parameters || {});
          break;
          
        case 'report':
          result = await ApiService.generateReport(sessionId, fileId, step.parameters || {});
          break;
          
        case 'convert':
          result = await ApiService.convertData(sessionId, fileId, step.parameters || {});
          break;
          
        case 'schema':
          result = await ApiService.validateSchema(sessionId, fileId, step.parameters || {});
          break;
          
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      return {
        success: true,
        stepIndex,
        step,
        result,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      return {
        success: false,
        stepIndex,
        step,
        error: err.message || 'Step execution failed',
        timestamp: new Date().toISOString()
      };
    }
  }, [fileId, sessionId]);

  // Execute all parsed steps sequentially
  const executeSteps = useCallback(async (steps = parsedSteps, onProgress = null) => {
    if (!steps || steps.length === 0) {
      throw new Error('No steps to execute');
    }

    setExecutionStatus('executing');
    setCurrentStepIndex(0);
    setExecutionResults([]);
    setError(null);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    const results = [];

    try {
      for (let i = 0; i < steps.length; i++) {
        // Check if execution was aborted
        if (abortControllerRef.current?.signal.aborted) {
          throw new Error('Execution was cancelled');
        }

        setCurrentStepIndex(i);
        onProgress?.({
          stepIndex: i,
          totalSteps: steps.length,
          currentStep: steps[i],
          status: 'executing'
        });

        const stepResult = await executeStep(steps[i], i);
        results.push(stepResult);

        // Update results immediately for real-time feedback
        setExecutionResults(prev => [...prev, stepResult]);

        if (!stepResult.success) {
          // Step failed - decide whether to continue or stop
          if (steps[i].continueOnError !== true) {
            setExecutionStatus('error');
            setError(`Step ${i + 1} failed: ${stepResult.error}`);
            
            onProgress?.({
              stepIndex: i,
              totalSteps: steps.length,
              currentStep: steps[i],
              status: 'error',
              error: stepResult.error
            });
            
            return {
              success: false,
              completedSteps: i,
              totalSteps: steps.length,
              results,
              error: stepResult.error
            };
          }
        }

        onProgress?.({
          stepIndex: i,
          totalSteps: steps.length,
          currentStep: steps[i],
          status: 'completed',
          result: stepResult.result
        });

        // Small delay between steps to prevent overwhelming the backend
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setExecutionStatus('completed');
      setCurrentStepIndex(-1);

      return {
        success: true,
        completedSteps: steps.length,
        totalSteps: steps.length,
        results
      };

    } catch (err) {
      setExecutionStatus('error');
      setError(err.message);
      
      return {
        success: false,
        completedSteps: results.length,
        totalSteps: steps.length,
        results,
        error: err.message
      };
    }
  }, [parsedSteps, executeStep]);

  // Cancel execution
  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setExecutionStatus('idle');
    setCurrentStepIndex(-1);
    setError('Execution cancelled by user');
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setParsedSteps([]);
    setExecutionStatus('idle');
    setCurrentStepIndex(-1);
    setExecutionResults([]);
    setError(null);
    setIsProcessing(false);
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  // Get execution progress
  const getExecutionProgress = useCallback(() => {
    if (executionStatus !== 'executing' || parsedSteps.length === 0) {
      return { percentage: 0, current: 0, total: 0 };
    }

    const current = currentStepIndex + 1;
    const total = parsedSteps.length;
    const percentage = (current / total) * 100;

    return { percentage, current, total };
  }, [executionStatus, currentStepIndex, parsedSteps.length]);

  // Validate prompt before parsing
  const validatePrompt = useCallback((prompt) => {
    const errors = [];
    
    if (!prompt || !prompt.trim()) {
      errors.push('Prompt cannot be empty');
    }
    
    if (prompt.length > 1000) {
      errors.push('Prompt is too long (max 1000 characters)');
    }
    
    if (!fileId) {
      errors.push('Please upload a file first');
    }
    
    if (!sessionId) {
      errors.push('Session ID is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [fileId, sessionId]);

  // Get step suggestions based on current context
  const getStepSuggestions = useCallback((prompt) => {
    const suggestions = [];
    const lowerPrompt = prompt.toLowerCase();

    // Analyze prompt for common patterns and suggest improvements
    if (lowerPrompt.includes('clean') && !lowerPrompt.includes('missing')) {
      suggestions.push('Consider specifying how to handle missing values (remove, fill, etc.)');
    }

    if (lowerPrompt.includes('analyze') && !lowerPrompt.includes('correlation') && !lowerPrompt.includes('statistics')) {
      suggestions.push('You might want to specify what type of analysis (correlation, statistics, distribution)');
    }

    if (lowerPrompt.includes('visualize') && !lowerPrompt.includes('chart') && !lowerPrompt.includes('plot')) {
      suggestions.push('Consider specifying chart types (bar, line, scatter, heatmap)');
    }

    if (lowerPrompt.includes('model') && !lowerPrompt.includes('target') && !lowerPrompt.includes('predict')) {
      suggestions.push('For ML models, specify your target variable and prediction type');
    }

    return suggestions;
  }, []);

  return {
    // State
    isProcessing,
    parsedSteps,
    executionStatus,
    currentStepIndex,
    executionResults,
    error,
    
    // Functions
    parsePrompt,
    executeSteps,
    cancelExecution,
    reset,
    validatePrompt,
    getStepSuggestions,
    getExecutionProgress,
    
    // Computed values
    canExecute: parsedSteps.length > 0 && executionStatus === 'idle',
    isExecuting: executionStatus === 'executing',
    isCompleted: executionStatus === 'completed',
    hasError: executionStatus === 'error' || !!error
  };
};

export default useAIPrompt;