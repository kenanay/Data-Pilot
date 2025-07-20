/*
Data Pipeline Dashboard - Keyboard Shortcuts Utility

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

/**
 * Keyboard shortcuts configuration for the pipeline dashboard
 */
export const KEYBOARD_SHORTCUTS = {
  UNDO: {
    key: 'z',
    ctrlKey: true,
    shiftKey: false,
    description: 'Undo last action',
    displayKey: 'Ctrl+Z'
  },
  REDO: {
    key: 'z',
    ctrlKey: true,
    shiftKey: true,
    description: 'Redo last undone action',
    displayKey: 'Ctrl+Shift+Z'
  },
  REDO_ALT: {
    key: 'y',
    ctrlKey: true,
    shiftKey: false,
    description: 'Redo last undone action (alternative)',
    displayKey: 'Ctrl+Y'
  },
  SAVE_SNAPSHOT: {
    key: 's',
    ctrlKey: true,
    shiftKey: true,
    description: 'Save current state as snapshot',
    displayKey: 'Ctrl+Shift+S'
  },
  CLEAR_HISTORY: {
    key: 'h',
    ctrlKey: true,
    shiftKey: true,
    description: 'Clear undo/redo history',
    displayKey: 'Ctrl+Shift+H'
  }
};

/**
 * Check if a keyboard event matches a shortcut
 * @param {KeyboardEvent} event - The keyboard event
 * @param {Object} shortcut - The shortcut configuration
 * @returns {boolean} - Whether the event matches the shortcut
 */
export const matchesShortcut = (event, shortcut) => {
  return (
    event.key.toLowerCase() === shortcut.key.toLowerCase() &&
    event.ctrlKey === shortcut.ctrlKey &&
    event.shiftKey === shortcut.shiftKey &&
    !event.altKey // We don't use Alt key in our shortcuts
  );
};

/**
 * Get display text for keyboard shortcuts
 * @param {Object} shortcut - The shortcut configuration
 * @returns {string} - Display text for the shortcut
 */
export const getShortcutDisplayText = (shortcut) => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  
  if (isMac) {
    return shortcut.displayKey.replace('Ctrl', '⌘');
  }
  
  return shortcut.displayKey;
};

/**
 * Register global keyboard shortcuts
 * @param {Object} handlers - Object with handler functions for each shortcut
 * @returns {Function} - Cleanup function to remove event listeners
 */
export const registerGlobalShortcuts = (handlers) => {
  const handleKeyDown = (event) => {
    // Don't trigger shortcuts when typing in input fields
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      return;
    }

    // Check each shortcut
    Object.entries(KEYBOARD_SHORTCUTS).forEach(([name, shortcut]) => {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        const handlerName = name.toLowerCase();
        if (handlers[handlerName]) {
          handlers[handlerName](event);
        }
      }
    });
  };

  document.addEventListener('keydown', handleKeyDown);
  
  // Return cleanup function
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
  };
};

export default {
  KEYBOARD_SHORTCUTS,
  matchesShortcut,
  getShortcutDisplayText,
  registerGlobalShortcuts
};