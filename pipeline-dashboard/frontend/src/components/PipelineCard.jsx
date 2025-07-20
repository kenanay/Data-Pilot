/*
Data Pipeline Dashboard - Pipeline Card Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, memo, useMemo, useCallback } from 'react';

const PipelineCard = memo(({ 
  stepTitle, 
  status = 'pending', 
  time, 
  details, 
  metrics,
  duration,
  errorMessage,
  onRollback, 
  onShowLog,
  onRetry
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Memoize status configuration to avoid recalculation
  const statusConfig = useMemo(() => {
    switch (status) {
      case 'completed':
        return {
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          textColor: 'text-green-800',
          icon: '✅',
          iconBg: 'bg-green-100'
        };
      case 'active':
        return {
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          icon: '🔄',
          iconBg: 'bg-blue-100'
        };
      case 'error':
        return {
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          icon: '❌',
          iconBg: 'bg-red-100'
        };
      case 'pending':
      default:
        return {
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-600',
          icon: '⏳',
          iconBg: 'bg-gray-100'
        };
    }
  }, [status]);

  // Memoize duration formatting
  const formattedDuration = useMemo(() => {
    if (!duration) return null;
    if (duration < 1000) return `${duration}ms`;
    if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
    return `${(duration / 60000).toFixed(1)}m`;
  }, [duration]);

  // Memoize metrics and expand button logic
  const { hasMetrics, showExpandButton } = useMemo(() => {
    const hasMetrics = metrics && Object.keys(metrics).length > 0;
    const showExpandButton = hasMetrics || errorMessage || (details && details.length > 100);
    return { hasMetrics, showExpandButton };
  }, [metrics, errorMessage, details]);

  // Memoize callback functions to prevent unnecessary re-renders
  const handleToggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleRollback = useCallback(() => {
    onRollback?.();
  }, [onRollback]);

  const handleRetry = useCallback(() => {
    onRetry?.();
  }, [onRetry]);

  const handleShowLog = useCallback(() => {
    onShowLog?.();
  }, [onShowLog]);

  return (
    <div className={`rounded-lg shadow-sm border-2 transition-all duration-200 hover:shadow-md ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
      {/* Header */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${statusConfig.iconBg}`}>
              {status === 'active' ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                statusConfig.icon
              )}
            </div>
            <div>
              <h3 className={`font-semibold text-lg ${statusConfig.textColor}`}>
                {stepTitle}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                {time && <span>{time}</span>}
                {formattedDuration && (
                  <>
                    <span>•</span>
                    <span>{formattedDuration}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Status Badge */}
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusConfig.textColor} ${statusConfig.iconBg}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </div>
        </div>

        {/* Details */}
        <div className="mb-3">
          <p className="text-gray-700 text-sm leading-relaxed">
            {isExpanded ? details : (details?.length > 100 ? `${details.slice(0, 100)}...` : details)}
          </p>
          
          {/* Error Message */}
          {status === 'error' && errorMessage && (
            <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-md">
              <p className="text-red-800 text-sm font-medium">Error:</p>
              <p className="text-red-700 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        {/* Metrics (when expanded) */}
        {isExpanded && hasMetrics && (
          <div className="mb-3 p-3 bg-white rounded-md border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Metrics</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(metrics).map(([key, value]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-600 capitalize">{key.replace('_', ' ')}:</span>
                  <span className="font-medium text-gray-900">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {/* Rollback Button */}
            {status === 'completed' && onRollback && (
              <button 
                onClick={handleRollback}
                className="px-3 py-1.5 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors duration-150 flex items-center space-x-1"
                title="Rollback to this step"
              >
                <span>↶</span>
                <span>Rollback</span>
              </button>
            )}

            {/* Retry Button */}
            {status === 'error' && onRetry && (
              <button 
                onClick={handleRetry}
                className="px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 transition-colors duration-150 flex items-center space-x-1"
                title="Retry this step"
              >
                <span>🔄</span>
                <span>Retry</span>
              </button>
            )}

            {/* View Log Button */}
            {onShowLog && (
              <button 
                onClick={handleShowLog}
                className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors duration-150 flex items-center space-x-1"
                title="View detailed logs"
              >
                <span>📋</span>
                <span>View Log</span>
              </button>
            )}
          </div>

          {/* Expand/Collapse Button */}
          {showExpandButton && (
            <button
              onClick={handleToggleExpand}
              className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-150"
              title={isExpanded ? "Show less" : "Show more"}
            >
              {isExpanded ? '▲ Less' : '▼ More'}
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar for Active Status */}
      {status === 'active' && (
        <div className="px-4 pb-4">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      )}
    </div>
  );
});

// Display name for debugging
PipelineCard.displayName = 'PipelineCard';

export default PipelineCard;