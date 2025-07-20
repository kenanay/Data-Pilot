/*
Data Pipeline Dashboard - AI Prompt Interface Storybook Stories

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';
import AIPromptInterface from './AIPromptInterface';

// Mock the hooks and services for Storybook
const mockNotifications = {
  success: (msg) => console.log('Success:', msg),
  error: (msg) => console.log('Error:', msg),
  warning: (msg) => console.log('Warning:', msg),
  info: (msg) => console.log('Info:', msg),
};

// Mock useNotifications hook
jest.mock('../hooks/useNotifications', () => ({
  useNotifications: () => mockNotifications
}));

export default {
  title: 'Components/AIPromptInterface',
  component: AIPromptInterface,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'AI-powered prompt interface for natural language pipeline creation'
      }
    }
  },
  argTypes: {
    fileId: {
      control: 'text',
      description: 'ID of the uploaded file'
    },
    sessionId: {
      control: 'text',
      description: 'Current session ID'
    },
    onPromptExecute: {
      action: 'promptExecute',
      description: 'Callback when prompt is executed'
    },
    onError: {
      action: 'error',
      description: 'Callback when error occurs'
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes'
    }
  }
};

// Default story
export const Default = {
  args: {
    fileId: 'sample-file-123',
    sessionId: 'session-456',
    onPromptExecute: (steps) => {
      console.log('Executing steps:', steps);
    },
    onError: (error) => {
      console.error('Error occurred:', error);
    }
  }
};

// Without file (disabled state)
export const NoFile = {
  args: {
    fileId: null,
    sessionId: 'session-456',
    onPromptExecute: (steps) => {
      console.log('Executing steps:', steps);
    },
    onError: (error) => {
      console.error('Error occurred:', error);
    }
  },
  parameters: {
    docs: {
      description: {
        story: 'Interface when no file is uploaded - shows disabled state'
      }
    }
  }
};

// With custom styling
export const CustomStyling = {
  args: {
    ...Default.args,
    className: 'border-2 border-blue-500 shadow-lg'
  },
  parameters: {
    docs: {
      description: {
        story: 'Interface with custom CSS classes applied'
      }
    }
  }
};

// Templates showcase
export const TemplatesView = {
  args: {
    ...Default.args
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const templatesTab = canvas.getByText('📋 Templates');
    await userEvent.click(templatesTab);
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows the templates tab with various prompt templates'
      }
    }
  }
};

// Interactive example with pre-filled prompt
export const WithPrompt = {
  args: {
    ...Default.args
  },
  render: (args) => {
    const [prompt, setPrompt] = React.useState('Clean my data by removing missing values, then analyze the correlations and create a heatmap visualization');
    
    return (
      <div>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Example Scenario</h3>
          <p className="text-sm text-blue-800">
            This story shows the interface with a pre-filled prompt to demonstrate the parsing and validation features.
          </p>
        </div>
        <AIPromptInterface {...args} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interface with a pre-filled prompt showing validation and suggestions'
      }
    }
  }
};

// Error state
export const ErrorState = {
  args: {
    ...Default.args,
    onError: (error) => {
      console.error('Simulated error:', error);
    }
  },
  render: (args) => {
    return (
      <div>
        <div className="mb-4 p-4 bg-red-50 rounded-lg">
          <h3 className="font-medium text-red-900 mb-2">Error State Demo</h3>
          <p className="text-sm text-red-800">
            This story demonstrates how the interface handles and displays errors.
          </p>
        </div>
        <AIPromptInterface {...args} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interface showing error handling and display'
      }
    }
  }
};

// Mobile responsive view
export const MobileView = {
  args: {
    ...Default.args
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1'
    },
    docs: {
      description: {
        story: 'Interface optimized for mobile devices'
      }
    }
  }
};

// Dark theme (if supported)
export const DarkTheme = {
  args: {
    ...Default.args,
    className: 'dark'
  },
  parameters: {
    backgrounds: {
      default: 'dark'
    },
    docs: {
      description: {
        story: 'Interface with dark theme styling'
      }
    }
  }
};

// Loading state
export const LoadingState = {
  args: {
    ...Default.args
  },
  render: (args) => {
    const [isProcessing, setIsProcessing] = React.useState(true);
    
    React.useEffect(() => {
      const timer = setTimeout(() => setIsProcessing(false), 3000);
      return () => clearTimeout(timer);
    }, []);
    
    return (
      <div>
        <div className="mb-4 p-4 bg-yellow-50 rounded-lg">
          <h3 className="font-medium text-yellow-900 mb-2">Loading State Demo</h3>
          <p className="text-sm text-yellow-800">
            This story shows the interface in a processing/loading state.
          </p>
        </div>
        <AIPromptInterface {...args} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interface showing loading and processing states'
      }
    }
  }
};

// Accessibility showcase
export const AccessibilityFeatures = {
  args: {
    ...Default.args
  },
  render: (args) => {
    return (
      <div>
        <div className="mb-4 p-4 bg-green-50 rounded-lg">
          <h3 className="font-medium text-green-900 mb-2">Accessibility Features</h3>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Keyboard navigation support</li>
            <li>• ARIA labels and roles</li>
            <li>• Screen reader compatibility</li>
            <li>• Focus management</li>
            <li>• High contrast support</li>
          </ul>
        </div>
        <AIPromptInterface {...args} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features and keyboard navigation'
      }
    }
  }
};