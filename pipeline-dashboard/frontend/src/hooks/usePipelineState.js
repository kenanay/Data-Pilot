/*
Data Pipeline Dashboard - Pipeline State Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import { useState, useEffect, useCallback } from 'react';
import ApiService from '../services/api';

export const usePipelineState = (sessionId) => {
  const [pipelineState, setPipelineState] = useState({
    session_id: sessionId,
    user_id: null,
    current_file_id: null,
    current_step: 0,
    steps: [],
    snapshots: [],
    created_at: null,
    updated_at: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch pipeline state from API
  const fetchPipelineState = useCallback(async () => {
    try {
      setError(null);
      const data = await ApiService.getPipelineState(sessionId);
      setPipelineState(data);
    } catch (err) {
      console.error('Failed to fetch pipeline state:', err);
      setError(err.message || 'Failed to fetch pipeline state');
    }
  }, [sessionId]);

  // Execute a pipeline step
  const executeStep = useCallback(async (stepName, parameters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.executeStep(
        stepName, 
        sessionId, 
        pipelineState.current_file_id, 
        parameters
      );

      // Update pipeline state with response
      if (response.pipeline_state) {
        setPipelineState(response.pipeline_state);
      } else {
        // Refresh state from server
        await fetchPipelineState();
      }

      return response;
    } catch (err) {
      console.error(`Failed to execute step ${stepName}:`, err);
      const errorMessage = err.message || `Failed to execute ${stepName}`;
      setError(errorMessage);
      
      // Update step status to error
      setPipelineState(prev => ({
        ...prev,
        steps: prev.steps.map((step, index) => 
          step.step_name === stepName 
            ? { ...step, status: 'error', error_message: errorMessage }
            : step
        )
      }));
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, pipelineState.current_file_id, fetchPipelineState]);

  // Upload file
  const uploadFile = useCallback(async (file) => {
    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.uploadFile(file, sessionId);

      // Update pipeline state with new file
      setPipelineState(prev => ({
        ...prev,
        current_file_id: response.file_id,
        current_step: 1, // Move to preview step
        steps: [
          {
            step_id: 0,
            step_name: 'upload',
            status: 'completed',
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            parameters: { filename: file.name, size: file.size },
            results: response
          }
        ]
      }));

      return response;
    } catch (err) {
      console.error('Failed to upload file:', err);
      const errorMessage = err.message || 'Failed to upload file';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Rollback to a previous step
  const rollbackToStep = useCallback(async (stepIndex) => {
    setLoading(true);
    setError(null);

    try {
      const step = pipelineState.steps[stepIndex];
      if (!step?.snapshot_id) {
        throw new Error('No snapshot available for this step');
      }

      const response = await ApiService.rollbackToSnapshot(sessionId, step.snapshot_id);
      setPipelineState(response.pipeline_state);
      return response;
    } catch (err) {
      console.error('Failed to rollback:', err);
      const errorMessage = err.message || 'Failed to rollback';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [sessionId, pipelineState.steps]);

  // Get available snapshots
  const getSnapshots = useCallback(async () => {
    try {
      const response = await ApiService.getSnapshots(sessionId);
      return response.snapshots;
    } catch (err) {
      console.error('Failed to fetch snapshots:', err);
      throw err;
    }
  }, [sessionId]);

  // Initialize pipeline state on mount
  useEffect(() => {
    fetchPipelineState();
  }, [fetchPipelineState]);

  // Auto-refresh pipeline state every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchPipelineState();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchPipelineState, loading]);

  return {
    pipelineState,
    loading,
    error,
    executeStep,
    uploadFile,
    rollbackToStep,
    getSnapshots,
    refreshState: fetchPipelineState,
    clearError: () => setError(null)
  };
};