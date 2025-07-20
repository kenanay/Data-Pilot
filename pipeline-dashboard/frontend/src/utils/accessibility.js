/*
Data Pipeline Dashboard - Accessibility Utilities

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Accessibility utilities for ARIA labels, keyboard navigation,
screen reader support, and Turkish language accessibility.
*/

// ARIA label generators with Turkish support
export const generateAriaLabel = (type, data = {}) => {
  const labels = {
    pipelineStep: (data) => {
      const { stepName, stepNumber, status, description } = data;
      const statusText = {
        pending: 'beklemede',
        active: 'aktif',
        completed: 'tamamlandı',
        error: 'hatalı'
      };
      
      return `Adım ${stepNumber}: ${stepName} - ${description} - Durum: ${statusText[status] || status}`;
    },
    
    fileUpload: (data) => {
      const { fileName, fileSize, fileType } = data;
      return `Dosya yükleme alanı. ${fileName ? `Seçili dosya: ${fileName}, boyut: ${fileSize}, tür: ${fileType}` : 'Dosya seçilmedi'}`;
    },
    
    dataPreview: (data) => {
      const { rows, columns } = data;
      return `Veri önizlemesi: ${rows} satır, ${columns} sütun`;
    },
    
    logEntry: (data) => {
      const { level, message, timestamp } = data;
      const levelText = {
        info: 'bilgi',
        warning: 'uyarı',
        error: 'hata',
        success: 'başarılı'
      };
      
      return `${levelText[level] || level} seviyesi log girişi: ${message}, zaman: ${timestamp}`;
    },
    
    button: (data) => {
      const { action, context, disabled } = data;
      const actionText = {
        upload: 'yükle',
        download: 'indir',
        delete: 'sil',
        retry: 'tekrar dene',
        rollback: 'geri al',
        preview: 'önizle',
        clean: 'temizle',
        analyze: 'analiz et',
        visualize: 'görselleştir'
      };
      
      const baseText = `${actionText[action] || action} ${context ? `- ${context}` : ''}`;
      return disabled ? `${baseText} (devre dışı)` : baseText;
    }
  };

  return labels[type] ? labels[type](data) : '';
};

// Keyboard navigation utilities
export class KeyboardNavigationManager {
  constructor() {
    this.focusableElements = [
      'button',
      'input',
      'select',
      'textarea',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ');
  }

  // Get all focusable elements within a container
  getFocusableElements(container = document) {
    return Array.from(container.querySelectorAll(this.focusableElements))
      .filter(el => !el.disabled && el.offsetParent !== null);
  }

  // Set up arrow key navigation for a container
  setupArrowKeyNavigation(container, options = {}) {
    const {
      direction = 'both', // 'horizontal', 'vertical', 'both'
      wrap = true,
      onNavigate
    } = options;

    const handleKeyDown = (e) => {
      const focusableElements = this.getFocusableElements(container);
      const currentIndex = focusableElements.indexOf(document.activeElement);
      
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;
      
      switch (e.key) {
        case 'ArrowRight':
          if (direction === 'horizontal' || direction === 'both') {
            e.preventDefault();
            nextIndex = wrap 
              ? (currentIndex + 1) % focusableElements.length
              : Math.min(currentIndex + 1, focusableElements.length - 1);
          }
          break;
          
        case 'ArrowLeft':
          if (direction === 'horizontal' || direction === 'both') {
            e.preventDefault();
            nextIndex = wrap
              ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
              : Math.max(currentIndex - 1, 0);
          }
          break;
          
        case 'ArrowDown':
          if (direction === 'vertical' || direction === 'both') {
            e.preventDefault();
            nextIndex = wrap
              ? (currentIndex + 1) % focusableElements.length
              : Math.min(currentIndex + 1, focusableElements.length - 1);
          }
          break;
          
        case 'ArrowUp':
          if (direction === 'vertical' || direction === 'both') {
            e.preventDefault();
            nextIndex = wrap
              ? (currentIndex - 1 + focusableElements.length) % focusableElements.length
              : Math.max(currentIndex - 1, 0);
          }
          break;
          
        case 'Home':
          e.preventDefault();
          nextIndex = 0;
          break;
          
        case 'End':
          e.preventDefault();
          nextIndex = focusableElements.length - 1;
          break;
      }

      if (nextIndex !== currentIndex && focusableElements[nextIndex]) {
        focusableElements[nextIndex].focus();
        onNavigate?.(focusableElements[nextIndex], nextIndex);
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  // Focus management for modals and overlays
  trapFocus(container) {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    
    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
}

// Screen reader utilities
export class ScreenReaderUtils {
  constructor() {
    this.announcements = [];
  }

  // Announce text to screen readers
  announce(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);

    this.announcements.push({
      message,
      priority,
      timestamp: Date.now()
    });
  }

  // Announce Turkish text with proper pronunciation hints
  announceTurkish(message, priority = 'polite') {
    // Add language attribute for better pronunciation
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('lang', 'tr');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  }

  // Announce progress updates
  announceProgress(current, total, operation = 'işlem') {
    const percentage = Math.round((current / total) * 100);
    const message = `${operation} ilerlemesi: ${percentage}%, ${current} / ${total} tamamlandı`;
    this.announce(message, 'polite');
  }

  // Announce errors with context
  announceError(error, context = '') {
    const message = `Hata${context ? ` ${context}` : ''}: ${error}`;
    this.announce(message, 'assertive');
  }

  // Get announcement history
  getAnnouncementHistory() {
    return this.announcements;
  }
}

// High contrast theme utilities
export class HighContrastManager {
  constructor() {
    this.isHighContrast = false;
    this.originalStyles = new Map();
  }

  // Toggle high contrast mode
  toggleHighContrast() {
    if (this.isHighContrast) {
      this.disableHighContrast();
    } else {
      this.enableHighContrast();
    }
  }

  // Enable high contrast mode
  enableHighContrast() {
    document.documentElement.classList.add('high-contrast');
    this.isHighContrast = true;
    
    // Store original styles
    const elements = document.querySelectorAll('*');
    elements.forEach(el => {
      const computedStyle = window.getComputedStyle(el);
      this.originalStyles.set(el, {
        backgroundColor: computedStyle.backgroundColor,
        color: computedStyle.color,
        borderColor: computedStyle.borderColor
      });
    });

    // Apply high contrast styles
    this.applyHighContrastStyles();
    
    // Announce change
    screenReaderUtils.announceTurkish('Yüksek kontrast modu etkinleştirildi');
  }

  // Disable high contrast mode
  disableHighContrast() {
    document.documentElement.classList.remove('high-contrast');
    this.isHighContrast = false;
    
    // Restore original styles
    this.originalStyles.forEach((styles, element) => {
      if (element.parentNode) {
        Object.assign(element.style, styles);
      }
    });
    
    this.originalStyles.clear();
    
    // Announce change
    screenReaderUtils.announceTurkish('Yüksek kontrast modu devre dışı bırakıldı');
  }

  // Apply high contrast styles
  applyHighContrastStyles() {
    const style = document.createElement('style');
    style.id = 'high-contrast-styles';
    style.textContent = `
      .high-contrast * {
        background-color: black !important;
        color: white !important;
        border-color: white !important;
      }
      
      .high-contrast button,
      .high-contrast input,
      .high-contrast select,
      .high-contrast textarea {
        background-color: black !important;
        color: white !important;
        border: 2px solid white !important;
      }
      
      .high-contrast button:hover,
      .high-contrast button:focus {
        background-color: white !important;
        color: black !important;
      }
      
      .high-contrast a {
        color: yellow !important;
      }
      
      .high-contrast a:visited {
        color: magenta !important;
      }
      
      .high-contrast .bg-green-50,
      .high-contrast .bg-blue-50,
      .high-contrast .bg-red-50,
      .high-contrast .bg-yellow-50 {
        background-color: black !important;
      }
      
      .high-contrast .text-green-800,
      .high-contrast .text-blue-800,
      .high-contrast .text-red-800,
      .high-contrast .text-yellow-800 {
        color: white !important;
      }
    `;
    
    document.head.appendChild(style);
  }
}

// Focus management utilities
export class FocusManager {
  constructor() {
    this.focusHistory = [];
    this.currentFocusIndex = -1;
  }

  // Save current focus
  saveFocus() {
    const activeElement = document.activeElement;
    if (activeElement && activeElement !== document.body) {
      this.focusHistory.push(activeElement);
      this.currentFocusIndex = this.focusHistory.length - 1;
    }
  }

  // Restore previous focus
  restoreFocus() {
    if (this.focusHistory.length > 0) {
      const elementToFocus = this.focusHistory[this.currentFocusIndex];
      if (elementToFocus && elementToFocus.parentNode) {
        elementToFocus.focus();
        return true;
      }
    }
    return false;
  }

  // Clear focus history
  clearHistory() {
    this.focusHistory = [];
    this.currentFocusIndex = -1;
  }

  // Set focus with announcement
  setFocusWithAnnouncement(element, announcement) {
    if (element) {
      element.focus();
      if (announcement) {
        screenReaderUtils.announceTurkish(announcement);
      }
    }
  }
}

// Create global instances
export const keyboardNavigation = new KeyboardNavigationManager();
export const screenReaderUtils = new ScreenReaderUtils();
export const highContrastManager = new HighContrastManager();
export const focusManager = new FocusManager();

// React hooks for accessibility
export const useAccessibility = () => {
  return {
    generateAriaLabel,
    keyboardNavigation,
    screenReaderUtils,
    highContrastManager,
    focusManager
  };
};

// Accessibility testing utilities
export const testAccessibility = {
  // Check if element has proper ARIA labels
  checkAriaLabels: (element) => {
    const issues = [];
    
    if (!element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby')) {
      issues.push('Element missing aria-label or aria-labelledby');
    }
    
    return issues;
  },

  // Check keyboard accessibility
  checkKeyboardAccess: (element) => {
    const issues = [];
    
    if (element.tabIndex < 0 && !element.getAttribute('aria-hidden')) {
      issues.push('Interactive element not keyboard accessible');
    }
    
    return issues;
  },

  // Check color contrast (basic check)
  checkColorContrast: (element) => {
    const issues = [];
    const style = window.getComputedStyle(element);
    const backgroundColor = style.backgroundColor;
    const color = style.color;
    
    // Basic contrast check (simplified)
    if (backgroundColor === color) {
      issues.push('Poor color contrast detected');
    }
    
    return issues;
  }
};

export default {
  generateAriaLabel,
  KeyboardNavigationManager,
  ScreenReaderUtils,
  HighContrastManager,
  FocusManager,
  keyboardNavigation,
  screenReaderUtils,
  highContrastManager,
  focusManager,
  useAccessibility,
  testAccessibility
};