/*
Data Pipeline Dashboard - Data Visualization Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const DataVisualization = ({ 
  fileId, 
  sessionId,
  onVisualizationComplete,
  onError 
}) => {
  const [columnInfo, setColumnInfo] = useState([]);
  const [visualizations, setVisualizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartConfig, setChartConfig] = useState({
    chart_type: 'bar',
    x_column: '',
    y_column: '',
    title: '',
    color_column: '',
    size_column: '',
    aggregation: 'count'
  });

  // Chart type configurations
  const chartTypes = {
    bar: {
      name: 'Bar Chart',
      icon: '📊',
      description: 'Compare categories or show distributions',
      requires: { x: true, y: false },
      supports: { color: true, aggregation: true }
    },
    line: {
      name: 'Line Chart',
      icon: '📈',
      description: 'Show trends over time or continuous data',
      requires: { x: true, y: true },
      supports: { color: true, aggregation: false }
    },
    scatter: {
      name: 'Scatter Plot',
      icon: '🔵',
      description: 'Explore relationships between two variables',
      requires: { x: true, y: true },
      supports: { color: true, size: true, aggregation: false }
    },
    histogram: {
      name: 'Histogram',
      icon: '📊',
      description: 'Show distribution of a single variable',
      requires: { x: true, y: false },
      supports: { color: false, aggregation: false }
    },
    box: {
      name: 'Box Plot',
      icon: '📦',
      description: 'Show distribution and outliers',
      requires: { x: false, y: true },
      supports: { color: true, aggregation: false }
    }
  };

  // Aggregation options
  const aggregationOptions = [
    { value: 'count', label: 'Count' },
    { value: 'sum', label: 'Sum' },
    { value: 'mean', label: 'Average' },
    { value: 'median', label: 'Median' },
    { value: 'min', label: 'Minimum' },
    { value: 'max', label: 'Maximum' }
  ];

  // Fetch column information
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

  // Get columns by type
  const getNumericColumns = () => {
    return columnInfo.filter(col => 
      ['int64', 'int32', 'float64', 'float32', 'number', 'integer', 'float'].includes(col.data_type?.toLowerCase())
    );
  };

  const getCategoricalColumns = () => {
    return columnInfo.filter(col => 
      ['object', 'string', 'text', 'category'].includes(col.data_type?.toLowerCase())
    );
  };

  const getDateColumns = () => {
    return columnInfo.filter(col => 
      ['datetime64', 'datetime', 'date'].includes(col.data_type?.toLowerCase())
    );
  };

  const getAllColumns = () => columnInfo;

  // Validate chart configuration
  const validateConfig = () => {
    const chartType = chartTypes[chartConfig.chart_type];
    const errors = [];

    if (chartType.requires.x && !chartConfig.x_column) {
      errors.push('X-axis column is required');
    }

    if (chartType.requires.y && !chartConfig.y_column) {
      errors.push('Y-axis column is required');
    }

    if (chartConfig.x_column === chartConfig.y_column && chartConfig.x_column) {
      errors.push('X and Y columns cannot be the same');
    }

    return errors;
  };

  // Create visualization
  const createVisualization = async () => {
    const validationErrors = validateConfig();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.visualizeData(sessionId, fileId, {
        chart_type: chartConfig.chart_type,
        x_column: chartConfig.x_column,
        y_column: chartConfig.y_column,
        color_column: chartConfig.color_column || undefined,
        size_column: chartConfig.size_column || undefined,
        title: chartConfig.title || `${chartTypes[chartConfig.chart_type].name}`,
        aggregation: chartConfig.aggregation,
        options: {
          width: 800,
          height: 500,
          responsive: true
        }
      });

      const newVisualization = {
        id: Date.now(),
        config: { ...chartConfig },
        result: response,
        created_at: new Date().toISOString()
      };

      setVisualizations(prev => [...prev, newVisualization]);
      onVisualizationComplete?.(response);

      // Reset form
      setChartConfig(prev => ({
        ...prev,
        title: '',
        color_column: '',
        size_column: ''
      }));

    } catch (err) {
      console.error('Failed to create visualization:', err);
      const errorMessage = err.message || 'Failed to create visualization';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Download visualization
  const downloadVisualization = (visualization) => {
    if (visualization.result?.image_url) {
      const link = document.createElement('a');
      link.href = visualization.result.image_url;
      link.download = `${visualization.config.chart_type}_${visualization.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Remove visualization
  const removeVisualization = (visualizationId) => {
    setVisualizations(prev => prev.filter(viz => viz.id !== visualizationId));
  };

  // Get appropriate columns for current chart type
  const getColumnsForAxis = (axis) => {
    const chartType = chartTypes[chartConfig.chart_type];
    
    switch (chartConfig.chart_type) {
      case 'bar':
        return axis === 'x' ? [...getCategoricalColumns(), ...getDateColumns()] : getNumericColumns();
      case 'line':
        return axis === 'x' ? [...getNumericColumns(), ...getDateColumns()] : getNumericColumns();
      case 'scatter':
        return getNumericColumns();
      case 'histogram':
        return axis === 'x' ? getNumericColumns() : [];
      case 'box':
        return axis === 'y' ? getNumericColumns() : getCategoricalColumns();
      default:
        return getAllColumns();
    }
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Visualization</h3>
        <p className="text-sm text-gray-600">
          Create interactive charts and visualizations to explore your data
        </p>
      </div>

      {/* Chart Configuration */}
      <div className="p-6 border-b bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-4">Create New Visualization</h4>
        
        {/* Chart Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Chart Type</label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(chartTypes).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setChartConfig(prev => ({ 
                  ...prev, 
                  chart_type: type,
                  x_column: '',
                  y_column: '',
                  color_column: '',
                  size_column: ''
                }))}
                className={`p-3 border rounded-lg text-center transition-all ${
                  chartConfig.chart_type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{config.icon}</div>
                <div className="text-xs font-medium">{config.name}</div>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {chartTypes[chartConfig.chart_type].description}
          </p>
        </div>

        {/* Column Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* X Column */}
          {chartTypes[chartConfig.chart_type].requires.x && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                X-Axis Column *
              </label>
              <select
                value={chartConfig.x_column}
                onChange={(e) => setChartConfig(prev => ({ ...prev, x_column: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {getColumnsForAxis('x').map(col => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.data_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Y Column */}
          {chartTypes[chartConfig.chart_type].requires.y && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Y-Axis Column *
              </label>
              <select
                value={chartConfig.y_column}
                onChange={(e) => setChartConfig(prev => ({ ...prev, y_column: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select column...</option>
                {getColumnsForAxis('y').map(col => (
                  <option key={col.name} value={col.name}>
                    {col.name} ({col.data_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Color Column */}
          {chartTypes[chartConfig.chart_type].supports.color && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color By (Optional)
              </label>
              <select
                value={chartConfig.color_column}
                onChange={(e) => setChartConfig(prev => ({ ...prev, color_column: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {getCategoricalColumns().map(col => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Size Column (for scatter plots) */}
          {chartTypes[chartConfig.chart_type].supports.size && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size By (Optional)
              </label>
              <select
                value={chartConfig.size_column}
                onChange={(e) => setChartConfig(prev => ({ ...prev, size_column: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None</option>
                {getNumericColumns().map(col => (
                  <option key={col.name} value={col.name}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Additional Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chart Title (Optional)
            </label>
            <input
              type="text"
              value={chartConfig.title}
              onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
              placeholder={`${chartTypes[chartConfig.chart_type].name}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Aggregation */}
          {chartTypes[chartConfig.chart_type].supports.aggregation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Aggregation Method
              </label>
              <select
                value={chartConfig.aggregation}
                onChange={(e) => setChartConfig(prev => ({ ...prev, aggregation: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {aggregationOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Create Button */}
        <button
          onClick={createVisualization}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating...' : 'Create Visualization'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-2">
              <div className="text-red-500 text-sm">❌</div>
              <div>
                <p className="text-red-800 text-sm font-medium">Visualization Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visualizations Gallery */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">
          Created Visualizations ({visualizations.length})
        </h4>

        {visualizations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📊</div>
            <p>No visualizations created yet</p>
            <p className="text-sm mt-1">Configure and create your first chart above</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {visualizations.map((viz) => (
              <div key={viz.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{chartTypes[viz.config.chart_type].icon}</span>
                    <h5 className="font-medium text-gray-900">
                      {viz.config.title || chartTypes[viz.config.chart_type].name}
                    </h5>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => downloadVisualization(viz)}
                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      title="Download"
                    >
                      💾
                    </button>
                    <button
                      onClick={() => removeVisualization(viz.id)}
                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Chart Configuration Summary */}
                <div className="text-xs text-gray-600 mb-3 space-y-1">
                  {viz.config.x_column && (
                    <div>X: {viz.config.x_column}</div>
                  )}
                  {viz.config.y_column && (
                    <div>Y: {viz.config.y_column}</div>
                  )}
                  {viz.config.color_column && (
                    <div>Color: {viz.config.color_column}</div>
                  )}
                </div>

                {/* Chart Display */}
                {viz.result?.image_url ? (
                  <img
                    src={viz.result.image_url}
                    alt={viz.config.title || chartTypes[viz.config.chart_type].name}
                    className="w-full h-64 object-contain border rounded"
                  />
                ) : viz.result?.chart_data ? (
                  <div className="w-full h-64 bg-gray-100 border rounded flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-2xl mb-2">📊</div>
                      <div className="text-sm">Chart data available</div>
                      <div className="text-xs">Interactive chart would render here</div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gray-100 border rounded flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-2xl mb-2">❌</div>
                      <div className="text-sm">Chart failed to render</div>
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 mt-2">
                  Created: {new Date(viz.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataVisualization;