import { defineConfig, devices } from '@playwright/test';
import type { Project } from '@playwright/test';
import type { SupportedLocale } from './src/i18n/app-text';
import { loadEnvironmentConfig } from './src/config/environment';

const environment = loadEnvironmentConfig();
const locales: readonly SupportedLocale[] = ['en-CA', 'fr-CA'];
const includeEdge = process.env.PLAYWRIGHT_INCLUDE_EDGE === 'true';
const liveSuite = process.env.LIVE_SUITE ?? 'framework';

if (!['framework', 'real-app', 'api'].includes(liveSuite)) {
  throw new Error(`Unsupported LIVE_SUITE: ${liveSuite}`);
}

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
  testIgnore:
    liveSuite === 'real-app'
      ? ['**/api/**', '**/framework/**']
      : liveSuite === 'api'
        ? ['**/real-app/**', '**/framework/**']
        : ['**/real-app/**', '**/api/**'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: environment.uiBaseURL,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },
  metadata: { environment: environment.name, dataProfile: environment.dataProfile },
  projects:
    liveSuite === 'api'
      ? [{ name: 'api', metadata: { environment: environment.name }, use: {} }]
      : [
          ...localizedProjects('chromium', 'Desktop Chrome'),
          ...localizedProjects('firefox', 'Desktop Firefox'),
          ...localizedProjects('webkit', 'Desktop Safari'),
          ...(includeEdge ? localizedProjects('edge', 'Desktop Edge', { channel: 'msedge' }) : [])
        ]
});
