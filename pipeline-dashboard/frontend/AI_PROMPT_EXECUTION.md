# AI Prompt Parsing and Execution Documentation

## Overview

The AI Prompt Parsing and Execution system enables users to describe complex data processing workflows in natural language and have them automatically converted into executable pipeline steps. This feature combines natural language processing with automated pipeline execution to provide an intuitive data processing experience.

## Architecture

### Components Overview

```
┌─────────────────────────────┐    Parse    ┌─────────────────────────────┐
│     AIPromptInterface       │────────────►│      promptParser.js        │
│  - Natural language input   │             │  - NLP processing           │
│  - Template management      │             │  - Step generation          │
│  - History & favorites      │             │  - Parameter extraction     │
└─────────────────────────────┘             └─────────────────────────────┘
                │                                           │
                │ Execute                                   │ Steps
                ▼                                           ▼
┌─────────────────────────────┐             ┌─────────────────────────────┐
│  AIPromptExecutionManager   │◄────────────│     Parsed Steps Array      │
│  - Step execution           │             │  - Structured operations    │
│  - Progress monitoring      │             │  - Dependencies             │
│  - Error handling           │             │  - Parameters               │
└─────────────────────────────┘             └─────────────────────────────┘
```

## Natural Language Processing

### Supported Operations

The prompt parser recognizes and converts the following natural language patterns:

#### 1. Data Cleaning Operations
**Keywords**: clean, remove, handle, fix, process, prepare

**Examples**:
- "Clean my data by removing missing values"
- "Handle outliers and duplicates"
- "Fill missing values with mean"

**Generated Parameters**:
```javascript
{
  operations: [
    {
      type: 'handle_missing',
      method: 'drop', // or 'fill', 'mean', 'median'
      columns: 'all'
    },
    {
      type: 'handle_outliers',
      method: 'iqr',
      threshold: 1.5
    }
  ]
}
```

#### 2. Data Analysis Operations
**Keywords**: analyze, analysis, examine, study, investigate, explore

**Examples**:
- "Analyze the statistics and correlations"
- "Show descriptive statistics"
- "Examine data distribution"

**Generated Parameters**:
```javascript
{
  analyses: [
    'descriptive_statistics',
    'correlation_analysis',
    'distribution_analysis'
  ]
}
```

#### 3. Data Visualization Operations
**Keywords**: visualize, plot, chart, graph, show, display

**Chart Types**:
- Bar chart: "bar", "column"
- Line chart: "line", "time series"
- Scatter plot: "scatter", "point"
- Histogram: "histogram", "distribution"
- Heatmap: "heatmap", "correlation matrix"
- Box plot: "box plot", "quartile"

**Examples**:
- "Create a correlation heatmap"
- "Show bar chart and scatter plot"
- "Visualize data distribution with histogram"

**Generated Parameters**:
```javascript
{
  charts: [
    {
      type: 'heatmap',
      method: 'correlation',
      title: 'Correlation Heatmap'
    },
    {
      type: 'bar',
      title: 'Bar Chart'
    }
  ]
}
```

#### 4. Machine Learning Operations
**Keywords**: model, predict, machine learning, ml, train, build model

**Model Types**:
- Classification: "classify", "classification", "category"
- Regression: "regression", "predict value", "continuous"
- Clustering: "cluster", "group", "segment"

**Examples**:
- "Build a classification model using age as target"
- "Train a regression model to predict income"
- "Create clustering model for customer segmentation"

**Generated Parameters**:
```javascript
{
  model_type: 'classification',
  algorithm: 'random_forest',
  target_column: 'age'
}
```

#### 5. Data Export Operations
**Keywords**: convert, export, save, download, output

**Formats**:
- CSV: "csv", "comma separated"
- JSON: "json", "javascript object"
- Parquet: "parquet", "apache parquet"
- Excel: "excel", "xlsx", "spreadsheet"

**Examples**:
- "Export to CSV and JSON"
- "Convert data to Parquet format"
- "Save as Excel spreadsheet"

#### 6. Schema Validation Operations
**Keywords**: validate, check, verify, compliance, schema

**Examples**:
- "Validate data against schema"
- "Check data quality and compliance"
- "Verify data structure"

#### 7. Report Generation Operations
**Keywords**: report, summary, document, generate report

