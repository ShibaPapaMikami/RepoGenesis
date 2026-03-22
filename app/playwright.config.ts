import { defineConfig } from '@playwright/test';

const remoteBaseUrl = process.env.APP_URL;
const useRemoteBase = typeof remoteBaseUrl === 'string' && remoteBaseUrl.length > 0;

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: remoteBaseUrl || 'http://localhost:5173',
    headless: true,
  },
  webServer: useRemoteBase
    ? undefined
    : {
      command: 'npm run dev -- --host 127.0.0.1',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
