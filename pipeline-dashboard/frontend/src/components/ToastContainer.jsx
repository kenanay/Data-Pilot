/*
Data Pipeline Dashboard - Toast Container Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';
import { createPortal } from 'react-dom';
import { useToast, TOAST_POSITIONS } from '../contexts/ToastContext';
import Toast from './Toast';

const ToastContainer = () => {
  const { toasts, position, removeToast, pauseToast, resumeToast } = useToast();

  // Position classes mapping
  const positionClasses = {
    [TOAST_POSITIONS.TOP_RIGHT]: 'top-4 right-4',
    [TOAST_POSITIONS.TOP_LEFT]: 'top-4 left-4',
    [TOAST_POSITIONS.TOP_CENTER]: 'top-4 left-1/2 transform -translate-x-1/2',
    [TOAST_POSITIONS.BOTTOM_RIGHT]: 'bottom-4 right-4',
    [TOAST_POSITIONS.BOTTOM_LEFT]: 'bottom-4 left-4',
    [TOAST_POSITIONS.BOTTOM_CENTER]: 'bottom-4 left-1/2 transform -translate-x-1/2'
  };

  // Don't render if no toasts
  if (toasts.length === 0) {
    return null;
  }

  const containerContent = (
    <div 
      className={`
        fixed z-50 pointer-events-none
        ${positionClasses[position] || positionClasses[TOAST_POSITIONS.TOP_RIGHT]}
      `}
      style={{ maxWidth: '420px', width: '100%' }}
    >
      <div className="pointer-events-auto">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
            onPause={pauseToast}
            onResume={resumeToast}
          />
        ))}
      </div>
    </div>
  );

  // Render using portal to ensure toasts appear above everything
  return createPortal(containerContent, document.body);
};

export default ToastContainer;