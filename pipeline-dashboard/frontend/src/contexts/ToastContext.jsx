/*
Data Pipeline Dashboard - Toast Notification Context

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Toast types
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  LOADING: 'loading'
};

// Toast positions
export const TOAST_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center'
};

// Action types
const TOAST_ACTIONS = {
  ADD_TOAST: 'ADD_TOAST',
  REMOVE_TOAST: 'REMOVE_TOAST',
  UPDATE_TOAST: 'UPDATE_TOAST',
  CLEAR_ALL: 'CLEAR_ALL',
  PAUSE_TOAST: 'PAUSE_TOAST',
  RESUME_TOAST: 'RESUME_TOAST'
};

// Initial state
const initialState = {
  toasts: [],
  position: TOAST_POSITIONS.TOP_RIGHT,
  maxToasts: 5
};

// Reducer function
const toastReducer = (state, action) => {
  switch (action.type) {
    case TOAST_ACTIONS.ADD_TOAST:
      const newToast = {
        id: action.payload.id || Date.now() + Math.random(),
        type: action.payload.type || TOAST_TYPES.INFO,
        title: action.payload.title,
        message: action.payload.message,
        duration: action.payload.duration ?? 5000,
        dismissible: action.payload.dismissible ?? true,
        actions: action.payload.actions || [],
        progress: action.payload.progress,
        createdAt: Date.now(),
        pausedAt: null,
        ...action.payload
      };

      // Limit number of toasts
      const updatedToasts = [newToast, ...state.toasts].slice(0, state.maxToasts);
      
      return {
        ...state,
        toasts: updatedToasts
      };

    case TOAST_ACTIONS.REMOVE_TOAST:
      return {
        ...state,
        toasts: state.toasts.filter(toast => toast.id !== action.payload.id)
      };

    case TOAST_ACTIONS.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map(toast =>
          toast.id === action.payload.id
            ? { ...toast, ...action.payload.updates }
            : toast
        )
      };

    case TOAST_ACTIONS.PAUSE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map(toast =>
          toast.id === action.payload.id
            ? { ...toast, pausedAt: Date.now() }
            : toast
        )
      };

    case TOAST_ACTIONS.RESUME_TOAST:
      return {
        ...state,
        toasts: state.toasts.map(toast =>
          toast.id === action.payload.id
            ? { ...toast, pausedAt: null }
            : toast
        )
      };

    case TOAST_ACTIONS.CLEAR_ALL:
      return {
        ...state,
        toasts: []
      };

    default:
      return state;
  }
};

// Create context
const ToastContext = createContext();

// Toast Provider component
export const ToastProvider = ({ children, position = TOAST_POSITIONS.TOP_RIGHT, maxToasts = 5 }) => {
  const [state, dispatch] = useReducer(toastReducer, {
    ...initialState,
    position,
    maxToasts
  });

  // Add toast function
  const addToast = useCallback((toastData) => {
    const id = toastData.id || Date.now() + Math.random();
    
    dispatch({
      type: TOAST_ACTIONS.ADD_TOAST,
      payload: { ...toastData, id }
    });

    // Auto-remove toast after duration (if not persistent)
    if (toastData.duration !== 0 && toastData.duration !== null) {
      const duration = toastData.duration || 5000;
      setTimeout(() => {
        dispatch({
          type: TOAST_ACTIONS.REMOVE_TOAST,
          payload: { id }
        });
      }, duration);
    }

    return id;
  }, []);

  // Remove toast function
  const removeToast = useCallback((id) => {
    dispatch({
      type: TOAST_ACTIONS.REMOVE_TOAST,
      payload: { id }
    });
  }, []);

  // Update toast function
  const updateToast = useCallback((id, updates) => {
    dispatch({
      type: TOAST_ACTIONS.UPDATE_TOAST,
      payload: { id, updates }
    });
  }, []);

  // Pause toast function
  const pauseToast = useCallback((id) => {
    dispatch({
      type: TOAST_ACTIONS.PAUSE_TOAST,
      payload: { id }
    });
  }, []);

  // Resume toast function
  const resumeToast = useCallback((id) => {
    dispatch({
      type: TOAST_ACTIONS.RESUME_TOAST,
      payload: { id }
    });
  }, []);

  // Clear all toasts function
  const clearAll = useCallback(() => {
    dispatch({
      type: TOAST_ACTIONS.CLEAR_ALL
    });
  }, []);

  // Convenience methods for different toast types
  const success = useCallback((message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.SUCCESS,
      message,
      title: options.title || 'Success',
      ...options
    });
  }, [addToast]);

  const error = useCallback((message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.ERROR,
      message,
      title: options.title || 'Error',
      duration: options.duration || 8000, // Longer duration for errors
      ...options
    });
  }, [addToast]);

  const warning = useCallback((message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.WARNING,
      message,
      title: options.title || 'Warning',
      duration: options.duration || 6000,
      ...options
    });
  }, [addToast]);

  const info = useCallback((message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.INFO,
      message,
      title: options.title || 'Info',
      ...options
    });
  }, [addToast]);

  const loading = useCallback((message, options = {}) => {
    return addToast({
      type: TOAST_TYPES.LOADING,
      message,
      title: options.title || 'Loading',
      duration: 0, // Persistent until manually removed
      dismissible: false,
      ...options
    });
  }, [addToast]);

  // Progress toast for long operations
  const progress = useCallback((message, progressValue = 0, options = {}) => {
    return addToast({
      type: TOAST_TYPES.INFO,
      message,
      title: options.title || 'Progress',
      progress: progressValue,
      duration: 0, // Persistent until manually removed
      ...options
    });
  }, [addToast]);

  const value = {
    toasts: state.toasts,
    position: state.position,
    maxToasts: state.maxToasts,
    addToast,
    removeToast,
    updateToast,
    pauseToast,
    resumeToast,
    clearAll,
    success,
    error,
    warning,
    info,
    loading,
    progress
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

// Custom hook to use toast context
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;