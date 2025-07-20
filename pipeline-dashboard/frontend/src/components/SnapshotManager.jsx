/*
Data Pipeline Dashboard - Snapshot Manager Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState } from 'react';
import { useSnapshots } from '../hooks/useSnapshots';
import { useNotifications } from '../hooks/useNotifications';

const SnapshotManager = ({ 
  sessionId, 
  currentStep = 0,
  onSnapshotRestore,
  className = "" 
}) => {
  const {
    snapshots,
    loading,
    error,
    selectedSnapshot,
    createSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    updateSnapshot,
    getSnapshotsByStep,
    clearError
  } = useSnapshots(sessionId);

  const notifications = useNotifications();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(null);
  const [editingSnapshot, setEditingSnapshot] = useState(null);
  const [filter, setFilter] = useState('all');

  // Create snapshot form state
  const [snapshotForm, setSnapshotForm] = useState({
    name: '',
    description: '',
    tags: ''
  });

  // Filter snapshots
  const filteredSnapshots = snapshots.filter(snapshot => {
    if (filter === 'all') return true;
    if (filter === 'auto') return snapshot.auto_created;
    if (filter === 'manual') return !snapshot.auto_created;
    if (filter === 'current') return snapshot.step_id === currentStep;
    return true;
  });

  // Handle create snapshot
  const handleCreateSnapshot = async () => {
    if (!snapshotForm.name.trim()) {
      notifications.warning('Please enter a snapshot name');
      return;
    }

    const metadata = {
      name: snapshotForm.name.trim(),
      description: snapshotForm.description.trim(),
      tags: snapshotForm.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      auto_created: false
    };

    const snapshot = await createSnapshot(currentStep, metadata);
    
    if (snapshot) {
      notifications.success(`Snapshot "${snapshot.name}" created successfully`);
      setShowCreateModal(false);
      setSnapshotForm({ name: '', description: '', tags: '' });
    } else {
      notifications.error('Failed to create snapshot');
    }
  };

  // Handle restore snapshot
  const handleRestoreSnapshot = async (snapshot) => {
    const success = await restoreSnapshot(snapshot.id);
    
    if (success) {
      notifications.success(`Restored to snapshot "${snapshot.name}"`);
      onSnapshotRestore?.(snapshot);
      setShowRestoreConfirm(null);
    } else {
      notifications.error('Failed to restore snapshot');
    }
  };

  // Handle delete snapshot
  const handleDeleteSnapshot = async (snapshot) => {
    const success = await deleteSnapshot(snapshot.id);
    
    if (success) {
      notifications.success(`Snapshot "${snapshot.name}" deleted`);
    } else {
      notifications.error('Failed to delete snapshot');
    }
  };

  // Handle update snapshot
  const handleUpdateSnapshot = async () => {
    if (!editingSnapshot || !editingSnapshot.name.trim()) {
      notifications.warning('Please enter a snapshot name');
      return;
    }

    const updates = {
      name: editingSnapshot.name.trim(),
      description: editingSnapshot.description.trim(),
      tags: typeof editingSnapshot.tags === 'string' 
        ? editingSnapshot.tags.split(',').map(tag => tag.trim()).filter(Boolean)
        : editingSnapshot.tags
    };

    const success = await updateSnapshot(editingSnapshot.id, updates);
    
    if (success) {
      notifications.success('Snapshot updated successfully');
      setEditingSnapshot(null);
    } else {
      notifications.error('Failed to update snapshot');
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Get step name
  const getStepName = (stepId) => {
    const stepNames = [
      'Upload', 'Preview', 'Clean', 'Analyze', 
      'Visualize', 'Model', 'Report', 'Convert', 'Schema'
    ];
    return stepNames[stepId] || `Step ${stepId}`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Pipeline Snapshots</h3>
            <p className="text-sm text-gray-600">
              Save and restore pipeline states at any point
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            📸 Create Snapshot
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'All Snapshots' },
            { id: 'current', label: 'Current Step' },
            { id: 'manual', label: 'Manual' },
            { id: 'auto', label: 'Auto-created' }
          ].map((filterOption) => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`
                px-3 py-1 text-sm rounded-full transition-colors
                ${filter === filterOption.id 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">❌</span>
              <span className="text-red-800 text-sm">{error}</span>
            </div>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Snapshots List */}
      <div className="max-h-96 overflow-y-auto">
        {loading && snapshots.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading snapshots...</p>
          </div>
        ) : filteredSnapshots.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <div className="text-4xl mb-4">📸</div>
            <p>No snapshots found</p>
            <p className="text-sm mt-1">
              {filter === 'all' 
                ? 'Create your first snapshot to save the current pipeline state'
                : `No ${filter} snapshots available`
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSnapshots.map((snapshot) => (
              <div key={snapshot.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Snapshot Header */}
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {editingSnapshot?.id === snapshot.id ? (
                          <input
                            type="text"
                            value={editingSnapshot.name}
                            onChange={(e) => setEditingSnapshot(prev => ({ ...prev, name: e.target.value }))}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          snapshot.name
                        )}
                      </h4>
                      
                      {snapshot.auto_created && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Auto
                        </span>
                      )}
                      
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                        {getStepName(snapshot.step_id)}
                      </span>
                    </div>

                    {/* Description */}
                    {(snapshot.description || editingSnapshot?.id === snapshot.id) && (
                      <p className="text-sm text-gray-600 mb-2">
                        {editingSnapshot?.id === snapshot.id ? (
                          <textarea
                            value={editingSnapshot.description}
                            onChange={(e) => setEditingSnapshot(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                            rows={2}
                          />
                        ) : (
                          snapshot.description
                        )}
                      </p>
                    )}

                    {/* Tags */}
                    {snapshot.tags && snapshot.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {editingSnapshot?.id === snapshot.id ? (
                          <input
                            type="text"
                            value={Array.isArray(editingSnapshot.tags) ? editingSnapshot.tags.join(', ') : editingSnapshot.tags}
                            onChange={(e) => setEditingSnapshot(prev => ({ ...prev, tags: e.target.value }))}
                            placeholder="tag1, tag2, tag3"
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        ) : (
                          snapshot.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                              {tag}
                            </span>
                          ))
                        )}
                      </div>
                    )}

                    {/* Metadata */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{formatTimestamp(snapshot.created_at)}</span>
                      {snapshot.file_size > 0 && (
                        <span>{formatFileSize(snapshot.file_size)}</span>
                      )}
                      {snapshot.row_count > 0 && (
                        <span>{snapshot.row_count.toLocaleString()} rows</span>
                      )}
                      {snapshot.column_count > 0 && (
                        <span>{snapshot.column_count} columns</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {editingSnapshot?.id === snapshot.id ? (
                      <>
                        <button
                          onClick={handleUpdateSnapshot}
                          className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingSnapshot(null)}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => setShowRestoreConfirm(snapshot)}
                          disabled={loading}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 disabled:opacity-50"
                        >
                          🔄 Restore
                        </button>
                        <button
                          onClick={() => setEditingSnapshot({ ...snapshot })}
                          className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          ✏️ Edit
                        </button>
                        {!snapshot.auto_created && (
                          <button
                            onClick={() => handleDeleteSnapshot(snapshot)}
                            disabled={loading}
                            className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50"
                          >
                            🗑️ Delete
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Snapshot Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowCreateModal(false)} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Snapshot</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Snapshot Name *
                  </label>
                  <input
                    type="text"
                    value={snapshotForm.name}
                    onChange={(e) => setSnapshotForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter snapshot name..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={snapshotForm.description}
                    onChange={(e) => setSnapshotForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={snapshotForm.tags}
                    onChange={(e) => setSnapshotForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="tag1, tag2, tag3..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSnapshot}
                  disabled={loading || !snapshotForm.name.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Snapshot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-50" onClick={() => setShowRestoreConfirm(null)} />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">⚠️</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Restore Snapshot</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-700 mb-2">
                  Are you sure you want to restore to snapshot:
                </p>
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="font-medium text-gray-900">{showRestoreConfirm.name}</p>
                  <p className="text-sm text-gray-600">{getStepName(showRestoreConfirm.step_id)} • {formatTimestamp(showRestoreConfirm.created_at)}</p>
                  {showRestoreConfirm.description && (
                    <p className="text-sm text-gray-600 mt-1">{showRestoreConfirm.description}</p>
                  )}
                </div>
                <p className="text-sm text-red-600 mt-2">
                  This will overwrite your current pipeline state and any unsaved changes will be lost.
                </p>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowRestoreConfirm(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRestoreSnapshot(showRestoreConfirm)}
                  disabled={loading}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {loading ? 'Restoring...' : 'Restore Snapshot'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SnapshotManager;