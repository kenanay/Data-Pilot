/*
Data Pipeline Dashboard - Schema Validation Utilities

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

/**
 * Schema validation utility functions
 */

// Common data type patterns
export const DATA_TYPE_PATTERNS = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[+]?[1-9]?[0-9]{7,15}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  ipv4: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
  date: /^\d{4}-\d{2}-\d{2}$/,
  time: /^\d{2}:\d{2}:\d{2}$/,
  datetime: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
};

// Common schema templates
export const SCHEMA_TEMPLATES = {
  'basic-data': {
    name: 'Basic Data Validation',
    description: 'Common data quality checks',
    schema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: true
    }
  },
  'financial-data': {
    name: 'Financial Data',
    description: 'Financial data with amount and date validation',
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', minimum: 0 },
        date: { type: 'string', format: 'date' },
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'JPY'] },
        transaction_id: { type: 'string', pattern: '^[A-Z0-9]{8,16}$' }
      },
      required: ['amount', 'date']
    }
  },
  'user-data': {
    name: 'User Data',
    description: 'User information with email and age validation',
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        email: { type: 'string', format: 'email' },
        age: { type: 'integer', minimum: 0, maximum: 150 },
        phone: { type: 'string', pattern: '^[+]?[1-9]?[0-9]{7,15}$' }
      },
      required: ['name', 'email']
    }
  },
  'product-data': {
    name: 'Product Data',
    description: 'E-commerce product information',
    schema: {
      type: 'object',
      properties: {
        sku: { type: 'string', pattern: '^[A-Z0-9-]{6,20}$' },
        name: { type: 'string', minLength: 1, maxLength: 200 },
        price: { type: 'number', minimum: 0 },
        category: { type: 'string', minLength: 1 },
        in_stock: { type: 'boolean' },
        weight: { type: 'number', minimum: 0 }
      },
      required: ['sku', 'name', 'price']
    }
  },
  'log-data': {
    name: 'Log Data',
    description: 'Application log entries',
    schema: {
      type: 'object',
      properties: {
        timestamp: { type: 'string', format: 'date-time' },
        level: { type: 'string', enum: ['DEBUG', 'INFO', 'WARN', 'ERROR'] },
        message: { type: 'string', minLength: 1 },
        source: { type: 'string' },
        user_id: { type: 'string' }
      },
      required: ['timestamp', 'level', 'message']
    }
  }
};

// Custom validation rule types
export const VALIDATION_RULE_TYPES = {
  'not-null': {
    name: 'Not Null',
    description: 'Column must not contain null values',
    parameters: [],
    validate: (value) => value !== null && value !== undefined && value !== ''
  },
  'unique': {
    name: 'Unique Values',
    description: 'All values in column must be unique',
    parameters: [],
    validate: (value, allValues) => {
      const occurrences = allValues.filter(v => v === value).length;
      return occurrences === 1;
    }
  },
  'range': {
    name: 'Value Range',
    description: 'Values must be within specified range',
    parameters: ['min', 'max'],
    validate: (value, _, params) => {
      const num = parseFloat(value);
      if (isNaN(num)) return false;
      const min = parseFloat(params.min);
      const max = parseFloat(params.max);
      return num >= min && num <= max;
    }
  },
  'pattern': {
    name: 'Pattern Match',
    description: 'Values must match regular expression pattern',
    parameters: ['pattern'],
    validate: (value, _, params) => {
      try {
        const regex = new RegExp(params.pattern);
        return regex.test(String(value));
      } catch {
        return false;
      }
    }
  },
  'enum': {
    name: 'Allowed Values',
    description: 'Values must be from predefined list',
    parameters: ['values'],
    validate: (value, _, params) => {
      const allowedValues = params.values.split(',').map(v => v.trim());
      return allowedValues.includes(String(value));
    }
  },
  'length': {
    name: 'String Length',
    description: 'String length must be within limits',
    parameters: ['min_length', 'max_length'],
    validate: (value, _, params) => {
      const str = String(value);
      const minLen = parseInt(params.min_length) || 0;
      const maxLen = parseInt(params.max_length) || Infinity;
      return str.length >= minLen && str.length <= maxLen;
    }
  },
  'email': {
    name: 'Email Format',
    description: 'Value must be a valid email address',
    parameters: [],
    validate: (value) => DATA_TYPE_PATTERNS.email.test(String(value))
  },
  'url': {
    name: 'URL Format',
    description: 'Value must be a valid URL',
    parameters: [],
    validate: (value) => DATA_TYPE_PATTERNS.url.test(String(value))
  },
  'phone': {
    name: 'Phone Number',
    description: 'Value must be a valid phone number',
    parameters: [],
    validate: (value) => DATA_TYPE_PATTERNS.phone.test(String(value))
  }
};

