# Pipeline Dashboard Security Implementation

## Overview

This document outlines the comprehensive security implementation for the Pipeline Dashboard, including input validation, sanitization, CSRF protection, rate limiting, and Turkish character support.

## Security Features

### 1. Input Validation and Sanitization

#### Turkish Character Support
- **UTF-8 Encoding**: Full support for Turkish characters (ç, ğ, ı, ö, ş, ü, Ç, Ğ, I, İ, Ö, Ş, Ü)
- **Filename Validation**: Turkish characters allowed in file names with proper UTF-8 encoding
- **Data Content**: Turkish text validation for data processing and cleaning operations
- **Format Preservation**: All data format conversions maintain Turkish character integrity

#### Validation Patterns
```javascript
// Frontend validation patterns
const VALIDATION_PATTERNS = {
  filename: /^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9._\s-]+$/,
  turkishText: /^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9\s.,;:!?'"()\-_]+$/,
  sqlInjection: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
  xss: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  pathTraversal: /\.\.[\/\\]/
};
```

```python
# Backend validation patterns
VALIDATION_PATTERNS = {
    'filename': re.compile(r'^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9._\s-]+$'),
    'turkish_text': re.compile(r'^[a-zA-ZçğıöşüÇĞIİÖŞÜ0-9\s.,;:!?\'"()\-_]+$'),
}
```

### 2. Security Headers

#### Comprehensive Security Headers
```javascript
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; object-src 'none'",
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Permitted-Cross-Domain-Policies': 'none'
};
```

### 3. CSRF Protection

#### Token Generation and Validation
```javascript
class CSRFProtection {
  static generateToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  static validateToken(token) {
    const storedToken = this.getToken();
    return storedToken && storedToken === token;
  }

  static getHeaders() {
    const token = this.getToken();
    return token ? { 'X-CSRF-Token': token } : {};
  }
}
```

### 4. Rate Limiting

#### Frontend Rate Limiting
```javascript
class RateLimiter {
  constructor() {
    this.limits = {
      upload: { max: 5, window: 60000 }, // 5 uploads per minute
      api: { max: 100, window: 60000 }, // 100 API calls per minute
      login: { max: 5, window: 300000 } // 5 login attempts per 5 minutes
    };
  }

  checkLimit(key, type = 'api') {
    // Implementation details...
  }
}
```

#### Backend Rate Limiting
```python
RATE_LIMITS = {
    'upload': {'max_requests': 5, 'window': 60},  # 5 uploads per minute
    'api': {'max_requests': 100, 'window': 60},   # 100 API calls per minute
}

@app.middleware("http")
async def rate_limiting_middleware(request: Request, call_next):
    client_ip = request.client.host
    # Rate limiting logic...
```

### 5. File Upload Security

#### File Validation
- **Allowed Types**: CSV, Excel (.xlsx, .xls), JSON, Parquet
- **Size Limits**: Maximum 100MB per file
- **Filename Validation**: Turkish characters supported with UTF-8 encoding
- **Content Validation**: File content type verification

```javascript
static validateFile(file) {
  const errors = [];
  
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }
  
  // Check file type
  const allowedTypes = Object.keys(ALLOWED_FILE_TYPES);
  if (!allowedTypes.includes(file.type)) {
    errors.push(`File type ${file.type} is not allowed`);
  }
  
  // Validate filename with Turkish character support
  const filenameValidation = this.validateFilename(file.name);
  if (!filenameValidation.valid) {
    errors.push(filenameValidation.error);
  }
  
  return { valid: errors.length === 0, errors };
}
```

### 6. Data Processing Security

#### Turkish Character Preservation
- **Data Cleaning**: Turkish characters preserved during cleaning operations
- **Format Conversion**: UTF-8 encoding maintained across all format conversions
- **Text Processing**: Proper handling of Turkish collation and sorting

