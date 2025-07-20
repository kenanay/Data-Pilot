/*
Data Pipeline Dashboard - Security Provider Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Security context provider that manages CSRF tokens, rate limiting,
and security event monitoring across the application.
*/

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { csrfProtection, securityLogger, rateLimiter } from '../utils/security';

const SecurityContext = createContext();

export const useSecurityContext = () => {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurityContext must be used within a SecurityProvider');
  }
  return context;
};

const SecurityProvider = ({ children }) => {
  const [csrfToken, setCsrfToken] = useState(null);
  const [securityStatus, setSecurityStatus] = useState({
    isSecure: true,
    lastCheck: null,
    violations: []
  });

  // Initialize CSRF token
  useEffect(() => {
    const initializeCSRF = () => {
      let token = csrfProtection.getToken();
      if (!token) {
        token = csrfProtection.generateToken();
        csrfProtection.storeToken(token);
      }
      setCsrfToken(token);
    };

    initializeCSRF();
  }, []);

  // Security monitoring
  useEffect(() => {
    const monitorSecurity = () => {
      // Check for suspicious activity
      const logs = securityLogger.getLogs();
      const recentViolations = logs.filter(log => 
        log.event.includes('VIOLATION') || 
        log.event.includes('ATTACK') ||
        log.event.includes('RATE_LIMIT')
      ).slice(-10);

      setSecurityStatus(prev => ({
        ...prev,
        lastCheck: new Date().toISOString(),
        violations: recentViolations
      }));
    };

    // Monitor every 30 seconds
    const interval = setInterval(monitorSecurity, 30000);
    monitorSecurity(); // Initial check

    return () => clearInterval(interval);
  }, []);

  // Content Security Policy violation handler
  useEffect(() => {
    const handleCSPViolation = (event) => {
      securityLogger.logEvent('CSP_VIOLATION', {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy
      });

      setSecurityStatus(prev => ({
        ...prev,
        isSecure: false,
        violations: [...prev.violations, {
          type: 'CSP_VIOLATION',
          timestamp: new Date().toISOString(),
          details: event
        }]
      }));
    };

    document.addEventListener('securitypolicyviolation', handleCSPViolation);
    
    return () => {
      document.removeEventListener('securitypolicyviolation', handleCSPViolation);
    };
  }, []);

  // Rate limit checker
  const checkRateLimit = useCallback((key, type = 'api') => {
    return rateLimiter.checkLimit(key, type);
  }, []);

  // Security event logger
  const logSecurityEvent = useCallback((event, details = {}) => {
    securityLogger.logEvent(event, details);
  }, []);

  // Validate input wrapper
  const validateInput = useCallback((input, type = 'text') => {
    // This will be used by components to validate user input
    switch (type) {
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'filename':
        return /^[a-zA-Z0-9._-]+$/.test(input) && input.length <= 255;
      case 'text':
        return !/[<>'"&]/.test(input) && input.length <= 1000;
      default:
        return true;
    }
  }, []);

  // Sanitize input wrapper
  const sanitizeInput = useCallback((input) => {
    if (typeof input !== 'string') return '';
    
    return input
      .replace(/[<>'"&]/g, '')
      .trim()
      .substring(0, 1000);
  }, []);

  // Security alert handler
  const handleSecurityAlert = useCallback((alert) => {
    setSecurityStatus(prev => ({
      ...prev,
      isSecure: false,
      violations: [...prev.violations, {
        type: 'SECURITY_ALERT',
        timestamp: new Date().toISOString(),
        details: alert
      }]
    }));

    // Log the alert
    logSecurityEvent('SECURITY_ALERT', alert);
  }, [logSecurityEvent]);

  // Clear security violations
  const clearViolations = useCallback(() => {
    setSecurityStatus(prev => ({
      ...prev,
      isSecure: true,
      violations: []
    }));
    securityLogger.clearLogs();
  }, []);

  const contextValue = {
    csrfToken,
    securityStatus,
    checkRateLimit,
    logSecurityEvent,
    validateInput,
    sanitizeInput,
    handleSecurityAlert,
    clearViolations
  };

  return (
    <SecurityContext.Provider value={contextValue}>
      {children}
    </SecurityContext.Provider>
  );
};

export default SecurityProvider;