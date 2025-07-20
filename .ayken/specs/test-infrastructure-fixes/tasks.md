# Test Infrastructure Fixes - Implementation Plan

- [x] 1. Update Vitest Configuration for ES Module Support

  - Update vitest.config.js to properly handle ES module imports and .jsx extensions
  - Configure esbuild target and module resolution settings
  - Add inline dependency configuration for @testing-library/react
  - Test the configuration by running a simple test to verify ES module support
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 5.2, 5.3_

- [ ] 2. Create Centralized Test Setup and Mock System

  - Create src/test/setup.js with global test configuration and browser API mocks
  - Configure UTF-8 encoding support for Turkish character testing
  - Implement centralized mock factory in src/test/mocks/index.js for consistent API mocking
  - Add Turkish character test data samples for comprehensive testing
  - Add test utilities in src/test/utils.js for component rendering with providers
  - Create standardized mock patterns for common hooks and services with Turkish character support
  - Ensure all test mocks handle Turkish characters (ç, ğ, ı, ö, ş, ü) properly
  - _Requirements: 2.1, 2.2, 2.3, 3.1, 3.2, 3.3_

- [-] 3. Fix SchemaValidation Test ES Module Issues

  - Update SchemaValidation.test.jsx to use proper ES module mocks instead of require()
  - Replace direct API service imports with centralized mock implementations
  - Fix component import paths to include .jsx extensions
  - Update test assertions to match actual component DOM structure

  - _Requirements: 1.1, 3.1, 4.1, 4.2_

- [ ] 4. Fix PromptParser Test Logic Issues

  - Debug and fix visualization chart type detection in promptParser.js
  - Update test expectations to match actual parser behavior for complex prompts
  - Fix unrecognized operations test to handle parser's actual response format
  - Add debug logging to understand parser output and adjust tests accordingly
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 5. Standardize All Component Test Files

  - Update all test files to use consistent import statements with .jsx extensions
  - Replace jest references with vitest equivalents (vi.fn(), vi.mock(), etc.)
  - Implement standardized mock patterns across all component tests
  - Fix component rendering tests to use proper test utilities and providers
  - Add Turkish character test scenarios to all relevant component tests
  - Ensure UTF-8 encoding is properly handled in all test files
  - Include Turkish filename and data content testing in file-related components
  - _Requirements: 2.1, 2.2, 3.1, 3.2, 4.1_

- [ ] 6. Fix UndoRedoManager Test Assertions

  - Update text matching in UndoRedoManager tests to handle split text elements
  - Use more flexible text matching strategies (getByText with functions)
  - Fix component prop mocking to match actual component interface
  - Add proper provider wrapping for context-dependent components
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 7. Implement Missing Hook and Service Mocks

  - Create mock implementations for useNotifications hook
  - Add mock implementations for useAuth and authentication-related hooks
  - Create standardized API service mocks that prevent actual HTTP requests
  - Implement localStorage and sessionStorage mocks for browser API testing
  - _Requirements: 2.2, 2.3, 3.1, 3.2_

- [ ] 8. Add Test Environment Validation

  - Create test script to validate all imports resolve correctly
  - Add test to verify mocks are properly intercepting real implementations
  - Implement test coverage reporting to identify untested code paths
  - Add test performance monitoring to identify slow tests
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 9. Update Package Dependencies and Scripts

  - Verify all testing dependencies are properly installed and up to date
  - Update package.json test scripts to use proper vitest configuration
  - Add test:debug script for debugging failing tests
  - Configure test:coverage script for code coverage reporting
  - _Requirements: 2.1, 2.2, 2.3_

- [ ] 10. Create Test Documentation and Best Practices
  - Document the new test setup and mock patterns for team consistency
  - Create examples of proper test structure for different component types
  - Add troubleshooting guide for common test issues
  - Document the mock factory usage and extension patterns
  - _Requirements: All requirements - documentation and maintenance_
