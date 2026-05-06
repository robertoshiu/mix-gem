import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 120000,
  use: {
    baseURL: 'http://127.0.0.1:3000/mix-gem',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npm run test:e2e:serve',
    url: 'http://127.0.0.1:3000/mix-gem/',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
