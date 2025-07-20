/*
Data Pipeline Dashboard - Fallback UI Components

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React from 'react';

// Generic Fallback Component
export const FallbackUI = ({ 
  title = "Something went wrong",
  message = "We're having trouble loading this content.",
  onRetry,
  onGoBack,
  showRetry = true,
  showGoBack = false,
  icon = "error",
  className = ""
}) => {
  const icons = {
    error: (
      <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="w-12 h-12 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
      </svg>
    ),
    info: (
      <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    loading: (
      <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    )
  };

  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center ${className}`}>
      <div className="mb-4">
        {icons[icon] || icons.error}
      </div>
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-6 max-w-md">
        {message}
      </p>
      
      <div className="flex space-x-3">
        {showRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}
        {showGoBack && onGoBack && (
          <button
            onClick={onGoBack}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Go Back
          </button>
        )}
      </div>
    </div>
  );
};

// Component-specific fallback UIs
export const PipelineStepFallback = ({ stepName, onRetry }) => (
  <FallbackUI
    title={`${stepName} Step Failed`}
    message={`We encountered an issue while processing the ${stepName.toLowerCase()} step. This might be a temporary problem.`}
    onRetry={onRetry}
    icon="warning"
    className="min-h-[200px] bg-yellow-50 border border-yellow-200 rounded-lg"
  />
);

export const DataLoadingFallback = ({ dataType = "data", onRetry }) => (
  <FallbackUI
    title={`Failed to Load ${dataType}`}
    message={`We couldn't load the ${dataType.toLowerCase()}. This might be due to a network issue or server problem.`}
    onRetry={onRetry}
    icon="error"
    className="min-h-[300px] bg-red-50 border border-red-200 rounded-lg"
  />
);

export const ChartFallback = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg min-h-[250px]">
    <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Chart Unavailable</h3>
    <p className="text-gray-600 mb-4 text-center">
      We couldn't generate the chart. This might be due to data formatting issues or processing errors.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
      >
        Retry Chart Generation
      </button>
    )}
  </div>
);

export const TableFallback = ({ onRetry }) => (
  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
    <div className="p-6 text-center">
      <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">Table Data Unavailable</h3>
      <p className="text-gray-600 mb-4">
        We couldn't load the table data. Please try refreshing or check your connection.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Reload Table
        </button>
      )}
    </div>
  </div>
);

export const FileUploadFallback = ({ onRetry }) => (
  <div className="border-2 border-dashed border-red-300 rounded-lg p-8 text-center bg-red-50">
    <svg className="w-12 h-12 text-red-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
    </svg>
    <h3 className="text-lg font-medium text-gray-900 mb-2">Upload Failed</h3>
    <p className="text-gray-600 mb-4">
      There was a problem uploading your file. Please check the file format and try again.
    </p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
      >
        Try Upload Again
      </button>
    )}
  </div>
);

export const NetworkFallback = ({ onRetry }) => (
  <FallbackUI
    title="Connection Lost"
    message="We've lost connection to the server. Please check your internet connection and try again."
    onRetry={onRetry}
    icon="warning"
    className="min-h-[200px] bg-yellow-50 border border-yellow-200 rounded-lg"
  />
);

export const MaintenanceFallback = () => (
  <FallbackUI
    title="Under Maintenance"
    message="The system is currently under maintenance. We'll be back shortly. Thank you for your patience."
    showRetry={false}
    icon="info"
    className="min-h-[300px] bg-blue-50 border border-blue-200 rounded-lg"
  />
);

// Loading fallback with skeleton
export const LoadingFallback = ({ message = "Loading...", showSkeleton = false }) => {
  if (showSkeleton) {
    return (
      <div className="animate-pulse">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <FallbackUI
      title={message}
      message="Please wait while we process your request..."
      showRetry={false}
      icon="loading"
      className="min-h-[200px]"
    />
  );
};

export default FallbackUI;