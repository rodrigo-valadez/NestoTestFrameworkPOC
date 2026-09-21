import { test as base } from './environment-test';
import { LocatorResolver } from '../framework/locator-resolver';
import { BrowserDiagnostics } from '../framework/browser-diagnostics';
import type { AppText, SupportedLocale } from '../i18n/app-text';
import { isSupportedLocale } from '../i18n/app-text';
import { loadAppText } from '../i18n/load-app-text';
import { SignupPage } from '../pages/signup.page';
import { loadSignupCases, type SignupCase } from '../test-data/signup-cases';

interface AppFixtures {
  appText: AppText;
  locale: SupportedLocale;
  locatorResolver: LocatorResolver;
  signupPage: SignupPage;
  browserDiagnostics: BrowserDiagnostics;
  signupCases: SignupCase[];
}

export const test = base.extend<AppFixtures>({
  signupCases: async ({ environment }, use) => {
    await use(loadSignupCases(environment.dataProfile));
  },
  locale: async ({}, use, testInfo) => {
    const locale = testInfo.project.metadata.locale;
    if (!isSupportedLocale(locale)) {
      throw new Error(`Project metadata locale is unsupported: ${String(locale)}`);
    }
    await use(locale);
  },
  appText: async ({ locale }, use) => {
    await use(loadAppText(locale));
  },
  locatorResolver: async ({ page }, use, testInfo) => {
    await use(new LocatorResolver(page, testInfo));
  },
  signupPage: async ({ page, appText, locatorResolver }, use) => {
    await use(new SignupPage(page, appText, locatorResolver));
  },
  browserDiagnostics: [
    async ({ page }, use, testInfo) => {
      const diagnostics = new BrowserDiagnostics(page);
      await use(diagnostics);
      await diagnostics.attachOnFailure(testInfo);
    },
    { auto: true }
  ]
});

export { expect } from '@playwright/test';
