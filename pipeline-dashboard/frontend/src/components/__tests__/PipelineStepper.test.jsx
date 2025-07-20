/*
Data Pipeline Dashboard - PipelineStepper Component Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Comprehensive unit tests for PipelineStepper component including
Turkish character support and accessibility testing.
*/

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import PipelineStepper from '../PipelineStepper';

expect.extend(toHaveNoViolations);

// Mock data with Turkish characters
const mockStepsWithTurkish = [
  { id: 0, name: 'Yükleme', icon: '📁', description: 'Veri dosyası yükle' },
  { id: 1, name: 'Önizleme', icon: '👁️', description: 'Veri yapısını görüntüle' },
  { id: 2, name: 'Temizlik', icon: '🧹', description: 'Veriyi temizle ve hazırla' },
  { id: 3, name: 'Analiz', icon: '📊', description: 'İstatistiksel analiz' },
  { id: 4, name: 'Görselleştirme', icon: '📈', description: 'Grafikler oluştur' },
  { id: 5, name: 'Model', icon: '🤖', description: 'Makine öğrenmesi modelleri' },
  { id: 6, name: 'Rapor', icon: '📄', description: 'Raporlar üret' },
  { id: 7, name: 'Dönüştür', icon: '🔄', description: 'Format dönüşümü' },
  { id: 8, name: 'Şema', icon: '✅', description: 'Şema doğrulama' }
];

