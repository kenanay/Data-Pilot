/*
Data Pipeline Dashboard - Frontend Application

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './hooks/useAuth';
import ToastContainer from './components/ToastContainer';
import PipelineStepper from './components/PipelineStepper';
import PipelineCard from './components/PipelineCard';
import LogPanel from './components/LogPanel';
import FileUpload from './components/FileUpload';
import DataPreview from './components/DataPreview';
import DataCleaning from './components/DataCleaning';
import DataAnalysis from './components/DataAnalysis';
import DataVisualization from './components/DataVisualization';
import MachineLearning from './components/MachineLearning';
import ReportGeneration from './components/ReportGeneration';
import DataConversion from './components/DataConversion';
import SchemaValidation from './components/SchemaValidation';
import NotificationHistory from './components/NotificationHistory';
import SnapshotManager from './components/SnapshotManager';
import SnapshotSelector from './components/SnapshotSelector';
import QuickSnapshot from './components/QuickSnapshot';
import UndoRedoManager from './components/UndoRedoManager';
import { UndoRedoButtons, CompactUndoRedoButtons } from './components/UndoRedoButtons';
import AIPromptInterface from './components/AIPromptInterface';
import AIPromptExecution from './components/AIPromptExecution';
import AIPromptExecutionManager from './components/AIPromptExecutionManager';
import { usePipelineState } from './hooks/usePipelineState';
import { useLogs } from './hooks/useLogs';
import { useNotifications } from './hooks/useNotifications';
import { useSnapshots } from './hooks/useSnapshots';
import { usePipelineUndoRedo } from './hooks/useUndoRedo';
import errorLogger from './utils/errorLogger';
import './App.css';

const PIPELINE_STEPS = [
  'Upload', 'Preview', 'Clean', 'Analyze', 
  'Visualize', 'Model', 'Report', 'Convert', 'Schema'
];

function App() {
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [showNotificationHistory, setShowNotificationHistory] = useState(false);
  const [aiExecutionSteps, setAiExecutionSteps] = useState(null);
  const [showAiExecution, setShowAiExecution] = useState(false);
  
  const { 
    pipelineState, 
    executeStep, 
    uploadFile,
    loading, 
    error: pipelineError,
    rollbackToStep,
    clearError 
  } = usePipelineState(sessionId);
  
  const { 
    logs, 
    connectionStatus, 
    error: logsError,
    isConnected,
    reconnect: reconnectLogs 
  } = useLogs(sessionId);

  const handleStepClick = async (stepIndex) => {
    try {
      const stepName = PIPELINE_STEPS[stepIndex].toLowerCase();
      await executeStep(stepName);
    } catch (error) {
      console.error(`Failed to execute step ${stepIndex}:`, error);
      // Error is already handled in the hook
    }
  };

  const handleRollback = async (stepIndex) => {
    try {
      await rollbackToStep(stepIndex);
    } catch (error) {
      console.error(`Failed to rollback to step ${stepIndex}:`, error);
    }
  };

  const handleShowLog = (stepIndex) => {
    console.log(`Show log for step ${stepIndex}`);
    // TODO: Implement log detail modal
  };

  const handleFileUpload = async (file, onProgress) => {
    try {
      await uploadFile(file);
      // File upload success is handled in the hook
    } catch (error) {
      console.error('File upload failed:', error);
      throw error; // Re-throw to let FileUpload component handle it
    }
  };

  return (
      <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                🔄 Data Pipeline Dashboard
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Advanced Data Processing with Visual Workflow Management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Compact Undo/Redo buttons in header */}
              {pipelineState.current_file_id && (
                <CompactUndoRedoButtons
                  pipelineState={pipelineState}
                  onStateChange={(newState) => {
                    console.log('Quick undo/redo action:', newState);
                  }}
                />
              )}
              
              <button
                onClick={() => setShowNotificationHistory(true)}
                className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Notification History"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 01-7.5-7.5H7.5a7.5 7.5 0 017.5 7.5v5z" />
                </svg>
              </button>
              <span className="text-sm text-gray-500">
                Session: {sessionId.slice(-8)}
              </span>
              <div className={`w-3 h-3 rounded-full ${
                logs.length > 0 ? 'bg-green-500' : 'bg-gray-300'
              }`} title="WebSocket Status" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Pipeline Stepper */}
        <div className="mb-8">
          <PipelineStepper 
            currentStep={pipelineState.current_step || 0}
            completedSteps={pipelineState.steps ? pipelineState.steps
              .filter(step => step.status === 'completed')
              .map((_, index) => index) : []}
            errorSteps={pipelineState.steps ? pipelineState.steps
              .filter(step => step.status === 'error')
              .map((_, index) => index) : []}
            onStepClick={handleStepClick}
            loading={loading}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pipeline Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Pipeline Steps
            </h2>
            
            {/* File Upload Section - Show when no file is uploaded */}
            {!pipelineState.current_file_id && (
              <div className="mb-6">
                <FileUpload
                  onFileUpload={handleFileUpload}
                  loading={loading}
                  error={pipelineError}
                  onClearError={clearError}
                />
              </div>
            )}

            {/* Data Preview Section - Show when file is uploaded and preview step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 1 && (
              <div className="mb-6">
                <DataPreview
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onPreviewComplete={(previewData) => {
                    console.log('Preview completed:', previewData);
                  }}
                  onError={(error) => {
                    console.error('Preview error:', error);
                  }}
                />
              </div>
            )}

            {/* Data Cleaning Section - Show when file is uploaded and clean step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 2 && (
              <div className="mb-6">
                <DataCleaning
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onCleaningComplete={(cleaningResult) => {
                    console.log('Cleaning completed:', cleaningResult);
                  }}
                  onError={(error) => {
                    console.error('Cleaning error:', error);
                  }}
                />
              </div>
            )}

            {/* Data Analysis Section - Show when file is uploaded and analyze step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 3 && (
              <div className="mb-6">
                <DataAnalysis
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onAnalysisComplete={(analysisResult) => {
                    console.log('Analysis completed:', analysisResult);
                  }}
                  onError={(error) => {
                    console.error('Analysis error:', error);
                  }}
                />
              </div>
            )}

            {/* Data Visualization Section - Show when file is uploaded and visualize step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 4 && (
              <div className="mb-6">
                <DataVisualization
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onVisualizationComplete={(visualizationResult) => {
                    console.log('Visualization completed:', visualizationResult);
                  }}
                  onError={(error) => {
                    console.error('Visualization error:', error);
                  }}
                />
              </div>
            )}

            {/* Machine Learning Section - Show when file is uploaded and model step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 5 && (
              <div className="mb-6">
                <MachineLearning
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onModelComplete={(modelResult) => {
                    console.log('Model completed:', modelResult);
                  }}
                  onError={(error) => {
                    console.error('Model error:', error);
                  }}
                />
              </div>
            )}

            {/* Report Generation Section - Show when file is uploaded and report step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 6 && (
              <div className="mb-6">
                <ReportGeneration
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onReportComplete={(reportResult) => {
                    console.log('Report completed:', reportResult);
                  }}
                  onError={(error) => {
                    console.error('Report error:', error);
                  }}
                />
              </div>
            )}

            {/* Data Conversion Section - Show when file is uploaded and convert step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 7 && (
              <div className="mb-6">
                <DataConversion
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onConversionComplete={(conversionResult) => {
                    console.log('Conversion completed:', conversionResult);
                  }}
                  onError={(error) => {
                    console.error('Conversion error:', error);
                  }}
                />
              </div>
            )}

            {/* Schema Validation Section - Show when file is uploaded and schema step is active */}
            {pipelineState.current_file_id && pipelineState.current_step === 8 && (
              <div className="mb-6">
                <SchemaValidation
                  fileId={pipelineState.current_file_id}
                  sessionId={sessionId}
                  onValidationComplete={(validationResult) => {
                    console.log('Schema validation completed:', validationResult);
                  }}
                  onError={(error) => {
                    console.error('Schema validation error:', error);
                  }}
                />
              </div>
            )}

            {pipelineState.steps && pipelineState.steps.length > 0 ? (
              pipelineState.steps.map((step, index) => (
                <PipelineCard
                  key={`${step.step}-${index}`}
                  stepTitle={step.step.charAt(0).toUpperCase() + step.step.slice(1)}
                  status={step.status}
                  time={step.timestamp ? new Date(step.timestamp).toLocaleTimeString() : undefined}
                  details={step.details || `${step.step} operation completed`}
                  metrics={step.metrics}
                  duration={step.duration}
                  errorMessage={step.error_message}
                  onRollback={() => handleRollback(index)}
                  onShowLog={() => handleShowLog(index)}
                  onRetry={() => handleStepClick(index)}
                />
              ))
            ) : !pipelineState.current_file_id ? null : (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-gray-400 text-lg mb-2">🚀</div>
                <p className="text-gray-500">
                  File uploaded successfully! Click on a pipeline step above to continue.
                </p>
              </div>
            )}
          </div>

          {/* Live Log Panel */}
          <div className="lg:col-span-1">
            <LogPanel logs={logs} />
          </div>
        </div>

        {/* AI Prompt Interface Section */}
        {pipelineState.current_file_id && !showAiExecution && (
          <div className="mt-8">
            <AIPromptInterface
              fileId={pipelineState.current_file_id}
              sessionId={sessionId}
              onPromptExecute={(steps) => {
                console.log('AI Prompt steps to execute:', steps);
                setAiExecutionSteps(steps);
                setShowAiExecution(true);
              }}
              onError={(error) => {
                console.error('AI Prompt error:', error);
              }}
            />
          </div>
        )}

        {/* AI Prompt Execution Manager */}
        {showAiExecution && aiExecutionSteps && (
          <div className="mt-8">
            <AIPromptExecutionManager
              sessionId={sessionId}
              fileId={pipelineState.current_file_id}
              steps={aiExecutionSteps}
              onComplete={(result) => {
                console.log('AI execution completed:', result);
                setShowAiExecution(false);
                setAiExecutionSteps(null);
                // Refresh pipeline state
                window.location.reload();
              }}
              onError={(error) => {
                console.error('AI execution error:', error);
              }}
              onCancel={() => {
                setShowAiExecution(false);
                setAiExecutionSteps(null);
              }}
            />
          </div>
        )}



        {/* Undo/Redo and Snapshot Management Section */}
        {pipelineState.current_file_id && (
          <div className="mt-8 space-y-8">
            {/* Undo/Redo Manager */}
            <UndoRedoManager
              pipelineState={pipelineState}
              onStateChange={(newState) => {
                // Handle state change from undo/redo operations
                console.log('Pipeline state updated via undo/redo:', newState);
                // The state will be automatically updated through the pipeline state hook
              }}
              sessionId={sessionId}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Quick Actions */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Quick Actions
                  </h3>
                  <div className="flex items-center space-x-2">
                    <QuickSnapshot
                      sessionId={sessionId}
                      stepId={pipelineState.current_step || 0}
                      stepName={PIPELINE_STEPS[pipelineState.current_step || 0]}
                    />
                    <SnapshotSelector
                      sessionId={sessionId}
                      currentStep={pipelineState.current_step || 0}
                      onSnapshotSelect={(snapshot) => {
                        console.log('Snapshot selected for restore:', snapshot);
                        // Handle snapshot restoration
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button
                    onClick={() => handleStepClick(2)}
                    disabled={loading}
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2">🧹</span>
                    <span className="text-sm font-medium">Clean Data</span>
                  </button>
                  <button
                    onClick={() => handleStepClick(4)}
                    disabled={loading}
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2">📊</span>
                    <span className="text-sm font-medium">Visualize</span>
                  </button>
                  <button
                    onClick={() => handleStepClick(6)}
                    disabled={loading}
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2">📄</span>
                    <span className="text-sm font-medium">Generate Report</span>
                  </button>
                  <button
                    onClick={() => handleStepClick(7)}
                    disabled={loading}
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2">🔄</span>
                    <span className="text-sm font-medium">Convert Data</span>
                  </button>
                  <button
                    onClick={() => handleStepClick(8)}
                    disabled={loading}
                    className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="text-2xl mb-2">✅</span>
                    <span className="text-sm font-medium">Schema Validation</span>
                  </button>
                </div>
              </div>

              {/* Snapshot Manager */}
              <div>
                <SnapshotManager
                  sessionId={sessionId}
                  currentStep={pipelineState.current_step || 0}
                  onSnapshotRestore={(snapshot) => {
                    console.log('Snapshot restored:', snapshot);
                    // Refresh pipeline state after restore
                    window.location.reload(); // Simple approach for now
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions for No File State */}
        {!pipelineState.current_file_id && (
          <div className="mt-8 bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Get Started
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleStepClick(0)}
                disabled={loading}
                className="flex flex-col items-center p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <span className="text-3xl mb-2">📁</span>
                <span className="text-lg font-medium">Upload Your Data File</span>
                <span className="text-sm text-gray-600 mt-1">CSV, Excel, JSON, or Parquet</span>
              </button>
              <div className="flex flex-col items-center p-6 border border-gray-200 rounded-lg bg-gray-50">
                <span className="text-3xl mb-2">📸</span>
                <span className="text-lg font-medium text-gray-700">Snapshot Management</span>
                <span className="text-sm text-gray-600 mt-1 text-center">
                  Save and restore pipeline states<br/>
                  Available after uploading data
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              © 2025 Kenan AY - Data Pipeline Dashboard v1.0.0
            </div>
            <div className="flex items-center space-x-4">
              <span>Backend: {pipelineError ? 'Error' : 'Connected'}</span>
              <span>WebSocket: {isConnected ? 'Active' : connectionStatus}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Notification History Modal */}
      <NotificationHistory
        isOpen={showNotificationHistory}
        onClose={() => setShowNotificationHistory(false)}
      />
    </div>
  );
}

// Wrap App with all providers and protection
const AppWithProviders = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
          <ToastContainer />
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default AppWithProviders;