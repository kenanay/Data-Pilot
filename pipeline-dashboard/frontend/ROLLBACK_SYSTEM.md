# Rollback System Documentation

## Overview

The Pipeline Dashboard includes a comprehensive rollback system that allows users to undo/redo operations and navigate through their action history. This system provides both automatic state management and manual control over pipeline operations.

## Components

### 1. UndoRedoManager
The main component that orchestrates all rollback functionality.

**Features:**
- Visual undo/redo controls
- History panel with timeline
- Confirmation dialogs for safety
- Keyboard shortcuts support
- Integration with pipeline state

**Usage:**
```jsx
<UndoRedoManager
  pipelineState={pipelineState}
  onStateChange={handleStateChange}
  sessionId={sessionId}
/>
```

### 2. UndoRedoButtons
Provides undo/redo button controls with tooltips and previews.

**Features:**
- Disabled state management
- Preview tooltips
- Loading states
- Keyboard shortcut hints

### 3. HistoryPanel
Displays the complete action history with navigation capabilities.

**Features:**
- Timeline view of all actions
- Jump to any previous state
- Clear history functionality
- Visual current position indicator

### 4. RollbackConfirmation
Safety confirmation dialog for rollback operations.

**Features:**
- Operation type display
- Impact assessment
- Data loss warnings
- Confirmation/cancellation

## Hooks

### useUndoRedo
Core hook providing undo/redo functionality.

**Features:**
- State history management
- Undo/redo operations
- Jump to specific states
- Keyboard shortcuts
- History size limits

### usePipelineUndoRedo
Pipeline-specific extension of useUndoRedo.

**Features:**
- Pipeline state integration
- Step-aware operations
- Metadata tracking
- Operation descriptions

## Keyboard Shortcuts

| Shortcut | Action | Description |
|----------|--------|-------------|
| `Ctrl+Z` | Undo | Undo the last action |
| `Ctrl+Shift+Z` | Redo | Redo the last undone action |
| `Ctrl+Y` | Redo | Alternative redo shortcut |
| `Ctrl+Shift+S` | Save Snapshot | Save current state |
| `Ctrl+Shift+H` | Clear History | Clear undo/redo history |

## Integration

### App.jsx Integration
The rollback system is integrated into the main App component:

```jsx
// In header for quick access
{pipelineState.current_file_id && (
  <CompactUndoRedoButtons
    pipelineState={pipelineState}
    onStateChange={handleStateChange}
  />
)}

// In main content area for full functionality
<UndoRedoManager
  pipelineState={pipelineState}
  onStateChange={handleStateChange}
  sessionId={sessionId}
/>
```

### State Management
The system automatically tracks pipeline state changes:

1. **Automatic Tracking**: State changes are automatically captured
2. **Manual Snapshots**: Users can create manual snapshots
3. **Step Integration**: Each pipeline step creates a history entry
4. **Metadata**: Operations include descriptive metadata

## Safety Features

### Confirmation Dialogs
All rollback operations show confirmation dialogs with:
- Operation type (undo/redo/jump)
- Target state description
- Number of steps affected
- Potential data loss warnings

### Data Protection
- Original data is never modified
- Snapshots preserve complete state
- History size limits prevent memory issues
- Automatic cleanup of old snapshots

### Error Handling
- Graceful failure recovery
- User-friendly error messages
- Fallback to previous state
- Comprehensive logging

## Usage Examples

### Basic Undo/Redo
```jsx
const { canUndo, canRedo, undo, redo } = usePipelineUndoRedo(initialState);

// Undo last action
if (canUndo) {
  const previousState = undo();
  onStateChange(previousState);
}

// Redo last undone action
if (canRedo) {
  const nextState = redo();
  onStateChange(nextState);
}
```

### Jump to Specific State
```jsx
const { history, jumpToState } = usePipelineUndoRedo(initialState);

// Jump to a specific point in history
const targetIndex = 3;
const targetState = jumpToState(targetIndex);
onStateChange(targetState);
```

### Manual State Tracking
```jsx
const { pushPipelineState } = usePipelineUndoRedo(initialState);

// Add a new state to history
pushPipelineState(
  newState,
  'Data Cleaning',
  2,
  'clean_missing_values'
);
```

## Testing

The rollback system includes comprehensive tests:

- **Unit Tests**: Individual component functionality
- **Integration Tests**: Component interaction
- **Hook Tests**: State management logic
- **E2E Tests**: Complete user workflows

Run tests with:
```bash
npm test UndoRedoManager
npm test useUndoRedo
```

## Performance Considerations

### Memory Management
- History size limited to 30 entries for pipeline states
- Automatic cleanup of old snapshots
- Efficient state comparison to prevent duplicates

### User Experience
- Debounced state updates
- Loading states during operations
- Progressive disclosure of advanced features
- Responsive design for mobile devices

## Troubleshooting

### Common Issues

1. **Undo/Redo Not Working**
   - Check if canUndo/canRedo are true
   - Verify state changes are being tracked
   - Ensure keyboard shortcuts aren't blocked

2. **History Not Updating**
   - Check if isUndoing/isRedoing flags are stuck
   - Verify pushPipelineState is being called
   - Check for state comparison issues

3. **Confirmation Dialog Not Showing**
   - Verify modal is properly rendered
   - Check z-index and positioning
   - Ensure event handlers are connected

### Debug Mode
Enable debug logging:
```jsx
const { lastAction } = usePipelineUndoRedo(initialState);
console.log('Last action:', lastAction);
```

## Future Enhancements

- **Branching History**: Support for multiple history branches
- **Collaborative Undo**: Multi-user undo/redo support
- **Persistent History**: Save history across sessions
- **Advanced Previews**: Visual diff previews
- **Batch Operations**: Undo/redo multiple operations at once