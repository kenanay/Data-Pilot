/*
Data Pipeline Dashboard - Report Generation Component

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited
*/

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';

const ReportGeneration = ({ 
  fileId, 
  sessionId,
  onReportComplete,
  onError 
}) => {
  const [reportConfig, setReportConfig] = useState({
    title: '',
    format: 'pdf',
    sections: {
      summary: true,
      data_preview: true,
      cleaning_summary: true,
      analysis_results: true,
      visualizations: true,
      model_results: true,
      recommendations: true
    },
    include_raw_data: false,
    include_code: false,
    template: 'professional'
  });
  
  const [generatedReports, setGeneratedReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewData, setPreviewData] = useState(null);

  // Report templates
  const reportTemplates = {
    professional: {
      name: 'Professional',
      description: 'Clean, business-ready format with executive summary',
      icon: '📊'
    },
    technical: {
      name: 'Technical',
      description: 'Detailed technical report with code and methodology',
      icon: '🔬'
    },
    executive: {
      name: 'Executive',
      description: 'High-level summary focused on key insights',
      icon: '📈'
    },
    academic: {
      name: 'Academic',
      description: 'Research-style report with detailed methodology',
      icon: '🎓'
    }
  };

  // Report sections
  const reportSections = {
    summary: {
      name: 'Executive Summary',
      description: 'High-level overview of findings and insights',
      icon: '📋',
      required: true
    },
    data_preview: {
      name: 'Data Overview',
      description: 'Dataset description and basic statistics',
      icon: '👁️',
      required: false
    },
    cleaning_summary: {
      name: 'Data Cleaning',
      description: 'Summary of data cleaning operations performed',
      icon: '🧹',
      required: false
    },
    analysis_results: {
      name: 'Statistical Analysis',
      description: 'Correlation analysis and descriptive statistics',
      icon: '📊',
      required: false
    },
    visualizations: {
      name: 'Visualizations',
      description: 'Charts and graphs created during analysis',
      icon: '📈',
      required: false
    },
    model_results: {
      name: 'Machine Learning',
      description: 'Model performance and feature importance',
      icon: '🤖',
      required: false
    },
    recommendations: {
      name: 'Recommendations',
      description: 'Actionable insights and next steps',
      icon: '💡',
      required: false
    }
  };

  // Generate report preview
  const generatePreview = async () => {
    try {
      const response = await ApiService.generateReport(sessionId, fileId, {
        ...reportConfig,
        preview_only: true
      });
      setPreviewData(response);
    } catch (err) {
      console.error('Failed to generate preview:', err);
      // Preview failure is not critical, just log it
    }
  };

  // Generate full report
  const generateReport = async () => {
    if (!reportConfig.title.trim()) {
      setError('Report title is required');
      return;
    }

    const selectedSections = Object.entries(reportConfig.sections)
      .filter(([_, selected]) => selected)
      .map(([section, _]) => section);

    if (selectedSections.length === 0) {
      setError('At least one report section must be selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await ApiService.generateReport(sessionId, fileId, {
        title: reportConfig.title,
        format: reportConfig.format,
        sections: selectedSections,
        include_raw_data: reportConfig.include_raw_data,
        include_code: reportConfig.include_code,
        template: reportConfig.template,
        options: {
          page_size: 'A4',
          orientation: 'portrait',
          margins: 'normal'
        }
      });

      const newReport = {
        id: Date.now(),
        config: { ...reportConfig },
        result: response,
        created_at: new Date().toISOString()
      };

      setGeneratedReports(prev => [...prev, newReport]);
      onReportComplete?.(response);

    } catch (err) {
      console.error('Failed to generate report:', err);
      const errorMessage = err.message || 'Failed to generate report';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Download report
  const downloadReport = (report) => {
    if (report.result?.download_url) {
      const link = document.createElement('a');
      link.href = report.result.download_url;
      link.download = `${report.config.title || 'report'}.${report.config.format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Preview report (for HTML format)
  const previewReport = (report) => {
    if (report.result?.preview_url) {
      window.open(report.result.preview_url, '_blank');
    }
  };

  // Remove report
  const removeReport = (reportId) => {
    setGeneratedReports(prev => prev.filter(report => report.id !== reportId));
  };

  // Toggle section
  const toggleSection = (sectionKey) => {
    setReportConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [sectionKey]: !prev.sections[sectionKey]
      }
    }));
  };

  // Auto-generate preview when config changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (reportConfig.title && Object.values(reportConfig.sections).some(Boolean)) {
        generatePreview();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [reportConfig]);

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="p-6 border-b">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Report Generation</h3>
        <p className="text-sm text-gray-600">
          Generate comprehensive reports from your analysis results
        </p>
      </div>

      {/* Report Configuration */}
      <div className="p-6 border-b bg-gray-50">
        <h4 className="font-medium text-gray-900 mb-4">Configure Report</h4>

        {/* Basic Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Report Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Title *
            </label>
            <input
              type="text"
              value={reportConfig.title}
              onChange={(e) => setReportConfig(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Data Analysis Report"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Output Format
            </label>
            <select
              value={reportConfig.format}
              onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pdf">PDF Document</option>
              <option value="html">HTML Page</option>
              <option value="docx">Word Document</option>
            </select>
          </div>
        </div>

        {/* Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Report Template</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(reportTemplates).map(([key, template]) => (
              <button
                key={key}
                onClick={() => setReportConfig(prev => ({ ...prev, template: key }))}
                className={`p-3 border rounded-lg text-center transition-all ${
                  reportConfig.template === key
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-1">{template.icon}</div>
                <div className="text-sm font-medium">{template.name}</div>
                <div className="text-xs text-gray-500 mt-1">{template.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Report Sections ({Object.values(reportConfig.sections).filter(Boolean).length} selected)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(reportSections).map(([key, section]) => (
              <label
                key={key}
                className={`flex items-center space-x-3 p-3 border rounded-lg cursor-pointer transition-all ${
                  reportConfig.sections[key]
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={reportConfig.sections[key]}
                  onChange={() => toggleSection(key)}
                  disabled={section.required}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div className="flex items-center space-x-2 flex-1">
                  <span className="text-lg">{section.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {section.name}
                      {section.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <div className="text-xs text-gray-500">{section.description}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">Advanced Options</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reportConfig.include_raw_data}
                onChange={(e) => setReportConfig(prev => ({ ...prev, include_raw_data: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include raw data tables</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={reportConfig.include_code}
                onChange={(e) => setReportConfig(prev => ({ ...prev, include_code: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Include code snippets and methodology</span>
            </label>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateReport}
          disabled={loading || !reportConfig.title.trim()}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating Report...' : 'Generate Report'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-start space-x-2">
              <div className="text-red-500 text-sm">❌</div>
              <div>
                <p className="text-red-800 text-sm font-medium">Report Generation Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="p-6 border-b">
          <h4 className="font-medium text-gray-900 mb-3">Report Preview</h4>
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Estimated Pages:</span>
                <span className="ml-2 font-medium">{previewData.estimated_pages || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-600">Sections:</span>
                <span className="ml-2 font-medium">{previewData.sections_count || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Charts:</span>
                <span className="ml-2 font-medium">{previewData.charts_count || 0}</span>
              </div>
              <div>
                <span className="text-gray-600">Tables:</span>
                <span className="ml-2 font-medium">{previewData.tables_count || 0}</span>
              </div>
            </div>
            {previewData.warnings && previewData.warnings.length > 0 && (
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="text-yellow-800 text-sm font-medium mb-1">⚠️ Warnings:</div>
                <ul className="text-yellow-700 text-xs space-y-1">
                  {previewData.warnings.map((warning, index) => (
                    <li key={index}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generated Reports */}
      <div className="p-6">
        <h4 className="font-medium text-gray-900 mb-4">
          Generated Reports ({generatedReports.length})
        </h4>

        {generatedReports.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <div className="text-4xl mb-4">📄</div>
            <p>No reports generated yet</p>
            <p className="text-sm mt-1">Configure and generate your first report above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {generatedReports.map((report) => (
              <div key={report.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">
                      {reportTemplates[report.config.template].icon}
                    </span>
                    <div>
                      <h5 className="font-medium text-gray-900">{report.config.title}</h5>
                      <p className="text-sm text-gray-600">
                        {reportTemplates[report.config.template].name} • {report.config.format.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.config.format === 'html' && (
                      <button
                        onClick={() => previewReport(report)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
                        title="Preview"
                      >
                        👁️ Preview
                      </button>
                    )}
                    <button
                      onClick={() => downloadReport(report)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                      title="Download"
                    >
                      💾 Download
                    </button>
                    <button
                      onClick={() => removeReport(report.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                      title="Remove"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Report Details */}
                <div className="text-sm text-gray-600 space-y-1">
                  <div>
                    <span className="font-medium">Sections:</span>
                    <span className="ml-2">
                      {Object.entries(report.config.sections)
                        .filter(([_, selected]) => selected)
                        .map(([section, _]) => reportSections[section]?.name)
                        .join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Generated:</span>
                    <span className="ml-2">{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                  {report.result?.file_size && (
                    <div>
                      <span className="font-medium">Size:</span>
                      <span className="ml-2">{report.result.file_size}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportGeneration;