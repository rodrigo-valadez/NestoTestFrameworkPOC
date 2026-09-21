import { test as base } from '@playwright/test';
import { LocatorResolver } from '../framework/locator-resolver';
import type { AppText, SupportedLocale } from '../i18n/app-text';
import { isSupportedLocale } from '../i18n/app-text';
import { loadAppText } from '../i18n/load-app-text';
import { SignupPage } from '../pages/signup.page';

interface AppFixtures {
  appText: AppText;
  locale: SupportedLocale;
  locatorResolver: LocatorResolver;
  signupPage: SignupPage;
}

export const test = base.extend<AppFixtures>({
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
  }
});

export { expect } from '@playwright/test';
