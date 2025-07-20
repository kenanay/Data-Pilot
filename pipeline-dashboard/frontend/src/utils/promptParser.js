/*
Data Pipeline Dashboard - Prompt Parser Utility

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

/**
 * Natural Language Prompt Parser for Pipeline Operations
 */

// Keywords and patterns for different operations
const OPERATION_PATTERNS = {
  // Data Cleaning Operations
  clean: {
    keywords: ['clean', 'remove', 'handle', 'fix', 'process', 'prepare'],
    subOperations: {
      missing: ['missing', 'null', 'empty', 'na', 'nan'],
      outliers: ['outlier', 'anomal', 'extreme', 'unusual'],
      duplicates: ['duplicate', 'repeat', 'same'],
      normalize: ['normalize', 'standard', 'scale']
    },
    methods: {
      drop: ['drop', 'remove', 'delete', 'eliminate'],
      fill: ['fill', 'replace', 'substitute', 'impute'],
      mean: ['mean', 'average'],
      median: ['median', 'middle'],
      mode: ['mode', 'most common', 'frequent']
    }
  },

  // Data Analysis Operations
  analyze: {
    keywords: ['analyze', 'analysis', 'examine', 'study', 'investigate', 'explore'],
    subOperations: {
      statistics: ['statistic', 'stat', 'summary', 'describe'],
      correlation: ['correlation', 'corr', 'relationship', 'association'],
      distribution: ['distribution', 'spread', 'pattern'],
      trend: ['trend', 'pattern', 'change over time']
    }
  },

  // Visualization Operations
  visualize: {
    keywords: ['visualize', 'plot', 'chart', 'graph', 'show', 'display', 'create visualization', 'create', 'visualization'],
    chartTypes: {
      bar: ['bar', 'column', 'bar chart'],
      line: ['line', 'time series', 'trend line'],
      scatter: ['scatter', 'point', 'xy plot'],
      histogram: ['histogram', 'distribution', 'frequency'],
      heatmap: ['heatmap', 'correlation matrix', 'heat map'],
      box: ['box plot', 'boxplot', 'quartile']
    }
  },

  // Machine Learning Operations
  model: {
    keywords: ['model', 'predict', 'machine learning', 'ml', 'train', 'build model'],
    types: {
      classification: ['classify', 'classification', 'category', 'class'],
      regression: ['regression', 'predict value', 'continuous'],
      clustering: ['cluster', 'group', 'segment', 'unsupervised']
    },
    algorithms: {
      'random_forest': ['random forest', 'rf'],
      'linear_regression': ['linear regression', 'linear'],
      'logistic_regression': ['logistic regression', 'logistic'],
      'svm': ['svm', 'support vector'],
      'kmeans': ['kmeans', 'k-means']
    }
  },

  // Data Export Operations
  convert: {
    keywords: ['convert', 'export', 'save', 'download', 'output'],
    formats: {
      csv: ['csv', 'comma separated'],
      json: ['json', 'javascript object'],
      parquet: ['parquet', 'apache parquet'],
      excel: ['excel', 'xlsx', 'spreadsheet']
    }
  },

  // Schema Validation Operations
  validate: {
    keywords: ['validate', 'check', 'verify', 'compliance', 'schema'],
    types: {
      schema: ['schema', 'structure', 'format'],
      quality: ['quality', 'integrity', 'consistency'],
      rules: ['rules', 'constraints', 'requirements']
    }
  },

  // Report Generation Operations
  report: {
    keywords: ['report', 'summary', 'document', 'generate report'],
    formats: {
      pdf: ['pdf', 'portable document'],
      html: ['html', 'web page']
    }
  }
};

// Column detection patterns
const COLUMN_PATTERNS = {
  target: ['target', 'label', 'outcome', 'dependent', 'y variable'],
  feature: ['feature', 'predictor', 'independent', 'x variable'],
  id: ['id', 'identifier', 'key'],
  date: ['date', 'time', 'timestamp'],
  numeric: ['number', 'numeric', 'value', 'amount', 'price', 'age', 'count']
};

/**
 * Parse natural language prompt into structured pipeline steps
 * @param {string} prompt - Natural language prompt
 * @param {Array} availableColumns - Available columns in the dataset
 * @returns {Object} - Parsed steps and metadata
 */
export const parsePrompt = (prompt, availableColumns = []) => {
  const steps = [];
  const suggestions = [];
  const warnings = [];
  
  // Normalize prompt
  const normalizedPrompt = prompt.toLowerCase().trim();
  
  // Split into sentences for better parsing
  const sentences = normalizedPrompt.split(/[.!?;]/).filter(s => s.trim());
  
  // Parse each sentence for operations
  sentences.forEach((sentence, index) => {
    const detectedOps = detectOperations(sentence, availableColumns);
    steps.push(...detectedOps.steps);
    suggestions.push(...detectedOps.suggestions);
    warnings.push(...detectedOps.warnings);
  });

  // Remove duplicates and sort steps by logical order
  const uniqueSteps = removeDuplicateSteps(steps);
  const orderedSteps = orderSteps(uniqueSteps);
  
  // Add step dependencies
  const stepsWithDependencies = addDependencies(orderedSteps);
  
  // Validate step sequence
  const validation = validateStepSequence(stepsWithDependencies);
  
  return {
    success: validation.isValid,
    steps: stepsWithDependencies,
    suggestions: [...new Set(suggestions)],
    warnings: [...new Set(warnings)],
    errors: validation.errors,
    metadata: {
      originalPrompt: prompt,
      parsedSentences: sentences.length,
      detectedOperations: steps.length,
      confidence: calculateConfidence(stepsWithDependencies, prompt)
    }
  };
};

/**
 * Detect operations in a sentence
 * @param {string} sentence - Sentence to analyze
 * @param {Array} availableColumns - Available columns
 * @returns {Object} - Detected operations
 */
const detectOperations = (sentence, availableColumns) => {
  const steps = [];
  const suggestions = [];
  const warnings = [];
  
  // Check for each operation type
  Object.entries(OPERATION_PATTERNS).forEach(([opType, config]) => {
    const isMatch = config.keywords.some(keyword => sentence.includes(keyword));
    
    if (isMatch) {
      const step = createStepFromOperation(opType, sentence, config, availableColumns);
      if (step) {
        steps.push(step);
        
        // Add suggestions based on operation
        const opSuggestions = generateOperationSuggestions(opType, sentence, availableColumns);
        suggestions.push(...opSuggestions);
      }
    }
  });
  
  // Check for column references
  const columnRefs = detectColumnReferences(sentence, availableColumns);
  if (columnRefs.length > 0) {
    // Update steps with column information
    steps.forEach(step => {
      if (!step.parameters.columns) {
        step.parameters.columns = columnRefs;
      }
    });
  }
  
  return { steps, suggestions, warnings };
};

/**
 * Create a step object from detected operation
 * @param {string} opType - Operation type
 * @param {string} sentence - Original sentence
 * @param {Object} config - Operation configuration
 * @param {Array} availableColumns - Available columns
 * @returns {Object} - Step object
 */
const createStepFromOperation = (opType, sentence, config, availableColumns) => {
  const step = {
    id: generateStepId(),
    name: getOperationName(opType),
    description: getOperationDescription(opType, sentence),
    type: opType,
    parameters: {},
    estimatedDuration: getEstimatedDuration(opType),
    dependencies: [],
    continueOnError: false
  };

  // Extract specific parameters based on operation type
  switch (opType) {
    case 'clean':
      step.parameters = extractCleaningParameters(sentence, config);
      break;
    case 'analyze':
      step.parameters = extractAnalysisParameters(sentence, config);
      break;
    case 'visualize':
      step.parameters = extractVisualizationParameters(sentence, config, availableColumns);
      break;
    case 'model':
      step.parameters = extractModelingParameters(sentence, config, availableColumns);
      break;
    case 'convert':
      step.parameters = extractConversionParameters(sentence, config);
      break;
    case 'validate':
      step.parameters = extractValidationParameters(sentence, config);
      break;
    case 'report':
      step.parameters = extractReportParameters(sentence, config);
      break;
  }

  return step;
};

/**
 * Extract cleaning operation parameters
 * @param {string} sentence - Sentence to analyze
 * @param {Object} config - Operation configuration
 * @returns {Object} - Cleaning parameters
 */
const extractCleaningParameters = (sentence, config) => {
  const parameters = {
    operations: []
  };

  // Check for missing value handling
  if (config.subOperations.missing.some(keyword => sentence.includes(keyword))) {
    const method = detectMethod(sentence, config.methods);
    parameters.operations.push({
      type: 'handle_missing',
      method: method || 'drop',
      columns: 'all'
    });
  }

  // Check for outlier handling
  if (config.subOperations.outliers.some(keyword => sentence.includes(keyword))) {
    parameters.operations.push({
      type: 'handle_outliers',
      method: 'iqr',
      threshold: 1.5
    });
  }

  // Check for duplicate handling
  if (config.subOperations.duplicates.some(keyword => sentence.includes(keyword))) {
    parameters.operations.push({
      type: 'remove_duplicates',
      subset: null
    });
  }

  return parameters;
};

