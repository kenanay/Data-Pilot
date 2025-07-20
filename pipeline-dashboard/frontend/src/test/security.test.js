/*
Data Pipeline Dashboard - Security Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Comprehensive security testing for input validation, sanitization,
and security utilities.
*/

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  InputValidator,
  InputSanitizer,
  SecurityHeaders,
  RateLimiter,
  CSRFProtection,
  SecurityAuditLogger
} from '../utils/security';

describe('InputValidator', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(InputValidator.validateEmail('test@example.com')).toEqual({ valid: true });
      expect(InputValidator.validateEmail('user.name@domain.co.uk')).toEqual({ valid: true });
    });

    it('should reject invalid email formats', () => {
      expect(InputValidator.validateEmail('invalid-email')).toEqual({
        valid: false,
        error: 'Invalid email format'
      });
      expect(InputValidator.validateEmail('')).toEqual({
        valid: false,
        error: 'Email is required'
      });
    });
  });

  describe('validateSessionId', () => {
    it('should validate correct session ID format', () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000';
      expect(InputValidator.validateSessionId(validSessionId)).toEqual({ valid: true });
    });

    it('should reject invalid session ID formats', () => {
      expect(InputValidator.validateSessionId('invalid-session')).toEqual({
        valid: false,
        error: 'Invalid session ID format'
      });
    });
  });

  describe('validateFile', () => {
    it('should validate correct file uploads', () => {
      const validFile = new File(['test content'], 'test.csv', {
        type: 'text/csv',
        size: 1024
      });

      const result = InputValidator.validateFile(validFile);
      expect(result.valid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(200 * 1024 * 1024)], 'large.csv', {
        type: 'text/csv',
        size: 200 * 1024 * 1024
      });

      const result = InputValidator.validateFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('File size exceeds maximum limit of 100MB');
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['test'], 'test.exe', {
        type: 'application/x-executable',
        size: 1024
      });

      const result = InputValidator.validateFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('File type application/x-executable is not allowed');
    });
  });

  describe('validateTextInput', () => {
    it('should validate safe text input', () => {
      expect(InputValidator.validateTextInput('Safe text input')).toEqual({ valid: true });
    });

    it('should reject SQL injection attempts', () => {
      const sqlInjection = "'; DROP TABLE users; --";
      expect(InputValidator.validateTextInput(sqlInjection)).toEqual({
        valid: false,
        error: 'Input contains potentially dangerous SQL patterns'
      });
    });

    it('should reject XSS attempts', () => {
      const xssAttempt = '<script>alert("xss")</script>';
      expect(InputValidator.validateTextInput(xssAttempt)).toEqual({
        valid: false,
        error: 'Input contains potentially dangerous script tags'
      });
    });

    it('should reject path traversal attempts', () => {
      const pathTraversal = '../../../etc/passwd';
      expect(InputValidator.validateTextInput(pathTraversal)).toEqual({
        valid: false,
        error: 'Input contains path traversal patterns'
      });
    });
  });

  describe('validateJSON', () => {
    it('should validate safe JSON', () => {
      const safeJson = '{"name": "test", "value": 123}';
      const result = InputValidator.validateJSON(safeJson);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'test', value: 123 });
    });

    it('should reject JSON with dangerous properties', () => {
      const dangerousJson = '{"__proto__": {"isAdmin": true}}';
      expect(InputValidator.validateJSON(dangerousJson)).toEqual({
        valid: false,
        error: 'JSON contains potentially dangerous properties'
      });
    });

    it('should reject invalid JSON', () => {
      const invalidJson = '{"invalid": json}';
      expect(InputValidator.validateJSON(invalidJson)).toEqual({
        valid: false,
        error: 'Invalid JSON format'
      });
    });
  });
});

describe('InputSanitizer', () => {
  describe('sanitizeHTML', () => {
    it('should remove HTML tags and escape special characters', () => {
      const input = '<script>alert("xss")</script><p>Hello & goodbye</p>';
      const expected = 'alert(&quot;xss&quot;)Hello &amp; goodbye';
      expect(InputSanitizer.sanitizeHTML(input)).toBe(expected);
    });

    it('should handle non-string input', () => {
      expect(InputSanitizer.sanitizeHTML(null)).toBe('');
      expect(InputSanitizer.sanitizeHTML(123)).toBe('');
    });
  });

  describe('sanitizeFilename', () => {
    it('should sanitize dangerous filename characters', () => {
      const input = '../../../etc/passwd<script>';
      const expected = '.._.._.._.._etc_passwd_script_';
      expect(InputSanitizer.sanitizeFilename(input)).toBe(expected);
    });

    it('should limit filename length', () => {
      const longFilename = 'a'.repeat(300);
      const result = InputSanitizer.sanitizeFilename(longFilename);
      expect(result.length).toBe(255);
    });
  });

  describe('sanitizeText', () => {
    it('should trim and normalize whitespace', () => {
      const input = '  Hello    world  \n\t  ';
      expect(InputSanitizer.sanitizeText(input)).toBe('Hello world');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00\x1F\x7FWorld';
      expect(InputSanitizer.sanitizeText(input)).toBe('HelloWorld');
    });
  });

  describe('sanitizeURL', () => {
    it('should allow safe URLs', () => {
      const url = 'https://example.com/path';
      expect(InputSanitizer.sanitizeURL(url)).toBe(url);
    });

    it('should reject dangerous protocols', () => {
      expect(InputSanitizer.sanitizeURL('javascript:alert("xss")')).toBe('');
      expect(InputSanitizer.sanitizeURL('data:text/html,<script>alert("xss")</script>')).toBe('');
    });

    it('should handle invalid URLs', () => {
      expect(InputSanitizer.sanitizeURL('not-a-url')).toBe('');
    });
  });
});

