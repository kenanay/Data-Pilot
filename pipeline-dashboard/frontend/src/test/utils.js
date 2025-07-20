/*
Test Utilities for Component Testing

Author: Kiro AI Assistant
Project: Data Pipeline Dashboard Test Infrastructure
*/

import React from 'react'
import { render } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * Test wrapper component that provides necessary context
 */
const TestWrapper = ({ children }) => {
  return (
    <div data-testid="test-wrapper">
      {children}
    </div>
  )
}

/**
 * Complete test wrapper with all providers
 */
const AllProvidersWrapper = ({ children }) => {
  return (
    <div data-testid="all-providers-wrapper">
      <div data-testid="auth-provider">
        <div data-testid="toast-provider">
          <div data-testid="theme-provider">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Enhanced render function with providers
 */
export const renderWithProviders = (component, options = {}) => {
  const { wrapper = TestWrapper, ...renderOptions } = options
  
  return render(component, {
    wrapper,
    ...renderOptions
  })
}

/**
 * Render component with toast provider context
 */
export const renderWithToast = (component, options = {}) => {
  const ToastWrapper = ({ children }) => (
    <div data-testid="toast-provider">
      {children}
    </div>
  )
  
  return renderWithProviders(component, {
    wrapper: ToastWrapper,
    ...options
  })
}

/**
 * Render component with auth provider context
 */
export const renderWithAuth = (component, options = {}) => {
  const AuthWrapper = ({ children }) => (
    <div data-testid="auth-provider">
      {children}
    </div>
  )
  
  return renderWithProviders(component, {
    wrapper: AuthWrapper,
    ...options
  })
}

/**
 * Render component with all providers (auth, toast, theme, etc.)
 */
export const renderWithAllProviders = (component, options = {}) => {
  return renderWithProviders(component, {
    wrapper: AllProvidersWrapper,
    ...options
  })
}

/**
 * Render component with pipeline context
 */
export const renderWithPipeline = (component, options = {}) => {
  const PipelineWrapper = ({ children }) => (
    <div data-testid="pipeline-provider">
      {children}
    </div>
  )
  
  return renderWithProviders(component, {
    wrapper: PipelineWrapper,
    ...options
  })
}

/**
 * Create mock event objects for testing
 */
export const createMockEvent = (type = 'click', properties = {}) => ({
  type,
  preventDefault: vi.fn(),
  stopPropagation: vi.fn(),
  target: {
    value: '',
    checked: false,
    ...properties.target
  },
  currentTarget: {
    value: '',
    ...properties.currentTarget
  },
  ...properties
})

/**
 * Create mock file objects for file upload testing
 */
export const createMockFile = (name = 'test.csv', type = 'text/csv', size = 1024) => {
  const file = new File(['test,data\n1,value'], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

/**
 * Wait for async operations in tests
 */
export const waitForAsync = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = { ...console }
  
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
  console.info = vi.fn()
  
  return {
    restore: () => {
      Object.assign(console, originalConsole)
    }
  }
}

/**
 * Create mock intersection observer for testing
 */
export const createMockIntersectionObserver = () => {
  const mockIntersectionObserver = vi.fn()
  mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })
  
  window.IntersectionObserver = mockIntersectionObserver
  return mockIntersectionObserver
}

/**
 * Create mock resize observer for testing
 */
export const createMockResizeObserver = () => {
  const mockResizeObserver = vi.fn()
  mockResizeObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  })
  
  window.ResizeObserver = mockResizeObserver
  return mockResizeObserver
}

/**
 * Setup common test environment
 */
export const setupTestEnvironment = () => {
  // Mock browser APIs
  createMockIntersectionObserver()
  createMockResizeObserver()
  
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
  
  // Mock URL.createObjectURL
  global.URL.createObjectURL = vi.fn(() => 'mock-object-url')
  global.URL.revokeObjectURL = vi.fn()
  
  return {
    cleanup: () => {
      vi.clearAllMocks()
    }
  }
}

export default {
  renderWithProviders,
  renderWithToast,
  renderWithAuth,
  renderWithAllProviders,
  renderWithPipeline,
  createMockEvent,
  createMockFile,
  waitForAsync,
  mockConsole,
  setupTestEnvironment
}