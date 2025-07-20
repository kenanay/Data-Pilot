/*
Data Pipeline Dashboard - Data Conversion Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const DataConversion = ({ 
  fileId, 
  sessionId,
  onConversionComplete,
  onError 
}) => {
  const [conversionConfig, setConversionConfig] = useState({
    target_format: 'csv',
    filename: '',
    options: {
      csv: {
        delimiter: ',',
        quote_char: '"',
        escape_char: '\\',
        line_terminator: '\n',
        include_index: false,
        include_header: true
      },
      json: {
        orient: 'records',
        indent: 2,
        ensure_ascii: false
      },
      excel: {
        sheet_name: 'Sheet1',
        include_index: false,
        include_header: true,
        engine: 'openpyxl'
      },
      parquet: {
        compression: 'snappy',
        include_index: false
      }
    }
  });

  const [fileInfo, setFileInfo] = useState(null);
  const [conversionHistory, setConversionHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState('convert');

  // Format configurations
  const formatConfigs = {
    csv: {
      name: 'CSV',
      icon: '📄',
      description: 'Comma-separated values format',
      extensions: ['.csv'],
      mimeType: 'text/csv',
      color: 'blue'
    },
    json: {
      name: 'JSON',
      icon: '📋',
      description: 'JavaScript Object Notation format',
      extensions: ['.json'],
      mimeType: 'application/json',
      color: 'green'
    },
    excel: {
      name: 'Excel',
      icon: '📊',
      description: 'Microsoft Excel spreadsheet format',
      extensions: ['.xlsx', '.xls'],
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      color: 'emerald'
    },
    parquet: {
      name: 'Parquet',
      icon: '🗃️',
      description: 'Apache Parquet columnar storage format',
      extensions: ['.parquet'],
      mimeType: 'application/octet-stream',
      color: 'purple'
    }
  };

  // Fetch file information
  useEffect(() => {
    if (!fileId) return;

    const fetchFileInfo = async () => {
      try {
        const response = await ApiService.previewData(fileId);
        setFileInfo(response.summary);
        
        // Auto-generate filename
        if (!conversionConfig.filename) {
          generateFilename(response.summary?.original_name || 'converted_data');
        }
      } catch (err) {
        console.error('Failed to fetch file info:', err);
        setError(err.message || 'Failed to load file information');
      }
    };

    fetchFileInfo();
  }, [fileId]);

  // Generate filename based on format
  useEffect(() => {
    if (fileInfo?.original_name) {
      generateFilename(fileInfo.original_name);
    }
  }, [conversionConfig.target_format, fileInfo]);

  // Generate appropriate filename
  const generateFilename = (originalName) => {
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const extension = formatConfigs[conversionConfig.target_format].extensions[0];
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    
    setConversionConfig(prev => ({
      ...prev,
      filename: `${baseName}_converted_${timestamp}${extension}`
    }));
  };

  // Update conversion options
  const updateOption = (format, key, value) => {
    setConversionConfig(prev => ({
      ...prev,
      options: {
        ...prev.options,
        [format]: {
          ...prev.options[format],
          [key]: value
        }
      }
    }));
  };

  // Validate conversion parameters
  const validateConversion = () => {
    if (!conversionConfig.filename.trim()) {
      return { valid: false, error: 'Filename is required' };
    }

    if (!formatConfigs[conversionConfig.target_format]) {
      return { valid: false, error: 'Invalid target format selected' };
    }

    // Format-specific validations
    const format = conversionConfig.target_format;
    const options = conversionConfig.options[format];

    if (format === 'csv') {
      if (!options.delimiter || options.delimiter.length === 0) {
        return { valid: false, error: 'CSV delimiter cannot be empty' };
      }
    }

    if (format === 'json') {
      if (!['records', 'index', 'values', 'split', 'table'].includes(options.orient)) {
        return { valid: false, error: 'Invalid JSON orientation selected' };
      }
    }

    if (format === 'excel') {
      if (!options.sheet_name.trim()) {
        return { valid: false, error: 'Excel sheet name cannot be empty' };
      }
    }

    return { valid: true };
  };

  // Start conversion process
  const startConversion = async () => {
    const validation = validateConversion();
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setLoading(true);
    setError(null);
    setProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      const response = await ApiService.convertData(sessionId, fileId, {
        target_format: conversionConfig.target_format,
        filename: conversionConfig.filename,
        options: conversionConfig.options[conversionConfig.target_format]
      });

      clearInterval(progressInterval);
      setProgress(100);

      const newConversion = {
        id: Date.now(),
        format: conversionConfig.target_format,
        filename: conversionConfig.filename,
        size: response.file_size || 0,
        download_url: response.download_url,
        created_at: new Date().toISOString(),
        status: 'completed'
      };

      setConversionHistory(prev => [newConversion, ...prev]);
      onConversionComplete?.(response);

      // Reset progress after a delay
      setTimeout(() => setProgress(0), 2000);

    } catch (err) {
      console.error('Failed to convert data:', err);
      const errorMessage = err.message || 'Failed to convert data';
      setError(errorMessage);
      onError?.(errorMessage);
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  // Download converted file
  const downloadFile = (conversion) => {
    if (conversion.download_url) {
      const link = document.createElement('a');
      link.href = conversion.download_url;
      link.download = conversion.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Remove conversion from history
  const removeConversion = (conversionId) => {
    setConversionHistory(prev => prev.filter(conv => conv.id !== conversionId));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get format color classes
  const getFormatColorClasses = (format) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      purple: 'bg-purple-50 text-purple-700 border-purple-200'
    };
    return colorMap[formatConfigs[format]?.color] || colorMap.blue;
  };

  if (!fileInfo) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Loading file information...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Data Format Conversion</h3>
        <p className="text-sm text-gray-600">
          Convert your processed data to different formats for use in other tools and systems
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'convert', label: '🔄 Convert Data' },
            { id: 'history', label: '📁 Conversion History' }
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

      {/* Convert Tab */}
      {activeTab === 'convert' && (
        <div className="p-6">
          {/* File Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Source File Information</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">File:</span>
                <div className="font-medium">{fileInfo.original_name}</div>
              </div>
              <div>
                <span className="text-gray-600">Rows:</span>
                <div className="font-medium">{fileInfo.row_count?.toLocaleString() || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-600">Columns:</span>
                <div className="font-medium">{fileInfo.columns?.length || 'N/A'}</div>
              </div>
              <div>
                <span className="text-gray-600">Size:</span>
                <div className="font-medium">{formatFileSize(fileInfo.file_size || 0)}</div>
              </div>
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">Target Format</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(formatConfigs).map(([format, config]) => (
                <button
                  key={format}
                  onClick={() => setConversionConfig(prev => ({ ...prev, target_format: format }))}
                  className={`p-4 border-2 rounded-lg text-left transition-all ${
                    conversionConfig.target_format === format
                      ? `${getFormatColorClasses(format)} border-current`
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xl">{config.icon}</span>
                    <span className="font-medium">{config.name}</span>
                  </div>
                  <p className="text-xs text-gray-600">{config.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.extensions.join(', ')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Filename Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Output Filename</label>
            <input
              type="text"
              value={conversionConfig.filename}
              onChange={(e) => setConversionConfig(prev => ({ ...prev, filename: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter filename..."
            />
          </div>

          {/* Format-specific Options */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Format Options</h4>
            
            {/* CSV Options */}
            {conversionConfig.target_format === 'csv' && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Delimiter</label>
                    <select
                      value={conversionConfig.options.csv.delimiter}
                      onChange={(e) => updateOption('csv', 'delimiter', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value=",">Comma (,)</option>
                      <option value=";">Semicolon (;)</option>
                      <option value="\t">Tab (\t)</option>
                      <option value="|">Pipe (|)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quote Character</label>
                    <select
                      value={conversionConfig.options.csv.quote_char}
                      onChange={(e) => updateOption('csv', 'quote_char', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value='"'>Double Quote (")</option>
                      <option value="'">Single Quote (')</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={conversionConfig.options.csv.include_header}
                      onChange={(e) => updateOption('csv', 'include_header', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include Header</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={conversionConfig.options.csv.include_index}
                      onChange={(e) => updateOption('csv', 'include_index', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Include Index</span>
                  </label>
                </div>
              </div>
            )}

            {/* JSON Options */}
            {conversionConfig.target_format === 'json' && (
              <div className="space-y-4 p-4 bg-green-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Orientation</label>
                    <select
                      value={conversionConfig.options.json.orient}
                      onChange={(e) => updateOption('json', 'orient', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="records">Records (array of objects)</option>
                      <option value="index">Index (nested objects)</option>
                      <option value="values">Values (array of arrays)</option>
                      <option value="split">Split (separate keys and values)</option>
                      <option value="table">Table (schema + data)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Indentation</label>
                    <select
                      value={conversionConfig.options.json.indent}
                      onChange={(e) => updateOption('json', 'indent', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="0">None (compact)</option>
                      <option value="2">2 spaces</option>
                      <option value="4">4 spaces</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionConfig.options.json.ensure_ascii}
                    onChange={(e) => updateOption('json', 'ensure_ascii', e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Ensure ASCII (escape non-ASCII characters)</span>
                </label>
              </div>
            )}

            {/* Excel Options */}
            {conversionConfig.target_format === 'excel' && (
              <div className="space-y-4 p-4 bg-emerald-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sheet Name</label>
                    <input
                      type="text"
                      value={conversionConfig.options.excel.sheet_name}
                      onChange={(e) => updateOption('excel', 'sheet_name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Sheet1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Engine</label>
                    <select
                      value={conversionConfig.options.excel.engine}
                      onChange={(e) => updateOption('excel', 'engine', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="openpyxl">OpenPyXL (.xlsx)</option>
                      <option value="xlsxwriter">XlsxWriter (.xlsx)</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={conversionConfig.options.excel.include_header}
                      onChange={(e) => updateOption('excel', 'include_header', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Include Header</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={conversionConfig.options.excel.include_index}
                      onChange={(e) => updateOption('excel', 'include_index', e.target.checked)}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-sm text-gray-700">Include Index</span>
                  </label>
                </div>
              </div>
            )}

            {/* Parquet Options */}
            {conversionConfig.target_format === 'parquet' && (
              <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Compression</label>
                    <select
                      value={conversionConfig.options.parquet.compression}
                      onChange={(e) => updateOption('parquet', 'compression', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="snappy">Snappy (fast)</option>
                      <option value="gzip">Gzip (balanced)</option>
                      <option value="brotli">Brotli (high compression)</option>
                      <option value="lz4">LZ4 (very fast)</option>
                      <option value="none">None</option>
                    </select>
                  </div>
                </div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={conversionConfig.options.parquet.include_index}
                    onChange={(e) => updateOption('parquet', 'include_index', e.target.checked)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm text-gray-700">Include Index</span>
                </label>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {loading && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Converting...</span>
                <span className="text-sm text-gray-600">{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start space-x-2">
                <div className="text-red-500 text-sm">❌</div>
                <div>
                  <p className="text-red-800 text-sm font-medium">Conversion Error</p>
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Convert Button */}
          <div className="flex justify-end">
            <button
              onClick={startConversion}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Converting...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Start Conversion</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="p-6">
          <h4 className="font-medium text-gray-900 mb-4">
            Conversion History ({conversionHistory.length})
          </h4>

          {conversionHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">📁</div>
              <p>No conversions yet</p>
              <p className="text-sm mt-1">Start converting data to see history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {conversionHistory.map((conversion) => (
                <div key={conversion.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{formatConfigs[conversion.format].icon}</span>
                      <div>
                        <h5 className="font-medium text-gray-900">{conversion.filename}</h5>
                        <p className="text-sm text-gray-600">
                          {formatConfigs[conversion.format].name} • 
                          {formatFileSize(conversion.size)} • 
                          {new Date(conversion.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => downloadFile(conversion)}
                        className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                      >
                        📥 Download
                      </button>
                      <button
                        onClick={() => removeConversion(conversion.id)}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DataConversion;