/**
 * Detect data type from column information
 * @param {Object} column - Column information
 * @returns {string} - Detected data type
 */
export const detectDataType = (column) => {
  const dataType = column.data_type?.toLowerCase();
  const colName = column.name.toLowerCase();
  
  // Check for specific patterns in column names
  if (colName.includes('email')) return 'email';
  if (colName.includes('phone') || colName.includes('tel')) return 'phone';
  if (colName.includes('url') || colName.includes('link')) return 'url';
  if (colName.includes('id') && dataType?.includes('string')) return 'uuid';
  if (colName.includes('date') || colName.includes('time')) return 'datetime';
  if (colName.includes('age')) return 'integer';
  if (colName.includes('price') || colName.includes('amount') || colName.includes('cost')) return 'currency';
  
  // Use actual data type
  if (dataType?.includes('int')) return 'integer';
  if (dataType?.includes('float') || dataType?.includes('number')) return 'number';
  if (dataType?.includes('bool')) return 'boolean';
  if (dataType?.includes('date')) return 'date';
  
  return 'string';
};

/**
 * Generate JSON Schema property for a column
 * @param {Object} column - Column information
 * @returns {Object} - JSON Schema property
 */
export const generateSchemaProperty = (column) => {
  const detectedType = detectDataType(column);
  const property = {};
  
  switch (detectedType) {
    case 'integer':
      property.type = 'integer';
      if (column.min_value !== undefined) property.minimum = column.min_value;
      if (column.max_value !== undefined) property.maximum = column.max_value;
      break;
      
    case 'number':
    case 'currency':
      property.type = 'number';
      if (column.min_value !== undefined) property.minimum = column.min_value;
      if (column.max_value !== undefined) property.maximum = column.max_value;
      if (detectedType === 'currency') property.minimum = 0;
      break;
      
    case 'boolean':
      property.type = 'boolean';
      break;
      
    case 'date':
    case 'datetime':
      property.type = 'string';
      property.format = detectedType === 'date' ? 'date' : 'date-time';
      break;
      
    case 'email':
      property.type = 'string';
      property.format = 'email';
      break;
      
    case 'url':
      property.type = 'string';
      property.format = 'uri';
      break;
      
    case 'phone':
      property.type = 'string';
      property.pattern = DATA_TYPE_PATTERNS.phone.source;
      break;
      
    case 'uuid':
      property.type = 'string';
      property.pattern = DATA_TYPE_PATTERNS.uuid.source;
      break;
      
    default:
      property.type = 'string';
      if (column.max_length) property.maxLength = column.max_length;
      if (column.min_length) property.minLength = column.min_length;
  }
  
  // Add enum for low cardinality columns
  if (column.unique_values && column.unique_values.length <= 10 && column.unique_values.length > 1) {
    property.enum = column.unique_values;
  }
  
  return property;
};

/**
 * Generate smart schema suggestions
 * @param {Array} columns - Array of column information
 * @returns {Array} - Array of suggestions
 */
