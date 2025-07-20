# Schema Validation Documentation

## Overview

The Schema Validation component provides comprehensive data validation capabilities for the Pipeline Dashboard. It allows users to validate their data against JSON schemas, custom validation rules, and receive smart suggestions based on data patterns.

## Features

### 1. JSON Schema Validation
- **Standard JSON Schema Support**: Full support for JSON Schema Draft 7
- **Schema Templates**: Pre-built templates for common data types
- **Auto-Generation**: Automatic schema generation based on data analysis
- **Real-time Validation**: Syntax validation as you type

### 2. Custom Validation Rules
- **Rule Builder**: Visual interface for creating custom validation rules
- **Multiple Rule Types**: Support for various validation patterns
- **Column-specific Rules**: Apply rules to specific columns
- **Parameter Configuration**: Customizable rule parameters

### 3. Smart Suggestions
- **AI-Powered Analysis**: Intelligent suggestions based on data patterns
- **Column Name Recognition**: Automatic detection of common patterns (email, phone, etc.)
- **Data Quality Insights**: Completeness and type distribution analysis
- **One-click Application**: Easy application of suggested validations

## Components

### SchemaValidation Component

The main component that orchestrates all schema validation functionality.

**Props:**
```jsx
{
  fileId: string,           // ID of the file to validate
  sessionId: string,        // Current session ID
  onValidationComplete: function, // Callback when validation completes
  onError: function         // Error callback
}
```

**Usage:**
```jsx
<SchemaValidation
  fileId="file-123"
  sessionId="session-456"
  onValidationComplete={(result) => console.log('Validation result:', result)}
  onError={(error) => console.error('Validation error:', error)}
/>
```

## Schema Templates

### Built-in Templates

1. **Basic Data Validation**
   - Generic object schema
   - Flexible property definitions
   - Suitable for any structured data

2. **Financial Data**
   - Amount validation (positive numbers)
   - Date format validation
   - Currency enumeration
   - Transaction ID patterns

3. **User Data**
   - Name length constraints
   - Email format validation
   - Age range validation (0-150)
   - Phone number patterns

4. **Product Data**
   - SKU pattern validation
   - Price constraints
   - Category requirements
   - Stock status boolean

5. **Log Data**
   - Timestamp format validation
   - Log level enumeration
   - Message requirements
   - Source tracking

### Custom Templates

You can create custom templates by extending the `SCHEMA_TEMPLATES` object:

```javascript
import { SCHEMA_TEMPLATES } from '../utils/schemaValidation';

SCHEMA_TEMPLATES['my-custom-template'] = {
  name: 'My Custom Template',
  description: 'Custom validation for my specific use case',
  schema: {
    type: 'object',
    properties: {
      // Your custom properties
    },
    required: ['required-field']
  }
};
```

## Validation Rules

### Available Rule Types

1. **Not Null**
   - Ensures column contains no null/empty values
   - No parameters required

2. **Unique Values**
   - Validates all values in column are unique
   - No parameters required

3. **Value Range**
   - Validates numeric values within specified range
   - Parameters: `min`, `max`

4. **Pattern Match**
   - Validates values against regular expression
   - Parameters: `pattern`

5. **Allowed Values (Enum)**
   - Validates values are from predefined list
   - Parameters: `values` (comma-separated)

6. **String Length**
   - Validates string length within limits
   - Parameters: `min_length`, `max_length`

7. **Email Format**
   - Validates email address format
   - No parameters required

8. **URL Format**
   - Validates URL format
   - No parameters required

9. **Phone Number**
   - Validates phone number format
   - No parameters required

### Creating Custom Rules

```javascript
import { VALIDATION_RULE_TYPES } from '../utils/schemaValidation';

VALIDATION_RULE_TYPES['my-custom-rule'] = {
  name: 'My Custom Rule',
  description: 'Custom validation logic',
  parameters: ['param1', 'param2'],
  validate: (value, allValues, params) => {
    // Your validation logic here
    return true; // or false
  }
};
```

## Smart Suggestions

### Automatic Detection

The system automatically detects common patterns and suggests appropriate validations:

- **Email Columns**: Detects columns with "email" in name
- **Age Columns**: Suggests age range validation (0-150)
- **Price/Amount Columns**: Suggests positive number validation
- **ID Columns**: Suggests UUID format validation
- **Phone Columns**: Suggests phone number format validation

### Data Quality Analysis

- **Completeness Analysis**: Shows percentage of non-null values per column
- **Data Type Distribution**: Displays breakdown of data types
- **Uniqueness Metrics**: Analyzes value uniqueness per column
- **Cardinality Detection**: Suggests enum constraints for low-cardinality columns

## API Integration

### Validation Endpoint

The component integrates with the backend validation API:

```javascript
POST /api/pipeline/schema-validate
{
  session_id: "session-123",
  file_id: "file-456",
  validation_type: "json-schema",
  schema: { /* JSON Schema object */ },
  custom_rules: [ /* Custom rules array */ ],
  validation_level: "strict",
  options: {
    max_errors: 100,
    sample_errors: true
  }
}
```

### Response Format

```javascript
{
  is_valid: boolean,
  total_rows: number,
  valid_rows: number,
  total_errors: number,
  errors: [
    {
      row_index: number,
      column: string,
      message: string,
      value: any
    }
  ]
}
```

## Usage Examples

### Basic JSON Schema Validation

```jsx
// 1. Load the component
<SchemaValidation
  fileId="my-file-id"
  sessionId="my-session-id"
  onValidationComplete={(result) => {
    console.log(`Validation ${result.is_valid ? 'passed' : 'failed'}`);
    console.log(`${result.valid_rows}/${result.total_rows} rows valid`);
  }}
/>

// 2. User selects JSON Schema tab
// 3. User enters or selects a schema template
// 4. User clicks "Run Validation"
// 5. Results are displayed with error details
```

### Custom Rules Validation

```jsx
// 1. User switches to Custom Rules tab
// 2. User clicks "Add Rule"
// 3. User selects column and rule type
// 4. User configures rule parameters
// 5. User clicks "Run Validation"
// 6. Custom validation logic is applied
```

### Smart Suggestions Workflow

```jsx
// 1. User switches to Smart Suggestions tab
// 2. System analyzes data and shows suggestions
// 3. User reviews column analysis and quality insights
// 4. User clicks "Apply" on relevant suggestions
// 5. Suggestions are merged into JSON schema
// 6. User can run validation with enhanced schema
```

## Error Handling

### Validation Errors

The component handles various types of validation errors:

- **Schema Format Errors**: Invalid JSON schema syntax
- **API Errors**: Backend validation service failures
- **Data Errors**: Issues with the data being validated
- **Configuration Errors**: Invalid rule parameters

### Error Display

Errors are displayed with:
- **Error Type**: Clear categorization of error types
- **Row/Column Information**: Specific location of validation failures
- **Error Messages**: Descriptive messages explaining the issue
- **Suggested Fixes**: Recommendations for resolving issues

## Testing

### Unit Tests

The component includes comprehensive unit tests covering:

- Component rendering and interaction
- Tab switching functionality
- Schema template loading
- Custom rule creation and management
- Validation execution
- Error handling scenarios
- Smart suggestions generation

### Running Tests

```bash
npm test SchemaValidation
```

### Test Coverage

- Component rendering: ✅
- User interactions: ✅
- API integration: ✅
- Error scenarios: ✅
- Edge cases: ✅

## Performance Considerations

### Optimization Features

- **Lazy Loading**: Schema templates loaded on demand
- **Debounced Validation**: Prevents excessive API calls
- **Result Caching**: Caches validation results for repeated runs
- **Progressive Enhancement**: Core functionality works without JavaScript

### Memory Management

- **Result Cleanup**: Automatic cleanup of old validation results
- **Schema Optimization**: Efficient schema storage and comparison
- **Event Cleanup**: Proper cleanup of event listeners

## Accessibility

### WCAG Compliance

- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: ARIA labels and descriptions
- **Color Contrast**: High contrast color schemes
- **Focus Management**: Proper focus handling

### Accessibility Features

- **Tab Navigation**: Logical tab order
- **Error Announcements**: Screen reader error announcements
- **Form Labels**: Proper form labeling
- **Status Updates**: Live region updates for validation status

## Browser Support

### Supported Browsers

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Polyfills

Required polyfills for older browsers:
- JSON parsing/stringification
- Regular expression support
- Promise support
- Fetch API

## Troubleshooting

### Common Issues

1. **Schema Not Loading**
   - Check file ID and session ID
   - Verify API connectivity
   - Check browser console for errors

2. **Validation Not Running**
   - Verify schema format is valid JSON
   - Check custom rule parameters
   - Ensure API endpoint is accessible

3. **Suggestions Not Appearing**
   - Verify column information is loaded
   - Check data type detection logic
   - Review suggestion generation criteria

### Debug Mode

Enable debug mode for detailed logging:

```javascript
localStorage.setItem('schema-validation-debug', 'true');
```

## Future Enhancements

### Planned Features

- **Schema Versioning**: Track schema changes over time
- **Batch Validation**: Validate multiple files simultaneously
- **Custom Validators**: User-defined validation functions
- **Integration Testing**: Automated validation in CI/CD pipelines
- **Performance Metrics**: Validation performance tracking

### Extensibility

The component is designed for easy extension:
- Plugin architecture for custom validators
- Theme customization support
- Internationalization ready
- API abstraction for different backends