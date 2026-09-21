import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium-en-CA',
      metadata: { locale: 'en-CA' },
      use: { ...devices['Desktop Chrome'], locale: 'en-CA' }
    },
    {
      name: 'chromium-fr-CA',
      metadata: { locale: 'fr-CA' },
      use: { ...devices['Desktop Chrome'], locale: 'fr-CA' }
    }
  ]
});
