/*
Data Pipeline Dashboard - Toast Notification Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect, useRef } from 'react';
import { TOAST_TYPES } from '../contexts/ToastContext';

// Individual Toast Component
export const Toast = ({ 
  toast, 
  onRemove, 
  onPause, 
  onResume,
  className = ""
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [remainingTime, setRemainingTime] = useState(toast.duration);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  // Toast type configurations
  const toastConfig = {
    [TOAST_TYPES.SUCCESS]: {
      icon: '✅',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-800',
      titleColor: 'text-green-900',
      progressColor: 'bg-green-500'
    },
    [TOAST_TYPES.ERROR]: {
      icon: '❌',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-800',
      titleColor: 'text-red-900',
      progressColor: 'bg-red-500'
    },
    [TOAST_TYPES.WARNING]: {
      icon: '⚠️',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-800',
      titleColor: 'text-yellow-900',
      progressColor: 'bg-yellow-500'
    },
    [TOAST_TYPES.INFO]: {
      icon: 'ℹ️',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-800',
      titleColor: 'text-blue-900',
      progressColor: 'bg-blue-500'
    },
    [TOAST_TYPES.LOADING]: {
      icon: '⏳',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      textColor: 'text-gray-800',
      titleColor: 'text-gray-900',
      progressColor: 'bg-gray-500'
    }
  };

  const config = toastConfig[toast.type] || toastConfig[TOAST_TYPES.INFO];

  // Show toast with animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle auto-removal
  useEffect(() => {
    if (toast.duration > 0 && !toast.pausedAt) {
      const startTime = startTimeRef.current;
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, toast.duration - elapsed);

      if (remaining <= 0) {
        handleRemove();
        return;
      }

      setRemainingTime(remaining);

      // Update remaining time every 100ms
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        const newRemaining = Math.max(0, toast.duration - (now - startTime));
        setRemainingTime(newRemaining);

        if (newRemaining <= 0) {
          handleRemove();
        }
      }, 100);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [toast.duration, toast.pausedAt]);

  // Handle removal with animation
  const handleRemove = () => {
    if (isRemoving) return;
    
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300); // Match animation duration
  };

  // Handle mouse enter (pause)
  const handleMouseEnter = () => {
    if (toast.duration > 0) {
      onPause(toast.id);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  };

  // Handle mouse leave (resume)
  const handleMouseLeave = () => {
    if (toast.duration > 0) {
      onResume(toast.id);
      startTimeRef.current = Date.now() - (toast.duration - remainingTime);
    }
  };

  // Calculate progress percentage
  const progressPercentage = toast.progress !== undefined 
    ? toast.progress 
    : toast.duration > 0 
      ? ((toast.duration - remainingTime) / toast.duration) * 100 
      : 0;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out mb-2
        ${isVisible && !isRemoving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${className}
      `}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`
        relative overflow-hidden rounded-lg border shadow-lg max-w-sm w-full
        ${config.bgColor} ${config.borderColor}
      `}>
        {/* Progress bar */}
        {(toast.duration > 0 || toast.progress !== undefined) && (
          <div className="absolute top-0 left-0 h-1 bg-gray-200 w-full">
            <div 
              className={`h-full transition-all duration-100 ease-linear ${config.progressColor}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 text-lg">
              {toast.type === TOAST_TYPES.LOADING ? (
                <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                config.icon
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              {toast.title && (
                <h4 className={`text-sm font-medium ${config.titleColor} mb-1`}>
                  {toast.title}
                </h4>
              )}

              {/* Message */}
              <p className={`text-sm ${config.textColor}`}>
                {toast.message}
              </p>

              {/* Progress text */}
              {toast.progress !== undefined && (
                <div className={`text-xs ${config.textColor} mt-1`}>
                  {Math.round(toast.progress)}% complete
                </div>
              )}

              {/* Actions */}
              {toast.actions && toast.actions.length > 0 && (
                <div className="mt-3 flex space-x-2">
                  {toast.actions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        action.onClick();
                        if (action.closeOnClick !== false) {
                          handleRemove();
                        }
                      }}
                      className={`
                        text-xs px-2 py-1 rounded font-medium transition-colors
                        ${action.variant === 'primary' 
                          ? `${config.progressColor} text-white hover:opacity-80`
                          : `bg-white ${config.textColor} border ${config.borderColor} hover:bg-gray-50`
                        }
                      `}
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close button */}
            {toast.dismissible && (
              <button
                onClick={handleRemove}
                className={`flex-shrink-0 ${config.textColor} hover:opacity-70 transition-opacity`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toast;