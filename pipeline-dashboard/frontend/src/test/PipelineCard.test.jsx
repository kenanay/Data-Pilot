/*
Data Pipeline Dashboard - PipelineCard Component Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Comprehensive unit tests for PipelineCard component including
Turkish character support and accessibility testing.
*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PipelineCard from '../components/PipelineCard';

expect.extend(toHaveNoViolations);

// Mock data with Turkish characters
const mockCardDataTurkish = {
  stepTitle: 'Veri Temizliği',
  status: 'completed',
  timestamp: '2025-01-20T10:30:00Z',
  details: 'Eksik değerler ortalama ile dolduruldu. Türkçe karakterler korundu.',
  metrics: {
    'İşlenen Satır': 1500,
    'Temizlenen Değer': 45,
    'Türkçe Karakter': 'Korundu'
  }
};

describe('PipelineCard Component', () => {
  const defaultProps = {
    stepTitle: 'Data Cleaning',
    status: 'pending',
    timestamp: '2025-01-20T10:00:00Z',
    details: 'Waiting to start data cleaning process',
    onRollback: vi.fn(),
    onShowLog: vi.fn(),
    onRetry: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render card with basic information', () => {
      render(<PipelineCard {...defaultProps} />);
      
      expect(screen.getByText('Data Cleaning')).toBeInTheDocument();
      expect(screen.getByText('Waiting to start data cleaning process')).toBeInTheDocument();
    });

    it('should render Turkish characters correctly', () => {
      render(<PipelineCard {...mockCardDataTurkish} />);
      
      expect(screen.getByText('Veri Temizliği')).toBeInTheDocument();
      expect(screen.getByText(/Türkçe karakterler korundu/)).toBeInTheDocument();
    });

    it('should display metrics with Turkish labels', () => {
      render(<PipelineCard {...mockCardDataTurkish} />);
      
      expect(screen.getByText('İşlenen Satır')).toBeInTheDocument();
      expect(screen.getByText('1500')).toBeInTheDocument();
      expect(screen.getByText('Temizlenen Değer')).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('Türkçe Karakter')).toBeInTheDocument();
      expect(screen.getByText('Korundu')).toBeInTheDocument();
    });
  });

  describe('Status Indicators', () => {
    it('should show pending status styling', () => {
      render(<PipelineCard {...defaultProps} status="pending" />);
      
      const card = screen.getByTestId('pipeline-card');
      expect(card).toHaveClass('border-gray-300', 'bg-gray-50');
    });

    it('should show active status styling', () => {
      render(<PipelineCard {...defaultProps} status="active" />);
      
      const card = screen.getByTestId('pipeline-card');
      expect(card).toHaveClass('border-blue-500', 'bg-blue-50');
    });

    it('should show completed status styling', () => {
      render(<PipelineCard {...defaultProps} status="completed" />);
      
      const card = screen.getByTestId('pipeline-card');
      expect(card).toHaveClass('border-green-500', 'bg-green-50');
    });

    it('should show error status styling', () => {
      render(<PipelineCard {...defaultProps} status="error" />);
      
      const card = screen.getByTestId('pipeline-card');
      expect(card).toHaveClass('border-red-500', 'bg-red-50');
    });
  });

  describe('Action Buttons', () => {
    it('should show rollback button for completed status', () => {
      render(<PipelineCard {...defaultProps} status="completed" />);
      
      expect(screen.getByText('Rollback')).toBeInTheDocument();
    });

    it('should show retry button for error status', () => {
      render(<PipelineCard {...defaultProps} status="error" />);
      
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should call onRollback when rollback button clicked', () => {
      const onRollback = vi.fn();
      render(<PipelineCard {...defaultProps} status="completed" onRollback={onRollback} />);
      
      fireEvent.click(screen.getByText('Rollback'));
      expect(onRollback).toHaveBeenCalledTimes(1);
    });

    it('should call onRetry when retry button clicked', () => {
      const onRetry = vi.fn();
      render(<PipelineCard {...defaultProps} status="error" onRetry={onRetry} />);
      
      fireEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it('should call onShowLog when view logs button clicked', () => {
      const onShowLog = vi.fn();
      render(<PipelineCard {...defaultProps} onShowLog={onShowLog} />);
      
      fireEvent.click(screen.getByText('View Logs'));
      expect(onShowLog).toHaveBeenCalledTimes(1);
    });
  });

  describe('Expandable Details', () => {
    it('should expand details when clicked', async () => {
      render(<PipelineCard {...defaultProps} />);
      
      const expandButton = screen.getByText('Show Details');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('Hide Details')).toBeInTheDocument();
      });
    });

    it('should show metrics when expanded', async () => {
      render(<PipelineCard {...mockCardDataTurkish} />);
      
      const expandButton = screen.getByText('Show Details');
      fireEvent.click(expandButton);
      
      await waitFor(() => {
        expect(screen.getByText('İşlenen Satır')).toBeInTheDocument();
        expect(screen.getByText('Temizlenen Değer')).toBeInTheDocument();
      });
    });
  });

  describe('Timestamp Display', () => {
    it('should format timestamp correctly', () => {
      render(<PipelineCard {...defaultProps} />);
      
      // Should display formatted timestamp
      expect(screen.getByText(/10:00/)).toBeInTheDocument();
    });

    it('should show relative time', () => {
      const recentTimestamp = new Date().toISOString();
      render(<PipelineCard {...defaultProps} timestamp={recentTimestamp} />);
      
      expect(screen.getByText(/just now|seconds ago|minutes ago/)).toBeInTheDocument();
    });
  });

  describe('Turkish Character Handling', () => {
    it('should preserve Turkish characters in all text fields', () => {
      const turkishData = {
        ...defaultProps,
        stepTitle: 'Şema Doğrulaması',
        details: 'Çağrı işlemi başarıyla tamamlandı. Öğeler güncellendi.',
        metrics: {
          'Başarılı İşlem': 100,
          'Hatalı Kayıt': 0,
          'Güncellenen Öğe': 50
        }
      };
      
      render(<PipelineCard {...turkishData} />);
      
      expect(screen.getByText('Şema Doğrulaması')).toBeInTheDocument();
      expect(screen.getByText(/Çağrı işlemi başarıyla/)).toBeInTheDocument();
    });

    it('should handle Turkish character encoding correctly', () => {
      const turkishText = 'İçerik: çok güzel öğrenci şarkısı';
      render(<PipelineCard {...defaultProps} details={turkishText} />);
      
      const detailsElement = screen.getByText(turkishText);
      expect(detailsElement.textContent).toBe(turkishText);
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<PipelineCard {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(<PipelineCard {...defaultProps} />);
      
      const card = screen.getByRole('article');
      expect(card).toHaveAttribute('aria-label', 
        expect.stringContaining('Data Cleaning')
      );
    });

    it('should support keyboard navigation', () => {
      render(<PipelineCard {...defaultProps} status="completed" />);
      
      const rollbackButton = screen.getByText('Rollback');
      rollbackButton.focus();
      
      expect(document.activeElement).toBe(rollbackButton);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing props gracefully', () => {
      render(<PipelineCard stepTitle="Test" />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      // Should not crash with missing props
    });

    it('should handle invalid timestamp', () => {
      render(<PipelineCard {...defaultProps} timestamp="invalid-date" />);
      
      // Should not crash with invalid timestamp
      expect(screen.getByTestId('pipeline-card')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should memoize expensive calculations', () => {
      const expensiveMetrics = {};
      for (let i = 0; i < 1000; i++) {
        expensiveMetrics[`Metric ${i}`] = Math.random();
      }
      
      const startTime = performance.now();
      render(<PipelineCard {...defaultProps} metrics={expensiveMetrics} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});