/**
 * Extract analysis operation parameters
 * @param {string} sentence - Sentence to analyze
 * @param {Object} config - Operation configuration
 * @returns {Object} - Analysis parameters
 */
const extractAnalysisParameters = (sentence, config) => {
  const parameters = {
    analyses: []
  };

  // Check for specific analysis types
  if (config.subOperations.statistics.some(keyword => sentence.includes(keyword))) {
    parameters.analyses.push('descriptive_statistics');
  }

  if (config.subOperations.correlation.some(keyword => sentence.includes(keyword))) {
    parameters.analyses.push('correlation_analysis');
  }

  if (config.subOperations.distribution.some(keyword => sentence.includes(keyword))) {
    parameters.analyses.push('distribution_analysis');
  }

  // Default to basic statistics if no specific analysis mentioned
  if (parameters.analyses.length === 0) {
    parameters.analyses.push('descriptive_statistics');
  }

  return parameters;
};

/**
 * Extract visualization operation parameters
 * @param {string} sentence - Sentence to analyze
 * @param {Object} config - Operation configuration
 * @param {Array} availableColumns - Available columns
 * @returns {Object} - Visualization parameters
 */
const extractVisualizationParameters = (sentence, config, availableColumns) => {
  const parameters = {
    charts: []
  };

  // Detect chart types
  Object.entries(config.chartTypes).forEach(([chartType, keywords]) => {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      const chart = {
        type: chartType,
        title: `${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart`
      };

      // Try to detect columns for axes
      const numericColumns = availableColumns.filter(col => 
        col.data_type && (col.data_type.includes('int') || col.data_type.includes('float'))
      );

      if (chartType === 'scatter' && numericColumns.length >= 2) {
        chart.x_column = numericColumns[0].name;
        chart.y_column = numericColumns[1].name;
      } else if (chartType === 'heatmap') {
        chart.method = 'correlation';
      }

      parameters.charts.push(chart);
    }
  });

  // Default to correlation heatmap if no specific chart mentioned
  if (parameters.charts.length === 0) {
    parameters.charts.push({
      type: 'heatmap',
      method: 'correlation',
      title: 'Correlation Heatmap'
    });
  }

  return parameters;
};

/**
 * Extract modeling operation parameters
 * @param {string} sentence - Sentence to analyze
 * @param {Object} config - Operation configuration
 * @param {Array} availableColumns - Available columns
 * @returns {Object} - Modeling parameters
 */
const extractModelingParameters = (sentence, config, availableColumns) => {
  const parameters = {
    model_type: 'classification',
    algorithm: 'random_forest'
  };

  // Detect model type
  Object.entries(config.types).forEach(([type, keywords]) => {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      parameters.model_type = type;
    }
  });

  // Detect algorithm
  Object.entries(config.algorithms).forEach(([algorithm, keywords]) => {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      parameters.algorithm = algorithm;
    }
  });

  // Try to detect target column
  const targetColumn = detectTargetColumn(sentence, availableColumns);
  if (targetColumn) {
    parameters.target_column = targetColumn;
  }

  return parameters;
};

/**
 * Extract conversion operation parameters
 * @param {string} sentence - Sentence to analyze
 * @param {Object} config - Operation configuration
 * @returns {Object} - Conversion parameters
 */
const extractConversionParameters = (sentence, config) => {
  const parameters = {
    formats: []
  };

  // Detect output formats
  Object.entries(config.formats).forEach(([format, keywords]) => {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      parameters.formats.push(format);
    }
  });

  // Default to CSV if no format specified
  if (parameters.formats.length === 0) {
    parameters.formats.push('csv');
  }

  return parameters;
};

/**
 * Extract validation operation parameters
 * @param {string} sentence - Sentence to analyze
 * @param {Object} config - Operation configuration
 * @returns {Object} - Validation parameters
 */
