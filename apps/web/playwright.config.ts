import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm.cmd run dev -- --hostname 127.0.0.1 --port 3100',
    url: 'http://127.0.0.1:3100/responsive-smoke',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
    cwd: __dirname,
  },
})
