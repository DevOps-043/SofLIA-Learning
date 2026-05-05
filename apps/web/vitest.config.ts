import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['src/lib/lia-context/__tests__/**'],
    coverage: {
      provider: 'v8',
      include: [
        'src/features/**/services/**',
        'src/features/**/hooks/**',
        'src/lib/**',
        'src/core/services/**',
      ],
      exclude: [
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}',
        'src/**/types.ts',
        'src/**/index.ts',
        'src/lib/supabase/types.ts',
      ],
      thresholds: {
        statements: 60,
        branches: 50,
        functions: 60,
        lines: 60,
      },
      reportOnFailure: true,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/components': path.resolve(__dirname, './src/shared/components'),
      '@/utils': path.resolve(__dirname, './src/shared/utils'),
      '@/hooks': path.resolve(__dirname, './src/shared/hooks'),
    },
  },
})
