import '@testing-library/jest-dom'
import { vi } from 'vitest'
import { createBrowserMocks, createHookMocks, createComponentMocks, createApiMock } from './mocks/index.jsx'

// Configure UTF-8 encoding for Turkish character support
Object.defineProperty(document, 'characterSet', {
  value: 'UTF-8',
  writable: false
});

// Turkish character test data
export const turkishTestData = {
  filenames: [
    'türkçe_dosya.csv',
    'öğrenci_listesi.xlsx',
    'şirket_verileri.json',
    'çalışan_raporu.parquet',
    'müşteri_analizi.csv'
  ],
  textSamples: [
    'Merhaba dünya! Nasılsınız?',
    'Çok güzel bir öğrenci şarkısı',
    'İçerik: şirket çağrı merkezi',
    'Ğ, ğ, ı, İ, ö, Ö, ş, Ş, ü, Ü karakterleri',
    'Başarılı işlem tamamlandı'
  ],
  columnNames: [
    'müşteri_adı',
    'çalışan_sayısı',
    'şirket_türü',
    'öğrenci_no',
    'başlangıç_tarihi'
  ],
  logMessages: [
    'Dosya yükleme işlemi başlatıldı',
    'Veri önizlemesi başarıyla oluşturuldu',
    'Eksik değerler tespit edildi: çağrı, öğrenci, şirket',
    'Şema doğrulama hatası: geçersiz karakter',
    'İşlem başarıyla tamamlandı'
  ]
};

// Helper function to test Turkish character preservation
export const testTurkishCharacters = (text) => {
  const turkishChars = ['ç', 'ğ', 'ı', 'ö', 'ş', 'ü', 'Ç', 'Ğ', 'I', 'İ', 'Ö', 'Ş', 'Ü'];
  return turkishChars.some(char => text.includes(char));
};

// Create centralized mocks
const browserMocks = createBrowserMocks()
const hookMocks = createHookMocks()
const componentMocks = createComponentMocks()

// Apply browser API mocks
Object.defineProperty(window, 'localStorage', {
  value: browserMocks.localStorage
})

Object.defineProperty(window, 'sessionStorage', {
  value: browserMocks.sessionStorage
})

global.fetch = browserMocks.fetch
global.WebSocket = browserMocks.WebSocket

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock URL APIs
global.URL.createObjectURL = vi.fn(() => 'mock-object-url')
global.URL.revokeObjectURL = vi.fn()

// Global mock setup for common modules using centralized mock factory
const apiMock = createApiMock()

vi.mock('../services/api', () => ({
  default: {
    // Use centralized API mock with enhanced data structure
    previewData: vi.fn().mockResolvedValue({ 
      success: true, 
      summary: { 
        columns: [
          {
            name: 'id',
            data_type: 'integer',
            null_count: 0,
            non_null_count: 100,
            min_value: 1,
            max_value: 100
          },
          {
            name: 'email',
            data_type: 'string',
            null_count: 5,
            non_null_count: 95,
            unique_values: ['test@example.com', 'user@test.com']
          }
        ] 
      } 
    }),
    validateSchema: vi.fn().mockResolvedValue({ 
      success: true, 
      valid: true,
      is_valid: false,
      total_rows: 100,
      valid_rows: 85,
      total_errors: 15,
      errors: []
    }),
    // Use centralized mock for other methods
    getFileInfo: apiMock.getFileInfo,
    cleanData: apiMock.cleanData,
    analyzeData: apiMock.analyzeData,
    visualizeData: apiMock.visualizeData,
    interpretPrompt: apiMock.interpretPrompt,
    // Add missing API methods
    uploadFile: vi.fn().mockResolvedValue({ success: true, file_id: 'test-file-id' }),
    deleteFile: vi.fn().mockResolvedValue({ success: true }),
    getPipelineState: vi.fn().mockResolvedValue({ success: true, state: 'ready' }),
    modelData: vi.fn().mockResolvedValue({ success: true }),
    generateReport: vi.fn().mockResolvedValue({ success: true }),
    convertData: vi.fn().mockResolvedValue({ success: true }),
    rollbackToSnapshot: vi.fn().mockResolvedValue({ success: true }),
    getSnapshots: vi.fn().mockResolvedValue({ success: true, snapshots: [] }),
    createSnapshot: vi.fn().mockResolvedValue({ success: true, snapshot_id: 'test-snapshot' }),
    getAISuggestions: vi.fn().mockResolvedValue({ success: true, suggestions: [] }),
    healthCheck: vi.fn().mockResolvedValue({ success: true, status: 'healthy' }),
    executeStep: vi.fn().mockResolvedValue({ success: true })
  }
}))

vi.mock('../hooks/useNotifications', () => ({
  useNotifications: hookMocks.useNotifications
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: hookMocks.useAuth
}))

vi.mock('../hooks/useUndoRedo', () => ({
  usePipelineUndoRedo: hookMocks.usePipelineUndoRedo
}))

vi.mock('../hooks/usePipeline', () => ({
  usePipeline: hookMocks.usePipeline
}))

vi.mock('../hooks/useFileUpload', () => ({
  useFileUpload: hookMocks.useFileUpload
}))

vi.mock('../hooks/useDataPreview', () => ({
  useDataPreview: hookMocks.useDataPreview
}))

vi.mock('../hooks/useTheme', () => ({
  useTheme: hookMocks.useTheme
}))

// Export mocks for test files that need them
export { browserMocks, hookMocks, componentMocks }