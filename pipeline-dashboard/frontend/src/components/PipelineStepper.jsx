/*
Data Pipeline Dashboard - Pipeline Stepper Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';

const PIPELINE_STEPS = [
  { id: 0, name: 'Upload', icon: '📁', description: 'Upload data file' },
  { id: 1, name: 'Preview', icon: '👁️', description: 'Preview data structure' },
  { id: 2, name: 'Clean', icon: '🧹', description: 'Clean and prepare data' },
  { id: 3, name: 'Analyze', icon: '📊', description: 'Statistical analysis' },
  { id: 4, name: 'Visualize', icon: '📈', description: 'Create visualizations' },
  { id: 5, name: 'Model', icon: '🤖', description: 'Machine learning models' },
  { id: 6, name: 'Report', icon: '📄', description: 'Generate reports' },
  { id: 7, name: 'Convert', icon: '🔄', description: 'Format conversion' },
  { id: 8, name: 'Schema', icon: '✅', description: 'Schema validation' }
];

const PipelineStepper = ({ 
  currentStep = 0, 
  completedSteps = [], 
  errorSteps = [], 
  onStepClick, 
  loading = false 
}) => {
  const getStepStatus = (stepIndex) => {
    if (errorSteps.includes(stepIndex)) return 'error';
    if (stepIndex === currentStep) return 'active';
    if (completedSteps.includes(stepIndex) || stepIndex < currentStep) return 'completed';
    return 'pending';
  };

  const getStepStyles = (status, isClickable) => {
    const baseStyles = "relative flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-200 border-2";
    
    switch (status) {
      case 'completed':
        return `${baseStyles} bg-green-500 border-green-500 text-white ${isClickable ? 'hover:bg-green-600 cursor-pointer' : ''}`;
      case 'active':
        return `${baseStyles} bg-blue-500 border-blue-500 text-white ring-4 ring-blue-200 ${loading ? 'animate-pulse' : ''}`;
      case 'error':
        return `${baseStyles} bg-red-500 border-red-500 text-white ${isClickable ? 'hover:bg-red-600 cursor-pointer' : ''}`;
      default:
        return `${baseStyles} bg-gray-200 border-gray-300 text-gray-500`;
    }
  };

  const getConnectorStyles = (stepIndex) => {
    const isCompleted = completedSteps.includes(stepIndex) || stepIndex < currentStep;
    const hasError = errorSteps.includes(stepIndex);
    
    if (hasError) {
      return 'bg-red-300';
    } else if (isCompleted) {
      return 'bg-green-300';
    } else {
      return 'bg-gray-300';
    }
  };

  const handleStepClick = (stepIndex, status) => {
    if (loading) return;
    
    // Allow clicking on completed steps or current step
    if (status === 'completed' || status === 'active') {
      onStepClick?.(stepIndex);
    }
  };

  return (
    <div className="w-full">
      {/* Desktop Stepper */}
      <div className="hidden md:flex items-center justify-between">
        {PIPELINE_STEPS.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = status === 'completed' || status === 'active';
          
          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(index, status)}
                  disabled={loading || !isClickable}
                  className={getStepStyles(status, isClickable)}
                  title={`${step.name}: ${step.description}`}
                  aria-label={`Step ${index + 1}: ${step.name} - ${status}`}
                >
                  {status === 'completed' ? (
                    <span className="text-lg">✓</span>
                  ) : status === 'error' ? (
                    <span className="text-lg">!</span>
                  ) : status === 'active' && loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <span className="text-xs font-bold">{index + 1}</span>
                  )}
                </button>
                
                {/* Step Label */}
                <div className="mt-2 text-center">
                  <div className={`text-sm font-medium ${
                    status === 'active' ? 'text-blue-600' : 
                    status === 'completed' ? 'text-green-600' : 
                    status === 'error' ? 'text-red-600' : 
                    'text-gray-500'
                  }`}>
                    {step.name}
                  </div>
                  <div className="text-xs text-gray-400 mt-1 hidden lg:block">
                    {step.icon} {step.description}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < PIPELINE_STEPS.length - 1 && (
                <div className="flex-1 mx-4">
                  <div className={`h-1 rounded-full transition-colors duration-300 ${getConnectorStyles(index)}`}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Mobile Stepper */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-gray-600">
            Step {currentStep + 1} of {PIPELINE_STEPS.length}
          </div>
          <div className="text-sm text-gray-500">
            {Math.round(((currentStep + 1) / PIPELINE_STEPS.length) * 100)}% Complete
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / PIPELINE_STEPS.length) * 100}%` }}
          ></div>
        </div>
        
        {/* Current Step Info */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center space-x-3">
            <div className={getStepStyles(getStepStatus(currentStep), false)}>
              {getStepStatus(currentStep) === 'completed' ? (
                <span className="text-lg">✓</span>
              ) : getStepStatus(currentStep) === 'error' ? (
                <span className="text-lg">!</span>
              ) : loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span className="text-xs font-bold">{currentStep + 1}</span>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {PIPELINE_STEPS[currentStep]?.name}
              </div>
              <div className="text-sm text-gray-500">
                {PIPELINE_STEPS[currentStep]?.description}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Step Navigation */}
        <div className="mt-4 flex space-x-2 overflow-x-auto pb-2">
          {PIPELINE_STEPS.map((step, index) => {
            const status = getStepStatus(index);
            const isClickable = status === 'completed' || status === 'active';
            
            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(index, status)}
                disabled={loading || !isClickable}
                className={`flex-shrink-0 w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200 ${
                  status === 'completed' ? 'bg-green-500 text-white' :
                  status === 'active' ? 'bg-blue-500 text-white' :
                  status === 'error' ? 'bg-red-500 text-white' :
                  'bg-gray-200 text-gray-500'
                } ${isClickable && !loading ? 'hover:scale-110' : ''}`}
                title={`${step.name}: ${step.description}`}
              >
                {status === 'completed' ? '✓' : 
                 status === 'error' ? '!' : 
                 index + 1}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PipelineStepper;