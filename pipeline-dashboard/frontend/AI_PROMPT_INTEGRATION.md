# AI Prompt Chain Integration Documentation

## Overview

The AI Prompt Chain Integration enables users to execute complex pipeline operations using natural language commands. This feature transforms natural language descriptions into executable pipeline steps, providing an intuitive way to automate data processing workflows.

## Features

### 1. Natural Language Processing
- **Prompt Parsing**: Converts natural language into structured pipeline steps
- **Intent Recognition**: Identifies data processing operations from user descriptions
- **Parameter Extraction**: Extracts relevant parameters for each operation
- **Validation**: Ensures prompts are valid and executable

### 2. Template System
- **Pre-built Templates**: Common workflow templates for quick start
- **Custom Templates**: User-defined templates for specific use cases
- **Template Categories**: Organized by use case (analysis, ML, quality, etc.)
- **One-click Loading**: Easy template selection and customization

### 3. History and Favorites
- **Prompt History**: Automatic saving of recent prompts
- **Favorites Management**: Save frequently used prompts
- **Search and Filter**: Find previous prompts quickly
- **Export/Import**: Share prompts between users

### 4. Real-time Feedback
- **Live Suggestions**: Context-aware suggestions as you type
- **Validation Feedback**: Real-time prompt validation
- **Step Preview**: Preview generated steps before execution
- **Error Guidance**: Helpful error messages and corrections

## Components

### AIPromptInterface

The main component for AI prompt input and management.

**Props:**
```jsx
{
  fileId: string,              // Current file ID
  sessionId: string,           // Current session ID
  onPromptExecute: function,   // Callback when steps are ready to execute
  onError: function,           // Error callback
  className: string            // Additional CSS classes
}
```

**Features:**
- Multi-tab interface (Input, Templates, History, Favorites)
- Real-time character count and suggestions
- Prompt validation and parsing
- Step preview modal
- Local storage integration

### AIPromptExecution

Component for executing and monitoring AI-generated pipeline steps.

**Props:**
```jsx
{
  sessionId: string,           // Current session ID
  fileId: string,              // Current file ID
  steps: Array,                // Steps to execute
  onComplete: function,        // Completion callback
  onError: function,           // Error callback
  onCancel: function           // Cancellation callback
}
```

**Features:**
- Step-by-step execution monitoring
- Progress tracking and visualization
- Real-time execution logs
- Error handling and recovery
- Cancellation support

### useAIPrompt Hook

Custom hook for AI prompt functionality.

**Returns:**
```javascript
{
  // State
  isProcessing: boolean,
  parsedSteps: Array,
  executionStatus: string,
  currentStepIndex: number,
  executionResults: Array,
  error: string,
  
  // Functions
  parsePrompt: function,
  executeSteps: function,
  cancelExecution: function,
  reset: function,
  validatePrompt: function,
  getStepSuggestions: function,
  
  // Computed
  canExecute: boolean,
  isExecuting: boolean,
  isCompleted: boolean,
  hasError: boolean
}
```

## Prompt Templates

### Built-in Templates

1. **Basic Data Analysis**
   ```
   Clean my data by removing missing values, then analyze the statistics and create a correlation heatmap visualization
   ```

2. **Machine Learning Pipeline**
   ```
   Clean the data, analyze correlations, create visualizations, then build a classification model using the target column
   ```

3. **Data Quality Check**
   ```
   Preview the data, check for missing values and outliers, validate against a basic schema, then generate a quality report
   ```

4. **Process and Export**
   ```
   Clean the data by handling missing values, analyze basic statistics, then convert to both JSON and Parquet formats
   ```

5. **Visualization Suite**
   ```
   Analyze the data statistics, then create a bar chart, line chart, and scatter plot to show different data relationships
   ```

### Template Structure

```javascript
{
  id: 'template-id',
  title: 'Template Title',
  description: 'Brief description of what this template does',
  prompt: 'The actual prompt text that will be loaded'
}
```

## Natural Language Processing

### Supported Operations

The system recognizes the following types of operations:

1. **Data Cleaning**
   - Keywords: clean, remove, handle, missing, outliers, duplicates
   - Examples: "clean my data", "remove missing values", "handle outliers"

2. **Data Analysis**
   - Keywords: analyze, statistics, correlation, distribution, summary
   - Examples: "analyze statistics", "show correlations", "generate summary"

3. **Visualization**
   - Keywords: visualize, chart, plot, graph, heatmap, bar, line, scatter
   - Examples: "create a bar chart", "visualize correlations", "make a heatmap"

4. **Machine Learning**
   - Keywords: model, predict, classify, regression, train, machine learning
   - Examples: "build a model", "predict values", "classify data"

5. **Data Export**
   - Keywords: export, convert, save, format, CSV, JSON, Parquet, Excel
   - Examples: "export to CSV", "convert to JSON", "save as Parquet"

6. **Schema Validation**
   - Keywords: validate, schema, check, verify, compliance
   - Examples: "validate schema", "check data quality", "verify compliance"

### Parameter Extraction

The system automatically extracts parameters from natural language:

- **Column Names**: "using the age column", "target variable is price"
- **Methods**: "using mean imputation", "with random forest"
- **Formats**: "export to CSV", "convert to JSON"
- **Thresholds**: "remove outliers above 3 standard deviations"

## API Integration

### Prompt Interpretation Endpoint

```javascript
POST /api/ai/interpret
{
  prompt: "Natural language description of the workflow"
}

Response:
{
  success: boolean,
  steps: [
    {
      name: "Step Name",
      description: "Step description",
      type: "step_type",
      parameters: { /* step-specific parameters */ }
    }
  ],
  suggestions: ["Suggestion 1", "Suggestion 2"]
}
```

### Step Execution

Each parsed step is executed using the existing pipeline API:

- `preview` → `/api/pipeline/preview`
- `clean` → `/api/pipeline/clean`
- `analyze` → `/api/pipeline/analyze`
- `visualize` → `/api/pipeline/visualize`
- `model` → `/api/pipeline/model`
- `report` → `/api/pipeline/report`
- `convert` → `/api/pipeline/convert`
- `schema` → `/api/pipeline/schema-validate`

## Usage Examples

### Basic Usage

```jsx
import AIPromptInterface from './components/AIPromptInterface';

function MyComponent() {
  const handlePromptExecute = (steps) => {
    console.log('Steps to execute:', steps);
    // Handle step execution
  };

  return (
    <AIPromptInterface
      fileId="file-123"
      sessionId="session-456"
      onPromptExecute={handlePromptExecute}
      onError={(error) => console.error('AI Error:', error)}
    />
  );
}
```

### Advanced Usage with Execution

```jsx
import { useState } from 'react';
import AIPromptInterface from './components/AIPromptInterface';
import AIPromptExecution from './components/AIPromptExecution';

function AdvancedAIComponent() {
  const [executingSteps, setExecutingSteps] = useState(null);

  const handlePromptExecute = (steps) => {
    setExecutingSteps(steps);
  };

  const handleExecutionComplete = (result) => {
    console.log('Execution completed:', result);
    setExecutingSteps(null);
  };

  return (
    <div>
      {!executingSteps ? (
        <AIPromptInterface
          fileId="file-123"
          sessionId="session-456"
          onPromptExecute={handlePromptExecute}
        />
      ) : (
        <AIPromptExecution
          sessionId="session-456"
          fileId="file-123"
          steps={executingSteps}
          onComplete={handleExecutionComplete}
          onCancel={() => setExecutingSteps(null)}
        />
      )}
    </div>
  );
}
```

## Error Handling

### Common Error Types

1. **Parsing Errors**
   - Ambiguous prompts
   - Unsupported operations
   - Missing context

2. **Execution Errors**
   - API failures
   - Invalid parameters
   - Data compatibility issues

3. **Validation Errors**
   - Empty prompts
   - Invalid file states
   - Missing session information

### Error Recovery

- **Automatic Retry**: For transient errors
- **User Guidance**: Specific error messages with suggestions
- **Fallback Options**: Alternative approaches when primary method fails
- **Manual Intervention**: Allow users to modify steps before execution

## Performance Considerations

### Optimization Features

- **Debounced Suggestions**: Prevents excessive API calls during typing
- **Local Storage**: Caches history and favorites locally
- **Progressive Enhancement**: Core functionality works without AI features
- **Lazy Loading**: Templates and suggestions loaded on demand

### Memory Management

- **History Limits**: Automatic cleanup of old history entries
- **Result Caching**: Efficient storage of execution results
- **Event Cleanup**: Proper cleanup of event listeners and timers

## Security Considerations

### Input Validation

- **Prompt Sanitization**: Clean user input before processing
- **Parameter Validation**: Validate extracted parameters
- **Rate Limiting**: Prevent abuse of AI endpoints
- **Content Filtering**: Block potentially harmful prompts

### Data Protection

- **Local Storage Encryption**: Encrypt sensitive data in localStorage
- **Session Isolation**: Ensure prompts are tied to specific sessions
- **Audit Logging**: Track AI prompt usage for security monitoring

## Testing

### Unit Tests

- Component rendering and interaction
- Prompt parsing and validation
- Template loading and management
- History and favorites functionality

### Integration Tests

- API integration with backend
- Step execution workflows
- Error handling scenarios
- Cross-component communication

### E2E Tests

- Complete AI workflow testing
- User interaction scenarios
- Error recovery testing
- Performance under load

## Accessibility

### WCAG Compliance

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: High contrast for all UI elements
- **Focus Management**: Proper focus handling throughout workflow

### Accessibility Features

- **Voice Input**: Support for speech-to-text input
- **Large Text**: Scalable text for vision-impaired users
- **Simplified Mode**: Reduced complexity option
- **Status Announcements**: Live region updates for execution status

## Future Enhancements

### Planned Features

- **Multi-language Support**: Support for multiple natural languages
- **Advanced NLP**: More sophisticated natural language understanding
- **Custom Vocabularies**: Domain-specific terminology support
- **Collaborative Prompts**: Share and collaborate on prompts
- **Prompt Analytics**: Usage analytics and optimization suggestions

### Extensibility

- **Plugin Architecture**: Support for custom prompt processors
- **Custom Templates**: User-defined template categories
- **API Extensions**: Support for additional pipeline operations
- **Integration Hooks**: Webhooks for external system integration

## Troubleshooting

### Common Issues

1. **Prompt Not Parsing**
   - Check for supported keywords
   - Verify file is uploaded
   - Ensure session is active

2. **Steps Not Executing**
   - Verify API connectivity
   - Check parameter validity
   - Review execution logs

3. **Templates Not Loading**
   - Clear browser cache
   - Check localStorage permissions
   - Verify component initialization

### Debug Mode

Enable debug logging:
```javascript
localStorage.setItem('ai-prompt-debug', 'true');
```

This enables detailed logging of:
- Prompt parsing steps
- API request/response details
- Execution progress
- Error stack traces