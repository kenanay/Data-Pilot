/*
Data Pipeline Dashboard - Undo/Redo Button Components

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState } from 'react';

// Individual Undo Button
export const UndoButton = ({ 
  onUndo, 
  canUndo, 
  undoPreview,
  loading = false,
  showTooltip = true,
  className = "" 
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="relative">
      <button
        onClick={onUndo}
        disabled={!canUndo || loading}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        className={`
          flex items-center space-x-1 px-3 py-2 rounded-md transition-all
          ${canUndo && !loading
            ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 hover:shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
          ${className}
        `}
        title={canUndo ? `Undo: ${undoPreview?.description || 'Previous action'}` : 'Nothing to undo'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
        <span className="text-sm font-medium">Undo</span>
        {loading && (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>

      {/* Tooltip Preview */}
      {showTooltip && showPreview && canUndo && undoPreview && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
            <div className="font-medium">{undoPreview.description}</div>
            {undoPreview.stepName && (
              <div className="text-gray-300">{undoPreview.stepName}</div>
            )}
            {undoPreview.timestamp && (
              <div className="text-gray-400">{formatTimestamp(undoPreview.timestamp)}</div>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Redo Button
export const RedoButton = ({ 
  onRedo, 
  canRedo, 
  redoPreview,
  loading = false,
  showTooltip = true,
  className = "" 
}) => {
  const [showPreview, setShowPreview] = useState(false);

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <div className="relative">
      <button
        onClick={onRedo}
        disabled={!canRedo || loading}
        onMouseEnter={() => setShowPreview(true)}
        onMouseLeave={() => setShowPreview(false)}
        className={`
          flex items-center space-x-1 px-3 py-2 rounded-md transition-all
          ${canRedo && !loading
            ? 'bg-green-100 text-green-700 hover:bg-green-200 hover:shadow-sm'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }
          ${className}
        `}
        title={canRedo ? `Redo: ${redoPreview?.description || 'Next action'}` : 'Nothing to redo'}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
        <span className="text-sm font-medium">Redo</span>
        {loading && (
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
        )}
      </button>

      {/* Tooltip Preview */}
      {showTooltip && showPreview && canRedo && redoPreview && (
        <div className="absolute bottom-full left-0 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-md px-2 py-1 whitespace-nowrap">
            <div className="font-medium">{redoPreview.description}</div>
            {redoPreview.stepName && (
              <div className="text-gray-300">{redoPreview.stepName}</div>
            )}
            {redoPreview.timestamp && (
              <div className="text-gray-400">{formatTimestamp(redoPreview.timestamp)}</div>
            )}
            {/* Arrow */}
            <div className="absolute top-full left-2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Combined Undo/Redo Button Group
export const UndoRedoButtons = ({ 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo, 
  undoPreview,
  redoPreview,
  loading = false,
  showTooltips = true,
  showKeyboardShortcuts = true,
  className = "" 
}) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <UndoButton
        onUndo={onUndo}
        canUndo={canUndo}
        undoPreview={undoPreview}
        loading={loading}
        showTooltip={showTooltips}
      />
      
      <RedoButton
        onRedo={onRedo}
        canRedo={canRedo}
        redoPreview={redoPreview}
        loading={loading}
        showTooltip={showTooltips}
      />

      {/* Keyboard Shortcuts Hint */}
      {showKeyboardShortcuts && (
        <div className="ml-2 text-xs text-gray-500 hidden md:block">
          <div>Ctrl+Z / Ctrl+Y</div>
        </div>
      )}
    </div>
  );
};

// Compact Undo/Redo Buttons (for toolbars)
export const CompactUndoRedoButtons = ({ 
  onUndo, 
  onRedo, 
  canUndo, 
  canRedo,
  loading = false,
  className = "" 
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      <button
        onClick={onUndo}
        disabled={!canUndo || loading}
        className={`
          p-1.5 rounded-l-md border-r transition-colors
          ${canUndo && !loading
            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
          }
        `}
        title="Undo (Ctrl+Z)"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
        </svg>
      </button>
      
      <button
        onClick={onRedo}
        disabled={!canRedo || loading}
        className={`
          p-1.5 rounded-r-md transition-colors
          ${canRedo && !loading
            ? 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 border'
            : 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200 border'
          }
        `}
        title="Redo (Ctrl+Y)"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
        </svg>
      </button>
    </div>
  );
};

export default UndoRedoButtons;