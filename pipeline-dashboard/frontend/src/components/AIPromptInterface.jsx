/*
Data Pipeline Dashboard - AI Prompt Interface Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect, useRef } from 'react';
import ApiService from '../services/api';
import { useNotifications } from '../hooks/useNotifications';
import { parsePrompt } from '../utils/promptParser';

const AIPromptInterface = ({ 
  fileId, 
  sessionId,
  onPromptExecute,
  onError,
  className = ""
}) => {
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedSteps, setParsedSteps] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [promptHistory, setPromptHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [activeTab, setActiveTab] = useState('input');
  const [error, setError] = useState(null);
  const [validationStatus, setValidationStatus] = useState(null);
  const [autoCompleteSuggestions, setAutoCompleteSuggestions] = useState([]);
  const [showAutoComplete, setShowAutoComplete] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  
  const textareaRef = useRef(null);
  const notifications = useNotifications();

  // Enhanced prompt templates with more comprehensive examples
  const promptTemplates = [
    {
      id: 'basic-analysis',
      title: 'Basic Data Analysis',
      description: 'Clean data, analyze statistics, and create visualizations',
      category: 'Beginner',
      prompt: 'Clean my data by removing missing values and outliers, then analyze the statistics and create a correlation heatmap visualization'
    },
    {
      id: 'ml-pipeline',
      title: 'Machine Learning Pipeline',
      description: 'Complete ML workflow from cleaning to modeling',
      category: 'Advanced',
      prompt: 'Clean the data by handling missing values with median imputation, analyze feature correlations, create visualizations for key relationships, then build a classification model with 80/20 train-test split and evaluate performance'
    },
    {
      id: 'data-quality',
      title: 'Data Quality Assessment',
      description: 'Comprehensive data quality and validation check',
      category: 'Intermediate',
      prompt: 'Preview the data structure, check for missing values and outliers, validate data types and ranges, then generate a comprehensive quality report with recommendations'
    },
    {
      id: 'export-pipeline',
      title: 'Process and Export',
      description: 'Clean, analyze, and export in multiple formats',
      category: 'Beginner',
      prompt: 'Clean the data by handling missing values and duplicates, analyze basic statistics and distributions, then convert and export to JSON, Parquet, and CSV formats'
    },
    {
      id: 'visualization-suite',
      title: 'Comprehensive Visualization',
      description: 'Create multiple chart types for data exploration',
      category: 'Intermediate',
      prompt: 'Analyze the data statistics and distributions, then create a bar chart for categorical data, line chart for trends, scatter plot for correlations, and histogram for distributions'
    },
    {
      id: 'time-series',
      title: 'Time Series Analysis',
      description: 'Analyze temporal data patterns and trends',
      category: 'Advanced',
      prompt: 'Clean the time series data, analyze trends and seasonality, create time-based visualizations, then forecast future values using appropriate models'
    },
    {
      id: 'feature-engineering',
      title: 'Feature Engineering Pipeline',
      description: 'Advanced data preparation for machine learning',
      category: 'Advanced',
      prompt: 'Clean the data, create new features from existing columns, analyze feature importance, normalize numerical features, encode categorical variables, then prepare for modeling'
    },
    {
      id: 'quick-insights',
      title: 'Quick Data Insights',
      description: 'Fast overview of your dataset',
      category: 'Beginner',
      prompt: 'Preview the data, show summary statistics, identify missing values, and create a simple visualization to understand the data distribution'
    },
    {
      id: 'anomaly-detection',
      title: 'Anomaly Detection',
      description: 'Identify outliers and unusual patterns',
      category: 'Advanced',
      prompt: 'Clean the data, analyze statistical distributions, detect outliers using multiple methods, visualize anomalies, then generate a report of unusual patterns'
    },
    {
      id: 'comparison-analysis',
      title: 'Comparative Analysis',
      description: 'Compare different groups or segments in data',
      category: 'Intermediate',
      prompt: 'Clean the data, group by categorical variables, analyze differences between groups, create comparative visualizations, then summarize key insights'
    }
  ];

  // Load prompt history and favorites from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('ai-prompt-history');
    const savedFavorites = localStorage.getItem('ai-prompt-favorites');
    
    if (savedHistory) {
      try {
        setPromptHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load prompt history:', error);
      }
    }
    
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
  }, []);

  // Save prompt history to localStorage
  const saveToHistory = (promptText) => {
    const newEntry = {
      id: Date.now(),
      prompt: promptText,
      timestamp: new Date().toISOString(),
      fileId,
      sessionId
    };

    const updatedHistory = [newEntry, ...promptHistory.slice(0, 19)]; // Keep last 20
    setPromptHistory(updatedHistory);
    localStorage.setItem('ai-prompt-history', JSON.stringify(updatedHistory));
  };

  // Add to favorites
  const addToFavorites = (promptText, title = '') => {
    const newFavorite = {
      id: Date.now(),
      title: title || `Favorite ${favorites.length + 1}`,
      prompt: promptText,
      timestamp: new Date().toISOString()
    };

    const updatedFavorites = [...favorites, newFavorite];
    setFavorites(updatedFavorites);
    localStorage.setItem('ai-prompt-favorites', JSON.stringify(updatedFavorites));
    notifications.success('Added to favorites');
  };

  // Remove from favorites
  const removeFromFavorites = (favoriteId) => {
    const updatedFavorites = favorites.filter(fav => fav.id !== favoriteId);
    setFavorites(updatedFavorites);
    localStorage.setItem('ai-prompt-favorites', JSON.stringify(updatedFavorites));
    notifications.success('Removed from favorites');
  };

  // Parse prompt into pipeline steps using local parser
  const parsePromptLocal = async (promptText) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get available columns from file preview if available
      let availableColumns = [];
      try {
        if (fileId) {
          const previewResponse = await ApiService.previewData(fileId);
          availableColumns = previewResponse.summary?.columns || [];
        }
      } catch (err) {
        console.warn('Could not fetch column info for parsing:', err);
      }

      // Use local prompt parser
      const parseResult = parsePrompt(promptText, availableColumns);
      
      if (parseResult.success && parseResult.steps.length > 0) {
        setParsedSteps(parseResult.steps);
        setShowPreview(true);
        setSuggestions(parseResult.suggestions || []);
        
        // Show warnings if any
        if (parseResult.warnings.length > 0) {
          parseResult.warnings.forEach(warning => {
            notifications.warning(warning);
          });
        }
      } else {
        const errorMsg = parseResult.errors.length > 0 
          ? parseResult.errors.join('; ') 
          : 'Could not parse prompt into valid pipeline steps';
        throw new Error(errorMsg);
      }
    } catch (err) {
      console.error('Failed to parse prompt:', err);
      const errorMessage = err.message || 'Failed to parse prompt';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle prompt submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!prompt.trim()) {
      notifications.warning('Please enter a prompt');
      return;
    }

    if (!fileId) {
      notifications.error('Please upload a file first');
      return;
    }

    saveToHistory(prompt.trim());
    await parsePromptLocal(prompt.trim());
  };

  // Execute parsed steps
  const executeSteps = async () => {
    if (!parsedSteps.length) return;

    setIsProcessing(true);
    
    try {
      onPromptExecute?.(parsedSteps);
      notifications.success('AI pipeline execution started');
      setShowPreview(false);
      setPrompt('');
    } catch (err) {
      console.error('Failed to execute steps:', err);
      notifications.error('Failed to execute pipeline');
    } finally {
      setIsProcessing(false);
    }
  };

  // Load template prompt
  const loadTemplate = (template) => {
    setPrompt(template.prompt);
    setActiveTab('input');
    textareaRef.current?.focus();
  };

  // Load from history
  const loadFromHistory = (historyItem) => {
    setPrompt(historyItem.prompt);
    setActiveTab('input');
    textareaRef.current?.focus();
  };

  // Load from favorites
  const loadFromFavorites = (favorite) => {
    setPrompt(favorite.prompt);
    setActiveTab('input');
    textareaRef.current?.focus();
  };

  // Auto-completion suggestions
  const getAutoCompleteSuggestions = (text, position) => {
    const beforeCursor = text.substring(0, position);
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1].toLowerCase();

    const suggestions = [];

    // Common data operations
    const operations = [
      'clean', 'analyze', 'visualize', 'model', 'predict', 'export', 'convert',
      'validate', 'transform', 'filter', 'group', 'sort', 'aggregate'
    ];

    // Data cleaning terms
    const cleaningTerms = [
      'missing values', 'outliers', 'duplicates', 'null values', 'empty rows',
      'data types', 'normalization', 'standardization'
    ];

    // Analysis terms
    const analysisTerms = [
      'statistics', 'correlation', 'distribution', 'summary', 'trends',
      'patterns', 'relationships', 'insights'
    ];

    // Visualization terms
    const visualizationTerms = [
      'bar chart', 'line chart', 'scatter plot', 'histogram', 'heatmap',
      'box plot', 'pie chart', 'violin plot'
    ];

    // Machine learning terms
    const mlTerms = [
      'classification', 'regression', 'clustering', 'feature selection',
      'cross validation', 'hyperparameter tuning', 'model evaluation'
    ];

    // Export formats
    const exportFormats = [
      'CSV', 'JSON', 'Parquet', 'Excel', 'SQL', 'XML'
    ];

    const allTerms = [
      ...operations,
      ...cleaningTerms,
      ...analysisTerms,
      ...visualizationTerms,
      ...mlTerms,
      ...exportFormats
    ];

    // Filter suggestions based on current word
    if (currentWord.length > 1) {
      const filtered = allTerms.filter(term => 
        term.toLowerCase().includes(currentWord) && 
        term.toLowerCase() !== currentWord
      );
      suggestions.push(...filtered.slice(0, 5));
    }

    return suggestions;
  };

  // Handle text area input with auto-completion
  const handlePromptChange = (e) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    
    setPrompt(newValue);
    setCursorPosition(position);

    // Get auto-complete suggestions
    const suggestions = getAutoCompleteSuggestions(newValue, position);
    setAutoCompleteSuggestions(suggestions);
    setShowAutoComplete(suggestions.length > 0 && newValue.length > 2);

    // Validate prompt in real-time
    validatePrompt(newValue);
  };

  // Validate prompt structure and content
  const validatePrompt = (promptText) => {
    if (!promptText.trim()) {
      setValidationStatus(null);
      return;
    }

    const validation = {
      isValid: true,
      warnings: [],
      suggestions: []
    };

    // Check for basic structure
    if (promptText.length < 10) {
      validation.warnings.push('Prompt seems too short for meaningful processing');
    }

    if (promptText.length > 500) {
      validation.warnings.push('Very long prompts might be harder to parse accurately');
    }

    // Check for action words
    const actionWords = ['clean', 'analyze', 'visualize', 'model', 'export', 'convert', 'validate'];
    const hasAction = actionWords.some(word => promptText.toLowerCase().includes(word));
    
    if (!hasAction) {
      validation.warnings.push('Consider adding action words like "clean", "analyze", or "visualize"');
    }

    // Check for sequence indicators
    const sequenceWords = ['then', 'after', 'next', 'finally', 'and then'];
    const hasSequence = sequenceWords.some(word => promptText.toLowerCase().includes(word));
    
    if (promptText.split(' ').length > 15 && !hasSequence) {
      validation.suggestions.push('Use sequence words like "then" or "after" to clarify step order');
    }

    // Check for specific parameters
    if (promptText.toLowerCase().includes('missing') && !promptText.toLowerCase().includes('remove') && !promptText.toLowerCase().includes('fill')) {
      validation.suggestions.push('Specify how to handle missing values (remove, fill with mean/median)');
    }

    setValidationStatus(validation);
  };

  // Insert auto-complete suggestion
  const insertSuggestion = (suggestion) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const beforeCursor = prompt.substring(0, cursorPosition);
    const afterCursor = prompt.substring(cursorPosition);
    const words = beforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    // Replace the current word with the suggestion
    const newBefore = beforeCursor.substring(0, beforeCursor.length - currentWord.length);
    const newPrompt = newBefore + suggestion + afterCursor;
    
    setPrompt(newPrompt);
    setShowAutoComplete(false);
    
    // Set cursor position after the inserted suggestion
    setTimeout(() => {
      const newPosition = newBefore.length + suggestion.length;
      textarea.setSelectionRange(newPosition, newPosition);
      textarea.focus();
    }, 0);
  };

  // Enhanced real-time parsing feedback (debounced)
  useEffect(() => {
    if (!prompt.trim()) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(() => {
      // Enhanced keyword-based suggestions with context awareness
      const keywords = prompt.toLowerCase();
      const newSuggestions = [];

      // Data cleaning suggestions
      if (keywords.includes('clean')) {
        newSuggestions.push('💡 Consider specifying how to handle missing values (remove, fill with mean/median/mode)');
        if (!keywords.includes('outlier')) {
          newSuggestions.push('💡 You might also want to handle outliers (remove, cap, or transform)');
        }
      }

      // Analysis suggestions
      if (keywords.includes('analyze') || keywords.includes('statistics')) {
        newSuggestions.push('💡 You can request specific statistics like correlation, distribution, or summary stats');
        if (!keywords.includes('group')) {
          newSuggestions.push('💡 Consider grouping analysis by categorical columns for deeper insights');
        }
      }

      // Visualization suggestions
      if (keywords.includes('visualize') || keywords.includes('chart') || keywords.includes('plot')) {
        newSuggestions.push('💡 Specify chart types: bar, line, scatter, histogram, heatmap, or box plot');
        if (!keywords.includes('color') && !keywords.includes('group')) {
          newSuggestions.push('💡 Consider using color coding or grouping to show additional dimensions');
        }
      }

      // Machine learning suggestions
      if (keywords.includes('model') || keywords.includes('predict') || keywords.includes('machine learning') || keywords.includes('ml')) {
        newSuggestions.push('💡 Mention your target variable and whether it\'s classification or regression');
        if (!keywords.includes('feature')) {
          newSuggestions.push('💡 Consider specifying which features to use or exclude from the model');
        }
        if (!keywords.includes('split') && !keywords.includes('train')) {
          newSuggestions.push('💡 You might want to specify train/test split ratio (default is 80/20)');
        }
      }

      // Export/conversion suggestions
      if (keywords.includes('export') || keywords.includes('convert') || keywords.includes('save')) {
        newSuggestions.push('💡 Specify output formats: CSV, JSON, Parquet, Excel, or SQL');
        if (!keywords.includes('filter') && !keywords.includes('select')) {
          newSuggestions.push('💡 Consider filtering or selecting specific columns for export');
        }
      }

      // Schema validation suggestions
      if (keywords.includes('schema') || keywords.includes('validate') || keywords.includes('check')) {
        newSuggestions.push('💡 You can validate data types, ranges, patterns, or custom business rules');
      }

      // General workflow suggestions
      if (keywords.split(' ').length > 10 && !keywords.includes('then') && !keywords.includes('after')) {
        newSuggestions.push('💡 Use words like "then", "after", or "next" to clearly separate pipeline steps');
      }

      // Column-specific suggestions (if we have column info)
      if (keywords.includes('column') || keywords.includes('field')) {
        newSuggestions.push('💡 You can reference specific column names from your dataset');
      }

      setSuggestions(newSuggestions);
    }, 800); // Reduced debounce time for more responsive feedback

    return () => clearTimeout(timeoutId);
  }, [prompt]);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              🤖 AI Pipeline Assistant
            </h3>
            <p className="text-sm text-gray-600">
              Describe what you want to do with your data in natural language
            </p>
          </div>
          {prompt.trim() && (
            <button
              onClick={() => addToFavorites(prompt.trim())}
              className="px-3 py-1 text-sm bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200 transition-colors"
              title="Add to favorites"
            >
              ⭐ Save
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'input', label: '💬 Prompt Input' },
            { id: 'templates', label: '📋 Templates' },
            { id: 'history', label: '🕒 History' },
            { id: 'favorites', label: '⭐ Favorites' }
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
        {/* Prompt Input Tab */}
        {activeTab === 'input' && (
          <div className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your data processing workflow
                </label>
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={handlePromptChange}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setShowAutoComplete(false);
                      }
                    }}
                    placeholder="Example: Clean my data by removing missing values, then analyze the correlations and create a heatmap visualization..."
                    rows={6}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 resize-none transition-colors ${
                      validationStatus?.isValid === false 
                        ? 'border-red-300 focus:ring-red-500' 
                        : validationStatus?.warnings?.length > 0
                        ? 'border-yellow-300 focus:ring-yellow-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={isProcessing}
                  />
                  
                  {/* Auto-complete dropdown */}
                  {showAutoComplete && autoCompleteSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                      {autoCompleteSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => insertSuggestion(suggestion)}
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 hover:text-blue-900 text-sm border-b border-gray-100 last:border-b-0"
                        >
                          <span className="font-medium">{suggestion}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Validation status */}
                {validationStatus && (validationStatus.warnings.length > 0 || validationStatus.suggestions.length > 0) && (
                  <div className="mt-2 space-y-1">
                    {validationStatus.warnings.map((warning, index) => (
                      <div key={`warning-${index}`} className="flex items-start space-x-2 text-sm text-yellow-700">
                        <span>⚠️</span>
                        <span>{warning}</span>
                      </div>
                    ))}
                    {validationStatus.suggestions.map((suggestion, index) => (
                      <div key={`suggestion-${index}`} className="flex items-start space-x-2 text-sm text-blue-700">
                        <span>💡</span>
                        <span>{suggestion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  {prompt.length}/1000 characters
                </div>
                <button
                  type="submit"
                  disabled={isProcessing || !prompt.trim() || !fileId}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isProcessing ? 'Processing...' : 'Parse Prompt'}
                </button>
              </div>
            </form>

            {/* Real-time Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">💡 Suggestions</h4>
                <ul className="space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-blue-800">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start space-x-2">
                  <div className="text-red-500 text-sm">❌</div>
                  <div>
                    <p className="text-red-800 text-sm font-medium">Parsing Error</p>
                    <p className="text-red-700 text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === 'templates' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Choose a template to get started</h4>
              <div className="text-sm text-gray-500">
                {promptTemplates.length} templates available
              </div>
            </div>
            
            {/* Category filters */}
            <div className="flex flex-wrap gap-2">
              {['All', 'Beginner', 'Intermediate', 'Advanced'].map((category) => (
                <button
                  key={category}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    category === 'All' 
                      ? 'bg-blue-100 text-blue-800 border-blue-200' 
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {promptTemplates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all group"
                  onClick={() => loadTemplate(template)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-gray-900 group-hover:text-blue-900">
                      {template.title}
                    </h5>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      template.category === 'Beginner' 
                        ? 'bg-green-100 text-green-800'
                        : template.category === 'Intermediate'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {template.category}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                  <div className="bg-gray-50 rounded p-2 group-hover:bg-blue-100 transition-colors">
                    <p className="text-xs text-gray-600 italic line-clamp-3">
                      "{template.prompt}"
                    </p>
                  </div>
                  <div className="mt-3 flex items-center text-xs text-gray-500">
                    <span>Click to use this template</span>
                    <span className="ml-auto">→</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Recent prompts</h4>
            {promptHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">🕒</div>
                <p>No prompt history yet</p>
                <p className="text-sm mt-1">Your recent prompts will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {promptHistory.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:bg-gray-50 cursor-pointer transition-all"
                    onClick={() => loadFromHistory(item)}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-sm text-gray-900 flex-1">{item.prompt}</p>
                      <span className="text-xs text-gray-500 ml-2">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Saved favorites</h4>
            {favorites.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="text-2xl mb-2">⭐</div>
                <p>No favorites saved yet</p>
                <p className="text-sm mt-1">Save prompts you use frequently</p>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 hover:bg-gray-50 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 cursor-pointer" onClick={() => loadFromFavorites(favorite)}>
                        <h5 className="font-medium text-gray-900 mb-1">{favorite.title}</h5>
                        <p className="text-sm text-gray-600">{favorite.prompt}</p>
                        <span className="text-xs text-gray-500">
                          Saved {new Date(favorite.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <button
                        onClick={() => removeFromFavorites(favorite.id)}
                        className="ml-2 p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove from favorites"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Step Preview Modal */}
      {showPreview && parsedSteps.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                🔍 Parsed Pipeline Steps
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Review the steps before execution
              </p>
            </div>
            
            <div className="p-6 max-h-96 overflow-y-auto">
              <div className="space-y-4">
                {parsedSteps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{step.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                      {step.parameters && Object.keys(step.parameters).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          Parameters: {JSON.stringify(step.parameters)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeSteps}
                disabled={isProcessing}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isProcessing ? 'Executing...' : 'Execute Pipeline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPromptInterface;