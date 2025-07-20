/*
Data Pipeline Dashboard - Security Utilities

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Comprehensive security utilities for input validation, sanitization,
and security header management.
*/

// Input validation patterns with Turkish character support
const VALIDATION_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  alphanumeric: /^[a-zA-Z0-9_-]+$/,
  alphanumericTurkish: /^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9_-]+$/,
  filename: /^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9._-\s]+$/,
  sessionId: /^[a-zA-Z0-9-]{36}$/,
  fileId: /^[a-zA-Z0-9_-]+$/,
  turkishText: /^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9\s.,;:!?'"()\-_]+$/,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  pathTraversal: /\.\.[\/\\]/,
  htmlTags: /<[^>]*>/g
};

// File type validation
const ALLOWED_FILE_TYPES = {
  'text/csv': ['.csv'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/json': ['.json'],
  'application/octet-stream': ['.parquet']
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Input Validation Class
 */
export class InputValidator {
  /**
   * Validate email format
   */
  static validateEmail(email) {
    if (!email || typeof email !== 'string') {
      return { valid: false, error: 'Email is required' };
    }
    
    if (!VALIDATION_PATTERNS.email.test(email)) {
      return { valid: false, error: 'Invalid email format' };
    }
    
    return { valid: true };
  }

  /**
   * Validate session ID format
   */
  static validateSessionId(sessionId) {
    if (!sessionId || typeof sessionId !== 'string') {
      return { valid: false, error: 'Session ID is required' };
    }
    
    if (!VALIDATION_PATTERNS.sessionId.test(sessionId)) {
      return { valid: false, error: 'Invalid session ID format' };
    }
    
    return { valid: true };
  }

  /**
   * Validate file ID format
   */
  static validateFileId(fileId) {
    if (!fileId || typeof fileId !== 'string') {
      return { valid: false, error: 'File ID is required' };
    }
    
    if (!VALIDATION_PATTERNS.fileId.test(fileId)) {
      return { valid: false, error: 'Invalid file ID format' };
    }
    
    return { valid: true };
  }

  /**
   * Validate filename with Turkish character support
   */
  static validateFilename(filename) {
    if (!filename || typeof filename !== 'string') {
      return { valid: false, error: 'Filename is required' };
    }
    
    // Check for Turkish characters and standard filename characters
    if (!VALIDATION_PATTERNS.filename.test(filename)) {
      return { valid: false, error: 'Invalid filename format. Turkish characters (ç,ğ,ı,ö,ş,ü) are supported.' };
    }
    
    if (filename.length > 255) {
      return { valid: false, error: 'Filename too long' };
    }
    
    // Ensure UTF-8 encoding is preserved
    try {
      const encoded = encodeURIComponent(filename);
      const decoded = decodeURIComponent(encoded);
      if (decoded !== filename) {
        return { valid: false, error: 'Filename contains invalid UTF-8 characters' };
      }
    } catch (error) {
      return { valid: false, error: 'Filename encoding validation failed' };
    }
    
    return { valid: true };
  }

  /**
   * Validate file upload
   */
  static validateFile(file) {
    const errors = [];
    
    if (!file) {
      return { valid: false, errors: ['File is required'] };
    }
    
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }
    
    // Check file type
    const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed. Allowed types: CSV, Excel, JSON, Parquet`);
    }
    
    // Check filename
    const filenameValidation = this.validateFilename(file.name);
    if (!filenameValidation.valid) {
      errors.push(filenameValidation.error);
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate text input for XSS and injection attacks with Turkish character support
   */
  static validateTextInput(input, maxLength = 1000) {
    if (typeof input !== 'string') {
      return { valid: false, error: 'Input must be a string' };
    }
    
    if (input.length > maxLength) {
      return { valid: false, error: `Input exceeds maximum length of ${maxLength}` };
    }
    
    // Check for SQL injection patterns
    if (VALIDATION_PATTERNS.sqlInjection.test(input)) {
      return { valid: false, error: 'Input contains potentially dangerous SQL patterns' };
    }
    
    // Check for XSS patterns
    if (VALIDATION_PATTERNS.xss.test(input)) {
      return { valid: false, error: 'Input contains potentially dangerous script tags' };
    }
    
    // Check for path traversal
    if (VALIDATION_PATTERNS.pathTraversal.test(input)) {
      return { valid: false, error: 'Input contains path traversal patterns' };
    }
    
    // Validate Turkish text pattern for data content
    if (!VALIDATION_PATTERNS.turkishText.test(input)) {
      return { valid: false, error: 'Input contains invalid characters. Turkish characters (ç,ğ,ı,ö,ş,ü) are supported.' };
    }
    
    // Ensure UTF-8 encoding is valid
    try {
      const encoded = encodeURIComponent(input);
      const decoded = decodeURIComponent(encoded);
      if (decoded !== input) {
        return { valid: false, error: 'Input contains invalid UTF-8 characters' };
      }
    } catch (error) {
      return { valid: false, error: 'Text encoding validation failed' };
    }
    
    return { valid: true };
  }

  /**
   * Validate JSON input
   */
  static validateJSON(jsonString) {
    try {
      const parsed = JSON.parse(jsonString);
      
      // Check for dangerous properties
      const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
      const hasDangerousKeys = this.checkForDangerousKeys(parsed, dangerousKeys);
      
      if (hasDangerousKeys) {
        return { valid: false, error: 'JSON contains potentially dangerous properties' };
      }
      
      return { valid: true, data: parsed };
    } catch (error) {
      return { valid: false, error: 'Invalid JSON format' };
    }
  }

  /**
   * Check for dangerous keys in object
   */
  static checkForDangerousKeys(obj, dangerousKeys) {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }
    
    for (const key of Object.keys(obj)) {
      if (dangerousKeys.includes(key)) {
        return true;
      }
      
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        if (this.checkForDangerousKeys(obj[key], dangerousKeys)) {
          return true;
        }
      }
    }
    
    return false;
  }
}

/**
 * Input Sanitization Class
 */
export class InputSanitizer {
  /**
   * Sanitize HTML input
   */
  static sanitizeHTML(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(VALIDATION_PATTERNS.htmlTags, '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize filename while preserving Turkish characters
   */
  static sanitizeFilename(filename) {
    if (typeof filename !== 'string') {
      return '';
    }
    
    // Preserve Turkish characters and common filename characters
    return filename
      .replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ0-9._\s-]/g, '_')
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 255);
  }

  /**
   * Sanitize text input while preserving Turkish characters
   */
  static sanitizeText(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .trim()
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .normalize('NFC'); // Normalize Turkish characters to composed form
  }

  /**
   * Sanitize URL
   */
  static sanitizeURL(url) {
    if (typeof url !== 'string') {
      return '';
    }
    
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return '';
      }
      
      return urlObj.toString();
    } catch (error) {
      return '';
    }
  }
}

/**
 * Security Headers Manager
 */
export class SecurityHeaders {
  /**
   * Get security headers for API requests
   */
  static getSecurityHeaders() {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': this.getCSPHeader()
    };
  }

  /**
   * Get Content Security Policy header
   */
  static getCSPHeader() {
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      "connect-src 'self' ws: wss:",
      "media-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; ');
  }

  /**
   * Apply security headers to fetch requests
   */
  static applyToFetch(options = {}) {
    return {
      ...options,
      headers: {
        ...this.getSecurityHeaders(),
        ...options.headers
      }
    };
  }
}

/**
 * Rate Limiting Utility
 */
export class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.limits = {
      upload: { max: 5, window: 60000 }, // 5 uploads per minute
      api: { max: 100, window: 60000 }, // 100 API calls per minute
      login: { max: 5, window: 300000 } // 5 login attempts per 5 minutes
    };
  }

  /**
   * Check if request is within rate limit
   */
  checkLimit(key, type = 'api') {
    const limit = this.limits[type];
    if (!limit) {
      return { allowed: true };
    }

    const now = Date.now();
    const windowStart = now - limit.window;

    // Get or create request history for this key
    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const requests = this.requests.get(key);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    this.requests.set(key, recentRequests);

    // Check if limit exceeded
    if (recentRequests.length >= limit.max) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + limit.window;
      
      return {
        allowed: false,
        resetTime,
        remaining: 0
      };
    }

    // Add current request
    recentRequests.push(now);
    this.requests.set(key, recentRequests);

    return {
      allowed: true,
      remaining: limit.max - recentRequests.length
    };
  }

  /**
   * Clear rate limit for a key
   */
  clearLimit(key) {
    this.requests.delete(key);
  }
}

/**
 * CSRF Protection
 */
export class CSRFProtection {
  /**
   * Generate CSRF token
   */
  static generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Store CSRF token
   */
  static storeToken(token) {
    sessionStorage.setItem('csrf_token', token);
  }

  /**
   * Get stored CSRF token
   */
  static getToken() {
    return sessionStorage.getItem('csrf_token');
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token) {
    const storedToken = this.getToken();
    return storedToken && storedToken === token;
  }

  /**
   * Get CSRF headers for requests
   */
  static getHeaders() {
    const token = this.getToken();
    return token ? { 'X-CSRF-Token': token } : {};
  }
}

/**
 * Security Audit Logger
 */
export class SecurityAuditLogger {
  /**
   * Log security event
   */
  static logEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('session_id')
    };

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.warn('Security Event:', logEntry);
    }

    // Store in session storage for debugging
    const logs = JSON.parse(sessionStorage.getItem('security_logs') || '[]');
    logs.push(logEntry);
    
    // Keep only last 100 logs
    if (logs.length > 100) {
      logs.splice(0, logs.length - 100);
    }
    
    sessionStorage.setItem('security_logs', JSON.stringify(logs));

    // Send to backend for production logging
    if (process.env.NODE_ENV === 'production') {
      this.sendToBackend(logEntry);
    }
  }

  /**
   * Send security log to backend
   */
  static async sendToBackend(logEntry) {
    try {
      await fetch('/api/security/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...SecurityHeaders.getSecurityHeaders(),
          ...CSRFProtection.getHeaders()
        },
        body: JSON.stringify(logEntry)
      });
    } catch (error) {
      console.error('Failed to send security log:', error);
    }
  }

  /**
   * Get security logs
   */
  static getLogs() {
    return JSON.parse(sessionStorage.getItem('security_logs') || '[]');
  }

  /**
   * Clear security logs
   */
  static clearLogs() {
    sessionStorage.removeItem('security_logs');
  }
}

// Create singleton instances
export const rateLimiter = new RateLimiter();

// Export utility functions
export const validateInput = InputValidator;
export const sanitizeInput = InputSanitizer;
export const securityHeaders = SecurityHeaders;
export const csrfProtection = CSRFProtection;
export const securityLogger = SecurityAuditLogger;

// Default export
export default {
  InputValidator,
  InputSanitizer,
  SecurityHeaders,
  RateLimiter,
  CSRFProtection,
  SecurityAuditLogger,
  rateLimiter,
  validateInput,
  sanitizeInput,
  securityHeaders,
  csrfProtection,
  securityLogger
};