import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    server: {
      deps: {
        inline: [
          '@testing-library/react',
          '@testing-library/user-event',
          '@testing-library/jest-dom',
          /^(?!.*vitest).*$/
        ]
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), './src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  esbuild: {
    target: 'es2020',
    format: 'esm'
  },
  define: {
    global: 'globalThis'
  }
})