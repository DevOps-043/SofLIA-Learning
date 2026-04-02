import { fileURLToPath } from 'node:url'
 
export default {
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    pool: 'threads',
    fileParallelism: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@shared': fileURLToPath(
        new URL('../../packages/shared/src', import.meta.url),
      ),
    },
  },
}