**Examples**:
- "Generate comprehensive report"
- "Create PDF summary"
- "Build analysis document"

### Advanced Parsing Features

#### Column Detection
The parser automatically detects column references in prompts:

```javascript
// Input: "Build model using age as target and income as feature"
// Detected: target_column: 'age', feature_columns: ['income']

// Input: "Create scatter plot with age vs income"
// Detected: x_column: 'age', y_column: 'income'
```

#### Method Detection
Specific methods are extracted from natural language:

```javascript
// Input: "Fill missing values with median"
// Detected: method: 'median'

// Input: "Remove outliers using IQR method"
// Detected: method: 'iqr'
```

#### Parameter Extraction
Complex parameters are parsed from context:

```javascript
// Input: "Remove outliers above 2 standard deviations"
// Detected: { method: 'zscore', threshold: 2 }

// Input: "Create 5 clusters for customer segmentation"
// Detected: { n_clusters: 5, purpose: 'customer_segmentation' }
```

## Execution Engine

### Step Execution Flow

1. **Confirmation Phase**
   - Display parsed steps to user
   - Show estimated execution time
   - Allow step modification or cancellation

2. **Sequential Execution**
   - Execute steps in dependency order
   - Monitor progress and log activities
   - Handle errors and provide recovery options

3. **Progress Monitoring**
   - Real-time progress updates
   - Step-by-step status indicators
   - Execution logs with timestamps

4. **Error Handling**
   - Graceful error recovery
   - Manual intervention options
   - Detailed error reporting

### Execution States

```javascript
const EXECUTION_STATES = {
  IDLE: 'idle',           // Ready to start
  EXECUTING: 'executing', // Currently running
  PAUSED: 'paused',      // Waiting for user input
  COMPLETED: 'completed', // Successfully finished
  ERROR: 'error'         // Failed with error
};
```

### Step Dependencies

The system automatically manages step dependencies:

```javascript
const DEPENDENCIES = {
  analyze: ['clean'],                    // Analysis requires clean data
  visualize: ['clean', 'analyze'],      // Visualization needs analysis
  model: ['clean', 'analyze'],          // ML needs clean, analyzed data
  report: ['analyze', 'visualize'],     // Reports need analysis results
  validate: ['clean']                   // Validation needs clean data
};
```

## API Integration

### Step Execution Mapping

Each parsed step type maps to specific API endpoints:

```javascript
const STEP_API_MAPPING = {
  clean: 'ApiService.cleanData(sessionId, fileId, parameters)',
  analyze: 'ApiService.analyzeData(sessionId, fileId, parameters)',
  visualize: 'ApiService.visualizeData(sessionId, fileId, parameters)',
  model: 'ApiService.modelData(sessionId, fileId, parameters)',
  convert: 'ApiService.convertData(sessionId, fileId, parameters)',
  validate: 'ApiService.validateSchema(sessionId, fileId, parameters)',
  report: 'ApiService.generateReport(sessionId, fileId, parameters)'
};
```

### Error Handling Strategy

```javascript
const ERROR_HANDLING = {
  // Retry transient errors
  RETRY_ERRORS: ['network_error', 'timeout', 'server_busy'],
  
  // Stop execution on critical errors
  STOP_ERRORS: ['invalid_data', 'missing_file', 'auth_error'],
  
  // Continue with warnings
  CONTINUE_ERRORS: ['minor_validation', 'optional_step_failed']
};
```

## Usage Examples

### Basic Usage

```javascript
// Simple cleaning and analysis
const prompt = "Clean my data and analyze the correlations";

// Parsed result:
{
  success: true,
  steps: [
    {
      name: 'Data Cleaning',
      type: 'clean',
      parameters: { operations: [{ type: 'handle_missing', method: 'drop' }] }
    },
    {
      name: 'Data Analysis',
      type: 'analyze',
      parameters: { analyses: ['correlation_analysis'] }
    }
  ]
}
```

### Advanced Usage

```javascript
// Complex ML pipeline
const prompt = `
  Clean the data by filling missing values with median,
  analyze correlations and distributions,
  create a heatmap and scatter plots,
  build a random forest classification model using status as target,
  then generate a comprehensive PDF report
`;

// Results in 5 structured steps with proper dependencies
```

### Column-Specific Operations

