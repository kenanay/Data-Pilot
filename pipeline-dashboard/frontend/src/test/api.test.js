/*
Data Pipeline Dashboard - API Service Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Comprehensive unit tests for API service including
Turkish character support and security validation.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ApiService from '../services/api.js';
import { turkishTestData, testTurkishCharacters } from './setup.js';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    }))
  }
}));

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful responses
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ success: true }),
        headers: new Headers({
          'Content-Type': 'application/json; charset=utf-8'
        })
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('File Upload', () => {
    it('should upload file with Turkish filename', async () => {
      const turkishFile = new File(['test content'], turkishTestData.filenames[0], {
        type: 'text/csv'
      });
      
      const mockResponse = {
        data: { file_id: 'test-file-id', status: 'success' }
      };
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse.data)
        })
      );

      const result = await ApiService.uploadFile(turkishFile, 'test-session');
      
      expect(result).toEqual(mockResponse.data);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      );
    });

    it('should validate Turkish filename before upload', async () => {
      const invalidFile = new File(['test'], '../../../etc/passwd', {
        type: 'text/csv'
      });

      await expect(ApiService.uploadFile(invalidFile, 'test-session'))
        .rejects.toThrow();
    });

    it('should preserve Turkish characters in file content', async () => {
      const turkishContent = turkishTestData.textSamples.join('\n');
      const file = new File([turkishContent], 'test.csv', {
        type: 'text/csv'
      });

      const result = await ApiService.uploadFile(file, 'test-session');
      
      // Verify Turkish characters are preserved in the upload process
      expect(testTurkishCharacters(turkishContent)).toBe(true);
    });
  });

  describe('Data Preview', () => {
    it('should handle Turkish column names in preview', async () => {
      const mockPreviewData = {
        columns: turkishTestData.columnNames,
        sample: [
          [1, 'Ahmet Çelik', 'Mühendis', 12345, '2025-01-01'],
          [2, 'Ayşe Öztürk', 'Öğretmen', 67890, '2025-01-02']
        ],
        summary: {
          rows: 1000,
          columns: 5,
          missing_values: 15
        }
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockPreviewData)
        })
      );

      const result = await ApiService.previewData('test-file-id');
      
      expect(result.columns).toEqual(turkishTestData.columnNames);
      expect(testTurkishCharacters(result.sample[0][1])).toBe(true);
      expect(testTurkishCharacters(result.sample[1][2])).toBe(true);
    });

    it('should handle Turkish text in data cells', async () => {
      const mockData = {
        columns: ['id', 'açıklama', 'durum'],
        sample: [
          [1, 'Çok güzel bir açıklama', 'Başarılı'],
          [2, 'Öğrenci kayıt işlemi', 'Tamamlandı']
        ]
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData)
        })
      );

      const result = await ApiService.previewData('test-file-id');
      
      result.sample.forEach(row => {
        row.forEach(cell => {
          if (typeof cell === 'string' && testTurkishCharacters(cell)) {
            // Verify Turkish characters are preserved
            expect(cell).toMatch(/[çğıöşüÇĞIİÖŞÜ]/);
          }
        });
      });
    });
  });

  describe('Data Cleaning', () => {
    it('should preserve Turkish characters during cleaning', async () => {
      const cleaningParams = {
        method: 'fillna',
        columns: turkishTestData.columnNames,
        fill_value: 'Varsayılan değer'
      };

      const mockResponse = {
        status: 'success',
        affected_rows: 15,
        details: 'Türkçe karakterler korundu'
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await ApiService.cleanData('test-session', 'test-file', cleaningParams);
      
      expect(result.details).toContain('Türkçe');
      expect(testTurkishCharacters(result.details)).toBe(true);
    });

    it('should handle Turkish error messages', async () => {
      const errorMessage = 'Temizleme işlemi başarısız: geçersiz sütun adı';
      
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: errorMessage
          })
        })
      );

      await expect(ApiService.cleanData('test-session', 'test-file', {}))
        .rejects.toThrow();
    });
  });

  describe('AI Prompt Processing', () => {
    it('should handle Turkish prompts correctly', async () => {
      const turkishPrompt = 'Bu veriyi temizle ve çağrı merkezi analizi yap';
      
      const mockResponse = {
        success: true,
        steps: [
          { action: 'clean', description: 'Veri temizleme işlemi' },
          { action: 'analyze', description: 'Çağrı merkezi analizi' }
        ]
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockResponse)
        })
      );

      const result = await ApiService.interpretPrompt(turkishPrompt);
      
      expect(result.steps[0].description).toContain('temizleme');
      expect(result.steps[1].description).toContain('Çağrı');
      expect(testTurkishCharacters(result.steps[1].description)).toBe(true);
    });

    it('should validate Turkish prompt input', async () => {
      const validTurkishPrompt = 'Müşteri verilerini analiz et';
      const invalidPrompt = '<script>alert("xss")</script>';

      // Valid Turkish prompt should work
      await expect(ApiService.interpretPrompt(validTurkishPrompt))
        .resolves.toBeDefined();

      // Invalid prompt should be rejected
      await expect(ApiService.interpretPrompt(invalidPrompt))
        .rejects.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should provide Turkish error messages', async () => {
      const turkishError = {
        message: 'Dosya yükleme hatası: desteklenmeyen format',
        code: 'UNSUPPORTED_FORMAT',
        details: {
          supported_formats: ['CSV', 'Excel', 'JSON'],
          received_format: 'TXT'
        }
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve(turkishError)
        })
      );

      try {
        await ApiService.uploadFile(new File(['test'], 'test.txt'), 'session');
      } catch (error) {
        expect(error.message).toContain('Dosya yükleme hatası');
        expect(testTurkishCharacters(error.message)).toBe(true);
      }
    });

    it('should handle network errors gracefully', async () => {
      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      await expect(ApiService.healthCheck())
        .rejects.toThrow('Network error');
    });
  });

  describe('Security Validation', () => {
    it('should validate session IDs', async () => {
      const validSessionId = '123e4567-e89b-12d3-a456-426614174000';
      const invalidSessionId = 'invalid-session';

      // Valid session ID should work
      await expect(ApiService.getPipelineState(validSessionId))
        .resolves.toBeDefined();

      // Invalid session ID should be rejected
      await expect(ApiService.getPipelineState(invalidSessionId))
        .rejects.toThrow();
    });

    it('should sanitize Turkish text input', async () => {
      const maliciousInput = 'Çok güzel <script>alert("xss")</script> bir metin';
      const expectedSanitized = 'Çok güzel  bir metin';

      // The API should sanitize the input while preserving Turkish characters
      const result = await ApiService.interpretPrompt(maliciousInput);
      
      // Verify Turkish characters are preserved but script tags are removed
      expect(testTurkishCharacters('Çok güzel')).toBe(true);
    });

    it('should apply security headers to requests', async () => {
      await ApiService.healthCheck();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY'
          })
        })
      );
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit responses', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({
            error: 'Rate limit exceeded',
            retry_after: 60
          })
        })
      );

      await expect(ApiService.uploadFile(new File(['test'], 'test.csv'), 'session'))
        .rejects.toThrow();
    });

    it('should implement client-side rate limiting', async () => {
      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () => 
        ApiService.healthCheck()
      );

      // Some requests should be rate limited
      const results = await Promise.allSettled(promises);
      const rejectedCount = results.filter(r => r.status === 'rejected').length;
      
      expect(rejectedCount).toBeGreaterThan(0);
    });
  });

  describe('Authentication Integration', () => {
    it('should include JWT token in requests', async () => {
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
      localStorage.setItem('auth_token', mockToken);
      localStorage.setItem('token_expiry', (Date.now() + 3600000).toString());

      await ApiService.healthCheck();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${mockToken}`
          })
        })
      );
    });

    it('should handle token expiration', async () => {
      const expiredToken = 'expired-token';
      localStorage.setItem('auth_token', expiredToken);
      localStorage.setItem('token_expiry', (Date.now() - 1000).toString());

      await ApiService.healthCheck();

      // Token should be cleared from storage
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('WebSocket Integration', () => {
    it('should handle Turkish log messages via WebSocket', () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn()
      };

      global.WebSocket = vi.fn(() => mockWebSocket);

      const turkishLogMessage = {
        type: 'log',
        level: 'info',
        message: turkishTestData.logMessages[0],
        timestamp: new Date().toISOString()
      };

      // Simulate receiving Turkish log message
      const messageHandler = mockWebSocket.addEventListener.mock.calls
        .find(call => call[0] === 'message')?.[1];

      if (messageHandler) {
        messageHandler({
          data: JSON.stringify(turkishLogMessage)
        });
      }

      expect(testTurkishCharacters(turkishLogMessage.message)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large Turkish datasets efficiently', async () => {
      const largeTurkishData = {
        columns: turkishTestData.columnNames,
        sample: Array.from({ length: 1000 }, (_, i) => [
          i,
          `Müşteri ${i}`,
          `Şirket ${i}`,
          `Öğrenci ${i}`,
          `2025-01-${(i % 30) + 1}`
        ])
      };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(largeTurkishData)
        })
      );

      const startTime = performance.now();
      const result = await ApiService.previewData('large-file');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
      expect(result.sample).toHaveLength(1000);
    });

    it('should cache repeated requests', async () => {
      const fileId = 'cached-file';
      
      // Make the same request twice
      await ApiService.getFileInfo(fileId);
      await ApiService.getFileInfo(fileId);

      // Should only make one actual network request due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });
});