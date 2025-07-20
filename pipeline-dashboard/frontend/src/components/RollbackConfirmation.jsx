/*
Data Pipeline Dashboard - Rollback Confirmation Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';

const RollbackConfirmation = ({ 
  isOpen,
  onClose,
  onConfirm,
  rollbackInfo,
  loading = false,
  className = ""
}) => {
  const [countdown, setCountdown] = useState(0);
  const [userConfirmed, setUserConfirmed] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCountdown(5); // 5 second countdown
      setUserConfirmed(false);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get rollback type description
  const getRollbackTypeDescription = (type) => {
    const descriptions = {
      undo: 'This will undo your last action and return to the previous state.',
      redo: 'This will redo the previously undone action.',
      jump: 'This will jump to a specific point in your action history.',
      snapshot: 'This will restore your pipeline to a saved snapshot.',
      step: 'This will rollback to a specific pipeline step.'
    };
    return descriptions[type] || 'This will change your current pipeline state.';
  };

  // Get impact level
  const getImpactLevel = (rollbackInfo) => {
    if (!rollbackInfo) return 'low';
    
    const { type, stepsAffected = 0, dataLoss = false } = rollbackInfo;
    
    if (dataLoss || stepsAffected > 3) return 'high';
    if (type === 'snapshot' || stepsAffected > 1) return 'medium';
    return 'low';
  };

  // Get impact color classes
  const getImpactColors = (level) => {
    const colors = {
      low: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      medium: 'bg-orange-50 border-orange-200 text-orange-800',
      high: 'bg-red-50 border-red-200 text-red-800'
    };
    return colors[level] || colors.low;
  };

  if (!isOpen || !rollbackInfo) return null;

  const impactLevel = getImpactLevel(rollbackInfo);
  const canConfirm = countdown === 0 && userConfirmed;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />
      
      {/* Modal */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
        <div className={`bg-white rounded-lg shadow-xl ${className}`}>
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${getImpactColors(impactLevel)}
              `}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Confirm Rollback Operation
                </h3>
                <p className="text-sm text-gray-600">
                  This action cannot be undone
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Rollback Description */}
            <div className="mb-4">
              <p className="text-sm text-gray-700 mb-2">
                {getRollbackTypeDescription(rollbackInfo.type)}
              </p>
            </div>

            {/* Rollback Details */}
            <div className={`p-4 rounded-lg border mb-4 ${getImpactColors(impactLevel)}`}>
              <div className="space-y-2">
                {rollbackInfo.targetDescription && (
                  <div>
                    <span className="font-medium">Target: </span>
                    {rollbackInfo.targetDescription}
                  </div>
                )}
                
                {rollbackInfo.currentDescription && (
                  <div>
                    <span className="font-medium">Current: </span>
                    {rollbackInfo.currentDescription}
                  </div>
                )}
                
                {rollbackInfo.timestamp && (
                  <div>
                    <span className="font-medium">Created: </span>
                    {formatTimestamp(rollbackInfo.timestamp)}
                  </div>
                )}
                
                {rollbackInfo.stepsAffected > 0 && (
                  <div>
                    <span className="font-medium">Steps affected: </span>
                    {rollbackInfo.stepsAffected}
                  </div>
                )}
              </div>
            </div>

            {/* Impact Warning */}
            {impactLevel === 'high' && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">High Impact Operation</p>
                    <p className="text-sm text-red-700 mt-1">
                      This rollback will affect multiple pipeline steps and may result in data loss. 
                      Make sure you have saved any important work.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Data Loss Warning */}
            {rollbackInfo.dataLoss && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">Data Loss Warning</p>
                    <p className="text-sm text-red-700 mt-1">
                      This operation will permanently delete some of your processed data. 
                      Consider creating a snapshot before proceeding.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Confirmation Checkbox */}
            <div className="mb-4">
              <label className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={userConfirmed}
                  onChange={(e) => setUserConfirmed(e.target.checked)}
                  className="mt-1 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="text-sm text-gray-700">
                  I understand that this action cannot be undone and I want to proceed with the rollback operation.
                </span>
              </label>
            </div>

            {/* Countdown Timer */}
            {countdown > 0 && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-md">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-600">
                    Please wait {countdown} second{countdown !== 1 ? 's' : ''}...
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canConfirm || loading}
              className={`
                px-4 py-2 rounded-md font-medium transition-colors
                ${canConfirm && !loading
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                'Confirm Rollback'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RollbackConfirmation;