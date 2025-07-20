/*
Data Pipeline Dashboard - Retry Mechanism Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for implementing retry mechanisms with exponential backoff
 * @param {Function} asyncFunction - The async function to retry
 * @param {Object} options - Configuration options
 * @returns {Object} - Retry state and functions
 */
export const useRetry = (asyncFunction, options = {}) => {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 10000,
    retryCondition = (error) => true, // Function to determine if error should trigger retry
    onRetry = () => {}, // Callback when retry is attempted
    onMaxRetriesReached = () => {}, // Callback when max retries reached
  } = options;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);

  const timeoutRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Calculate delay with exponential backoff
  const calculateDelay = useCallback((attempt) => {
    const delay = initialDelay * Math.pow(backoffMultiplier, attempt);
    return Math.min(delay, maxDelay);
  }, [initialDelay, backoffMultiplier, maxDelay]);

  // Execute function with retry logic
  const execute = useCallback(async (...args) => {
    // Cancel any pending retry
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this attempt
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);
    setLastAttemptTime(Date.now());

    let currentAttempt = 0;

    const attemptExecution = async () => {
      try {
        const result = await asyncFunction(...args, {
          signal: abortControllerRef.current?.signal
        });
        
        // Success - reset retry count
        setRetryCount(0);
        setIsLoading(false);
        setError(null);
        
        return result;
      } catch (err) {
        // Check if request was aborted
        if (err.name === 'AbortError') {
          setIsLoading(false);
          return;
        }

        console.error(`Attempt ${currentAttempt + 1} failed:`, err);

        // Check if we should retry this error
        if (!retryCondition(err)) {
          setError(err);
          setIsLoading(false);
          throw err;
        }

        // Check if we've reached max retries
        if (currentAttempt >= maxRetries) {
          setError(err);
          setRetryCount(currentAttempt + 1);
          setIsLoading(false);
          onMaxRetriesReached(err, currentAttempt + 1);
          throw err;
        }

        // Calculate delay for next attempt
        const delay = calculateDelay(currentAttempt);
        currentAttempt++;
        setRetryCount(currentAttempt);
        
        // Notify about retry attempt
        onRetry(err, currentAttempt, delay);

        // Wait before retrying
        await new Promise((resolve) => {
          timeoutRef.current = setTimeout(resolve, delay);
        });

        // Retry the execution
        return attemptExecution();
      }
    };

    return attemptExecution();
  }, [asyncFunction, maxRetries, retryCondition, onRetry, onMaxRetriesReached, calculateDelay]);

  // Manual retry function
  const retry = useCallback(() => {
    if (!isLoading) {
      return execute();
    }
  }, [execute, isLoading]);

  // Reset retry state
  const reset = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
    setError(null);
    setRetryCount(0);
    setLastAttemptTime(null);
  }, []);

  // Cancel ongoing operation
  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);
  }, []);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    execute,
    retry,
    reset,
    cancel,
    isLoading,
    error,
    retryCount,
    lastAttemptTime,
    hasReachedMaxRetries: retryCount >= maxRetries,
    nextRetryDelay: retryCount < maxRetries ? calculateDelay(retryCount) : null,
  };
};

/**
 * Hook for retrying API calls specifically
 */
export const useApiRetry = (apiFunction, options = {}) => {
  const defaultOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    retryCondition: (error) => {
      // Retry on network errors and 5xx server errors
      if (!error.response) return true; // Network error
      const status = error.response.status;
      return status >= 500 || status === 408 || status === 429; // Server errors, timeout, rate limit
    },
    onRetry: (error, attempt, delay) => {
      console.log(`API call failed, retrying in ${delay}ms (attempt ${attempt})`);
    },
    ...options
  };

  return useRetry(apiFunction, defaultOptions);
};

/**
 * Hook for retrying WebSocket connections
 */
export const useWebSocketRetry = (connectFunction, options = {}) => {
  const defaultOptions = {
    maxRetries: 5,
    initialDelay: 1000,
    maxDelay: 30000,
    retryCondition: (error) => {
      // Always retry WebSocket connection errors
      return true;
    },
    onRetry: (error, attempt, delay) => {
      console.log(`WebSocket connection failed, retrying in ${delay}ms (attempt ${attempt})`);
    },
    ...options
  };

  return useRetry(connectFunction, defaultOptions);
};

export default useRetry;