describe('SecurityHeaders', () => {
  it('should provide comprehensive security headers', () => {
    const headers = SecurityHeaders.getSecurityHeaders();
    
    expect(headers).toHaveProperty('X-Content-Type-Options', 'nosniff');
    expect(headers).toHaveProperty('X-Frame-Options', 'DENY');
    expect(headers).toHaveProperty('X-XSS-Protection', '1; mode=block');
    expect(headers).toHaveProperty('Referrer-Policy', 'strict-origin-when-cross-origin');
    expect(headers).toHaveProperty('Content-Security-Policy');
  });

  it('should apply headers to fetch options', () => {
    const options = { method: 'POST' };
    const result = SecurityHeaders.applyToFetch(options);
    
    expect(result.headers).toHaveProperty('X-Content-Type-Options');
    expect(result.method).toBe('POST');
  });
});

describe('RateLimiter', () => {
  let rateLimiter;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
  });

  it('should allow requests within limit', () => {
    const result = rateLimiter.checkLimit('test-key', 'api');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(99);
  });

  it('should block requests exceeding limit', () => {
    // Make 100 requests to hit the limit
    for (let i = 0; i < 100; i++) {
      rateLimiter.checkLimit('test-key', 'api');
    }

    const result = rateLimiter.checkLimit('test-key', 'api');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it('should reset limits after time window', () => {
    // Mock time to simulate window expiration
    const originalNow = Date.now;
    Date.now = vi.fn(() => 1000);

    // Hit the limit
    for (let i = 0; i < 100; i++) {
      rateLimiter.checkLimit('test-key', 'api');
    }

    // Move time forward beyond window
    Date.now = vi.fn(() => 70000); // 70 seconds later

    const result = rateLimiter.checkLimit('test-key', 'api');
    expect(result.allowed).toBe(true);

    Date.now = originalNow;
  });
});

describe('CSRFProtection', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('should generate and store CSRF tokens', () => {
    const token = CSRFProtection.generateToken();
    expect(token).toHaveLength(64);
    
    CSRFProtection.storeToken(token);
    expect(CSRFProtection.getToken()).toBe(token);
  });

  it('should validate CSRF tokens', () => {
    const token = CSRFProtection.generateToken();
    CSRFProtection.storeToken(token);
    
    expect(CSRFProtection.validateToken(token)).toBe(true);
    expect(CSRFProtection.validateToken('invalid-token')).toBe(false);
  });

  it('should provide CSRF headers', () => {
    const token = CSRFProtection.generateToken();
    CSRFProtection.storeToken(token);
    
    const headers = CSRFProtection.getHeaders();
    expect(headers).toEqual({ 'X-CSRF-Token': token });
  });
});

describe('SecurityAuditLogger', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it('should log security events', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    SecurityAuditLogger.logEvent('TEST_EVENT', { test: 'data' });
    
    const logs = SecurityAuditLogger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].event).toBe('TEST_EVENT');
    expect(logs[0].details).toEqual({ test: 'data' });
    
    consoleSpy.mockRestore();
  });

  it('should limit log storage', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    // Add 150 logs (more than the 100 limit)
    for (let i = 0; i < 150; i++) {
      SecurityAuditLogger.logEvent(`EVENT_${i}`, { index: i });
    }
    
    const logs = SecurityAuditLogger.getLogs();
    expect(logs).toHaveLength(100);
    expect(logs[0].event).toBe('EVENT_50'); // Should start from event 50
    
    consoleSpy.mockRestore();
  });

  it('should clear logs', () => {
    SecurityAuditLogger.logEvent('TEST_EVENT');
    expect(SecurityAuditLogger.getLogs()).toHaveLength(1);
    
    SecurityAuditLogger.clearLogs();
    expect(SecurityAuditLogger.getLogs()).toHaveLength(0);
  });
});

describe('Integration Tests', () => {
  it('should handle complete security workflow', () => {
    // Simulate file upload with security validation
    const file = new File(['test content'], 'test.csv', {
      type: 'text/csv',
      size: 1024
    });

    // Validate file
    const fileValidation = InputValidator.validateFile(file);
    expect(fileValidation.valid).toBe(true);

    // Sanitize filename
    const sanitizedName = InputSanitizer.sanitizeFilename(file.name);
    expect(sanitizedName).toBe('test.csv');

    // Check rate limit
    const rateLimiter = new RateLimiter();
    const rateCheck = rateLimiter.checkLimit('test-user', 'upload');
    expect(rateCheck.allowed).toBe(true);

    // Generate CSRF token
    const csrfToken = CSRFProtection.generateToken();
    CSRFProtection.storeToken(csrfToken);

    // Get security headers
    const headers = SecurityHeaders.getSecurityHeaders();
    expect(headers).toHaveProperty('X-Content-Type-Options');

    // Log security event
    SecurityAuditLogger.logEvent('FILE_UPLOAD_SUCCESS', {
      filename: sanitizedName,
      size: file.size
    });

    const logs = SecurityAuditLogger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].event).toBe('FILE_UPLOAD_SUCCESS');
  });
});