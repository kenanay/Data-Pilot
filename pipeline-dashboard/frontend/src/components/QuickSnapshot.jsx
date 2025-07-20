/*
Data Pipeline Dashboard - Quick Snapshot Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState } from 'react';
import { useSnapshots } from '../hooks/useSnapshots';
import { useNotifications } from '../hooks/useNotifications';

const QuickSnapshot = ({ 
  sessionId, 
  stepId, 
  stepName,
  onSnapshotCreated,
  className = "" 
}) => {
  const { createSnapshot, loading } = useSnapshots(sessionId);
  const notifications = useNotifications();
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickName, setQuickName] = useState('');

  // Handle quick snapshot creation
  const handleQuickSnapshot = async () => {
    const name = quickName.trim() || `${stepName} - ${new Date().toLocaleTimeString()}`;
    
    const snapshot = await createSnapshot(stepId, {
      name,
      description: `Quick snapshot created at ${stepName} step`,
      tags: ['quick', stepName.toLowerCase()],
      auto_created: false
    });

    if (snapshot) {
      notifications.success(`Quick snapshot "${snapshot.name}" created`);
      onSnapshotCreated?.(snapshot);
      setShowQuickForm(false);
      setQuickName('');
    } else {
      notifications.error('Failed to create quick snapshot');
    }
  };

  // Handle auto snapshot creation
  const handleAutoSnapshot = async () => {
    const snapshot = await createSnapshot(stepId, {
      name: `Auto: ${stepName}`,
      description: `Automatically created snapshot for ${stepName} step`,
      tags: ['auto', stepName.toLowerCase()],
      auto_created: true
    });

    if (snapshot) {
      notifications.success(`Auto snapshot created for ${stepName}`);
      onSnapshotCreated?.(snapshot);
    }
  };

  if (showQuickForm) {
    return (
      <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={quickName}
            onChange={(e) => setQuickName(e.target.value)}
            placeholder={`${stepName} snapshot...`}
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && handleQuickSnapshot()}
            autoFocus
          />
          <button
            onClick={handleQuickSnapshot}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? '⏳' : '📸'}
          </button>
          <button
            onClick={() => {
              setShowQuickForm(false);
              setQuickName('');
            }}
            className="px-2 py-1 text-sm text-gray-600 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <button
        onClick={() => setShowQuickForm(true)}
        disabled={loading}
        className="flex items-center space-x-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50 transition-colors"
        title="Create quick snapshot"
      >
        <span>📸</span>
        <span>Quick Save</span>
      </button>
      
      <button
        onClick={handleAutoSnapshot}
        disabled={loading}
        className="flex items-center space-x-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 transition-colors"
        title="Create auto snapshot"
      >
        <span>🤖</span>
        <span>Auto Save</span>
      </button>
    </div>
  );
};

export default QuickSnapshot;