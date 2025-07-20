/*
Data Pipeline Dashboard - Snapshot Management Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import { useState, useCallback, useEffect } from 'react';
import ApiService from '../services/api';

/**
 * Custom hook for managing pipeline snapshots
 * @param {string} sessionId - Current session ID
 * @returns {Object} - Snapshot management functions and state
 */
export const useSnapshots = (sessionId) => {
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Load snapshots for current session
  const loadSnapshots = useCallback(async () => {
    if (!sessionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.getSnapshots(sessionId);
      setSnapshots(response.snapshots || []);
    } catch (err) {
      console.error('Failed to load snapshots:', err);
      setError(err.message || 'Failed to load snapshots');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Create a new snapshot
  const createSnapshot = useCallback(async (stepId, metadata = {}) => {
    if (!sessionId) return null;

    setLoading(true);
    setError(null);

    try {
      const snapshotData = {
        session_id: sessionId,
        step_id: stepId,
        name: metadata.name || `Step ${stepId} Snapshot`,
        description: metadata.description || '',
        tags: metadata.tags || [],
        auto_created: metadata.auto_created || false,
        ...metadata
      };

      const response = await ApiService.createSnapshot(sessionId, stepId, snapshotData);
      
      const newSnapshot = {
        id: response.snapshot_id,
        session_id: sessionId,
        step_id: stepId,
        name: snapshotData.name,
        description: snapshotData.description,
        tags: snapshotData.tags,
        auto_created: snapshotData.auto_created,
        created_at: response.created_at || new Date().toISOString(),
        file_size: response.file_size || 0,
        row_count: response.row_count || 0,
        column_count: response.column_count || 0,
        ...response
      };

      setSnapshots(prev => [newSnapshot, ...prev]);
      return newSnapshot;
    } catch (err) {
      console.error('Failed to create snapshot:', err);
      setError(err.message || 'Failed to create snapshot');
      return null;
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  // Restore from snapshot
  const restoreSnapshot = useCallback(async (snapshotId) => {
    if (!sessionId || !snapshotId) return false;

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.rollbackToSnapshot(sessionId, snapshotId);
      
      // Update selected snapshot
      const snapshot = snapshots.find(s => s.id === snapshotId);
      if (snapshot) {
        setSelectedSnapshot(snapshot);
      }

      return response;
    } catch (err) {
      console.error('Failed to restore snapshot:', err);
      setError(err.message || 'Failed to restore snapshot');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId, snapshots]);

  // Delete snapshot
  const deleteSnapshot = useCallback(async (snapshotId) => {
    if (!sessionId || !snapshotId) return false;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would call an API endpoint
      // await ApiService.deleteSnapshot(snapshotId);
      
      // For now, just remove from local state
      setSnapshots(prev => prev.filter(s => s.id !== snapshotId));
      
      if (selectedSnapshot?.id === snapshotId) {
        setSelectedSnapshot(null);
      }

      return true;
    } catch (err) {
      console.error('Failed to delete snapshot:', err);
      setError(err.message || 'Failed to delete snapshot');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedSnapshot]);

  // Update snapshot metadata
  const updateSnapshot = useCallback(async (snapshotId, updates) => {
    if (!sessionId || !snapshotId) return false;

    setLoading(true);
    setError(null);

    try {
      // In a real implementation, you would call an API endpoint
      // await ApiService.updateSnapshot(snapshotId, updates);
      
      // For now, just update local state
      setSnapshots(prev => prev.map(snapshot =>
        snapshot.id === snapshotId
          ? { ...snapshot, ...updates, updated_at: new Date().toISOString() }
          : snapshot
      ));

      if (selectedSnapshot?.id === snapshotId) {
        setSelectedSnapshot(prev => ({ ...prev, ...updates }));
      }

      return true;
    } catch (err) {
      console.error('Failed to update snapshot:', err);
      setError(err.message || 'Failed to update snapshot');
      return false;
    } finally {
      setLoading(false);
    }
  }, [sessionId, selectedSnapshot]);

  // Get snapshots by step
  const getSnapshotsByStep = useCallback((stepId) => {
    return snapshots.filter(snapshot => snapshot.step_id === stepId);
  }, [snapshots]);

  // Get latest snapshot
  const getLatestSnapshot = useCallback(() => {
    if (snapshots.length === 0) return null;
    return snapshots.reduce((latest, current) => 
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    );
  }, [snapshots]);

  // Auto-create snapshot for step
  const autoCreateSnapshot = useCallback(async (stepId, stepName) => {
    return createSnapshot(stepId, {
      name: `Auto: ${stepName}`,
      description: `Automatically created snapshot for ${stepName} step`,
      auto_created: true,
      tags: ['auto', stepName.toLowerCase()]
    });
  }, [createSnapshot]);

  // Cleanup old snapshots
  const cleanupSnapshots = useCallback(async (maxSnapshots = 10) => {
    if (snapshots.length <= maxSnapshots) return;

    const sortedSnapshots = [...snapshots].sort((a, b) => 
      new Date(b.created_at) - new Date(a.created_at)
    );

    const snapshotsToDelete = sortedSnapshots.slice(maxSnapshots);
    
    for (const snapshot of snapshotsToDelete) {
      if (snapshot.auto_created) {
        await deleteSnapshot(snapshot.id);
      }
    }
  }, [snapshots, deleteSnapshot]);

  // Load snapshots on mount
  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  // Auto-cleanup on snapshots change
  useEffect(() => {
    if (snapshots.length > 15) {
      cleanupSnapshots(10);
    }
  }, [snapshots.length, cleanupSnapshots]);

  return {
    snapshots,
    loading,
    error,
    selectedSnapshot,
    setSelectedSnapshot,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    updateSnapshot,
    getSnapshotsByStep,
    getLatestSnapshot,
    autoCreateSnapshot,
    cleanupSnapshots,
    clearError: () => setError(null)
  };
};

export default useSnapshots;