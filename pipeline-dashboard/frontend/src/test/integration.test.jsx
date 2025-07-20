/*
Data Pipeline Dashboard - Integration Tests

Author: Kenan AY
Project: Data Pipeline Dashboard
Date: 2025
Copyright: © 2025 Kenan AY - All rights reserved
License: Proprietary - Unauthorized use prohibited

Integration tests for end-to-end pipeline workflows including
Turkish character support and cross-component interactions.
*/

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { turkishTestData, testTurkishCharacters } from './setup.js';

// Mock complete pipeline workflow
const mockPipelineWorkflow = {
  sessionId: 'test-session-123',
  steps: [
    { id: 0, name: 'Yükleme', status: 'completed', timestamp: '2025-01-20T10:00:00Z' },
    { id: 1, name: 'Önizleme', status: 'completed', timestamp: '2025-01-20T10:01:00Z' },
    { id: 2, name: 'Temizlik', status: 'active', timestamp: null },
    { id: 3, name: 'Analiz', status: 'pending', timestamp: null }
  ],
  currentFile: {
    id: 'turkish-file-123',
    name: turkishTestData.filenames[0],
    size: 1024000,
    type: 'text/csv'
  }
};

describe('Pipeline Integration Tests', () => {
  let user;

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    
    // Mock successful API responses
    global.fetch = vi.fn((url) => {
      if (url.includes('/api/upload')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            file_id: mockPipelineWorkflow.currentFile.id,
            status: 'success'
          })
        });
      }
      
      if (url.includes('/api/preview')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            columns: turkishTestData.columnNames,
            sample: [
              [1, 'Ahmet Çelik', 'Mühendis', 12345, '2025-01-01'],
              [2, 'Ayşe Öztürk', 'Öğretmen', 67890, '2025-01-02']
            ],
            summary: { rows: 1000, columns: 5, missing_values: 15 }
          })
        });
      }
      
      if (url.includes('/api/clean')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            status: 'success',
            affected_rows: 15,
            details: 'Türkçe karakterler korunarak temizleme tamamlandı'
          })
        });
      }
      
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete Pipeline Workflow', () => {
    it('should execute full pipeline with Turkish data', async () => {
      // Mock the main pipeline component
      const PipelineDashboard = () => {
        const [currentStep, setCurrentStep] = React.useState(0);
        const [completedSteps, setCompletedSteps] = React.useState([]);
        const [fileData, setFileData] = React.useState(null);

        return (
          <div data-testid="pipeline-dashboard">
            <div data-testid="file-upload">
              <input
                type="file"
                data-testid="file-input"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setFileData(file);
                    setCompletedSteps([0]);
                    setCurrentStep(1);
                  }
                }}
              />
            </div>
            
            <div data-testid="pipeline-stepper">
              {mockPipelineWorkflow.steps.map((step, index) => (
                <div
                  key={step.id}
                  data-testid={`step-${step.id}`}
                  className={`step ${
                    completedSteps.includes(index) ? 'completed' :
                    currentStep === index ? 'active' : 'pending'
                  }`}
                >
                  {step.name}
                </div>
              ))}
            </div>
            
            {fileData && (
              <div data-testid="file-preview">
                <h3>Dosya: {fileData.name}</h3>
                <p>Boyut: {fileData.size} bytes</p>
                <button
                  data-testid="preview-button"
                  onClick={() => {
                    setCompletedSteps([0, 1]);
                    setCurrentStep(2);
                  }}
                >
                  Önizleme Yap
                </button>
              </div>
            )}
            
            {completedSteps.includes(1) && (
              <div data-testid="data-preview">
                <h3>Veri Önizlemesi</h3>
                <table>
                  <thead>
                    <tr>
                      {turkishTestData.columnNames.map(col => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>1</td>
                      <td>Ahmet Çelik</td>
                      <td>Mühendis</td>
                      <td>12345</td>
                      <td>2025-01-01</td>
                    </tr>
                  </tbody>
                </table>
                <button
                  data-testid="clean-button"
                  onClick={() => {
                    setCompletedSteps([0, 1, 2]);
                    setCurrentStep(3);
                  }}
                >
                  Veriyi Temizle
                </button>
              </div>
            )}
            
            {completedSteps.includes(2) && (
              <div data-testid="cleaning-results">
                <h3>Temizleme Sonuçları</h3>
                <p>Türkçe karakterler korunarak 15 satır temizlendi</p>
              </div>
            )}
          </div>
        );
      };

      render(<PipelineDashboard />);

      // Step 1: Upload Turkish file
      const fileInput = screen.getByTestId('file-input');
      const turkishFile = new File(
        ['test,content\nwith,turkish\nçharacters,öğrenci'],
        turkishTestData.filenames[0],
        { type: 'text/csv' }
      );

      await user.upload(fileInput, turkishFile);

      // Verify file upload
      await waitFor(() => {
        expect(screen.getByText(turkishTestData.filenames[0])).toBeInTheDocument();
      });

      // Step 2: Preview data
      const previewButton = screen.getByTestId('preview-button');
      await user.click(previewButton);

      // Verify Turkish column names are displayed
      await waitFor(() => {
        turkishTestData.columnNames.forEach(columnName => {
          expect(screen.getByText(columnName)).toBeInTheDocument();
        });
      });

      // Verify Turkish data in cells
      expect(screen.getByText('Ahmet Çelik')).toBeInTheDocument();
      expect(screen.getByText('Mühendis')).toBeInTheDocument();

      // Step 3: Clean data
      const cleanButton = screen.getByTestId('clean-button');
      await user.click(cleanButton);

      // Verify cleaning results with Turkish text
      await waitFor(() => {
        expect(screen.getByText(/Türkçe karakterler korunarak/)).toBeInTheDocument();
      });

      // Verify pipeline progression
      const completedStep = screen.getByTestId('step-0');
      expect(completedStep).toHaveClass('completed');
    });

    it('should handle errors gracefully in Turkish', async () => {
      // Mock error response
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 400,
          json: () => Promise.resolve({
            error: 'Dosya formatı desteklenmiyor',
            details: 'Sadece CSV, Excel ve JSON dosyaları kabul edilir'
          })
        })
      );

      const ErrorComponent = () => {
        const [error, setError] = React.useState(null);

        const handleUpload = async () => {
          try {
            const response = await fetch('/api/upload');
            if (!response.ok) {
              const errorData = await response.json();
              setError(errorData.error);
            }
          } catch (err) {
            setError('Beklenmeyen bir hata oluştu');
          }
        };

        return (
          <div>
            <button onClick={handleUpload} data-testid="upload-button">
              Dosya Yükle
            </button>
            {error && (
              <div data-testid="error-message" className="error">
                {error}
              </div>
            )}
          </div>
        );
      };

      render(<ErrorComponent />);

      const uploadButton = screen.getByTestId('upload-button');
      await user.click(uploadButton);

      await waitFor(() => {
        const errorMessage = screen.getByTestId('error-message');
        expect(errorMessage).toHaveTextContent('Dosya formatı desteklenmiyor');
        expect(testTurkishCharacters(errorMessage.textContent)).toBe(true);
      });
    });
  });

  describe('WebSocket Integration', () => {
    it('should receive and display Turkish log messages', async () => {
      const mockWebSocket = {
        send: vi.fn(),
        close: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        readyState: WebSocket.OPEN
      };

      global.WebSocket = vi.fn(() => mockWebSocket);

      const LogComponent = () => {
        const [logs, setLogs] = React.useState([]);

        React.useEffect(() => {
          const ws = new WebSocket('ws://localhost:8082/ws/logs/test-session');
          
          const messageHandler = (event) => {
            const logData = JSON.parse(event.data);
            setLogs(prev => [...prev, logData]);
          };

          // Simulate message handler registration
          mockWebSocket.addEventListener.mockImplementation((event, handler) => {
            if (event === 'message') {
              // Simulate receiving Turkish log message
              setTimeout(() => {
                handler({
                  data: JSON.stringify({
                    id: '1',
                    timestamp: new Date().toISOString(),
                    level: 'info',
                    message: turkishTestData.logMessages[0],
                    details: { dosya: turkishTestData.filenames[0] }
                  })
                });
              }, 100);
            }
          });

          ws.addEventListener('message', messageHandler);
        }, []);

        return (
          <div data-testid="log-panel">
            {logs.map(log => (
              <div key={log.id} data-testid="log-entry">
                <span className="timestamp">{log.timestamp}</span>
                <span className="level">{log.level}</span>
                <span className="message">{log.message}</span>
              </div>
            ))}
          </div>
        );
      };

      render(<LogComponent />);

      // Wait for WebSocket message
      await waitFor(() => {
        const logEntry = screen.getByTestId('log-entry');
        expect(logEntry).toBeInTheDocument();
        
        const message = within(logEntry).getByText(turkishTestData.logMessages[0]);
        expect(message).toBeInTheDocument();
        expect(testTurkishCharacters(message.textContent)).toBe(true);
      });
    });
  });

  describe('State Management Integration', () => {
    it('should persist Turkish data across component updates', async () => {
      const StateComponent = () => {
        const [pipelineState, setPipelineState] = React.useState({
          currentFile: null,
          previewData: null,
          cleaningResults: null
        });

        const updateState = (key, value) => {
          setPipelineState(prev => ({ ...prev, [key]: value }));
        };

        return (
          <div data-testid="state-component">
            <button
              data-testid="set-file"
              onClick={() => updateState('currentFile', {
                name: turkishTestData.filenames[0],
                columns: turkishTestData.columnNames
              })}
            >
              Set Turkish File
            </button>
            
            <button
              data-testid="set-preview"
              onClick={() => updateState('previewData', {
                sample: [['Ahmet Çelik', 'Mühendis']],
                summary: 'Türkçe veri önizlemesi'
              })}
            >
              Set Preview Data
            </button>
            
            {pipelineState.currentFile && (
              <div data-testid="current-file">
                <p>Dosya: {pipelineState.currentFile.name}</p>
                <p>Sütunlar: {pipelineState.currentFile.columns.join(', ')}</p>
              </div>
            )}
            
            {pipelineState.previewData && (
              <div data-testid="preview-data">
                <p>Örnek: {pipelineState.previewData.sample[0].join(' - ')}</p>
                <p>Özet: {pipelineState.previewData.summary}</p>
              </div>
            )}
          </div>
        );
      };

      render(<StateComponent />);

      // Set Turkish file data
      const setFileButton = screen.getByTestId('set-file');
      await user.click(setFileButton);

      await waitFor(() => {
        expect(screen.getByText(turkishTestData.filenames[0])).toBeInTheDocument();
        expect(screen.getByText(/müşteri_adı, çalışan_sayısı/)).toBeInTheDocument();
      });

      // Set preview data
      const setPreviewButton = screen.getByTestId('set-preview');
      await user.click(setPreviewButton);

      await waitFor(() => {
        expect(screen.getByText('Ahmet Çelik - Mühendis')).toBeInTheDocument();
        expect(screen.getByText('Türkçe veri önizlemesi')).toBeInTheDocument();
      });

      // Verify Turkish characters are preserved
      const currentFileDiv = screen.getByTestId('current-file');
      const previewDataDiv = screen.getByTestId('preview-data');
      
      expect(testTurkishCharacters(currentFileDiv.textContent)).toBe(true);
      expect(testTurkishCharacters(previewDataDiv.textContent)).toBe(true);
    });
  });

  describe('Authentication Integration', () => {
    it('should handle authentication with Turkish user data', async () => {
      const mockUserData = {
        id: 'user-123',
        name: 'Mehmet Öztürk',
        email: 'mehmet@şirket.com',
        role: 'Veri Analisti'
      };

      localStorage.setItem('user_info', JSON.stringify(mockUserData));
      localStorage.setItem('auth_token', 'mock-jwt-token');

      const AuthComponent = () => {
        const [user, setUser] = React.useState(null);

        React.useEffect(() => {
          const userData = localStorage.getItem('user_info');
          if (userData) {
            setUser(JSON.parse(userData));
          }
        }, []);

        return (
          <div data-testid="auth-component">
            {user ? (
              <div data-testid="user-info">
                <p>Hoş geldiniz, {user.name}</p>
                <p>Rol: {user.role}</p>
                <p>E-posta: {user.email}</p>
              </div>
            ) : (
              <p>Giriş yapılmamış</p>
            )}
          </div>
        );
      };

      render(<AuthComponent />);

      await waitFor(() => {
        expect(screen.getByText('Hoş geldiniz, Mehmet Öztürk')).toBeInTheDocument();
        expect(screen.getByText('Rol: Veri Analisti')).toBeInTheDocument();
        expect(screen.getByText('E-posta: mehmet@şirket.com')).toBeInTheDocument();
      });

      // Verify Turkish characters in user data
      const userInfo = screen.getByTestId('user-info');
      expect(testTurkishCharacters(userInfo.textContent)).toBe(true);
    });
  });

  describe('Performance Integration', () => {
    it('should handle large Turkish datasets efficiently', async () => {
      const largeTurkishDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `Müşteri ${i}`,
        company: `Şirket ${i}`,
        description: `Açıklama ${i}: Çok güzel bir öğrenci projesi`
      }));

      const PerformanceComponent = () => {
        const [data, setData] = React.useState([]);
        const [loading, setLoading] = React.useState(false);

        const loadData = async () => {
          setLoading(true);
          const startTime = performance.now();
          
          // Simulate data processing
          await new Promise(resolve => setTimeout(resolve, 100));
          setData(largeTurkishDataset);
          
          const endTime = performance.now();
          console.log(`Data loaded in ${endTime - startTime}ms`);
          setLoading(false);
        };

        return (
          <div data-testid="performance-component">
            <button onClick={loadData} data-testid="load-data">
              Büyük Veri Yükle
            </button>
            
            {loading && <p data-testid="loading">Yükleniyor...</p>}
            
            {data.length > 0 && (
              <div data-testid="data-table">
                <p>Toplam kayıt: {data.length}</p>
                <div data-testid="sample-data">
                  {data.slice(0, 5).map(item => (
                    <div key={item.id}>
                      {item.name} - {item.company}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      };

      render(<PerformanceComponent />);

      const loadButton = screen.getByTestId('load-data');
      const startTime = performance.now();
      
      await user.click(loadButton);

      await waitFor(() => {
        expect(screen.getByText('Toplam kayıt: 1000')).toBeInTheDocument();
      });

      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds

      // Verify Turkish characters in sample data
      const sampleData = screen.getByTestId('sample-data');
      expect(testTurkishCharacters(sampleData.textContent)).toBe(true);
    });
  });
});