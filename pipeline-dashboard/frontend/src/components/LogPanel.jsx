/*
Data Pipeline Dashboard - Log Panel Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect, useRef } from 'react';

const LogPanel = ({ 
  logs = [], 
  onLogClick, 
  maxEntries = 100,
  autoScroll = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [isAutoScroll, setIsAutoScroll] = useState(autoScroll);
  const [expandedLogs, setExpandedLogs] = useState(new Set());
  const logContainerRef = useRef(null);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isAutoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const getLevelConfig = (level) => {
    switch (level?.toLowerCase()) {
      case 'success':
        return {
          color: 'text-green-400',
          bgColor: 'bg-green-900/20',
          icon: '✓',
          borderColor: 'border-green-500/30'
        };
      case 'error':
        return {
          color: 'text-red-400',
          bgColor: 'bg-red-900/20',
          icon: '✗',
          borderColor: 'border-red-500/30'
        };
      case 'warning':
        return {
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-900/20',
          icon: '⚠',
          borderColor: 'border-yellow-500/30'
        };
      case 'info':
      default:
        return {
          color: 'text-blue-400',
          bgColor: 'bg-blue-900/20',
          icon: 'ℹ',
          borderColor: 'border-blue-500/30'
        };
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return new Date().toLocaleTimeString();
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = !searchTerm || 
        (log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesLevel = selectedLevel === 'all' || 
        (log.level && log.level.toLowerCase() === selectedLevel);
      return matchesSearch && matchesLevel;
    })
    .slice(-maxEntries);

  const toggleLogExpansion = (logIndex) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logIndex)) {
      newExpanded.delete(logIndex);
    } else {
      newExpanded.add(logIndex);
    }
    setExpandedLogs(newExpanded);
  };

  const exportLogs = () => {
    const logText = filteredLogs
      .map(log => `[${formatTimestamp(log.timestamp)}] ${log.level?.toUpperCase() || 'INFO'}: ${log.message}`)
      .join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pipeline-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    // This would typically call a parent function to clear logs
    console.log('Clear logs requested');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-lg text-gray-900">Live Logs</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${logs.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} 
                 title={logs.length > 0 ? 'Receiving logs' : 'No activity'} />
            <span className="text-xs text-gray-500">{filteredLogs.length} entries</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-2">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Level Filter */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>

          {/* Action Buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => setIsAutoScroll(!isAutoScroll)}
              className={`px-2 py-1.5 text-xs rounded-md transition-colors ${
                isAutoScroll 
                  ? 'bg-blue-100 text-blue-800 hover:bg-blue-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isAutoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
            >
              {isAutoScroll ? '📌' : '📌'}
            </button>
            <button
              onClick={exportLogs}
              className="px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              title="Export logs"
            >
              💾
            </button>
            <button
              onClick={clearLogs}
              className="px-2 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors"
              title="Clear logs"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Log Container */}
      <div 
        ref={logContainerRef}
        className="flex-1 bg-gray-900 text-white p-3 overflow-y-auto font-mono text-sm"
        style={{ minHeight: '300px', maxHeight: '500px' }}
      >
        {filteredLogs.length > 0 ? (
          filteredLogs.map((log, index) => {
            const levelConfig = getLevelConfig(log.level);
            const isExpanded = expandedLogs.has(index);
            const hasDetails = log.details && Object.keys(log.details).length > 0;
            
            return (
              <div 
                key={log.id || index} 
                className={`mb-2 p-2 rounded border-l-2 ${levelConfig.bgColor} ${levelConfig.borderColor} hover:bg-gray-800/50 transition-colors cursor-pointer`}
                onClick={() => {
                  if (hasDetails) toggleLogExpansion(index);
                  if (onLogClick) onLogClick(log);
                }}
              >
                <div className="flex items-start space-x-2">
                  <span className={`${levelConfig.color} font-bold`}>
                    {levelConfig.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-gray-400 text-xs">
                        [{formatTimestamp(log.timestamp)}]
                      </span>
                      {log.level && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${levelConfig.color} ${levelConfig.bgColor}`}>
                          {log.level.toUpperCase()}
                        </span>
                      )}
                      {log.stepId !== undefined && (
                        <span className="text-xs text-gray-500">
                          Step {log.stepId + 1}
                        </span>
                      )}
                    </div>
                    <div className="text-gray-100 break-words">
                      {log.message}
                    </div>
                    
                    {/* Expanded Details */}
                    {isExpanded && hasDetails && (
                      <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
                        <div className="text-gray-400 mb-1">Details:</div>
                        <pre className="text-gray-300 whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                  
                  {hasDetails && (
                    <button className="text-gray-500 hover:text-gray-300 text-xs">
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-2xl mb-2">📝</div>
              <div className="text-sm">
                {searchTerm || selectedLevel !== 'all' 
                  ? 'No logs match your filters' 
                  : 'No logs yet...'}
              </div>
              {(searchTerm || selectedLevel !== 'all') && (
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedLevel('all');
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 mt-1"
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
        <span>
          {isAutoScroll ? 'Auto-scroll enabled' : 'Auto-scroll disabled'}
        </span>
        <span>
          {filteredLogs.length} / {logs.length} logs
        </span>
      </div>
    </div>
  );
};

export default LogPanel;