#### Sanitization with Turkish Support
```javascript
static sanitizeText(input) {
  return input
    .trim()
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' ') // Normalize whitespace
    .normalize('NFC'); // Normalize Turkish characters to composed form
}

static sanitizeFilename(filename) {
  // Preserve Turkish characters and common filename characters
  return filename
    .replace(/[^a-zA-ZçğıöşüÇĞIİÖŞÜ0-9._\s-]/g, '_')
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 255);
}
```

### 7. Security Audit Logging

#### Event Logging
```javascript
class SecurityAuditLogger {
  static logEvent(event, details = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: sessionStorage.getItem('session_id')
    };

    // Store locally and send to backend
    this.storeLog(logEntry);
    this.sendToBackend(logEntry);
  }
}
```

#### Backend Security Logging
```python
def log_security_event(event_type: str, details: dict, client_ip: str = None):
    """Log security events"""
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "event_type": event_type,
        "details": details,
        "client_ip": client_ip
    }
    print(f"SECURITY EVENT: {json.dumps(log_entry)}")
```

### 8. Authentication Integration

#### JWT Token Security
- **Token Validation**: Automatic token validation on all API requests
- **Token Refresh**: Automatic token refresh before expiration
- **Cross-tab Sync**: Shared authentication state across browser tabs
- **Secure Storage**: Tokens stored with expiration timestamps

### 9. Error Handling

#### Secure Error Messages
- **User-friendly Messages**: No sensitive information exposed in error messages
- **Detailed Logging**: Full error details logged securely on backend
- **Turkish Language Support**: Error messages support Turkish characters

### 10. Security Testing

#### Test Coverage
- **Input Validation Tests**: Comprehensive tests for all validation functions
- **Turkish Character Tests**: Specific tests for Turkish character handling
- **Security Attack Tests**: Tests for XSS, SQL injection, and path traversal
- **File Upload Tests**: Security tests for file upload functionality

```javascript
describe('Security Tests with Turkish Characters', () => {
  it('should validate Turkish filenames correctly', () => {
    expect(InputValidator.validateFilename('türkçe_dosya.csv')).toEqual({ valid: true });
    expect(InputValidator.validateFilename('öğrenci_listesi.xlsx')).toEqual({ valid: true });
  });

  it('should sanitize Turkish text properly', () => {
    const input = 'Merhaba dünya! Nasılsınız?';
    const sanitized = InputSanitizer.sanitizeText(input);
    expect(sanitized).toBe('Merhaba dünya! Nasılsınız?');
  });
});
```

## Implementation Status

### ✅ Completed Features
- Input validation with Turkish character support
- Security headers implementation
- CSRF protection system
- Rate limiting (frontend and backend)
- File upload security validation
- Security audit logging
- Turkish character preservation in data processing

### 🔄 In Progress
- Security monitoring dashboard
- Advanced threat detection
- Performance optimization for security checks

### 📋 Planned Features
- Advanced security analytics
- Automated security testing
- Security compliance reporting

## Security Best Practices

### Development Guidelines
1. **Always validate input** on both frontend and backend
2. **Preserve Turkish characters** in all text processing operations
3. **Use UTF-8 encoding** consistently across all components
4. **Log security events** for audit and monitoring
5. **Test with Turkish character data** in all security tests
6. **Apply security headers** to all HTTP responses
7. **Implement rate limiting** for all user-facing endpoints

### Deployment Considerations
1. **HTTPS Only**: All production traffic must use HTTPS
2. **Security Headers**: Ensure all security headers are properly configured
3. **Rate Limiting**: Configure appropriate rate limits for production load
4. **Monitoring**: Set up security event monitoring and alerting
5. **Regular Updates**: Keep all security dependencies up to date

## Troubleshooting

### Common Issues
1. **Turkish Character Display**: Ensure UTF-8 encoding is set in all components
2. **File Upload Errors**: Check file type validation and size limits
3. **CSRF Token Issues**: Verify token generation and validation logic
4. **Rate Limiting**: Check rate limit configuration and client identification

### Debug Tools
- Security event logs in browser console (development)
- Backend security event logging
- Network request inspection for security headers
- File upload validation testing tools

## Contact and Support

For security-related questions or issues, please refer to the main project documentation or contact the development team.