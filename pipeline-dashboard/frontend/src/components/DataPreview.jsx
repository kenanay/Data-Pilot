/*
Data Pipeline Dashboard - Data Preview Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const DataPreview = ({ 
  fileId, 
  sessionId,
  onPreviewComplete,
  onError 
}) => {
  const [previewData, setPreviewData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('data');

  // Fetch preview data
  useEffect(() => {
    if (!fileId) return;

    const fetchPreview = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await ApiService.previewData(fileId);
        setPreviewData(response);
        onPreviewComplete?.(response);
      } catch (err) {
        console.error('Failed to fetch preview:', err);
        const errorMessage = err.message || 'Failed to preview data';
        setError(errorMessage);
        onError?.(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [fileId, onPreviewComplete, onError]);

  // Get data type icon
  const getDataTypeIcon = (dataType) => {
    const type = dataType?.toLowerCase();
    switch (type) {
      case 'int64':
      case 'int32':
      case 'integer':
      case 'number':
        return '🔢';
      case 'float64':
      case 'float32':
      case 'float':
        return '📊';
      case 'object':
      case 'string':
      case 'text':
        return '📝';
      case 'datetime64':
      case 'datetime':
      case 'date':
        return '📅';
      case 'bool':
      case 'boolean':
        return '✅';
      default:
        return '❓';
    }
  };

  // Format number with commas
  const formatNumber = (num) => {
    if (typeof num !== 'number') return num;
    return num.toLocaleString();
  };

  // Format percentage
  const formatPercentage = (value, total) => {
    if (!total || total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading data preview...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-start space-x-3">
          <div className="text-red-500 text-xl">❌</div>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-2">Preview Failed</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">💡 Suggestions:</h4>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Check if the file format is correct and not corrupted</li>
                <li>• Ensure CSV files use comma (,) as delimiter</li>
                <li>• Verify Excel files are not password protected</li>
                <li>• Make sure JSON files contain valid data structure</li>
                <li>• Try uploading the file again</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!previewData) {
    return null;
  }

  const { data, summary, statistics } = previewData;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header with Summary Stats */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Data Preview</h3>
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span>📊 {formatNumber(summary?.total_rows || 0)} rows</span>
            <span>📋 {summary?.total_columns || 0} columns</span>
            <span>⚠️ {formatNumber(summary?.missing_values || 0)} missing</span>
          </div>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Rows</div>
            <div className="text-blue-900 text-xl font-bold">
              {formatNumber(summary?.total_rows || 0)}
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3 border border-green-200">
            <div className="text-green-600 text-sm font-medium">Columns</div>
            <div className="text-green-900 text-xl font-bold">
              {summary?.total_columns || 0}
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
            <div className="text-yellow-600 text-sm font-medium">Missing Values</div>
            <div className="text-yellow-900 text-xl font-bold">
              {formatNumber(summary?.missing_values || 0)}
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Completeness</div>
            <div className="text-purple-900 text-xl font-bold">
              {formatPercentage(
                (summary?.total_rows * summary?.total_columns) - (summary?.missing_values || 0),
                summary?.total_rows * summary?.total_columns
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {['data', 'columns', 'statistics'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'data' && '📋 Data Sample'}
              {tab === 'columns' && '📊 Column Info'}
              {tab === 'statistics' && '📈 Statistics'}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'data' && (
          <div className="overflow-x-auto">
            <div className="mb-4 text-sm text-gray-600">
              Showing first {Math.min(20, data?.length || 0)} rows
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  {data && data.length > 0 && Object.keys(data[0]).map((column) => (
                    <th
                      key={column}
                      className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data && data.slice(0, 20).map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                      {index + 1}
                    </td>
                    {Object.values(row).map((value, colIndex) => (
                      <td
                        key={colIndex}
                        className="px-3 py-2 whitespace-nowrap text-sm text-gray-900"
                      >
                        {value === null || value === undefined ? (
                          <span className="text-gray-400 italic">null</span>
                        ) : (
                          String(value)
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'columns' && (
          <div className="space-y-4">
            {summary?.columns?.map((column, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getDataTypeIcon(column.data_type)}</span>
                    <h4 className="font-medium text-gray-900">{column.name}</h4>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                      {column.data_type}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatNumber(column.non_null_count)} / {formatNumber(summary.total_rows)} values
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Non-null:</span>
                    <span className="ml-2 font-medium">{formatNumber(column.non_null_count)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Missing:</span>
                    <span className="ml-2 font-medium">{formatNumber(column.null_count || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Unique:</span>
                    <span className="ml-2 font-medium">{formatNumber(column.unique_count || 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Completeness:</span>
                    <span className="ml-2 font-medium">
                      {formatPercentage(column.non_null_count, summary.total_rows)}
                    </span>
                  </div>
                </div>

                {/* Progress bar for completeness */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${(column.non_null_count / summary.total_rows) * 100}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'statistics' && statistics && (
          <div className="space-y-6">
            {Object.entries(statistics).map(([columnName, stats]) => (
              <div key={columnName} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center space-x-2">
                  <span>{getDataTypeIcon(stats.dtype)}</span>
                  <span>{columnName}</span>
                </h4>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  {stats.count !== undefined && (
                    <div>
                      <span className="text-gray-500">Count:</span>
                      <span className="ml-2 font-medium">{formatNumber(stats.count)}</span>
                    </div>
                  )}
                  {stats.mean !== undefined && (
                    <div>
                      <span className="text-gray-500">Mean:</span>
                      <span className="ml-2 font-medium">{Number(stats.mean).toFixed(2)}</span>
                    </div>
                  )}
                  {stats.std !== undefined && (
                    <div>
                      <span className="text-gray-500">Std Dev:</span>
                      <span className="ml-2 font-medium">{Number(stats.std).toFixed(2)}</span>
                    </div>
                  )}
                  {stats.min !== undefined && (
                    <div>
                      <span className="text-gray-500">Min:</span>
                      <span className="ml-2 font-medium">{stats.min}</span>
                    </div>
                  )}
                  {stats.max !== undefined && (
                    <div>
                      <span className="text-gray-500">Max:</span>
                      <span className="ml-2 font-medium">{stats.max}</span>
                    </div>
                  )}
                  {stats['25%'] !== undefined && (
                    <div>
                      <span className="text-gray-500">Q1:</span>
                      <span className="ml-2 font-medium">{Number(stats['25%']).toFixed(2)}</span>
                    </div>
                  )}
                  {stats['50%'] !== undefined && (
                    <div>
                      <span className="text-gray-500">Median:</span>
                      <span className="ml-2 font-medium">{Number(stats['50%']).toFixed(2)}</span>
                    </div>
                  )}
                  {stats['75%'] !== undefined && (
                    <div>
                      <span className="text-gray-500">Q3:</span>
                      <span className="ml-2 font-medium">{Number(stats['75%']).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataPreview;