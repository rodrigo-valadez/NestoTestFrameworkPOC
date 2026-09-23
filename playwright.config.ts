import { defineConfig, devices } from '@playwright/test';
import type { Project } from '@playwright/test';
import type { SupportedLocale } from './src/i18n/app-text';
import { loadEnvironmentConfig } from './src/config/environment';

const environment = loadEnvironmentConfig();
const locales: readonly SupportedLocale[] = ['en-CA', 'fr-CA'];
const includeEdge = process.env.PLAYWRIGHT_INCLUDE_EDGE === 'true';
const liveSuite = process.env.LIVE_SUITE ?? 'framework';
const publishLatestReport = process.env.PUBLISH_LATEST_REPORT === 'true';

if (!['framework', 'real-app', 'api', 'account-creation'].includes(liveSuite)) {
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
  testMatch:
    liveSuite === 'account-creation' ? '**/real-app/account-creation/**/*.spec.ts' : '**/*.spec.ts',
  testIgnore:
    liveSuite === 'real-app'
      ? ['**/api/**', '**/framework/**', '**/account-creation/**']
      : liveSuite === 'api'
        ? ['**/real-app/**', '**/framework/**', '**/account-creation/**']
        : liveSuite === 'account-creation'
          ? ['**/framework/**', '**/api/**']
          : ['**/real-app/**', '**/api/**', '**/account-creation/**'],
  fullyParallel: liveSuite !== 'account-creation',
  forbidOnly: Boolean(process.env.CI),
  retries: liveSuite === 'account-creation' ? 0 : process.env.CI ? 2 : 0,
  maxFailures: liveSuite === 'account-creation' ? 1 : 0,
  workers: liveSuite === 'account-creation' ? 1 : undefined,
  reporter:
    liveSuite === 'account-creation'
      ? [['list']]
      : [
          ['list'],
          ['html', { open: 'never' }],
          ...(publishLatestReport
            ? ([['json', { outputFile: 'test-results/latest-report.json' }]] as const)
            : [])
        ],
  use: {
    baseURL: environment.uiBaseURL,
    screenshot: liveSuite === 'account-creation' ? 'off' : 'only-on-failure',
    trace: liveSuite === 'account-creation' ? 'off' : 'retain-on-failure',
    video: liveSuite === 'account-creation' ? 'off' : 'retain-on-failure'
  },
  metadata: { environment: environment.name, dataProfile: environment.dataProfile },
  projects:
    liveSuite === 'api'
      ? [{ name: 'api', metadata: { environment: environment.name }, use: {} }]
      : liveSuite === 'account-creation'
        ? [
            {
              name: 'account-creation-chromium-en-CA',
              metadata: { locale: 'en-CA', writeCapable: true },
              use: { ...devices['Desktop Chrome'], locale: 'en-CA' }
            }
          ]
        : [
            ...localizedProjects('chromium', 'Desktop Chrome'),
            ...localizedProjects('firefox', 'Desktop Firefox'),
            ...localizedProjects('webkit', 'Desktop Safari'),
            ...(includeEdge ? localizedProjects('edge', 'Desktop Edge', { channel: 'msedge' }) : [])
          ]
});
