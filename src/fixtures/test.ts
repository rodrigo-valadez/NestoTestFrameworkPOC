import { test as base } from './environment-test';
import { BrowserDiagnostics } from '../framework/browser-diagnostics';
import type { AppText, SupportedLocale } from '../i18n/app-text';
import { isSupportedLocale } from '../i18n/app-text';
import { loadAppText } from '../i18n/load-app-text';
import { loadLiveSignupText, type LiveSignupText } from '../i18n/live-signup-text';
import { requireRealAppEnvironment } from '../config/environment';
import { SignupPage } from '../pages/signup.page';
import { LiveSignupPage } from '../pages/live-signup.page';
import { loadSignupCases, type SignupCase } from '../test-data/signup-cases';

interface AppFixtures {
  appText: AppText;
  liveSignupText: LiveSignupText;
  liveSignupPage: LiveSignupPage;
  locale: SupportedLocale;
  signupPage: SignupPage;
  browserDiagnostics: BrowserDiagnostics;
  signupCases: SignupCase[];
  browserDiagnosticsEnabled: boolean;
}

export const test = base.extend<AppFixtures>({
  browserDiagnosticsEnabled: [true, { option: true }],
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
  liveSignupText: async ({ locale }, use) => {
    await use(loadLiveSignupText(locale));
  },
  liveSignupPage: async ({ page, environment, locale, liveSignupText }, use) => {
    const target = requireRealAppEnvironment(environment);
    const paths: Record<SupportedLocale, string> = {
      'en-CA': target.signupPath,
      'fr-CA': target.signupPathFr ?? target.signupPath
    };
    await use(
      new LiveSignupPage(
        page,
        paths[locale],
        paths[liveSignupText.languageSwitchTarget],
        liveSignupText
      )
    );
  },
  signupPage: async ({ page, appText }, use) => {
    await use(new SignupPage(page, appText));
  },
  browserDiagnostics: [
    async ({ page, browserDiagnosticsEnabled }, use, testInfo) => {
      const diagnostics = new BrowserDiagnostics(page, browserDiagnosticsEnabled);
      await use(diagnostics);
      if (browserDiagnosticsEnabled) await diagnostics.attachOnFailure(testInfo);
    },
    { auto: true }
  ]
});

export { expect } from '@playwright/test';