export const generateSmartSuggestions = (columns) => {
  const suggestions = [];
  
  columns.forEach(col => {
    const colName = col.name.toLowerCase();
    const dataType = col.data_type?.toLowerCase();
    const nullRate = col.null_count / (col.non_null_count + col.null_count);
    
    // Email validation suggestion
    if (colName.includes('email') && dataType?.includes('string')) {
      suggestions.push({
        column: col.name,
        suggestion: 'Email format validation',
        priority: 'high',
        schema: { type: 'string', format: 'email' }
      });
    }
    
    // Age range validation
    if (colName.includes('age') && (dataType?.includes('int') || dataType?.includes('number'))) {
      suggestions.push({
        column: col.name,
        suggestion: 'Age range validation (0-150)',
        priority: 'medium',
        schema: { type: 'integer', minimum: 0, maximum: 150 }
      });
    }
    
    // Price/amount validation
    if ((colName.includes('price') || colName.includes('amount') || colName.includes('cost')) && 
        (dataType?.includes('number') || dataType?.includes('float'))) {
      suggestions.push({
        column: col.name,
        suggestion: 'Positive number validation',
        priority: 'high',
        schema: { type: 'number', minimum: 0 }
      });
    }
    
    // ID format validation
    if (colName.includes('id') && dataType?.includes('string')) {
      suggestions.push({
        column: col.name,
        suggestion: 'UUID format validation',
        priority: 'medium',
        schema: { type: 'string', pattern: DATA_TYPE_PATTERNS.uuid.source }
      });
    }
    
    // Phone number validation
    if ((colName.includes('phone') || colName.includes('tel')) && dataType?.includes('string')) {
      suggestions.push({
        column: col.name,
        suggestion: 'Phone number format validation',
        priority: 'medium',
        schema: { type: 'string', pattern: DATA_TYPE_PATTERNS.phone.source }
      });
    }
    
    // High null count suggestion
    if (nullRate > 0.3) {
      suggestions.push({
        column: col.name,
        suggestion: `High null count (${(nullRate * 100).toFixed(1)}%) - consider making optional`,
        priority: 'low',
        schema: { nullable: true }
      });
    }
    
    // Low cardinality enum suggestion
    if (col.unique_values && col.unique_values.length <= 5 && col.unique_values.length > 1) {
      suggestions.push({
        column: col.name,
        suggestion: `Limited values detected - consider enum constraint`,
        priority: 'medium',
        schema: { enum: col.unique_values }
      });
    }
  });
  
  // Sort by priority
  const priorityOrder = { high: 3, medium: 2, low: 1 };
  return suggestions.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
};

/**
 * Validate JSON Schema format
 * @param {string} schemaString - JSON Schema as string
 * @returns {Object} - Validation result
 */
export const validateSchemaFormat = (schemaString) => {
  try {
    const schema = JSON.parse(schemaString);
    
    // Basic schema structure validation
    if (typeof schema !== 'object') {
      return { valid: false, error: 'Schema must be an object' };
    }
    
    if (!schema.type) {
      return { valid: false, error: 'Schema must have a type property' };
    }
    
    if (schema.type === 'object' && !schema.properties) {
      return { valid: false, error: 'Object schema must have properties' };
    }
    
    return { valid: true, schema };
  } catch (err) {
    return { valid: false, error: `Invalid JSON: ${err.message}` };
  }
};

/**
 * Calculate data quality metrics
 * @param {Array} columns - Array of column information
 * @returns {Object} - Quality metrics
 */
export const calculateDataQuality = (columns) => {
  const metrics = {
    completeness: {},
    dataTypes: {},
    uniqueness: {},
    overall: {
      totalColumns: columns.length,
      completeColumns: 0,
      averageCompleteness: 0
    }
  };
  
  let totalCompleteness = 0;
  
  columns.forEach(col => {
    const totalRows = col.non_null_count + (col.null_count || 0);
    const completeness = totalRows > 0 ? (col.non_null_count / totalRows) * 100 : 0;
    
    metrics.completeness[col.name] = {
      percentage: completeness,
      nullCount: col.null_count || 0,
      nonNullCount: col.non_null_count || 0
    };
    
    if (completeness >= 95) {
      metrics.overall.completeColumns++;
    }
    
    totalCompleteness += completeness;
    
    // Data type distribution
    const dataType = col.data_type || 'unknown';
    metrics.dataTypes[dataType] = (metrics.dataTypes[dataType] || 0) + 1;
    
    // Uniqueness
    if (col.unique_values) {
      metrics.uniqueness[col.name] = {
        uniqueCount: col.unique_values.length,
        totalCount: col.non_null_count,
        uniquenessRatio: col.non_null_count > 0 ? col.unique_values.length / col.non_null_count : 0
      };
    }
  });
  
  metrics.overall.averageCompleteness = columns.length > 0 ? totalCompleteness / columns.length : 0;
  
  return metrics;
};

export default {
  DATA_TYPE_PATTERNS,
  SCHEMA_TEMPLATES,
  VALIDATION_RULE_TYPES,
  detectDataType,
  generateSchemaProperty,
  generateSmartSuggestions,
  validateSchemaFormat,
  calculateDataQuality
};