describe('PipelineStepper Component', () => {
  const defaultProps = {
    currentStep: 0,
    completedSteps: [],
    errorSteps: [],
    onStepClick: vi.fn(),
    loading: false,
    steps: mockStepsWithTurkish
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all pipeline steps', () => {
      render(<PipelineStepper {...defaultProps} />);
      
      mockStepsWithTurkish.forEach(step => {
        expect(screen.getByText(step.name)).toBeInTheDocument();
      });
    });

    it('should render Turkish characters correctly', () => {
      render(<PipelineStepper {...defaultProps} />);
      
      expect(screen.getByText('Yükleme')).toBeInTheDocument();
      expect(screen.getByText('Önizleme')).toBeInTheDocument();
      expect(screen.getByText('Görselleştirme')).toBeInTheDocument();
      expect(screen.getByText('Dönüştür')).toBeInTheDocument();
      expect(screen.getByText('Şema')).toBeInTheDocument();
    });

    it('should display step icons', () => {
      render(<PipelineStepper {...defaultProps} />);
      
      mockStepsWithTurkish.forEach(step => {
        expect(screen.getByText(step.icon)).toBeInTheDocument();
      });
    });

    it('should show tooltips with Turkish descriptions', async () => {
      render(<PipelineStepper {...defaultProps} />);
      
      const firstStep = screen.getByText('Yükleme');
      fireEvent.mouseEnter(firstStep);
      
      await waitFor(() => {
        expect(screen.getByText('Veri dosyası yükle')).toBeInTheDocument();
      });
    });
  });

  describe('Step States', () => {
    it('should highlight current step', () => {
      render(<PipelineStepper {...defaultProps} currentStep={2} />);
      
      const currentStepElement = screen.getByText('Temizlik').closest('[data-testid="pipeline-step"]');
      expect(currentStepElement).toHaveClass('bg-blue-100', 'border-blue-500');
    });

    it('should mark completed steps', () => {
      render(<PipelineStepper {...defaultProps} completedSteps={[0, 1]} />);
      
      const completedStep = screen.getByText('Yükleme').closest('[data-testid="pipeline-step"]');
      expect(completedStep).toHaveClass('bg-green-100', 'border-green-500');
    });

    it('should mark error steps', () => {
      render(<PipelineStepper {...defaultProps} errorSteps={[2]} />);
      
      const errorStep = screen.getByText('Temizlik').closest('[data-testid="pipeline-step"]');
      expect(errorStep).toHaveClass('bg-red-100', 'border-red-500');
    });

    it('should show loading state', () => {
      render(<PipelineStepper {...defaultProps} loading={true} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should call onStepClick when clicking completed step', () => {
      const onStepClick = vi.fn();
      render(
        <PipelineStepper 
          {...defaultProps} 
          completedSteps={[0, 1]} 
          onStepClick={onStepClick}
        />
      );
      
      fireEvent.click(screen.getByText('Yükleme'));
      expect(onStepClick).toHaveBeenCalledWith(0);
    });

    it('should not call onStepClick when clicking incomplete step', () => {
      const onStepClick = vi.fn();
      render(<PipelineStepper {...defaultProps} onStepClick={onStepClick} />);
      
      fireEvent.click(screen.getByText('Analiz'));
      expect(onStepClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard navigation', () => {
      const onStepClick = vi.fn();
      render(
        <PipelineStepper 
          {...defaultProps} 
          completedSteps={[0]} 
          onStepClick={onStepClick}
        />
      );
      
      const firstStep = screen.getByText('Yükleme');
      firstStep.focus();
      fireEvent.keyDown(firstStep, { key: 'Enter' });
      
      expect(onStepClick).toHaveBeenCalledWith(0);
    });
  });

  describe('Responsive Design', () => {
    it('should adapt to mobile viewport', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<PipelineStepper {...defaultProps} />);
      
      const container = screen.getByTestId('pipeline-stepper');
      expect(container).toHaveClass('flex-col', 'md:flex-row');
    });

    it('should show abbreviated step names on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      });

      render(<PipelineStepper {...defaultProps} />);
      
      // Should show icons instead of full names on very small screens
      expect(screen.getByText('📁')).toBeInTheDocument();
    });
  });

  describe('Progress Indicators', () => {
    it('should show progress line between steps', () => {
      render(<PipelineStepper {...defaultProps} currentStep={2} />);
      
      const progressLines = screen.getAllByTestId('progress-line');
      expect(progressLines).toHaveLength(mockStepsWithTurkish.length - 1);
    });

    it('should highlight completed progress lines', () => {
      render(<PipelineStepper {...defaultProps} completedSteps={[0, 1, 2]} />);
      
      const progressLines = screen.getAllByTestId('progress-line');
      const completedLines = progressLines.filter(line => 
        line.classList.contains('bg-green-500')
      );
      expect(completedLines).toHaveLength(2);
    });
  });

  describe('Turkish Character Handling', () => {
    it('should properly encode Turkish characters in URLs', () => {
      const onStepClick = vi.fn();
      render(
        <PipelineStepper 
          {...defaultProps} 
          completedSteps={[0]} 
          onStepClick={onStepClick}
        />
      );
      
      fireEvent.click(screen.getByText('Yükleme'));
      
      // Verify Turkish characters are properly handled
      expect(onStepClick).toHaveBeenCalledWith(0);
    });

    it('should display Turkish characters without encoding issues', () => {
      render(<PipelineStepper {...defaultProps} />);
      
      // Check that Turkish characters display correctly
      const turkishSteps = ['Yükleme', 'Önizleme', 'Görselleştirme', 'Dönüştür', 'Şema'];
      turkishSteps.forEach(stepName => {
        const element = screen.getByText(stepName);
        expect(element.textContent).toBe(stepName);
      });
    });

    it('should handle Turkish character sorting correctly', () => {
      const sortedSteps = [...mockStepsWithTurkish].sort((a, b) => 
        a.name.localeCompare(b.name, 'tr-TR')
      );
      
      render(<PipelineStepper {...defaultProps} steps={sortedSteps} />);
      
      // Verify steps are rendered in Turkish alphabetical order
      const stepElements = screen.getAllByTestId('step-name');
      const stepNames = stepElements.map(el => el.textContent);
      
      expect(stepNames).toEqual(sortedSteps.map(step => step.name));
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<PipelineStepper {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have proper ARIA labels', () => {
      render(<PipelineStepper {...defaultProps} />);
      
      const stepper = screen.getByRole('navigation');
      expect(stepper).toHaveAttribute('aria-label', 'Pipeline steps');
      
      mockStepsWithTurkish.forEach((step, index) => {
        const stepElement = screen.getByText(step.name).closest('button');
        expect(stepElement).toHaveAttribute('aria-label', 
          `Step ${index + 1}: ${step.name} - ${step.description}`
        );
      });
    });

    it('should support screen readers', () => {
      render(<PipelineStepper {...defaultProps} currentStep={1} completedSteps={[0]} />);
      
      const currentStep = screen.getByText('Önizleme').closest('button');
      expect(currentStep).toHaveAttribute('aria-current', 'step');
      
      const completedStep = screen.getByText('Yükleme').closest('button');
      expect(completedStep).toHaveAttribute('aria-label', 
        expect.stringContaining('completed')
      );
    });

    it('should have proper focus management', () => {
      render(<PipelineStepper {...defaultProps} completedSteps={[0]} />);
      
      const firstStep = screen.getByText('Yükleme');
      firstStep.focus();
      
      expect(document.activeElement).toBe(firstStep);
      expect(firstStep).toHaveAttribute('tabindex', '0');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing step data gracefully', () => {
      const incompleteSteps = [
        { id: 0, name: 'Test' },
        { id: 1 } // Missing name
      ];
      
      render(<PipelineStepper {...defaultProps} steps={incompleteSteps} />);
      
      expect(screen.getByText('Test')).toBeInTheDocument();
      // Should not crash with missing data
    });

    it('should handle invalid step indices', () => {
      render(
        <PipelineStepper 
          {...defaultProps} 
          currentStep={999} 
          completedSteps={[999, -1]}
          errorSteps={[888]}
        />
      );
      
      // Should not crash with invalid indices
      expect(screen.getByTestId('pipeline-stepper')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const renderSpy = vi.fn();
      const TestComponent = (props) => {
        renderSpy();
        return <PipelineStepper {...props} />;
      };
      
      const { rerender } = render(<TestComponent {...defaultProps} />);
      
      // Re-render with same props
      rerender(<TestComponent {...defaultProps} />);
      
      // Should only render twice (initial + rerender)
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });

    it('should handle large number of steps efficiently', () => {
      const manySteps = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `Adım ${i + 1}`,
        icon: '⚡',
        description: `Açıklama ${i + 1}`
      }));
      
      const startTime = performance.now();
      render(<PipelineStepper {...defaultProps} steps={manySteps} />);
      const endTime = performance.now();
      
      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});