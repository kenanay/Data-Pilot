/*
Data Pipeline Dashboard - File Upload Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useRef, useCallback } from 'react';

const FileUpload = ({ 
  onFileUpload, 
  loading = false, 
  error = null,
  onClearError,
  maxFileSize = 100 * 1024 * 1024, // 100MB default
  acceptedFormats = ['.csv', '.xlsx', '.xls', '.json', '.parquet']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Supported file types with descriptions
  const fileTypes = {
    '.csv': { name: 'CSV', description: 'Comma-separated values', icon: '📊' },
    '.xlsx': { name: 'Excel', description: 'Excel spreadsheet', icon: '📈' },
    '.xls': { name: 'Excel', description: 'Excel spreadsheet (legacy)', icon: '📈' },
    '.json': { name: 'JSON', description: 'JavaScript Object Notation', icon: '🔗' },
    '.parquet': { name: 'Parquet', description: 'Apache Parquet format', icon: '🗃️' }
  };

  // Validate file type and size
  const validateFile = useCallback((file) => {
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    
    // Check file type
    if (!acceptedFormats.includes(fileExtension)) {
      return {
        valid: false,
        error: `Unsupported file format. Please upload: ${acceptedFormats.join(', ')}`
      };
    }

    // Check file size
    if (file.size > maxFileSize) {
      const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      return {
        valid: false,
        error: `File too large (${fileSizeMB}MB). Maximum size allowed: ${maxSizeMB}MB`
      };
    }

    return { valid: true };
  }, [acceptedFormats, maxFileSize]);

  // Handle file selection
  const handleFileSelect = useCallback(async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0]; // Only handle single file for now
    const validation = validateFile(file);

    if (!validation.valid) {
      onClearError?.();
      // Trigger error through parent component
      console.error('File validation failed:', validation.error);
      return;
    }

    try {
      setUploadProgress(0);
      await onFileUpload(file, (progress) => {
        setUploadProgress(progress);
      });
    } catch (error) {
      console.error('File upload failed:', error);
      setUploadProgress(0);
    }
  }, [validateFile, onFileUpload, onClearError]);

  // Drag and drop handlers
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  }, [handleFileSelect]);

  // File input change handler
  const handleInputChange = useCallback((e) => {
    const files = Array.from(e.target.files);
    handleFileSelect(files);
    // Reset input value to allow same file selection
    e.target.value = '';
  }, [handleFileSelect]);

  // Open file dialog
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
          isDragOver
            ? 'border-blue-400 bg-blue-50'
            : loading
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        } ${loading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={!loading ? openFileDialog : undefined}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          onChange={handleInputChange}
          className="hidden"
          disabled={loading}
        />

        {/* Upload Icon and Text */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center space-y-2">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-sm text-gray-600">Uploading...</div>
              {uploadProgress > 0 && (
                <div className="w-full max-w-xs">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{Math.round(uploadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="text-4xl">
                {isDragOver ? '📤' : '📁'}
              </div>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {isDragOver ? 'Drop your file here' : 'Upload your data file'}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Drag and drop or click to browse
                </p>
              </div>
            </>
          )}
        </div>

        {/* File size limit info */}
        {!loading && (
          <div className="mt-4 text-xs text-gray-400">
            Maximum file size: {formatFileSize(maxFileSize)}
          </div>
        )}
      </div>

      {/* Supported Formats */}
      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Supported Formats</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {acceptedFormats.map((format) => {
            const typeInfo = fileTypes[format];
            return (
              <div
                key={format}
                className="flex items-center space-x-2 p-2 bg-gray-50 rounded-md border"
              >
                <span className="text-lg">{typeInfo?.icon || '📄'}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-gray-900">
                    {typeInfo?.name || format.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 truncate">
                    {typeInfo?.description || 'Data file'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start space-x-3">
            <div className="text-red-500 text-lg">❌</div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">Upload Failed</h4>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <div className="mt-3 flex space-x-2">
                <button
                  onClick={openFileDialog}
                  className="px-3 py-1.5 text-xs bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors"
                >
                  Try Again
                </button>
                {onClearError && (
                  <button
                    onClick={onClearError}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Tips */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <h4 className="text-sm font-medium text-blue-800 mb-2">💡 Upload Tips</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• Ensure your data has column headers in the first row</li>
          <li>• CSV files should use comma (,) as delimiter</li>
          <li>• Excel files can have multiple sheets (first sheet will be used)</li>
          <li>• JSON files should contain an array of objects or a single object</li>
          <li>• Large files may take longer to process</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUpload;