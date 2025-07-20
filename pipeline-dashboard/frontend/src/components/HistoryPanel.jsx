/*
Data Pipeline Dashboard - History Panel Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState } from 'react';

const HistoryPanel = ({ 
  history = [], 
  currentIndex = 0,
  onJumpToState,
  onClearHistory,
  loading = false,
  className = "" 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Get action icon
  const getActionIcon = (actionType) => {
    const icons = {
      upload: '📁',
      preview: '👁️',
      clean: '🧹',
      analyze: '📊',
      visualize: '📈',
      model: '🤖',
      report: '📄',
      convert: '🔄',
      schema: '✅',
      snapshot: '📸',
      rollback: '⏪',
      default: '⚡'
    };

    // Extract base action from compound action types
    const baseAction = actionType?.toLowerCase().split('_')[0] || 'default';
    return icons[baseAction] || icons.default;
  };

  // Get action color
  const getActionColor = (actionType, isCurrent) => {
    if (isCurrent) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }

    const colors = {
      upload: 'bg-purple-50 text-purple-700 border-purple-200',
      preview: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      clean: 'bg-green-50 text-green-700 border-green-200',
      analyze: 'bg-orange-50 text-orange-700 border-orange-200',
      visualize: 'bg-pink-50 text-pink-700 border-pink-200',
      model: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      report: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      convert: 'bg-teal-50 text-teal-700 border-teal-200',
      schema: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      default: 'bg-gray-50 text-gray-700 border-gray-200'
    };

    const baseAction = actionType?.toLowerCase().split('_')[0] || 'default';
    return colors[baseAction] || colors.default;
  };

  if (history.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
        <div className="text-center text-gray-500">
          <div className="text-2xl mb-2">📜</div>
          <p className="text-sm">No history available</p>
          <p className="text-xs mt-1">Actions will appear here as you work</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Action History</h3>
            <p className="text-sm text-gray-600">
              {history.length} action{history.length !== 1 ? 's' : ''} • Position {currentIndex + 1}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              <svg 
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {history.length > 1 && (
              <button
                onClick={onClearHistory}
                disabled={loading}
                className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 disabled:opacity-50 transition-colors"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* History List */}
      <div className={`${isExpanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto transition-all duration-200`}>
        {history.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <p className="text-sm">No actions in history</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {history.slice().reverse().map((entry, reverseIndex) => {
              const actualIndex = history.length - 1 - reverseIndex;
              const isCurrent = actualIndex === currentIndex;
              const isFuture = actualIndex > currentIndex;
              
              return (
                <button
                  key={actualIndex}
                  onClick={() => onJumpToState(actualIndex)}
                  disabled={loading || isCurrent}
                  className={`
                    w-full p-3 text-left hover:bg-gray-50 transition-colors
                    ${isCurrent ? 'bg-blue-50' : ''}
                    ${isFuture ? 'opacity-60' : ''}
                    ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="flex items-start space-x-3">
                    {/* Timeline indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs border
                        ${getActionColor(entry.actionType, isCurrent)}
                      `}>
                        {getActionIcon(entry.actionType)}
                      </div>
                      {reverseIndex < history.length - 1 && (
                        <div className={`w-0.5 h-4 mt-1 ${isFuture ? 'bg-gray-200' : 'bg-gray-300'}`} />
                      )}
                    </div>

                    {/* Action details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${isCurrent ? 'text-blue-900' : 'text-gray-900'}`}>
                          {entry.description || 'Unknown action'}
                        </p>
                        <span className="text-xs text-gray-500">
                          #{actualIndex + 1}
                        </span>
                      </div>
                      
                      {entry.stepName && (
                        <p className="text-xs text-gray-600 mt-1">
                          {entry.stepName}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {formatTimestamp(entry.timestamp)}
                        </span>
                        
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                            Current
                          </span>
                        )}
                        
                        {isFuture && (
                          <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                            Future
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t bg-gray-50 text-center">
        <p className="text-xs text-gray-500">
          Click on any action to jump to that state
        </p>
        {!isExpanded && history.length > 5 && (
          <button
            onClick={() => setIsExpanded(true)}
            className="text-xs text-blue-600 hover:text-blue-800 mt-1"
          >
            Show all {history.length} actions
          </button>
        )}
      </div>
    </div>
  );
};

export default HistoryPanel;