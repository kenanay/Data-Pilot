/*
Data Pipeline Dashboard - Data Cleaning Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const DataCleaning = ({ 
  fileId, 
  sessionId,
  onCleaningComplete,
  onError 
}) => {
  const [columnInfo, setColumnInfo] = useState([]);
  const [cleaningOperations, setCleaningOperations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cleaningPreview, setCleaningPreview] = useState(null);
  const [activeTab, setActiveTab] = useState('missing');

  // Fetch column information for cleaning options
  useEffect(() => {
    if (!fileId) return;

    const fetchColumnInfo = async () => {
      try {
        const response = await ApiService.previewData(fileId);
        if (response.summary?.columns) {
          setColumnInfo(response.summary.columns);
        }
      } catch (err) {
        console.error('Failed to fetch column info:', err);
        setError(err.message || 'Failed to load column information');
      }
    };

    fetchColumnInfo();
  }, [fileId]);

  // Add cleaning operation
  const addCleaningOperation = (operation) => {
    setCleaningOperations(prev => [...prev, { ...operation, id: Date.now() }]);
  };

  // Remove cleaning operation
  const removeCleaningOperation = (operationId) => {
    setCleaningOperations(prev => prev.filter(op => op.id !== operationId));
  };

  // Preview cleaning operations
  const previewCleaning = async () => {
    if (cleaningOperations.length === 0) {
      setError('Please add at least one cleaning operation');
      return;
    }

    setPreviewLoading(true);
    setError(null);

    try {
      const response = await ApiService.cleanData(sessionId, fileId, {
        operations: cleaningOperations,
        preview_only: true
      });
      setCleaningPreview(response);
    } catch (err) {
      console.error('Failed to preview cleaning:', err);
      setError(err.message || 'Failed to preview cleaning operations');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Apply cleaning operations
  const applyCleaning = async () => {
    if (cleaningOperations.length === 0) {
      setError('Please add at least one cleaning operation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.cleanData(sessionId, fileId, {
        operations: cleaningOperations,
        create_snapshot: true
      });
      onCleaningComplete?.(response);
    } catch (err) {
      console.error('Failed to apply cleaning:', err);
      const errorMessage = err.message || 'Failed to apply cleaning operations';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Get columns with missing values
  const getColumnsWithMissing = () => {
    return columnInfo.filter(col => col.null_count > 0);
  };

  // Get numeric columns
  const getNumericColumns = () => {
    return columnInfo.filter(col => 
      ['int64', 'int32', 'float64', 'float32', 'number', 'integer', 'float'].includes(col.data_type?.toLowerCase())
    );
  };

  // Missing Value Handling Component
  const MissingValueHandling = () => {
    const [selectedColumn, setSelectedColumn] = useState('');
    const [method, setMethod] = useState('mean');
    const [customValue, setCustomValue] = useState('');

    const columnsWithMissing = getColumnsWithMissing();

    const handleAddOperation = () => {
      if (!selectedColumn) {
        setError('Please select a column');
        return;
      }

      const operation = {
        type: 'fill_missing',
        column: selectedColumn,
        method: method,
        value: method === 'custom' ? customValue : undefined
      };

      addCleaningOperation(operation);
      setSelectedColumn('');
      setCustomValue('');
      setError(null);
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column with Missing Values
            </label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select column...</option>
              {columnsWithMissing.map(col => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.null_count} missing)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fill Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="mean">Mean (numeric only)</option>
              <option value="median">Median (numeric only)</option>
              <option value="mode">Mode (most frequent)</option>
              <option value="forward_fill">Forward Fill</option>
              <option value="backward_fill">Backward Fill</option>
              <option value="custom">Custom Value</option>
              <option value="drop">Drop Rows</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {method === 'custom' ? 'Custom Value' : 'Action'}
            </label>
            {method === 'custom' ? (
              <input
                type="text"
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Enter custom value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <button
                onClick={handleAddOperation}
                disabled={!selectedColumn}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Operation
              </button>
            )}
          </div>
        </div>

        {method === 'custom' && (
          <button
            onClick={handleAddOperation}
            disabled={!selectedColumn || !customValue}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Custom Fill Operation
          </button>
        )}
      </div>
    );
  };

  // Outlier Detection Component
  const OutlierDetection = () => {
    const [selectedColumn, setSelectedColumn] = useState('');
    const [method, setMethod] = useState('iqr');
    const [threshold, setThreshold] = useState('1.5');

    const numericColumns = getNumericColumns();

    const handleAddOperation = () => {
      if (!selectedColumn) {
        setError('Please select a column');
        return;
      }

      const operation = {
        type: 'remove_outliers',
        column: selectedColumn,
        method: method,
        threshold: parseFloat(threshold)
      };

      addCleaningOperation(operation);
      setSelectedColumn('');
      setError(null);
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Numeric Column
            </label>
            <select
              value={selectedColumn}
              onChange={(e) => setSelectedColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select column...</option>
              {numericColumns.map(col => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.data_type})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Detection Method
            </label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="iqr">IQR Method</option>
              <option value="zscore">Z-Score Method</option>
              <option value="isolation_forest">Isolation Forest</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Threshold
            </label>
            <input
              type="number"
              step="0.1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="1.5"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleAddOperation}
          disabled={!selectedColumn}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Outlier Removal
        </button>
      </div>
    );
  };

  // Duplicate Removal Component
  const DuplicateRemoval = () => {
    const [selectedColumns, setSelectedColumns] = useState([]);
    const [keepFirst, setKeepFirst] = useState(true);

    const handleColumnToggle = (columnName) => {
      setSelectedColumns(prev => 
        prev.includes(columnName) 
          ? prev.filter(col => col !== columnName)
          : [...prev, columnName]
      );
    };

    const handleAddOperation = () => {
      const operation = {
        type: 'remove_duplicates',
        columns: selectedColumns.length > 0 ? selectedColumns : undefined,
        keep: keepFirst ? 'first' : 'last'
      };

      addCleaningOperation(operation);
      setSelectedColumns([]);
      setError(null);
    };

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Check Duplicates Based On (leave empty for all columns)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
            {columnInfo.map(col => (
              <label key={col.name} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={selectedColumns.includes(col.name)}
                  onChange={() => handleColumnToggle(col.name)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">{col.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keep Which Duplicate
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={keepFirst}
                onChange={() => setKeepFirst(true)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Keep First</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                checked={!keepFirst}
                onChange={() => setKeepFirst(false)}
                className="text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Keep Last</span>
            </label>
          </div>
        </div>

        <button
          onClick={handleAddOperation}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
        >
          Add Duplicate Removal
        </button>
      </div>
    );
  };

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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Cleaning</h3>
        <p className="text-sm text-gray-600">
          Configure cleaning operations to handle missing values, outliers, and duplicates
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'missing', label: '🔧 Missing Values', count: getColumnsWithMissing().length },
            { id: 'outliers', label: '📊 Outliers', count: getNumericColumns().length },
            { id: 'duplicates', label: '🔄 Duplicates', count: null }
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
              {tab.count !== null && (
                <span className="ml-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'missing' && <MissingValueHandling />}
        {activeTab === 'outliers' && <OutlierDetection />}
        {activeTab === 'duplicates' && <DuplicateRemoval />}
      </div>

      {/* Operations Summary */}
      {cleaningOperations.length > 0 && (
        <div className="p-6 border-t bg-gray-50">
          <h4 className="font-medium text-gray-900 mb-3">
            Planned Operations ({cleaningOperations.length})
          </h4>
          <div className="space-y-2">
            {cleaningOperations.map((operation) => (
              <div key={operation.id} className="flex items-center justify-between bg-white p-3 rounded-md border">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium">
                    {operation.type === 'fill_missing' && '🔧'}
                    {operation.type === 'remove_outliers' && '📊'}
                    {operation.type === 'remove_duplicates' && '🔄'}
                  </span>
                  <span className="text-sm">
                    {operation.type === 'fill_missing' && 
                      `Fill missing in "${operation.column}" with ${operation.method}${operation.value ? ` (${operation.value})` : ''}`}
                    {operation.type === 'remove_outliers' && 
                      `Remove outliers in "${operation.column}" using ${operation.method} (threshold: ${operation.threshold})`}
                    {operation.type === 'remove_duplicates' && 
                      `Remove duplicates${operation.columns ? ` based on: ${operation.columns.join(', ')}` : ''} (keep ${operation.keep})`}
                  </span>
                </div>
                <button
                  onClick={() => removeCleaningOperation(operation.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 mt-4">
            <button
              onClick={previewCleaning}
              disabled={previewLoading}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {previewLoading ? 'Previewing...' : 'Preview Changes'}
            </button>
            <button
              onClick={applyCleaning}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Applying...' : 'Apply Cleaning'}
            </button>
          </div>
        </div>
      )}

      {/* Preview Results */}
      {cleaningPreview && (
        <div className="p-6 border-t">
          <h4 className="font-medium text-gray-900 mb-3">Cleaning Preview</h4>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-blue-600 font-medium">Rows Before:</span>
                <span className="ml-2">{cleaningPreview.before?.rows || 0}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Rows After:</span>
                <span className="ml-2">{cleaningPreview.after?.rows || 0}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Rows Removed:</span>
                <span className="ml-2">{(cleaningPreview.before?.rows || 0) - (cleaningPreview.after?.rows || 0)}</span>
              </div>
              <div>
                <span className="text-blue-600 font-medium">Missing Values:</span>
                <span className="ml-2">{cleaningPreview.after?.missing_values || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-6 border-t">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-start space-x-3">
              <div className="text-red-500 text-lg">❌</div>
              <div>
                <h4 className="text-sm font-medium text-red-800">Cleaning Error</h4>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataCleaning;