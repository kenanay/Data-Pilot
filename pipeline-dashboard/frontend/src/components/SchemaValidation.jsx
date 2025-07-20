/*
Data Pipeline Dashboard - Schema Validation Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api.js';

const SchemaValidation = ({ 
  fileId, 
  sessionId,
  onValidationComplete,
  onError 
}) => {
  const [columnInfo, setColumnInfo] = useState([]);
  const [validationResults, setValidationResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('json-schema');
  const [schemaConfig, setSchemaConfig] = useState({
    type: 'json-schema',
    schema: '',
    custom_rules: [],
    validation_level: 'strict'
  });

  // Predefined schema templates
  const schemaTemplates = {
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
          currency: { type: 'string', enum: ['USD', 'EUR', 'GBP'] }
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
          age: { type: 'integer', minimum: 0, maximum: 150 }
        },
        required: ['name', 'email']
      }
    }
  };

  // Custom validation rule types
  const ruleTypes = {
    'not-null': {
      name: 'Not Null',
      description: 'Column must not contain null values',
      parameters: []
    },
    'unique': {
      name: 'Unique Values',
      description: 'All values in column must be unique',
      parameters: []
    },
    'range': {
      name: 'Value Range',
      description: 'Values must be within specified range',
      parameters: ['min', 'max']
    },
    'pattern': {
      name: 'Pattern Match',
      description: 'Values must match regular expression pattern',
      parameters: ['pattern']
    },
    'enum': {
      name: 'Allowed Values',
      description: 'Values must be from predefined list',
      parameters: ['values']
    },
    'length': {
      name: 'String Length',
      description: 'String length must be within limits',
      parameters: ['min_length', 'max_length']
    }
  };

  // Fetch column information
  useEffect(() => {
    if (!fileId) return;

    const fetchColumnInfo = async () => {
      try {
        const response = await ApiService.previewData(fileId);
        if (response.summary?.columns) {
          setColumnInfo(response.summary.columns);
          
          // Auto-generate basic schema from columns
          if (!schemaConfig.schema) {
            generateBasicSchema(response.summary.columns);
          }
        }
      } catch (err) {
        console.error('Failed to fetch column info:', err);
        setError(err.message || 'Failed to load column information');
      }
    };

    fetchColumnInfo();
  }, [fileId]);

  // Generate basic schema from column information
  const generateBasicSchema = (columns) => {
    const properties = {};
    const required = [];

    columns.forEach(col => {
      const dataType = col.data_type?.toLowerCase();
      const property = {};
      
      // Set basic type
      if (dataType?.includes('int') || dataType?.includes('integer')) {
        property.type = 'integer';
        if (col.min_value !== undefined) property.minimum = col.min_value;
        if (col.max_value !== undefined) property.maximum = col.max_value;
      } else if (dataType?.includes('float') || dataType?.includes('number')) {
        property.type = 'number';
        if (col.min_value !== undefined) property.minimum = col.min_value;
        if (col.max_value !== undefined) property.maximum = col.max_value;
      } else if (dataType?.includes('bool')) {
        property.type = 'boolean';
      } else if (dataType?.includes('date')) {
        property.type = 'string';
        property.format = 'date';
      } else {
        property.type = 'string';
        if (col.max_length) property.maxLength = col.max_length;
        if (col.min_length) property.minLength = col.min_length;
      }

      // Add pattern for common formats
      if (col.name.toLowerCase().includes('email')) {
        property.format = 'email';
      } else if (col.name.toLowerCase().includes('url')) {
        property.format = 'uri';
      } else if (col.name.toLowerCase().includes('phone')) {
        property.pattern = '^[+]?[1-9]?[0-9]{7,15}$';
      }

      // Add enum for low cardinality columns
      if (col.unique_values && col.unique_values.length <= 10 && col.unique_values.length > 1) {
        property.enum = col.unique_values;
      }

      properties[col.name] = property;

      // Add as required if has low null count
      if (col.null_count === 0 || (col.null_count / (col.non_null_count || 1)) < 0.1) {
        required.push(col.name);
      }
    });

    const basicSchema = {
      type: 'object',
      properties,
      required,
      additionalProperties: false
    };

    setSchemaConfig(prev => ({
      ...prev,
      schema: JSON.stringify(basicSchema, null, 2)
    }));
  };

  // Generate smart schema suggestions based on data patterns
  const generateSmartSchema = () => {
    const suggestions = [];
    
    columnInfo.forEach(col => {
      const colName = col.name.toLowerCase();
      const dataType = col.data_type?.toLowerCase();
      
      // Suggest patterns based on column names and data
      if (colName.includes('email') && dataType?.includes('string')) {
        suggestions.push({
          column: col.name,
          suggestion: 'Email format validation',
          schema: { type: 'string', format: 'email' }
        });
      }
      
      if (colName.includes('age') && (dataType?.includes('int') || dataType?.includes('number'))) {
        suggestions.push({
          column: col.name,
          suggestion: 'Age range validation (0-150)',
          schema: { type: 'integer', minimum: 0, maximum: 150 }
        });
      }
      
      if (colName.includes('price') || colName.includes('amount') || colName.includes('cost')) {
        suggestions.push({
          column: col.name,
          suggestion: 'Positive number validation',
          schema: { type: 'number', minimum: 0 }
        });
      }
      
      if (colName.includes('id') && dataType?.includes('string')) {
        suggestions.push({
          column: col.name,
          suggestion: 'UUID format validation',
          schema: { type: 'string', pattern: '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' }
        });
      }
      
      // High null count suggests optional field
      if (col.null_count && col.null_count / (col.non_null_count || 1) > 0.3) {
        suggestions.push({
          column: col.name,
          suggestion: 'High null count - consider making optional',
          schema: { nullable: true }
        });
      }
    });
    
    return suggestions;
  };

  // Apply schema suggestion
  const applySchemaSuggestion = (suggestion) => {
    try {
      const currentSchema = JSON.parse(schemaConfig.schema || '{"type":"object","properties":{},"required":[]}');
      
      if (!currentSchema.properties) {
        currentSchema.properties = {};
      }
      
      // Merge suggestion into current schema
      currentSchema.properties[suggestion.column] = {
        ...currentSchema.properties[suggestion.column],
        ...suggestion.schema
      };
      
      setSchemaConfig(prev => ({
        ...prev,
        schema: JSON.stringify(currentSchema, null, 2)
      }));
    } catch (error) {
      console.error('Failed to apply suggestion:', error);
    }
  };

  // Load schema template
  const loadTemplate = (templateKey) => {
    const template = schemaTemplates[templateKey];
    if (template) {
      setSchemaConfig(prev => ({
        ...prev,
        schema: JSON.stringify(template.schema, null, 2)
      }));
    }
  };

  // Add custom validation rule
  const addCustomRule = () => {
    const newRule = {
      id: Date.now(),
      column: '',
      rule_type: 'not-null',
      parameters: {},
      enabled: true
    };

    setSchemaConfig(prev => ({
      ...prev,
      custom_rules: [...prev.custom_rules, newRule]
    }));
  };

  // Update custom rule
  const updateCustomRule = (ruleId, updates) => {
    setSchemaConfig(prev => ({
      ...prev,
      custom_rules: prev.custom_rules.map(rule =>
        rule.id === ruleId ? { ...rule, ...updates } : rule
      )
    }));
  };

  // Remove custom rule
  const removeCustomRule = (ruleId) => {
    setSchemaConfig(prev => ({
      ...prev,
      custom_rules: prev.custom_rules.filter(rule => rule.id !== ruleId)
    }));
  };

  // Validate schema syntax
  const validateSchemaFormat = () => {
    if (activeTab === 'json-schema') {
      try {
        JSON.parse(schemaConfig.schema);
        return { valid: true };
      } catch (err) {
        return { valid: false, error: `Invalid JSON: ${err.message}` };
      }
    }
    return { valid: true };
  };

  // Run validation
  const runValidation = async () => {
    const schemaValidation = validateSchemaFormat();
    if (!schemaValidation.valid) {
      setError(schemaValidation.error);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.validateSchema(sessionId, fileId, {
        validation_type: schemaConfig.type,
        schema: activeTab === 'json-schema' ? JSON.parse(schemaConfig.schema) : undefined,
        custom_rules: activeTab === 'custom-rules' ? schemaConfig.custom_rules : undefined,
        validation_level: schemaConfig.validation_level,
        options: {
          max_errors: 100,
          sample_errors: true
        }
      });

      const newValidation = {
        id: Date.now(),
        config: { ...schemaConfig, type: activeTab },
        result: response,
        created_at: new Date().toISOString()
      };

      setValidationResults(prev => [...prev, newValidation]);
      onValidationComplete?.(response);

    } catch (err) {
      console.error('Failed to validate schema:', err);
      const errorMessage = err.message || 'Failed to validate schema';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove validation result
  const removeValidation = (validationId) => {
    setValidationResults(prev => prev.filter(val => val.id !== validationId));
  };

  // Get validation status color
  const getValidationStatusColor = (result) => {
    if (!result) return 'text-gray-500';
    
    const errorCount = result.total_errors || 0;
    const totalRows = result.total_rows || 1;
    const errorRate = errorCount / totalRows;

    if (errorRate === 0) return 'text-green-600';
    if (errorRate < 0.05) return 'text-yellow-600';
    return 'text-red-600';
  };

  // JSON Schema Tab
  const JsonSchemaTab = () => (
    <div className="space-y-6">
      {/* Schema Templates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Schema Templates</label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {Object.entries(schemaTemplates).map(([key, template]) => (
            <button
              key={key}
              onClick={() => loadTemplate(key)}
              className="p-3 border border-gray-300 rounded-lg text-left hover:border-gray-400 hover:bg-gray-50 transition-all"
            >
              <div className="font-medium text-sm text-gray-900">{template.name}</div>
              <div className="text-xs text-gray-500 mt-1">{template.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Schema Editor */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">JSON Schema</label>
        <textarea
          value={schemaConfig.schema}
          onChange={(e) => setSchemaConfig(prev => ({ ...prev, schema: e.target.value }))}
          placeholder="Enter JSON Schema..."
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
        <div className="mt-2 text-xs text-gray-500">
          Define your data structure using JSON Schema format. 
          <a href="https://json-schema.org/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 ml-1">
            Learn more about JSON Schema
          </a>
        </div>
      </div>
    </div>
  );

  // Smart Suggestions Tab
  const SmartSuggestionsTab = () => {
    const suggestions = generateSmartSchema();
    
    return (
      <div className="space-y-6">
        {/* Auto-Generate Schema Button */}
        <div className="flex justify-between items-center">
          <div>
            <h4 className="font-medium text-gray-900">Smart Schema Suggestions</h4>
            <p className="text-sm text-gray-600 mt-1">
              AI-powered suggestions based on your data patterns and column names
            </p>
          </div>
          <button
            onClick={() => generateBasicSchema(columnInfo)}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
          >
            🤖 Auto-Generate Schema
          </button>
        </div>

        {/* Column Analysis */}
        <div>
          <h5 className="font-medium text-gray-700 mb-3">Column Analysis</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {columnInfo.map(col => (
              <div key={col.name} className="border border-gray-200 rounded-lg p-3">
                <div className="font-medium text-sm text-gray-900 mb-2">{col.name}</div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div>Type: <span className="font-medium">{col.data_type}</span></div>
                  <div>Null Count: <span className="font-medium">{col.null_count || 0}</span></div>
                  <div>Non-Null: <span className="font-medium">{col.non_null_count || 0}</span></div>
                  {col.unique_values && (
                    <div>Unique Values: <span className="font-medium">{col.unique_values.length}</span></div>
                  )}
                  {col.min_value !== undefined && (
                    <div>Range: <span className="font-medium">{col.min_value} - {col.max_value}</span></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions List */}
        {suggestions.length > 0 ? (
          <div>
            <h5 className="font-medium text-gray-700 mb-3">
              Validation Suggestions ({suggestions.length})
            </h5>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-blue-600">💡</span>
                      <span className="font-medium text-blue-900">{suggestion.column}</span>
                    </div>
                    <button
                      onClick={() => applySchemaSuggestion(suggestion)}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                    >
                      Apply
                    </button>
                  </div>
                  <div className="text-sm text-blue-800 mb-2">{suggestion.suggestion}</div>
                  <div className="text-xs text-blue-700 font-mono bg-blue-100 p-2 rounded">
                    {JSON.stringify(suggestion.schema, null, 2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <div className="text-2xl mb-2">🔍</div>
            <p>No specific suggestions found</p>
            <p className="text-sm mt-1">Your data looks well-structured!</p>
          </div>
        )}

        {/* Data Quality Insights */}
        <div>
          <h5 className="font-medium text-gray-700 mb-3">Data Quality Insights</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Completeness */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h6 className="font-medium text-gray-900 mb-2">📊 Data Completeness</h6>
              {columnInfo.map(col => {
                const completeness = col.non_null_count / (col.non_null_count + (col.null_count || 0)) * 100;
                return (
                  <div key={col.name} className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{col.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            completeness >= 95 ? 'bg-green-500' : 
                            completeness >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${completeness}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-600 w-10">{completeness.toFixed(0)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Data Types */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h6 className="font-medium text-gray-900 mb-2">🏷️ Data Types</h6>
              <div className="space-y-2">
                {Object.entries(
                  columnInfo.reduce((acc, col) => {
                    const type = col.data_type || 'unknown';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 capitalize">{type}</span>
                    <span className="text-gray-600">{count} columns</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Custom Rules Tab
  const CustomRulesTab = () => (
    <div className="space-y-6">
      {/* Add Rule Button */}
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-gray-900">Custom Validation Rules</h4>
        <button
          onClick={addCustomRule}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
        >
          + Add Rule
        </button>
      </div>

      {/* Rules List */}
      {schemaConfig.custom_rules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-2xl mb-2">📋</div>
          <p>No custom rules defined</p>
          <p className="text-sm mt-1">Add rules to validate your data</p>
        </div>
      ) : (
        <div className="space-y-4">
          {schemaConfig.custom_rules.map((rule) => (
            <div key={rule.id} className="border border-gray-300 rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                {/* Column Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Column</label>
                  <select
                    value={rule.column}
                    onChange={(e) => updateCustomRule(rule.id, { column: e.target.value })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select column...</option>
                    {columnInfo.map(col => (
                      <option key={col.name} value={col.name}>{col.name}</option>
                    ))}
                  </select>
                </div>

                {/* Rule Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Rule Type</label>
                  <select
                    value={rule.rule_type}
                    onChange={(e) => updateCustomRule(rule.id, { 
                      rule_type: e.target.value,
                      parameters: {} // Reset parameters when rule type changes
                    })}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(ruleTypes).map(([key, ruleType]) => (
                      <option key={key} value={key}>{ruleType.name}</option>
                    ))}
                  </select>
                </div>

                {/* Enable/Disable */}
                <div className="flex items-center">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={rule.enabled}
                      onChange={(e) => updateCustomRule(rule.id, { enabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">Enabled</span>
                  </label>
                </div>

                {/* Remove Button */}
                <div className="flex items-center">
                  <button
                    onClick={() => removeCustomRule(rule.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>
              </div>

              {/* Rule Parameters */}
              {ruleTypes[rule.rule_type]?.parameters.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ruleTypes[rule.rule_type].parameters.map(param => (
                    <div key={param}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {param.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </label>
                      <input
                        type="text"
                        value={rule.parameters[param] || ''}
                        onChange={(e) => updateCustomRule(rule.id, {
                          parameters: { ...rule.parameters, [param]: e.target.value }
                        })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder={`Enter ${param}...`}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Rule Description */}
              <div className="mt-2 text-xs text-gray-500">
                {ruleTypes[rule.rule_type]?.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (columnInfo.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading column information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Schema Validation</h3>
        <p className="text-sm text-gray-600">
          Validate your data against schemas and custom rules to ensure quality and compliance
        </p>
      </div>

      {/* Validation Type Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'json-schema', label: '📋 JSON Schema' },
            { id: 'custom-rules', label: '⚙️ Custom Rules' },
            { id: 'suggestions', label: '💡 Smart Suggestions' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Configuration Section */}
      <div className="p-6 border-b bg-gray-50">
        {/* Validation Level */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Validation Level</label>
          <select
            value={schemaConfig.validation_level}
            onChange={(e) => setSchemaConfig(prev => ({ ...prev, validation_level: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="strict">Strict - Fail on any validation error</option>
            <option value="warning">Warning - Report errors but continue</option>
            <option value="lenient">Lenient - Only report critical errors</option>
          </select>
        </div>

        {/* Tab Content */}
        {activeTab === 'json-schema' && <JsonSchemaTab />}
        {activeTab === 'custom-rules' && <CustomRulesTab />}
        {activeTab === 'suggestions' && <SmartSuggestionsTab />}

        {/* Validate Button */}
        <div className="mt-6">
          <button
            onClick={runValidation}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Validating...' : 'Run Validation'}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-2">
              <div className="text-red-500 text-sm">❌</div>
              <div>
                <p className="text-red-800 text-sm font-medium">Validation Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Validation Results */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">
          Validation Results ({validationResults.length})
        </h4>

        {validationResults.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">✅</div>
            <p>No validations run yet</p>
            <p className="text-sm mt-1">Configure and run validation above</p>
          </div>
        ) : (
          <div className="space-y-6">
            {validationResults.map((validation) => (
              <div key={validation.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {validation.result?.is_valid ? '✅' : '❌'}
                    </span>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {validation.config.type === 'json-schema' ? 'JSON Schema' : 'Custom Rules'} Validation
                      </h5>
                      <p className="text-sm text-gray-600">
                        {validation.result?.is_valid ? 'Passed' : 'Failed'} • 
                        {new Date(validation.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeValidation(validation.id)}
                    className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  >
                    🗑️
                  </button>
                </div>

                {/* Validation Summary */}
                {validation.result && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-900">
                        {validation.result.total_rows || 0}
                      </div>
                      <div className="text-xs text-gray-600">Total Rows</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className="text-lg font-bold text-gray-900">
                        {validation.result.valid_rows || 0}
                      </div>
                      <div className="text-xs text-gray-600">Valid Rows</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className={`text-lg font-bold ${getValidationStatusColor(validation.result)}`}>
                        {validation.result.total_errors || 0}
                      </div>
                      <div className="text-xs text-gray-600">Errors</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded">
                      <div className={`text-lg font-bold ${getValidationStatusColor(validation.result)}`}>
                        {validation.result.total_rows ? 
                          `${(((validation.result.valid_rows || 0) / validation.result.total_rows) * 100).toFixed(1)}%` : 
                          '0%'
                        }
                      </div>
                      <div className="text-xs text-gray-600">Success Rate</div>
                    </div>
                  </div>
                )}

                {/* Error Details */}
                {validation.result?.errors && validation.result.errors.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">
                      Validation Errors ({validation.result.errors.length})
                    </h6>
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {validation.result.errors.slice(0, 10).map((error, index) => (
                        <div key={index} className="p-2 bg-red-50 border border-red-200 rounded text-sm">
                          <div className="font-medium text-red-800">
                            Row {error.row_index + 1}, Column: {error.column}
                          </div>
                          <div className="text-red-700">{error.message}</div>
                          {error.value !== undefined && (
                            <div className="text-red-600 text-xs mt-1">
                              Value: {JSON.stringify(error.value)}
                            </div>
                          )}
                        </div>
                      ))}
                      {validation.result.errors.length > 10 && (
                        <div className="text-center text-sm text-gray-500">
                          ... and {validation.result.errors.length - 10} more errors
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaValidation;