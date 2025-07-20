/*
Data Pipeline Dashboard - Data Analysis Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const DataAnalysis = ({ 
  fileId, 
  sessionId,
  onAnalysisComplete,
  onError 
}) => {
  const [analysisResults, setAnalysisResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisConfig, setAnalysisConfig] = useState({
    include_correlation: true,
    include_distribution: true,
    include_descriptive: true,
    correlation_method: 'pearson',
    significance_level: 0.05
  });

  // Run analysis
  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.analyzeData(sessionId, fileId, {
        analysis_type: 'comprehensive',
        config: analysisConfig
      });
      setAnalysisResults(response);
      onAnalysisComplete?.(response);
    } catch (err) {
      console.error('Failed to run analysis:', err);
      const errorMessage = err.message || 'Failed to run analysis';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis on component mount
  useEffect(() => {
    if (fileId && sessionId) {
      runAnalysis();
    }
  }, [fileId, sessionId]);

  // Format number for display
  const formatNumber = (num, decimals = 2) => {
    if (typeof num !== 'number' || isNaN(num)) return 'N/A';
    return num.toFixed(decimals);
  };

  // Get correlation color
  const getCorrelationColor = (value) => {
    const absValue = Math.abs(value);
    if (absValue >= 0.8) return value > 0 ? 'bg-green-600' : 'bg-red-600';
    if (absValue >= 0.6) return value > 0 ? 'bg-green-500' : 'bg-red-500';
    if (absValue >= 0.4) return value > 0 ? 'bg-green-400' : 'bg-red-400';
    if (absValue >= 0.2) return value > 0 ? 'bg-green-300' : 'bg-red-300';
    return 'bg-gray-200';
  };

  // Overview Tab Component
  const OverviewTab = () => {
    if (!analysisResults?.summary) return null;

    const { summary } = analysisResults;

    return (
      <div className="space-y-6">
        {/* Key Insights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="text-blue-600 text-sm font-medium">Total Variables</div>
            <div className="text-blue-900 text-2xl font-bold">
              {summary.total_columns || 0}
            </div>
            <div className="text-blue-600 text-xs mt-1">
              {summary.numeric_columns || 0} numeric, {summary.categorical_columns || 0} categorical
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-green-600 text-sm font-medium">Data Quality</div>
            <div className="text-green-900 text-2xl font-bold">
              {formatNumber((summary.completeness || 0) * 100, 1)}%
            </div>
            <div className="text-green-600 text-xs mt-1">
              Completeness score
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <div className="text-purple-600 text-sm font-medium">Strong Correlations</div>
            <div className="text-purple-900 text-2xl font-bold">
              {summary.strong_correlations || 0}
            </div>
            <div className="text-purple-600 text-xs mt-1">
              |r| ≥ 0.7
            </div>
          </div>

          <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
            <div className="text-orange-600 text-sm font-medium">Outliers Detected</div>
            <div className="text-orange-900 text-2xl font-bold">
              {summary.outliers_detected || 0}
            </div>
            <div className="text-orange-600 text-xs mt-1">
              Across all variables
            </div>
          </div>
        </div>

        {/* Key Findings */}
        {summary.key_findings && (
          <div className="bg-white border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">🔍 Key Findings</h4>
            <ul className="space-y-2">
              {summary.key_findings.map((finding, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-gray-700">{finding}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Recommendations */}
        {summary.recommendations && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-medium text-yellow-800 mb-3">💡 Recommendations</h4>
            <ul className="space-y-2">
              {summary.recommendations.map((rec, index) => (
                <li key={index} className="flex items-start space-x-2 text-sm">
                  <span className="text-yellow-600 mt-1">•</span>
                  <span className="text-yellow-700">{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Descriptive Statistics Tab
  const DescriptiveTab = () => {
    if (!analysisResults?.descriptive_stats) return null;

    const { descriptive_stats } = analysisResults;

    return (
      <div className="space-y-6">
        {Object.entries(descriptive_stats).map(([columnName, stats]) => (
          <div key={columnName} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <span>📊</span>
              <span>{columnName}</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                {stats.dtype || 'unknown'}
              </span>
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 text-sm">
              {stats.count !== undefined && (
                <div>
                  <span className="text-gray-500 block">Count</span>
                  <span className="font-medium text-gray-900">{stats.count}</span>
                </div>
              )}
              {stats.mean !== undefined && (
                <div>
                  <span className="text-gray-500 block">Mean</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats.mean)}</span>
                </div>
              )}
              {stats.std !== undefined && (
                <div>
                  <span className="text-gray-500 block">Std Dev</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats.std)}</span>
                </div>
              )}
              {stats.min !== undefined && (
                <div>
                  <span className="text-gray-500 block">Min</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats.min)}</span>
                </div>
              )}
              {stats.max !== undefined && (
                <div>
                  <span className="text-gray-500 block">Max</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats.max)}</span>
                </div>
              )}
              {stats['50%'] !== undefined && (
                <div>
                  <span className="text-gray-500 block">Median</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats['50%'])}</span>
                </div>
              )}
              {stats['25%'] !== undefined && (
                <div>
                  <span className="text-gray-500 block">Q1</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats['25%'])}</span>
                </div>
              )}
              {stats['75%'] !== undefined && (
                <div>
                  <span className="text-gray-500 block">Q3</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats['75%'])}</span>
                </div>
              )}
              {stats.skewness !== undefined && (
                <div>
                  <span className="text-gray-500 block">Skewness</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats.skewness)}</span>
                </div>
              )}
              {stats.kurtosis !== undefined && (
                <div>
                  <span className="text-gray-500 block">Kurtosis</span>
                  <span className="font-medium text-gray-900">{formatNumber(stats.kurtosis)}</span>
                </div>
              )}
            </div>

            {/* Distribution info */}
            {stats.distribution_info && (
              <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <div className="text-sm">
                  <span className="text-gray-600">Distribution: </span>
                  <span className="font-medium">{stats.distribution_info.type || 'Unknown'}</span>
                  {stats.distribution_info.normality_test && (
                    <span className="ml-2 text-xs text-gray-500">
                      (p-value: {formatNumber(stats.distribution_info.normality_test.p_value, 4)})
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Correlation Analysis Tab
  const CorrelationTab = () => {
    if (!analysisResults?.correlation_matrix) return null;

    const { correlation_matrix, correlation_pairs } = analysisResults;
    const columns = Object.keys(correlation_matrix);

    return (
      <div className="space-y-6">
        {/* Correlation Heatmap */}
        <div className="border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4">🔥 Correlation Heatmap</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="p-2"></th>
                  {columns.map(col => (
                    <th key={col} className="p-2 text-xs font-medium text-gray-600 transform -rotate-45 origin-bottom-left">
                      {col.length > 10 ? col.substring(0, 10) + '...' : col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {columns.map(row => (
                  <tr key={row}>
                    <td className="p-2 text-xs font-medium text-gray-600 max-w-20 truncate">
                      {row}
                    </td>
                    {columns.map(col => {
                      const value = correlation_matrix[row]?.[col];
                      if (value === undefined) return <td key={col} className="p-1"></td>;
                      
                      return (
                        <td key={col} className="p-1">
                          <div 
                            className={`w-8 h-8 flex items-center justify-center text-xs font-medium text-white rounded ${getCorrelationColor(value)}`}
                            title={`${row} vs ${col}: ${formatNumber(value)}`}
                          >
                            {Math.abs(value) >= 0.1 ? formatNumber(value, 1) : '0'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Legend */}
          <div className="mt-4 flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-600 rounded"></div>
              <span>Strong Negative</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-300 rounded"></div>
              <span>Weak Negative</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>No Correlation</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-300 rounded"></div>
              <span>Weak Positive</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-600 rounded"></div>
              <span>Strong Positive</span>
            </div>
          </div>
        </div>

        {/* Top Correlations */}
        {correlation_pairs && (
          <div className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4">🔗 Strongest Correlations</h4>
            <div className="space-y-2">
              {correlation_pairs.slice(0, 10).map((pair, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-900">
                      {pair.variable1} ↔ {pair.variable2}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      Math.abs(pair.correlation) >= 0.7 ? 'bg-red-100 text-red-800' :
                      Math.abs(pair.correlation) >= 0.5 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {formatNumber(pair.correlation)}
                    </span>
                    {pair.p_value !== undefined && (
                      <span className="text-xs text-gray-500">
                        p={formatNumber(pair.p_value, 4)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Distribution Analysis Tab
  const DistributionTab = () => {
    if (!analysisResults?.distribution_analysis) return null;

    const { distribution_analysis } = analysisResults;

    return (
      <div className="space-y-6">
        {Object.entries(distribution_analysis).map(([columnName, analysis]) => (
          <div key={columnName} className="border rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-4 flex items-center space-x-2">
              <span>📈</span>
              <span>{columnName}</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Distribution Info */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Distribution Properties</h5>
                <div className="space-y-2 text-sm">
                  {analysis.distribution_type && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium">{analysis.distribution_type}</span>
                    </div>
                  )}
                  {analysis.normality_test && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Normality (p-value):</span>
                      <span className={`font-medium ${
                        analysis.normality_test.p_value < 0.05 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {formatNumber(analysis.normality_test.p_value, 4)}
                      </span>
                    </div>
                  )}
                  {analysis.outliers && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Outliers:</span>
                      <span className="font-medium">{analysis.outliers.count || 0}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Histogram Data */}
              {analysis.histogram && (
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Distribution Shape</h5>
                  <div className="space-y-1">
                    {analysis.histogram.bins?.map((bin, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <span className="w-16 text-gray-600">
                          {formatNumber(bin.start)}-{formatNumber(bin.end)}
                        </span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ 
                              width: `${(bin.count / Math.max(...analysis.histogram.bins.map(b => b.count))) * 100}%` 
                            }}
                          ></div>
                        </div>
                        <span className="w-8 text-gray-600">{bin.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-gray-600">Running statistical analysis...</span>
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
            <h3 className="font-semibold text-red-800 mb-2">Analysis Failed</h3>
            <p className="text-red-700 text-sm mb-4">{error}</p>
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <h4 className="text-sm font-medium text-red-800 mb-2">💡 Suggestions:</h4>
              <ul className="text-xs text-red-700 space-y-1">
                <li>• Ensure your data contains numeric columns for correlation analysis</li>
                <li>• Check that your data has sufficient rows (minimum 10 recommended)</li>
                <li>• Verify that columns don't contain only missing values</li>
                <li>• Try cleaning your data first to remove inconsistencies</li>
              </ul>
            </div>
            <button
              onClick={runAnalysis}
              className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
            >
              Retry Analysis
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysisResults) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Statistical Analysis</h3>
            <p className="text-sm text-gray-600 mt-1">
              Comprehensive analysis of your data including correlations, distributions, and descriptive statistics
            </p>
          </div>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'overview', label: '📋 Overview' },
            { id: 'descriptive', label: '📊 Descriptive Stats' },
            { id: 'correlation', label: '🔗 Correlations' },
            { id: 'distribution', label: '📈 Distributions' }
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

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'descriptive' && <DescriptiveTab />}
        {activeTab === 'correlation' && <CorrelationTab />}
        {activeTab === 'distribution' && <DistributionTab />}
      </div>
    </div>
  );
};

export default DataAnalysis;