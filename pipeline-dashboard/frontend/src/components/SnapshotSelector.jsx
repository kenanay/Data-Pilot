/*
Data Pipeline Dashboard - Snapshot Selector Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState } from 'react';
import { useSnapshots } from '../hooks/useSnapshots';

const SnapshotSelector = ({ 
  sessionId, 
  onSnapshotSelect,
  currentStep,
  showStepFilter = true,
  className = "" 
}) => {
  const { snapshots, loading, getSnapshotsByStep } = useSnapshots(sessionId);
  const [selectedStepFilter, setSelectedStepFilter] = useState('all');
  const [isOpen, setIsOpen] = useState(false);

  // Get step names
  const getStepName = (stepId) => {
    const stepNames = [
      'Upload', 'Preview', 'Clean', 'Analyze', 
      'Visualize', 'Model', 'Report', 'Convert', 'Schema'
    ];
    return stepNames[stepId] || `Step ${stepId}`;
  };

  // Filter snapshots
  const filteredSnapshots = selectedStepFilter === 'all' 
    ? snapshots 
    : selectedStepFilter === 'current'
    ? getSnapshotsByStep(currentStep)
    : getSnapshotsByStep(parseInt(selectedStepFilter));

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

  // Handle snapshot selection
  const handleSnapshotSelect = (snapshot) => {
    onSnapshotSelect?.(snapshot);
    setIsOpen(false);
  };

  // Get unique steps that have snapshots
  const availableSteps = [...new Set(snapshots.map(s => s.step_id))].sort((a, b) => a - b);

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || snapshots.length === 0}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <span>🔄</span>
        <span className="text-sm">
          {snapshots.length === 0 ? 'No Snapshots' : `Restore (${snapshots.length})`}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          {/* Header */}
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Select Snapshot</h4>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step Filter */}
            {showStepFilter && availableSteps.length > 1 && (
              <div className="mt-2">
                <select
                  value={selectedStepFilter}
                  onChange={(e) => setSelectedStepFilter(e.target.value)}
                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="all">All Steps</option>
                  <option value="current">Current Step ({getStepName(currentStep)})</option>
                  {availableSteps.map(stepId => (
                    <option key={stepId} value={stepId.toString()}>
                      {getStepName(stepId)} ({getSnapshotsByStep(stepId).length})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Snapshots List */}
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading snapshots...</p>
              </div>
            ) : filteredSnapshots.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <div className="text-2xl mb-2">📸</div>
                <p className="text-sm">No snapshots available</p>
                <p className="text-xs mt-1">
                  {selectedStepFilter === 'all' 
                    ? 'Create snapshots to restore pipeline states'
                    : `No snapshots for ${selectedStepFilter === 'current' ? 'current step' : getStepName(parseInt(selectedStepFilter))}`
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredSnapshots.map((snapshot) => (
                  <button
                    key={snapshot.id}
                    onClick={() => handleSnapshotSelect(snapshot)}
                    className="w-full p-3 text-left hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Snapshot Name */}
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-gray-900 truncate">
                            {snapshot.name}
                          </p>
                          {snapshot.auto_created && (
                            <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                              Auto
                            </span>
                          )}
                        </div>

                        {/* Step and Time */}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span className="px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded">
                            {getStepName(snapshot.step_id)}
                          </span>
                          <span>{formatTimestamp(snapshot.created_at)}</span>
                        </div>

                        {/* Description */}
                        {snapshot.description && (
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {snapshot.description}
                          </p>
                        )}

                        {/* Tags */}
                        {snapshot.tags && snapshot.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {snapshot.tags.slice(0, 3).map((tag, index) => (
                              <span key={index} className="px-1 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                            {snapshot.tags.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{snapshot.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Restore Icon */}
                      <div className="flex-shrink-0 ml-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {filteredSnapshots.length > 0 && (
            <div className="p-2 border-t bg-gray-50 text-center">
              <p className="text-xs text-gray-500">
                Click on a snapshot to restore pipeline state
              </p>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default SnapshotSelector;