```javascript
// Target-specific modeling
const prompt = "Build regression model to predict income using age and education";

// Parsed parameters:
{
  model_type: 'regression',
  target_column: 'income',
  feature_columns: ['age', 'education']
}
```

## Configuration and Customization

### Adding Custom Operations

```javascript
// Extend OPERATION_PATTERNS in promptParser.js
OPERATION_PATTERNS.custom_operation = {
  keywords: ['custom', 'special'],
  subOperations: {
    specific: ['specific_keyword']
  }
};
```

### Custom Parameter Extraction

```javascript
// Add custom parameter extraction logic
const extractCustomParameters = (sentence, config) => {
  const parameters = {};
  
  // Custom parsing logic here
  if (sentence.includes('custom_keyword')) {
    parameters.custom_param = 'custom_value';
  }
  
  return parameters;
};
```

### Template Customization

```javascript
// Add custom prompt templates
const customTemplates = {
  'custom-workflow': {
    title: 'Custom Workflow',
    description: 'My specific use case',
    prompt: 'Custom prompt text here'
  }
};
```

## Performance Considerations

### Parsing Optimization

- **Caching**: Parsed results cached for repeated prompts
- **Debouncing**: Real-time suggestions debounced to prevent excessive processing
- **Lazy Loading**: Templates and suggestions loaded on demand

### Execution Optimization

- **Parallel Processing**: Independent steps executed in parallel when possible
- **Resource Management**: Memory cleanup between steps
- **Progress Streaming**: Real-time progress updates without blocking UI

### Memory Management

```javascript
// Automatic cleanup after execution
const cleanup = () => {
  setStepResults([]);
  setExecutionLogs([]);
  setParsedSteps([]);
};
```

## Testing Strategy

### Unit Tests

- **Prompt Parsing**: Test various natural language inputs
- **Parameter Extraction**: Verify correct parameter parsing
- **Step Generation**: Validate step creation logic
- **Dependency Management**: Test step ordering and dependencies

### Integration Tests

- **API Integration**: Test actual API calls with mock responses
- **Error Scenarios**: Test error handling and recovery
- **User Workflows**: Test complete user interaction flows

### E2E Tests

- **Complete Pipelines**: Test full prompt-to-execution workflows
- **Error Recovery**: Test manual intervention scenarios
- **Performance**: Test with large datasets and complex prompts

## Security Considerations

### Input Validation

```javascript
// Sanitize user input
const sanitizePrompt = (prompt) => {
  return prompt
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
};
```

### Parameter Validation

```javascript
// Validate extracted parameters
const validateParameters = (parameters) => {
  // Check for malicious parameters
  // Validate data types and ranges
  // Ensure required parameters are present
};
```

### Execution Safety

- **Sandboxed Execution**: Steps executed in isolated environment
- **Resource Limits**: Prevent resource exhaustion
- **Audit Logging**: Track all AI-generated operations

## Troubleshooting

### Common Issues

1. **Prompt Not Parsing**
   - Check for supported keywords
   - Verify column names exist in dataset
   - Review parsing confidence score

2. **Steps Not Executing**
   - Verify API connectivity
   - Check parameter validity
   - Review execution logs

3. **Incorrect Parameters**
   - Check column name spelling
   - Verify data types match operations
   - Review parameter extraction logic

### Debug Mode

```javascript
// Enable detailed logging
localStorage.setItem('ai-prompt-debug', 'true');

// View parsing details
console.log('Parsing result:', parseResult);
console.log('Confidence score:', parseResult.metadata.confidence);
console.log('Suggestions:', parseResult.suggestions);
```

## Future Enhancements

### Planned Features

- **Multi-language Support**: Support for languages other than English
- **Context Awareness**: Remember previous operations in conversation
- **Smart Suggestions**: ML-powered prompt completion
- **Custom Vocabularies**: Domain-specific terminology support
- **Batch Processing**: Execute multiple prompts simultaneously

### Advanced NLP Features

- **Intent Classification**: Better understanding of user intent
- **Entity Recognition**: Improved column and parameter detection
- **Sentiment Analysis**: Understand urgency and priority
- **Conversation Memory**: Multi-turn conversation support

This comprehensive system transforms natural language descriptions into executable data processing pipelines, making advanced data analysis accessible to users regardless of their technical expertise.