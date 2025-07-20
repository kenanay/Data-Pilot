/*
Data Pipeline Dashboard - LogPanel Component Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Comprehensive unit tests for LogPanel component including
WebSocket integration and Turkish character support.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import LogPanel from '../components/LogPanel';

expect.extend(toHaveNoViolations);

// Mock WebSocket
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      if (this.onopen) this.onopen();
    }, 10);
  }
  
  send(data) {
    // Mock send
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    if (this.onclose) this.onclose();
  }
}

global.WebSocket = MockWebSocket;

// Mock log data with Turkish characters
const mockLogsWithTurkish = [
  {
    id: '1',
    timestamp: '2025-01-20T10:00:00Z',
    level: 'info',
    message: 'Dosya yükleme işlemi başlatıldı',
    details: { filename: 'türkçe_veri.csv', size: 1024 },
    stepId: 0
  },
  {
    id: '2',
    timestamp: '2025-01-20T10:01:00Z',
    level: 'success',
    message: 'Veri önizlemesi başarıyla oluşturuldu',
    details: { rows: 1500, columns: 8, türkçe_sütun: 'var' },
    stepId: 1
  },
  {
    id: '3',
    timestamp: '2025-01-20T10:02:00Z',
    level: 'warning',
    message: 'Eksik değerler tespit edildi: çağrı, öğrenci, şirket',
    details: { missing_count: 15, affected_columns: ['çağrı', 'öğrenci'] },
    stepId: 2
  },
  {
    id: '4',
    timestamp: '2025-01-20T10:03:00Z',
    level: 'error',
    message: 'Şema doğrulama hatası: geçersiz karakter',
    details: { error_code: 'INVALID_CHAR', field: 'müşteri_adı' },
    stepId: 8
  }
];

describe('LogPanel Component', () => {
  const defaultProps = {
    logs: mockLogsWithTurkish,
    onLogClick: vi.fn(),
    maxEntries: 100,
    sessionId: 'test-session-123'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render all log entries', () => {
      render(<LogPanel {...defaultProps} />);
      
      mockLogsWithTurkish.forEach(log => {
        expect(screen.getByText(log.message)).toBeInTheDocument();
      });
    });

    it('should render Turkish characters correctly in log messages', () => {
      render(<LogPanel {...defaultProps} />);
      
      expect(screen.getByText('Dosya yükleme işlemi başlatıldı')).toBeInTheDocument();
      expect(screen.getByText('Veri önizlemesi başarıyla oluşturuldu')).toBeInTheDocument();
      expect(screen.getByText(/çağrı, öğrenci, şirket/)).toBeInTheDocument();
      expect(screen.getByText(/Şema doğrulama hatası/)).toBeInTheDocument();
    });

    it('should display log levels with appropriate colors', () => {
      render(<LogPanel {...defaultProps} />);
      
      const infoLog = screen.getByText('Dosya yükleme işlemi başlatıldı').closest('.log-entry');
      expect(infoLog).toHaveClass('text-blue-600', 'bg-blue-50');
      
      const successLog = screen.getByText('Veri önizlemesi başarıyla oluşturuldu').closest('.log-entry');
      expect(successLog).toHaveClass('text-green-600', 'bg-green-50');
      
      const warningLog = screen.getByText(/çağrı, öğrenci, şirket/).closest('.log-entry');
      expect(warningLog).toHaveClass('text-yellow-600', 'bg-yellow-50');
      
      const errorLog = screen.getByText(/Şema doğrulama hatası/).closest('.log-entry');
      expect(errorLog).toHaveClass('text-red-600', 'bg-red-50');
    });

    it('should format timestamps correctly', () => {
      render(<LogPanel {...defaultProps} />);
      
      // Should display formatted timestamps
      expect(screen.getByText('10:00:00')).toBeInTheDocument();
      expect(screen.getByText('10:01:00')).toBeInTheDocument();
    });
  });

  describe('Log Filtering', () => {
    it('should filter logs by level', async () => {
      render(<LogPanel {...defaultProps} />);
      
      const filterSelect = screen.getByLabelText('Filter logs');
      fireEvent.change(filterSelect, { target: { value: 'error' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Şema doğrulama hatası/)).toBeInTheDocument();
        expect(screen.queryByText('Dosya yükleme işlemi başlatıldı')).not.toBeInTheDocument();
      });
    });

    it('should search logs with Turkish characters', async () => {
      render(<LogPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search logs...');
      fireEvent.change(searchInput, { target: { value: 'çağrı' } });
      
      await waitFor(() => {
        expect(screen.getByText(/çağrı, öğrenci, şirket/)).toBeInTheDocument();
        expect(screen.queryByText('Dosya yükleme işlemi başlatıldı')).not.toBeInTheDocument();
      });
    });

    it('should handle case-insensitive Turkish search', async () => {
      render(<LogPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('Search logs...');
      fireEvent.change(searchInput, { target: { value: 'ŞEMA' } });
      
      await waitFor(() => {
        expect(screen.getByText(/Şema doğrulama hatası/)).toBeInTheDocument();
      });
    });
  });

  describe('Log Details', () => {
    it('should show expandable log details', async () => {
      render(<LogPanel {...defaultProps} />);
      
      const logEntry = screen.getByText('Dosya yükleme işlemi başlatıldı');
      fireEvent.click(logEntry);
      
      await waitFor(() => {
        expect(screen.getByText('türkçe_veri.csv')).toBeInTheDocument();
        expect(screen.getByText('1024')).toBeInTheDocument();
      });
    });

    it('should display Turkish characters in log details', async () => {
      render(<LogPanel {...defaultProps} />);
      
      const logEntry = screen.getByText(/çağrı, öğrenci, şirket/);
      fireEvent.click(logEntry);
      
      await waitFor(() => {
        expect(screen.getByText('çağrı')).toBeInTheDocument();
        expect(screen.getByText('öğrenci')).toBeInTheDocument();
      });
    });

    it('should call onLogClick when log is clicked', () => {
      const onLogClick = vi.fn();
      render(<LogPanel {...defaultProps} onLogClick={onLogClick} />);
      
      const logEntry = screen.getByText('Dosya yükleme işlemi başlatıldı');
      fireEvent.click(logEntry);
      
      expect(onLogClick).toHaveBeenCalledWith(mockLogsWithTurkish[0]);
    });
  });

  describe('WebSocket Integration', () => {
    it('should establish WebSocket connection', async () => {
      render(<LogPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Connected');
      });
    });

    it('should handle incoming log messages with Turkish characters', async () => {
      render(<LogPanel {...defaultProps} logs={[]} />);
      
      // Simulate WebSocket message
      const newLog = {
        id: '5',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Yeni Türkçe log mesajı geldi',
        details: { işlem: 'başarılı', durum: 'tamamlandı' }
      };
      
      // Mock WebSocket message
      const wsInstance = new MockWebSocket('ws://localhost:8082/ws/logs/test-session-123');
      wsInstance.onmessage({ data: JSON.stringify(newLog) });
      
      await waitFor(() => {
        expect(screen.getByText('Yeni Türkçe log mesajı geldi')).toBeInTheDocument();
      });
    });

    it('should handle connection errors gracefully', async () => {
      render(<LogPanel {...defaultProps} />);
      
      // Simulate connection error
      const wsInstance = new MockWebSocket('ws://localhost:8082/ws/logs/test-session-123');
      wsInstance.onerror(new Error('Connection failed'));
      
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Disconnected');
      });
    });

    it('should attempt reconnection on disconnect', async () => {
      const reconnectSpy = vi.fn();
      render(<LogPanel {...defaultProps} onReconnect={reconnectSpy} />);
      
      // Simulate disconnect
      const wsInstance = new MockWebSocket('ws://localhost:8082/ws/logs/test-session-123');
      wsInstance.close();
      
      await waitFor(() => {
        expect(reconnectSpy).toHaveBeenCalled();
      });
    });
  });

  describe('Auto-scroll Functionality', () => {
    it('should auto-scroll to latest entries', async () => {
      const scrollSpy = vi.fn();
      Element.prototype.scrollIntoView = scrollSpy;
      
      render(<LogPanel {...defaultProps} />);
      
      // Add new log entry
      const newLogs = [...mockLogsWithTurkish, {
        id: '5',
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'En son log girişi',
        stepId: 3
      }];
      
      render(<LogPanel {...defaultProps} logs={newLogs} />);
      
      await waitFor(() => {
        expect(scrollSpy).toHaveBeenCalled();
      });
    });

    it('should allow manual scroll control', () => {
      render(<LogPanel {...defaultProps} />);
      
      const autoScrollToggle = screen.getByLabelText('Auto-scroll');
      fireEvent.click(autoScrollToggle);
      
      expect(autoScrollToggle).not.toBeChecked();
    });
  });

  describe('Export Functionality', () => {
    it('should export logs with Turkish characters', () => {
      const createObjectURLSpy = vi.fn();
      global.URL.createObjectURL = createObjectURLSpy;
      
      render(<LogPanel {...defaultProps} />);
      
      const exportButton = screen.getByText('Export Logs');
      fireEvent.click(exportButton);
      
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it('should preserve Turkish character encoding in export', () => {
      const mockBlob = vi.fn();
      global.Blob = mockBlob;
      
      render(<LogPanel {...defaultProps} />);
      
      const exportButton = screen.getByText('Export Logs');
      fireEvent.click(exportButton);
      
      expect(mockBlob).toHaveBeenCalledWith(
        expect.arrayContaining([expect.stringContaining('çağrı')]),
        { type: 'text/plain;charset=utf-8' }
      );
    });
  });

  describe('Performance', () => {
    it('should handle large number of logs efficiently', () => {
      const manyLogs = Array.from({ length: 1000 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Log mesajı ${i}: Türkçe karakter testi`,
        stepId: i % 9
      }));
      
      const startTime = performance.now();
      render(<LogPanel {...defaultProps} logs={manyLogs} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('should limit displayed entries based on maxEntries', () => {
      const manyLogs = Array.from({ length: 200 }, (_, i) => ({
        id: `log-${i}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        message: `Log ${i}`,
        stepId: 0
      }));
      
      render(<LogPanel {...defaultProps} logs={manyLogs} maxEntries={50} />);
      
      const logEntries = screen.getAllByTestId('log-entry');
      expect(logEntries).toHaveLength(50);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<LogPanel {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support keyboard navigation', () => {
      render(<LogPanel {...defaultProps} />);
      
      const firstLog = screen.getByText('Dosya yükleme işlemi başlatıldı');
      firstLog.focus();
      
      expect(document.activeElement).toBe(firstLog);
    });

    it('should have proper ARIA labels', () => {
      render(<LogPanel {...defaultProps} />);
      
      const logPanel = screen.getByRole('log');
      expect(logPanel).toHaveAttribute('aria-label', 'Pipeline execution logs');
      
      const searchInput = screen.getByRole('searchbox');
      expect(searchInput).toHaveAttribute('aria-label', 'Search logs');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed log entries', () => {
      const malformedLogs = [
        { id: '1' }, // Missing required fields
        { message: 'No ID' }, // Missing ID
        null, // Null entry
        undefined // Undefined entry
      ];
      
      render(<LogPanel {...defaultProps} logs={malformedLogs} />);
      
      // Should not crash
      expect(screen.getByTestId('log-panel')).toBeInTheDocument();
    });

    it('should handle WebSocket connection failures', async () => {
      // Mock WebSocket constructor to throw error
      global.WebSocket = vi.fn(() => {
        throw new Error('WebSocket connection failed');
      });
      
      render(<LogPanel {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByTestId('connection-status')).toHaveTextContent('Failed to connect');
      });
    });
  });
});