const extractValidationParameters = (sentence, config) => {
  const parameters = {
    validation_type: 'basic_schema',
    strict_mode: true
  };

  // Check for specific validation types
  if (config.types.quality.some(keyword => sentence.includes(keyword))) {
    parameters.validation_type = 'data_quality';
  }

  if (config.types.rules.some(keyword => sentence.includes(keyword))) {
    parameters.validation_type = 'custom_rules';
  }

  return parameters;
};

/**
 * Extract report operation parameters
 * @param {string} sentence - Sentence to analyze
 * @param {Object} config - Operation configuration
 * @returns {Object} - Report parameters
 */
const extractReportParameters = (sentence, config) => {
  const parameters = {
    format: 'pdf',
    sections: ['summary', 'analysis', 'visualizations']
  };

  // Detect output format
  Object.entries(config.formats).forEach(([format, keywords]) => {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      parameters.format = format;
    }
  });

  return parameters;
};

/**
 * Detect column references in sentence
 * @param {string} sentence - Sentence to analyze
 * @param {Array} availableColumns - Available columns
 * @returns {Array} - Referenced columns
 */
const detectColumnReferences = (sentence, availableColumns) => {
  const references = [];
  
  availableColumns.forEach(column => {
    if (sentence.includes(column.name.toLowerCase())) {
      references.push(column.name);
    }
  });

  return references;
};

/**
 * Detect target column for modeling
 * @param {string} sentence - Sentence to analyze
 * @param {Array} availableColumns - Available columns
 * @returns {string|null} - Target column name
 */
const detectTargetColumn = (sentence, availableColumns) => {
  // Look for explicit target mentions
  const targetPatterns = COLUMN_PATTERNS.target;
  
  for (const pattern of targetPatterns) {
    const regex = new RegExp(`${pattern}\\s+(is\\s+|column\\s+)?([\\w_]+)`, 'i');
    const match = sentence.match(regex);
    if (match && match[2]) {
      const columnName = match[2];
      const column = availableColumns.find(col => 
        col.name.toLowerCase() === columnName.toLowerCase()
      );
      if (column) {
        return column.name;
      }
    }
  }

  // Look for "using X as target" or "with X as target" patterns
  const usingAsTargetRegex = /(using|with)\s+(\w+)\s+as\s+(target|label)/i;
  const match = sentence.match(usingAsTargetRegex);
  if (match && match[2]) {
    const columnName = match[2];
    const column = availableColumns.find(col => 
      col.name.toLowerCase() === columnName.toLowerCase()
    );
    if (column) {
      return column.name;
    }
  }

  return null;
};

/**
 * Detect method from sentence
 * @param {string} sentence - Sentence to analyze
 * @param {Object} methods - Available methods
 * @returns {string|null} - Detected method
 */
const detectMethod = (sentence, methods) => {
  for (const [method, keywords] of Object.entries(methods)) {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      return method;
    }
  }
  return null;
};

/**
 * Generate operation suggestions
 * @param {string} opType - Operation type
 * @param {string} sentence - Original sentence
 * @param {Array} availableColumns - Available columns
 * @returns {Array} - Suggestions
 */
const generateOperationSuggestions = (opType, sentence, availableColumns) => {
  const suggestions = [];

  switch (opType) {
    case 'clean':
      if (!sentence.includes('missing') && !sentence.includes('outlier')) {
        suggestions.push('Consider specifying how to handle missing values and outliers');
      }
      break;
    case 'analyze':
      if (!sentence.includes('correlation') && !sentence.includes('statistics')) {
        suggestions.push('You can specify correlation analysis or descriptive statistics');
      }
      break;
    case 'visualize':
      if (!sentence.includes('chart') && !sentence.includes('plot')) {
        suggestions.push('Consider specifying chart types (bar, line, scatter, heatmap)');
      }
      break;
    case 'model':
      if (!sentence.includes('target') && !sentence.includes('predict')) {
        suggestions.push('Specify your target variable for machine learning');
      }
      break;
  }

  return suggestions;
};

/**
 * Remove duplicate steps
 * @param {Array} steps - Array of steps
 * @returns {Array} - Unique steps
 */
