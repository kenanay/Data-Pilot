/*
Data Pipeline Dashboard - Security Monitor Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Security monitoring dashboard component that displays security status,
violations, and provides security controls for administrators.
*/

import React, { useState, useEffect } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle, Eye, EyeOff } from 'lucide-react';
import { useSecurityContext } from './SecurityProvider';
import { securityLogger } from '../utils/security';

const SecurityMonitor = ({ isVisible = false, onToggle }) => {
  const { securityStatus, clearViolations } = useSecurityContext();
  const [logs, setLogs] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const updateLogs = () => {
      const allLogs = securityLogger.getLogs();
      const filteredLogs = filter === 'all' 
        ? allLogs 
        : allLogs.filter(log => log.level === filter || log.event.includes(filter.toUpperCase()));
      
      setLogs(filteredLogs.slice(-50)); // Show last 50 logs
    };

    updateLogs();
    const interval = setInterval(updateLogs, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [filter]);

  const getStatusIcon = () => {
    if (securityStatus.isSecure) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        title="Security Monitor"
      >
        <Shield className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Security Monitor</h3>
          {getStatusIcon()}
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <EyeOff className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Status Summary */}
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Status:</span>
            <span className={`ml-2 font-medium ${securityStatus.isSecure ? 'text-green-600' : 'text-red-600'}`}>
              {securityStatus.isSecure ? 'Secure' : 'Alert'}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Violations:</span>
            <span className="ml-2 font-medium text-gray-900">
              {securityStatus.violations.length}
            </span>
          </div>
        </div>
        
        {securityStatus.violations.length > 0 && (
          <button
            onClick={clearViolations}
            className="mt-2 px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Clear Violations
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="p-3 border-b border-gray-200">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded px-2 py-1"
        >
          <option value="all">All Events</option>
          <option value="error">Errors</option>
          <option value="warning">Warnings</option>
          <option value="info">Info</option>
          <option value="VIOLATION">Violations</option>
          <option value="RATE_LIMIT">Rate Limits</option>
        </select>
      </div>

      {/* Security Logs */}
      <div className="max-h-48 overflow-y-auto">
        {logs.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No security events
          </div>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div
                key={index}
                className={`p-2 text-xs border-l-2 ${
                  log.event.includes('VIOLATION') || log.event.includes('ATTACK')
                    ? 'border-red-500 bg-red-50'
                    : log.event.includes('SUCCESS')
                    ? 'border-green-500 bg-green-50'
                    : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">
                    {log.event.replace(/_/g, ' ')}
                  </span>
                  <span className="text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                {log.message && (
                  <div className="mt-1 text-gray-600">
                    {log.message}
                  </div>
                )}
                {log.details && Object.keys(log.details).length > 0 && (
                  <div className="mt-1 text-gray-500">
                    {Object.entries(log.details).map(([key, value]) => (
                      <div key={key} className="truncate">
                        {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 text-xs text-gray-500 text-center">
        Last updated: {securityStatus.lastCheck ? formatTimestamp(securityStatus.lastCheck) : 'Never'}
      </div>
    </div>
  );
};

export default SecurityMonitor;