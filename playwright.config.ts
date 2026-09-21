import { defineConfig, devices } from '@playwright/test';
import type { Project } from '@playwright/test';
import type { SupportedLocale } from './src/i18n/app-text';

const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
const locales: readonly SupportedLocale[] = ['en-CA', 'fr-CA'];
const includeEdge = process.env.PLAYWRIGHT_INCLUDE_EDGE === 'true';

function localizedProjects(
  browserName: string,
  deviceName: keyof typeof devices,
  browserUse: Project['use'] = {}
): Project[] {
  return locales.map(locale => ({
    name: `${browserName}-${locale}`,
    metadata: { locale },
    use: { ...devices[deviceName], ...browserUse, locale }
  }));
}

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
    ...localizedProjects('chromium', 'Desktop Chrome'),
    ...localizedProjects('firefox', 'Desktop Firefox'),
    ...localizedProjects('webkit', 'Desktop Safari'),
    ...(includeEdge ? localizedProjects('edge', 'Desktop Edge', { channel: 'msedge' }) : [])
  ]
});
