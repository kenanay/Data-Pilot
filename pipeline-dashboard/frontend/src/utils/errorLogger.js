/*
Data Pipeline Dashboard - Error Logging Utility

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

/**
 * Error logging utility for centralized error handling and reporting
 */
class ErrorLogger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100; // Keep last 100 error logs
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * Log an error with context information
   * @param {Error|string} error - The error to log
   * @param {Object} context - Additional context information
   * @param {string} severity - Error severity level
   */
  logError(error, context = {}, severity = 'error') {
    const errorEntry = {
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString(),
      severity,
      message: typeof error === 'string' ? error : error.message,
      stack: error.stack || null,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        userId: localStorage.getItem('user_id') || 'anonymous',
        sessionId: localStorage.getItem('session_id') || null,
        ...context
      },
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : { message: error }
    };

    // Add to local logs
    this.logs.unshift(errorEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Console logging based on environment
    if (!this.isProduction) {
      console.group(`🚨 Error Log [${severity.toUpperCase()}]`);
      console.error('Message:', errorEntry.message);
      console.error('Context:', errorEntry.context);
      if (errorEntry.stack) {
        console.error('Stack:', errorEntry.stack);
      }
      console.groupEnd();
    }

    // Send to external logging service in production
    if (this.isProduction) {
      this.sendToLoggingService(errorEntry);
    }

    return errorEntry.id;
  }

  /**
   * Log API errors with specific context
   * @param {Error} error - API error
   * @param {Object} requestInfo - Request information
   */
  logApiError(error, requestInfo = {}) {
    const context = {
      type: 'api_error',
      method: requestInfo.method || 'unknown',
      url: requestInfo.url || 'unknown',
      status: error.response?.status || null,
      statusText: error.response?.statusText || null,
      responseData: error.response?.data || null,
      requestData: requestInfo.data || null,
      ...requestInfo
    };

    return this.logError(error, context, 'error');
  }

  /**
   * Log WebSocket errors
   * @param {Error} error - WebSocket error
   * @param {Object} wsInfo - WebSocket information
   */
  logWebSocketError(error, wsInfo = {}) {
    const context = {
      type: 'websocket_error',
      readyState: wsInfo.readyState || null,
      url: wsInfo.url || null,
      protocol: wsInfo.protocol || null,
      ...wsInfo
    };

    return this.logError(error, context, 'error');
  }

  /**
   * Log component errors (for Error Boundaries)
   * @param {Error} error - Component error
   * @param {Object} errorInfo - React error info
   */
  logComponentError(error, errorInfo = {}) {
    const context = {
      type: 'component_error',
      componentStack: errorInfo.componentStack || null,
      ...errorInfo
    };

    return this.logError(error, context, 'error');
  }

  /**
   * Log performance issues
   * @param {string} message - Performance issue description
   * @param {Object} metrics - Performance metrics
   */
  logPerformanceIssue(message, metrics = {}) {
    const context = {
      type: 'performance_issue',
      ...metrics
    };

    return this.logError(message, context, 'warning');
  }

  /**
   * Log user actions that led to errors
   * @param {string} action - User action
   * @param {Object} actionContext - Action context
   */
  logUserAction(action, actionContext = {}) {
    const context = {
      type: 'user_action',
      action,
      ...actionContext
    };

    return this.logError(`User action: ${action}`, context, 'info');
  }

  /**
   * Get recent error logs
   * @param {number} limit - Number of logs to return
   * @returns {Array} Recent error logs
   */
  getRecentLogs(limit = 10) {
    return this.logs.slice(0, limit);
  }

  /**
   * Get logs by severity
   * @param {string} severity - Severity level
   * @returns {Array} Filtered logs
   */
  getLogsBySeverity(severity) {
    return this.logs.filter(log => log.severity === severity);
  }

  /**
   * Clear all logs
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * Export logs for debugging
   * @returns {string} JSON string of all logs
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Send error to external logging service
   * @param {Object} errorEntry - Error entry to send
   */
  async sendToLoggingService(errorEntry) {
    try {
      // In a real application, you would send to services like:
      // - Sentry
      // - LogRocket
      // - DataDog
      // - Custom logging endpoint
      
      // Example implementation:
      /*
      await fetch('/api/logs/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorEntry)
      });
      */

      // For now, just store in localStorage as backup
      const storedLogs = JSON.parse(localStorage.getItem('error_logs') || '[]');
      storedLogs.unshift(errorEntry);
      
      // Keep only last 50 logs in localStorage
      if (storedLogs.length > 50) {
        storedLogs.splice(50);
      }
      
      localStorage.setItem('error_logs', JSON.stringify(storedLogs));
    } catch (loggingError) {
      console.error('Failed to send error to logging service:', loggingError);
    }
  }

  /**
   * Create error report for support
   * @param {string} errorId - Error ID to create report for
   * @returns {Object} Error report
   */
  createErrorReport(errorId) {
    const errorLog = this.logs.find(log => log.id === errorId);
    if (!errorLog) {
      return null;
    }

    return {
      errorId,
      timestamp: errorLog.timestamp,
      userAgent: errorLog.context.userAgent,
      url: errorLog.context.url,
      userId: errorLog.context.userId,
      sessionId: errorLog.context.sessionId,
      error: {
        message: errorLog.message,
        stack: errorLog.stack,
        severity: errorLog.severity
      },
      context: errorLog.context,
      recentActions: this.getLogsBySeverity('info').slice(0, 5),
      systemInfo: {
        timestamp: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine
      }
    };
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Global error handler
window.addEventListener('error', (event) => {
  errorLogger.logError(event.error || event.message, {
    type: 'global_error',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  errorLogger.logError(event.reason, {
    type: 'unhandled_promise_rejection'
  });
});

export default errorLogger;