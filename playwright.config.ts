import { defineConfig, devices } from '@playwright/test';
import type { Project } from '@playwright/test';
import type { SupportedLocale } from './src/i18n/app-text';
import { loadEnvironmentConfig } from './src/config/environment';

const environment = loadEnvironmentConfig();
const includeEdge = process.env.PLAYWRIGHT_INCLUDE_EDGE === 'true';
const liveSuite = process.env.LIVE_SUITE ?? 'framework';
const publishLatestReport = process.env.PUBLISH_LATEST_REPORT === 'true';

if (!['framework', 'real-app', 'api', 'account-creation'].includes(liveSuite)) {
  throw new Error(`Unsupported LIVE_SUITE: ${liveSuite}`);
}

const suitePatterns: Record<string, string> = {
  framework: '**/framework/**/*.spec.ts',
  'real-app': '**/real-app/**/*.spec.ts',
  api: '**/api/**/*.spec.ts',
  'account-creation': '**/real-app/account-creation/**/*.spec.ts'
};

function browserLocaleProject(
  browserName: string,
  deviceName: keyof typeof devices,
  locale: SupportedLocale,
  browserUse: Project['use'] = {}
): Project {
  return {
    name: `${browserName}-${locale}`,
    metadata: { browser: browserName, locale },
    use: { ...devices[deviceName], ...browserUse, locale }
  };
}

// Keep the supported matrix explicit so reviewers can see every browser/locale pair.
const readOnlyProjects: Project[] = [
  browserLocaleProject('chromium', 'Desktop Chrome', 'en-CA'),
  browserLocaleProject('chromium', 'Desktop Chrome', 'fr-CA'),
  browserLocaleProject('firefox', 'Desktop Firefox', 'en-CA'),
  browserLocaleProject('firefox', 'Desktop Firefox', 'fr-CA'),
  browserLocaleProject('webkit', 'Desktop Safari', 'en-CA'),
  browserLocaleProject('webkit', 'Desktop Safari', 'fr-CA')
];

const edgeProjects: Project[] = [
  browserLocaleProject('edge', 'Desktop Edge', 'en-CA', { channel: 'msedge' }),
  browserLocaleProject('edge', 'Desktop Edge', 'fr-CA', { channel: 'msedge' })
];

export default defineConfig({
  testDir: './tests',
  testMatch: suitePatterns[liveSuite],
  testIgnore: liveSuite === 'real-app' ? ['**/account-creation/**'] : [],
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
        : [...readOnlyProjects, ...(includeEdge ? edgeProjects : [])]
});
