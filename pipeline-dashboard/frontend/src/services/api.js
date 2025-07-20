/*
Data Pipeline Dashboard - API Service Layer

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import axios from 'axios';
import { 
  validateInput, 
  sanitizeInput, 
  securityHeaders, 
  csrfProtection, 
  securityLogger,
  rateLimiter 
} from '../utils/security.js';

// Pipeline Dashboard API base URL
const API_BASE_URL = process.env.REACT_APP_PIPELINE_API_URL || 'http://localhost:8000';

// Main Data Pilot API URL for authentication
const MAIN_API_URL = process.env.REACT_APP_MAIN_API_URL || 'http://localhost:8081';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for JWT token and security headers
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    const expiry = localStorage.getItem('token_expiry');
    
    // Check if token exists and is not expired
    if (token && expiry) {
      const currentTime = new Date().getTime();
      const expiryTime = parseInt(expiry, 10);
      
      if (currentTime < expiryTime) {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Token expired, clear storage
        localStorage.removeItem('auth_token');
        localStorage.removeItem('token_expiry');
        localStorage.removeItem('user_info');
        console.warn('Token expired, cleared from storage');
        securityLogger.logEvent('TOKEN_EXPIRED', { url: config.url });
      }
    }
    
    // Apply security headers
    config.headers = {
      ...config.headers,
      ...securityHeaders.getSecurityHeaders(),
      ...csrfProtection.getHeaders()
    };
    
    // Rate limiting check
    const userKey = token ? `user_${token.substring(0, 10)}` : 'anonymous';
    const rateCheck = rateLimiter.checkLimit(userKey, 'api');
    
    if (!rateCheck.allowed) {
      securityLogger.logEvent('RATE_LIMIT_EXCEEDED', { 
        url: config.url,
        resetTime: rateCheck.resetTime 
      });
      return Promise.reject(new Error('Rate limit exceeded'));
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling and security logging
apiClient.interceptors.response.use(
  (response) => {
    // Log successful requests for audit
    if (response.config.method !== 'get') {
      securityLogger.logEvent('API_SUCCESS', {
        method: response.config.method,
        url: response.config.url,
        status: response.status
      });
    }
    return response;
  },
  (error) => {
    // Log security-related errors
    const status = error.response?.status;
    const url = error.config?.url;
    
    if (status === 401) {
      // Handle unauthorized access - redirect to main app login
      console.warn('Authentication required. Redirecting to main application.');
      
      securityLogger.logEvent('UNAUTHORIZED_ACCESS', { url, status });
      
      // Clear auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user_info');
      
      // Redirect to main app login
      const currentUrl = window.location.href;
      const loginUrl = `${MAIN_API_URL.replace(':8081', ':3000')}/login?redirect=${encodeURIComponent(currentUrl)}`;
      window.location.href = loginUrl;
    } else if (status === 403) {
      securityLogger.logEvent('FORBIDDEN_ACCESS', { url, status });
    } else if (status === 429) {
      securityLogger.logEvent('RATE_LIMITED', { url, status });
    } else if (status >= 400 && status < 500) {
      securityLogger.logEvent('CLIENT_ERROR', { url, status, error: error.message });
    }
    
    return Promise.reject(error);
  }
);

// Error handling utility
const handleApiError = (error, context = '') => {
  const errorInfo = {
    message: error.response?.data?.message || error.message || 'An unexpected error occurred',
    code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
    status: error.response?.status,
    details: error.response?.data?.details || {},
    context
  };

  console.error(`API Error ${context}:`, errorInfo);
  return errorInfo;
};

// Retry utility for transient errors
const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      if (attempt === maxRetries || error.response?.status < 500) {
        throw error;
      }
      
      console.warn(`Request failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
};

// API Service Class
class ApiService {
  // File Management
  static async uploadFile(file, sessionId) {
    try {
      // Validate session ID
      const sessionValidation = validateInput.validateSessionId(sessionId);
      if (!sessionValidation.valid) {
        throw new Error(sessionValidation.error);
      }

      // Validate file
      const fileValidation = validateInput.validateFile(file);
      if (!fileValidation.valid) {
        securityLogger.logEvent('FILE_VALIDATION_FAILED', {
          errors: fileValidation.errors,
          filename: file?.name
        });
        throw new Error(fileValidation.errors.join(', '));
      }

      // Rate limiting for uploads
      const userKey = localStorage.getItem('auth_token')?.substring(0, 10) || 'anonymous';
      const rateCheck = rateLimiter.checkLimit(userKey, 'upload');
      
      if (!rateCheck.allowed) {
        securityLogger.logEvent('UPLOAD_RATE_LIMITED', { filename: file.name });
        throw new Error('Upload rate limit exceeded. Please wait before uploading again.');
      }

      // Sanitize filename
      const sanitizedFilename = sanitizeInput.sanitizeFilename(file.name);
      
      const formData = new FormData();
      formData.append('file', file, sanitizedFilename);
      formData.append('session_id', sessionId);

      securityLogger.logEvent('FILE_UPLOAD_STARTED', {
        filename: sanitizedFilename,
        size: file.size,
        type: file.type
      });

      const response = await retryRequest(() => 
        apiClient.post('/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })
      );

      securityLogger.logEvent('FILE_UPLOAD_SUCCESS', {
        filename: sanitizedFilename,
        fileId: response.data.file_id
      });

      return response.data;
    } catch (error) {
      securityLogger.logEvent('FILE_UPLOAD_FAILED', {
        filename: file?.name,
        error: error.message
      });
      throw handleApiError(error, 'uploadFile');
    }
  }

  static async getFileInfo(fileId) {
    try {
      // Validate file ID
      const fileIdValidation = validateInput.validateFileId(fileId);
      if (!fileIdValidation.valid) {
        throw new Error(fileIdValidation.error);
      }

      const response = await apiClient.get(`/api/files/${fileId}/info`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getFileInfo');
    }
  }

  static async deleteFile(fileId) {
    try {
      // Validate file ID
      const fileIdValidation = validateInput.validateFileId(fileId);
      if (!fileIdValidation.valid) {
        throw new Error(fileIdValidation.error);
      }

      securityLogger.logEvent('FILE_DELETE_REQUESTED', { fileId });

      const response = await apiClient.delete(`/api/files/${fileId}`);
      
      securityLogger.logEvent('FILE_DELETE_SUCCESS', { fileId });
      
      return response.data;
    } catch (error) {
      securityLogger.logEvent('FILE_DELETE_FAILED', { fileId, error: error.message });
      throw handleApiError(error, 'deleteFile');
    }
  }

  // Pipeline Operations
  static async getPipelineState(sessionId) {
    try {
      const response = await apiClient.get(`/api/pipeline/state/${sessionId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getPipelineState');
    }
  }

  static async previewData(fileId) {
    try {
      const response = await apiClient.get(`/api/pipeline/preview?file_id=${fileId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'previewData');
    }
  }

  static async cleanData(sessionId, fileId, parameters = {}) {
    try {
      const payload = {
        session_id: sessionId,
        file_id: fileId,
        ...parameters
      };

      const response = await retryRequest(() => 
        apiClient.post('/api/pipeline/clean', payload)
      );

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'cleanData');
    }
  }

  static async analyzeData(sessionId, fileId, parameters = {}) {
    try {
      const payload = {
        session_id: sessionId,
        file_id: fileId,
        ...parameters
      };

      const response = await retryRequest(() => 
        apiClient.post('/api/pipeline/analyze', payload)
      );

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'analyzeData');
    }
  }

  static async visualizeData(sessionId, fileId, parameters = {}) {
    try {
      const payload = {
        session_id: sessionId,
        file_id: fileId,
        ...parameters
      };

      const response = await retryRequest(() => 
        apiClient.post('/api/pipeline/visualize', payload)
      );

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'visualizeData');
    }
  }

  static async modelData(sessionId, fileId, parameters = {}) {
    try {
      const payload = {
        session_id: sessionId,
        file_id: fileId,
        ...parameters
      };

      const response = await retryRequest(() => 
        apiClient.post('/api/pipeline/model', payload)
      );

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'modelData');
    }
  }

  static async generateReport(sessionId, fileId, parameters = {}) {
    try {
      const payload = {
        session_id: sessionId,
        file_id: fileId,
        ...parameters
      };

      const response = await retryRequest(() => 
        apiClient.post('/api/pipeline/report', payload)
      );

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'generateReport');
    }
  }

  static async convertData(sessionId, fileId, parameters = {}) {
    try {
      const payload = {
        session_id: sessionId,
        file_id: fileId,
        ...parameters
      };

      const response = await retryRequest(() => 
        apiClient.post('/api/pipeline/convert', payload)
      );

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'convertData');
    }
  }

  static async validateSchema(sessionId, fileId, parameters = {}) {
    try {
      const payload = {
        session_id: sessionId,
        file_id: fileId,
        ...parameters
      };

      const response = await retryRequest(() => 
        apiClient.post('/api/pipeline/schema-validate', payload)
      );

      return response.data;
    } catch (error) {
      throw handleApiError(error, 'validateSchema');
    }
  }

  // State Management
  static async rollbackToSnapshot(sessionId, snapshotId) {
    try {
      const payload = {
        session_id: sessionId,
        snapshot_id: snapshotId
      };

      const response = await apiClient.post('/api/pipeline/rollback', payload);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'rollbackToSnapshot');
    }
  }

  static async getSnapshots(sessionId) {
    try {
      const response = await apiClient.get(`/api/pipeline/snapshots/${sessionId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getSnapshots');
    }
  }

  static async createSnapshot(sessionId, stepId) {
    try {
      const payload = {
        session_id: sessionId,
        step_id: stepId
      };

      const response = await apiClient.post('/api/pipeline/snapshot', payload);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'createSnapshot');
    }
  }

  // AI Integration
  static async interpretPrompt(prompt) {
    try {
      // Validate and sanitize prompt
      const promptValidation = validateInput.validateTextInput(prompt, 5000);
      if (!promptValidation.valid) {
        throw new Error(promptValidation.error);
      }

      const sanitizedPrompt = sanitizeInput.sanitizeText(prompt);
      
      securityLogger.logEvent('AI_PROMPT_SUBMITTED', {
        promptLength: sanitizedPrompt.length
      });

      const payload = { prompt: sanitizedPrompt };
      const response = await apiClient.post('/api/ai/interpret', payload);
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'interpretPrompt');
    }
  }

  static async getAISuggestions(context = {}) {
    try {
      const response = await apiClient.get('/api/ai/suggestions', { params: context });
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'getAISuggestions');
    }
  }

  // Health Check
  static async healthCheck() {
    try {
      const response = await apiClient.get('/health');
      return response.data;
    } catch (error) {
      throw handleApiError(error, 'healthCheck');
    }
  }

  // Generic execute step method
  static async executeStep(stepName, sessionId, fileId, parameters = {}) {
    const stepMethods = {
      'upload': () => { throw new Error('Upload should be handled via uploadFile method'); },
      'preview': () => this.previewData(fileId),
      'clean': () => this.cleanData(sessionId, fileId, parameters),
      'analyze': () => this.analyzeData(sessionId, fileId, parameters),
      'visualize': () => this.visualizeData(sessionId, fileId, parameters),
      'model': () => this.modelData(sessionId, fileId, parameters),
      'report': () => this.generateReport(sessionId, fileId, parameters),
      'convert': () => this.convertData(sessionId, fileId, parameters),
      'schema': () => this.validateSchema(sessionId, fileId, parameters)
    };

    const method = stepMethods[stepName];
    if (!method) {
      throw new Error(`Unknown step: ${stepName}`);
    }

    return await method();
  }

  // Authentication methods (integrated with main Data Pilot app)
  static async login(credentials) {
    // This method redirects to main app instead of handling login locally
    throw new Error('Login should be handled through main Data Pilot application');
  }

  static async logout() {
    try {
      // Call main app logout endpoint
      const response = await fetch(`${MAIN_API_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      // Clear local storage regardless of API response
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user_info');

      return {
        success: true,
        message: 'Logged out successfully'
      };
    } catch (error) {
      // Clear storage even if API call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token_expiry');
      localStorage.removeItem('user_info');
      
      throw handleApiError(error, 'logout');
    }
  }

  static async refreshToken() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No token available for refresh');
      }

      const response = await fetch(`${MAIN_API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      return {
        success: true,
        token: data.access_token,
        user: data.user
      };
    } catch (error) {
      throw handleApiError(error, 'refreshToken');
    }
  }

  static async getCurrentUser() {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${MAIN_API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const data = await response.json();
      
      return {
        success: true,
        user: data
      };
    } catch (error) {
      throw handleApiError(error, 'getCurrentUser');
    }
  }
}

// Export both the service class and the configured axios instance
export { ApiService, apiClient };
export default ApiService;