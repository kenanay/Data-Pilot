/*
Data Pipeline Dashboard - Enhanced Notifications Hook

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import { useCallback } from 'react';
import { useToast, TOAST_TYPES } from '../contexts/ToastContext';

/**
 * Enhanced notifications hook with history tracking and advanced features
 */
export const useNotifications = () => {
  const toast = useToast();

  // Save notification to history
  const saveToHistory = useCallback((notification) => {
    try {
      const history = JSON.parse(localStorage.getItem('notification_history') || '[]');
      const newNotification = {
        id: notification.id || Date.now() + Math.random(),
        type: notification.type,
        title: notification.title,
        message: notification.message,
        timestamp: Date.now(),
        ...notification
      };
      
      // Add to beginning and limit to 100 items
      history.unshift(newNotification);
      const limitedHistory = history.slice(0, 100);
      
      localStorage.setItem('notification_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.error('Failed to save notification to history:', error);
    }
  }, []);

  // Enhanced success notification
  const notifySuccess = useCallback((message, options = {}) => {
    const notification = {
      type: TOAST_TYPES.SUCCESS,
      message,
      title: options.title || 'Success',
      ...options
    };
    
    const id = toast.success(message, options);
    saveToHistory({ ...notification, id });
    
    return id;
  }, [toast, saveToHistory]);

  // Enhanced error notification
  const notifyError = useCallback((message, options = {}) => {
    const notification = {
      type: TOAST_TYPES.ERROR,
      message,
      title: options.title || 'Error',
      duration: options.duration || 8000,
      ...options
    };
    
    const id = toast.error(message, options);
    saveToHistory({ ...notification, id });
    
    return id;
  }, [toast, saveToHistory]);

  // Enhanced warning notification
  const notifyWarning = useCallback((message, options = {}) => {
    const notification = {
      type: TOAST_TYPES.WARNING,
      message,
      title: options.title || 'Warning',
      duration: options.duration || 6000,
      ...options
    };
    
    const id = toast.warning(message, options);
    saveToHistory({ ...notification, id });
    
    return id;
  }, [toast, saveToHistory]);

  // Enhanced info notification
  const notifyInfo = useCallback((message, options = {}) => {
    const notification = {
      type: TOAST_TYPES.INFO,
      message,
      title: options.title || 'Info',
      ...options
    };
    
    const id = toast.info(message, options);
    saveToHistory({ ...notification, id });
    
    return id;
  }, [toast, saveToHistory]);

  // Loading notification with progress
  const notifyLoading = useCallback((message, options = {}) => {
    const notification = {
      type: TOAST_TYPES.LOADING,
      message,
      title: options.title || 'Loading',
      duration: 0,
      dismissible: false,
      ...options
    };
    
    const id = toast.loading(message, options);
    saveToHistory({ ...notification, id });
    
    return id;
  }, [toast, saveToHistory]);

  // Progress notification
  const notifyProgress = useCallback((message, progress, options = {}) => {
    const notification = {
      type: TOAST_TYPES.INFO,
      message,
      progress,
      title: options.title || 'Progress',
      duration: 0,
      ...options
    };
    
    const id = toast.progress(message, progress, options);
    saveToHistory({ ...notification, id });
    
    return id;
  }, [toast, saveToHistory]);

  // Pipeline step notifications
  const notifyStepStart = useCallback((stepName) => {
    return notifyLoading(`Starting ${stepName} step...`, {
      title: 'Pipeline Step',
    });
  }, [notifyLoading]);

  const notifyStepComplete = useCallback((stepName, duration) => {
    const durationText = duration ? ` (${Math.round(duration / 1000)}s)` : '';
    return notifySuccess(`${stepName} step completed successfully${durationText}`, {
      title: 'Pipeline Step',
      duration: 4000
    });
  }, [notifySuccess]);

  const notifyStepError = useCallback((stepName, error) => {
    return notifyError(`${stepName} step failed: ${error}`, {
      title: 'Pipeline Step Error',
      actions: [
        {
          label: 'Retry',
          onClick: () => {
            // This would be handled by the calling component
            console.log(`Retry ${stepName} step`);
          },
          variant: 'primary'
        }
      ]
    });
  }, [notifyError]);

  // File operation notifications
  const notifyFileUpload = useCallback((filename) => {
    return notifyLoading(`Uploading ${filename}...`, {
      title: 'File Upload'
    });
  }, [notifyLoading]);

  const notifyFileUploadComplete = useCallback((filename) => {
    return notifySuccess(`${filename} uploaded successfully`, {
      title: 'File Upload',
      duration: 3000
    });
  }, [notifySuccess]);

  const notifyFileUploadError = useCallback((filename, error) => {
    return notifyError(`Failed to upload ${filename}: ${error}`, {
      title: 'File Upload Error'
    });
  }, [notifyError]);

  // Data processing notifications
  const notifyDataProcessing = useCallback((operation) => {
    return notifyLoading(`Processing data: ${operation}...`, {
      title: 'Data Processing'
    });
  }, [notifyLoading]);

  const notifyDataProcessingComplete = useCallback((operation, recordsProcessed) => {
    const recordsText = recordsProcessed ? ` (${recordsProcessed.toLocaleString()} records)` : '';
    return notifySuccess(`${operation} completed${recordsText}`, {
      title: 'Data Processing',
      duration: 4000
    });
  }, [notifySuccess]);

  // API operation notifications
  const notifyApiError = useCallback((operation, error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred';
    return notifyError(`${operation} failed: ${message}`, {
      title: 'API Error',
      actions: error.response?.status >= 500 ? [
        {
          label: 'Retry',
          onClick: () => {
            // This would be handled by the calling component
            console.log(`Retry ${operation}`);
          },
          variant: 'primary'
        }
      ] : undefined
    });
  }, [notifyError]);

  // Connection notifications
  const notifyConnectionLost = useCallback(() => {
    return notifyWarning('Connection to server lost. Attempting to reconnect...', {
      title: 'Connection Issue',
      duration: 0,
      dismissible: false
    });
  }, [notifyWarning]);

  const notifyConnectionRestored = useCallback(() => {
    return notifySuccess('Connection restored successfully', {
      title: 'Connection Restored',
      duration: 3000
    });
  }, [notifySuccess]);

  // Batch notifications
  const notifyBatch = useCallback((notifications) => {
    const ids = [];
    notifications.forEach(notification => {
      let id;
      switch (notification.type) {
        case TOAST_TYPES.SUCCESS:
          id = notifySuccess(notification.message, notification.options);
          break;
        case TOAST_TYPES.ERROR:
          id = notifyError(notification.message, notification.options);
          break;
        case TOAST_TYPES.WARNING:
          id = notifyWarning(notification.message, notification.options);
          break;
        case TOAST_TYPES.INFO:
          id = notifyInfo(notification.message, notification.options);
          break;
        default:
          id = notifyInfo(notification.message, notification.options);
      }
      ids.push(id);
    });
    return ids;
  }, [notifySuccess, notifyError, notifyWarning, notifyInfo]);

  return {
    // Basic notifications
    success: notifySuccess,
    error: notifyError,
    warning: notifyWarning,
    info: notifyInfo,
    loading: notifyLoading,
    progress: notifyProgress,
    
    // Pipeline-specific notifications
    stepStart: notifyStepStart,
    stepComplete: notifyStepComplete,
    stepError: notifyStepError,
    
    // File operation notifications
    fileUpload: notifyFileUpload,
    fileUploadComplete: notifyFileUploadComplete,
    fileUploadError: notifyFileUploadError,
    
    // Data processing notifications
    dataProcessing: notifyDataProcessing,
    dataProcessingComplete: notifyDataProcessingComplete,
    
    // API notifications
    apiError: notifyApiError,
    
    // Connection notifications
    connectionLost: notifyConnectionLost,
    connectionRestored: notifyConnectionRestored,
    
    // Batch notifications
    batch: notifyBatch,
    
    // Toast context methods
    remove: toast.removeToast,
    update: toast.updateToast,
    clearAll: toast.clearAll
  };
};

export default useNotifications;