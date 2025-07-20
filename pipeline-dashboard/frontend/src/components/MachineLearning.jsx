/*
Data Pipeline Dashboard - Machine Learning Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const MachineLearning = ({ 
  fileId, 
  sessionId,
  onModelComplete,
  onError 
}) => {
  const [columnInfo, setColumnInfo] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('supervised');
  const [modelConfig, setModelConfig] = useState({
    model_type: 'classification',
    algorithm: 'random_forest',
    target_column: '',
    feature_columns: [],
    test_size: 0.2,
    random_state: 42,
    cross_validation: true,
    cv_folds: 5
  });

  // Model configurations
  const modelTypes = {
    supervised: {
      classification: {
        name: 'Classification',
        icon: '🎯',
        description: 'Predict categories or classes',
        algorithms: {
          random_forest: { name: 'Random Forest', description: 'Ensemble method, good for most cases' },
          logistic_regression: { name: 'Logistic Regression', description: 'Linear model, interpretable' },
          svm: { name: 'Support Vector Machine', description: 'Good for high-dimensional data' },
          gradient_boosting: { name: 'Gradient Boosting', description: 'Powerful ensemble method' },
          naive_bayes: { name: 'Naive Bayes', description: 'Fast, good for text data' }
        }
      },
      regression: {
        name: 'Regression',
        icon: '📈',
        description: 'Predict continuous values',
        algorithms: {
          random_forest: { name: 'Random Forest', description: 'Ensemble method, handles non-linearity' },
          linear_regression: { name: 'Linear Regression', description: 'Simple, interpretable' },
          ridge: { name: 'Ridge Regression', description: 'Regularized linear regression' },
          lasso: { name: 'Lasso Regression', description: 'Feature selection + regularization' },
          gradient_boosting: { name: 'Gradient Boosting', description: 'Powerful ensemble method' }
        }
      }
    },
    unsupervised: {
      clustering: {
        name: 'Clustering',
        icon: '🔵',
        description: 'Group similar data points',
        algorithms: {
          kmeans: { name: 'K-Means', description: 'Popular clustering algorithm' },
          hierarchical: { name: 'Hierarchical', description: 'Creates cluster hierarchy' },
          dbscan: { name: 'DBSCAN', description: 'Density-based clustering' },
          gaussian_mixture: { name: 'Gaussian Mixture', description: 'Probabilistic clustering' }
        }
      },
      dimensionality_reduction: {
        name: 'Dimensionality Reduction',
        icon: '📊',
        description: 'Reduce feature dimensions',
        algorithms: {
          pca: { name: 'PCA', description: 'Principal Component Analysis' },
          tsne: { name: 't-SNE', description: 'Good for visualization' },
          umap: { name: 'UMAP', description: 'Preserves local structure' }
        }
      }
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

  const getAllColumns = () => columnInfo;

  // Get appropriate target columns
  const getTargetColumns = () => {
    if (activeTab === 'unsupervised') return [];
    
    switch (modelConfig.model_type) {
      case 'classification':
        return getCategoricalColumns();
      case 'regression':
        return getNumericColumns();
      default:
        return getAllColumns();
    }
  };

  // Toggle feature column selection
  const toggleFeatureColumn = (columnName) => {
    setModelConfig(prev => ({
      ...prev,
      feature_columns: prev.feature_columns.includes(columnName)
        ? prev.feature_columns.filter(col => col !== columnName)
        : [...prev.feature_columns, columnName]
    }));
  };

  // Select all numeric features
  const selectAllNumericFeatures = () => {
    const numericCols = getNumericColumns()
      .map(col => col.name)
      .filter(name => name !== modelConfig.target_column);
    setModelConfig(prev => ({ ...prev, feature_columns: numericCols }));
  };

  // Validate model configuration
  const validateConfig = () => {
    const errors = [];

    if (activeTab === 'supervised' && !modelConfig.target_column) {
      errors.push('Target column is required for supervised learning');
    }

    if (modelConfig.feature_columns.length === 0) {
      errors.push('At least one feature column is required');
    }

    if (modelConfig.feature_columns.includes(modelConfig.target_column)) {
      errors.push('Target column cannot be used as a feature');
    }

    return errors;
  };

  // Train model
  const trainModel = async () => {
    const validationErrors = validateConfig();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.modelData(sessionId, fileId, {
        model_category: activeTab,
        model_type: modelConfig.model_type,
        algorithm: modelConfig.algorithm,
        target_column: modelConfig.target_column || undefined,
        feature_columns: modelConfig.feature_columns,
        parameters: {
          test_size: modelConfig.test_size,
          random_state: modelConfig.random_state,
          cross_validation: modelConfig.cross_validation,
          cv_folds: modelConfig.cv_folds
        }
      });

      const newModel = {
        id: Date.now(),
        config: { ...modelConfig, model_category: activeTab },
        result: response,
        created_at: new Date().toISOString()
      };

      setModels(prev => [...prev, newModel]);
      onModelComplete?.(response);

    } catch (err) {
      console.error('Failed to train model:', err);
      const errorMessage = err.message || 'Failed to train model';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Remove model
  const removeModel = (modelId) => {
    setModels(prev => prev.filter(model => model.id !== modelId));
  };

  // Format metric value
  const formatMetric = (value) => {
    if (typeof value !== 'number') return value;
    return value.toFixed(4);
  };

  // Get metric color
  const getMetricColor = (metricName, value) => {
    if (typeof value !== 'number') return 'text-gray-600';
    
    // Higher is better metrics
    const higherBetter = ['accuracy', 'precision', 'recall', 'f1_score', 'r2_score'];
    // Lower is better metrics
    const lowerBetter = ['mse', 'rmse', 'mae'];
    
    if (higherBetter.includes(metricName.toLowerCase())) {
      if (value >= 0.9) return 'text-green-600';
      if (value >= 0.8) return 'text-blue-600';
      if (value >= 0.7) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    if (lowerBetter.includes(metricName.toLowerCase())) {
      if (value <= 0.1) return 'text-green-600';
      if (value <= 0.3) return 'text-blue-600';
      if (value <= 0.5) return 'text-yellow-600';
      return 'text-red-600';
    }
    
    return 'text-gray-600';
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Machine Learning</h3>
        <p className="text-sm text-gray-600">
          Build and evaluate machine learning models on your data
        </p>
      </div>

      {/* Learning Type Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {['supervised', 'unsupervised'].map((type) => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setModelConfig(prev => ({
                  ...prev,
                  model_type: type === 'supervised' ? 'classification' : 'clustering',
                  algorithm: type === 'supervised' ? 'random_forest' : 'kmeans',
                  target_column: '',
                  feature_columns: []
                }));
              }}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === type
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {type === 'supervised' ? '🎯 Supervised Learning' : '🔍 Unsupervised Learning'}
            </button>
          ))}
        </nav>
      </div>

      {/* Model Configuration */}
      <div className="p-6 border-b bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-4">Configure Model</h4>

        {/* Model Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Model Type</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(modelTypes[activeTab]).map(([type, config]) => (
              <button
                key={type}
                onClick={() => setModelConfig(prev => ({ 
                  ...prev, 
                  model_type: type,
                  algorithm: Object.keys(config.algorithms)[0]
                }))}
                className={`p-4 border rounded-lg text-left transition-all ${
                  modelConfig.model_type === type
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{config.icon}</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                <p className="text-sm text-gray-600">{config.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Algorithm Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Algorithm</label>
          <select
            value={modelConfig.algorithm}
            onChange={(e) => setModelConfig(prev => ({ ...prev, algorithm: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.entries(modelTypes[activeTab][modelConfig.model_type].algorithms).map(([alg, config]) => (
              <option key={alg} value={alg}>
                {config.name} - {config.description}
              </option>
            ))}
          </select>
        </div>

        {/* Target Column (Supervised only) */}
        {activeTab === 'supervised' && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target Column *
            </label>
            <select
              value={modelConfig.target_column}
              onChange={(e) => setModelConfig(prev => ({ 
                ...prev, 
                target_column: e.target.value,
                feature_columns: prev.feature_columns.filter(col => col !== e.target.value)
              }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select target column...</option>
              {getTargetColumns().map(col => (
                <option key={col.name} value={col.name}>
                  {col.name} ({col.data_type})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Feature Selection */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-gray-700">
              Feature Columns * ({modelConfig.feature_columns.length} selected)
            </label>
            <button
              onClick={selectAllNumericFeatures}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Select All Numeric
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
            {getAllColumns()
              .filter(col => col.name !== modelConfig.target_column)
              .map(col => (
              <label key={col.name} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={modelConfig.feature_columns.includes(col.name)}
                  onChange={() => toggleFeatureColumn(col.name)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm">
                  {col.name}
                  <span className="text-xs text-gray-500 ml-1">({col.data_type})</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {activeTab === 'supervised' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Size
              </label>
              <select
                value={modelConfig.test_size}
                onChange={(e) => setModelConfig(prev => ({ ...prev, test_size: parseFloat(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0.1}>10%</option>
                <option value={0.2}>20%</option>
                <option value={0.3}>30%</option>
                <option value={0.4}>40%</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Random State
            </label>
            <input
              type="number"
              value={modelConfig.random_state}
              onChange={(e) => setModelConfig(prev => ({ ...prev, random_state: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {activeTab === 'supervised' && (
            <>
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={modelConfig.cross_validation}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, cross_validation: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Cross Validation</span>
                </label>
              </div>

              {modelConfig.cross_validation && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CV Folds
                  </label>
                  <select
                    value={modelConfig.cv_folds}
                    onChange={(e) => setModelConfig(prev => ({ ...prev, cv_folds: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={3}>3</option>
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                  </select>
                </div>
              )}
            </>
          )}
        </div>

        {/* Train Button */}
        <button
          onClick={trainModel}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Training Model...' : 'Train Model'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-2">
              <div className="text-red-500 text-sm">❌</div>
              <div>
                <p className="text-red-800 text-sm font-medium">Model Training Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trained Models */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">
          Trained Models ({models.length})
        </h4>

        {models.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">🤖</div>
            <p>No models trained yet</p>
            <p className="text-sm mt-1">Configure and train your first model above</p>
          </div>
        ) : (
          <div className="space-y-6">
            {models.map((model) => (
              <div key={model.id} className="border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {modelTypes[model.config.model_category][model.config.model_type].icon}
                    </span>
                    <div>
                      <h5 className="font-medium text-gray-900">
                        {modelTypes[model.config.model_category][model.config.model_type].algorithms[model.config.algorithm].name}
                      </h5>
                      <p className="text-sm text-gray-600">
                        {modelTypes[model.config.model_category][model.config.model_type].name}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeModel(model.id)}
                    className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                  >
                    Remove
                  </button>
                </div>

                {/* Model Configuration */}
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {model.config.target_column && (
                      <div>
                        <span className="text-gray-600">Target:</span>
                        <span className="ml-2 font-medium">{model.config.target_column}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Features:</span>
                      <span className="ml-2 font-medium">{model.config.feature_columns.length}</span>
                    </div>
                    {model.config.test_size && (
                      <div>
                        <span className="text-gray-600">Test Size:</span>
                        <span className="ml-2 font-medium">{(model.config.test_size * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-600">Trained:</span>
                      <span className="ml-2 font-medium">{new Date(model.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Performance Metrics */}
                {model.result?.metrics && (
                  <div className="mb-4">
                    <h6 className="text-sm font-medium text-gray-700 mb-2">Performance Metrics</h6>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(model.result.metrics).map(([metric, value]) => (
                        <div key={metric} className="text-center p-3 bg-white border rounded">
                          <div className="text-xs text-gray-500 uppercase tracking-wide">
                            {metric.replace('_', ' ')}
                          </div>
                          <div className={`text-lg font-bold ${getMetricColor(metric, value)}`}>
                            {formatMetric(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Feature Importance */}
                {model.result?.feature_importance && (
                  <div>
                    <h6 className="text-sm font-medium text-gray-700 mb-2">Feature Importance</h6>
                    <div className="space-y-2">
                      {model.result.feature_importance.slice(0, 10).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <span className="w-24 text-sm text-gray-600 truncate">{item.feature}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${(item.importance / Math.max(...model.result.feature_importance.map(f => f.importance))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-16 text-right">
                            {formatMetric(item.importance)}
                          </span>
                        </div>
                      ))}
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

export default MachineLearning;