const removeDuplicateSteps = (steps) => {
  const unique = [];
  const seen = new Set();

  steps.forEach(step => {
    const key = `${step.type}-${JSON.stringify(step.parameters)}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(step);
    }
  });

  return unique;
};

/**
 * Order steps by logical sequence
 * @param {Array} steps - Array of steps
 * @returns {Array} - Ordered steps
 */
const orderSteps = (steps) => {
  const order = ['clean', 'analyze', 'visualize', 'model', 'validate', 'report', 'convert'];
  
  return steps.sort((a, b) => {
    const aIndex = order.indexOf(a.type);
    const bIndex = order.indexOf(b.type);
    return aIndex - bIndex;
  });
};

/**
 * Add dependencies between steps
 * @param {Array} steps - Array of steps
 * @returns {Array} - Steps with dependencies
 */
const addDependencies = (steps) => {
  const dependencies = {
    analyze: ['clean'],
    visualize: ['clean', 'analyze'],
    model: ['clean', 'analyze'],
    report: ['analyze', 'visualize', 'model'],
    validate: ['clean']
  };

  return steps.map(step => {
    const deps = dependencies[step.type] || [];
    const availableDeps = steps
      .filter(s => deps.includes(s.type))
      .map(s => s.id);
    
    return {
      ...step,
      dependencies: availableDeps
    };
  });
};

/**
 * Validate step sequence
 * @param {Array} steps - Array of steps
 * @returns {Object} - Validation result
 */
const validateStepSequence = (steps) => {
  const errors = [];
  const warnings = [];

  // Check for required dependencies
  steps.forEach(step => {
    step.dependencies.forEach(depId => {
      const depExists = steps.some(s => s.id === depId);
      if (!depExists) {
        errors.push(`Step "${step.name}" requires dependency "${depId}" which is not present`);
      }
    });
  });

  // Check for logical issues
  if (steps.some(s => s.type === 'model') && !steps.some(s => s.type === 'clean')) {
    warnings.push('Machine learning without data cleaning may produce poor results');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Calculate confidence score for parsing
 * @param {Array} steps - Parsed steps
 * @param {string} originalPrompt - Original prompt
 * @returns {number} - Confidence score (0-1)
 */
const calculateConfidence = (steps, originalPrompt) => {
  let score = 0;
  const words = originalPrompt.toLowerCase().split(/\s+/);
  
  // Base score for having steps
  if (steps.length > 0) score += 0.3;
  
  // Score for keyword matches
  const totalKeywords = Object.values(OPERATION_PATTERNS)
    .flatMap(op => op.keywords).length;
  
  let matchedKeywords = 0;
  Object.values(OPERATION_PATTERNS).forEach(op => {
    op.keywords.forEach(keyword => {
      if (words.includes(keyword)) matchedKeywords++;
    });
  });
  
  score += (matchedKeywords / totalKeywords) * 0.4;
  
  // Score for parameter extraction
  const stepsWithParams = steps.filter(s => 
    Object.keys(s.parameters).length > 0
  ).length;
  
  if (steps.length > 0) {
    score += (stepsWithParams / steps.length) * 0.3;
  }
  
  return Math.min(score, 1);
};

/**
 * Get operation name
 * @param {string} opType - Operation type
 * @returns {string} - Human readable name
 */
const getOperationName = (opType) => {
  const names = {
    clean: 'Data Cleaning',
    analyze: 'Data Analysis',
    visualize: 'Data Visualization',
    model: 'Machine Learning',
    convert: 'Data Conversion',
    validate: 'Schema Validation',
    report: 'Report Generation'
  };
  
  return names[opType] || opType.charAt(0).toUpperCase() + opType.slice(1);
};

/**
 * Get operation description
 * @param {string} opType - Operation type
 * @param {string} sentence - Original sentence
 * @returns {string} - Description
 */
const getOperationDescription = (opType, sentence) => {
  const descriptions = {
    clean: 'Clean and prepare data for analysis',
    analyze: 'Perform statistical analysis on the data',
    visualize: 'Create visualizations to explore data patterns',
    model: 'Build and train machine learning models',
    convert: 'Convert data to different formats',
    validate: 'Validate data against schema rules',
    report: 'Generate comprehensive analysis report'
  };
  
  return descriptions[opType] || `Perform ${opType} operation`;
};

/**
 * Get estimated duration for operation
 * @param {string} opType - Operation type
 * @returns {number} - Estimated duration in seconds
 */
const getEstimatedDuration = (opType) => {
  const durations = {
    clean: 30,
    analyze: 45,
    visualize: 60,
    model: 120,
    convert: 20,
    validate: 25,
    report: 40
  };
  
  return durations[opType] || 30;
};

/**
 * Generate unique step ID
 * @returns {string} - Unique ID
 */
const generateStepId = () => {
  return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default {
  parsePrompt,
  OPERATION_PATTERNS,
  COLUMN_PATTERNS
};