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
  },
  resolve: {
    alias: {
      // `server-only` lanza al importarse fuera de un Server Component, lo que
      // rompe la recoleccion de cualquier test que alcance un modulo de
      // servidor. En Vitest esa frontera no existe: se sustituye por un stub.
      'server-only': path.resolve(__dirname, './src/test/server-only-stub.ts'),
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
