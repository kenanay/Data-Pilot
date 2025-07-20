/*
Data Pipeline Dashboard - Notification History Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import { TOAST_TYPES } from '../contexts/ToastContext';

const NotificationHistory = ({ 
  isOpen, 
  onClose, 
  className = "" 
}) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');

  // Load notifications from localStorage
  useEffect(() => {
    const loadNotifications = () => {
      try {
        const stored = localStorage.getItem('notification_history');
        if (stored) {
          const parsed = JSON.parse(stored);
          setNotifications(parsed.slice(0, 100)); // Keep last 100 notifications
        }
      } catch (error) {
        console.error('Failed to load notification history:', error);
      }
    };

    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    return notification.type === filter;
  });

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
    localStorage.removeItem('notification_history');
  };

  // Remove single notification
  const removeNotification = (id) => {
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    localStorage.setItem('notification_history', JSON.stringify(updated));
  };

  // Get notification icon
  const getNotificationIcon = (type) => {
    const icons = {
      [TOAST_TYPES.SUCCESS]: '✅',
      [TOAST_TYPES.ERROR]: '❌',
      [TOAST_TYPES.WARNING]: '⚠️',
      [TOAST_TYPES.INFO]: 'ℹ️',
      [TOAST_TYPES.LOADING]: '⏳'
    };
    return icons[type] || icons[TOAST_TYPES.INFO];
  };

  // Get notification color classes
  const getNotificationColors = (type) => {
    const colors = {
      [TOAST_TYPES.SUCCESS]: 'text-green-600 bg-green-50 border-green-200',
      [TOAST_TYPES.ERROR]: 'text-red-600 bg-red-50 border-red-200',
      [TOAST_TYPES.WARNING]: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      [TOAST_TYPES.INFO]: 'text-blue-600 bg-blue-50 border-blue-200',
      [TOAST_TYPES.LOADING]: 'text-gray-600 bg-gray-50 border-gray-200'
    };
    return colors[type] || colors[TOAST_TYPES.INFO];
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Notification History
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b bg-gray-50">
            <div className="flex space-x-2 mb-3">
              {['all', TOAST_TYPES.SUCCESS, TOAST_TYPES.ERROR, TOAST_TYPES.WARNING, TOAST_TYPES.INFO].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`
                    px-3 py-1 text-xs rounded-full transition-colors
                    ${filter === type 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }
                  `}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
            
            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="text-xs text-red-600 hover:text-red-800 transition-colors"
              >
                Clear All History
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg className="w-12 h-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5H7.5a7.5 7.5 0 017.5 7.5v5z" />
                </svg>
                <p className="text-center">
                  {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`
                      p-3 rounded-lg border transition-all hover:shadow-sm
                      ${getNotificationColors(notification.type)}
                    `}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {notification.title && (
                          <h4 className="text-sm font-medium mb-1">
                            {notification.title}
                          </h4>
                        )}
                        <p className="text-sm opacity-90">
                          {notification.message}
                        </p>
                        <p className="text-xs opacity-70 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      
                      <button
                        onClick={() => removeNotification(notification.id)}
                        className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 text-center">
            <p className="text-xs text-gray-500">
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationHistory;