import { type Page } from '@playwright/test';
import type { SupportedLocale } from '../i18n/app-text';
import type { RealAppEnvironmentConfig } from '../config/environment';

const signupCopy = {
  'en-CA': { heading: 'Create a nesto account', email: 'Email', switchLink: 'FR' },
  'fr-CA': { heading: 'Créez un compte nesto', email: 'Courriel', switchLink: 'EN' }
} as const;

/** Task-oriented controls for the deployed signup page; no account-creation workflow. */
export class LiveSignupPage {
  readonly path: string;
  readonly otherLanguagePath: string;
  private readonly locale: SupportedLocale;

  constructor(
    private readonly page: Page,
    environment: RealAppEnvironmentConfig,
    locale: SupportedLocale
  ) {
    this.locale = locale;
    this.path =
      locale === 'fr-CA'
        ? (environment.signupPathFr ?? environment.signupPath)
        : environment.signupPath;
    this.otherLanguagePath =
      locale === 'fr-CA'
        ? environment.signupPath
        : (environment.signupPathFr ?? environment.signupPath);
  }

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async switchLanguage(): Promise<void> {
    await this.page
      .getByRole('link', { name: signupCopy[this.locale].switchLink, exact: true })
      .click();
  }

  otherLanguageHeading() {
    const otherLocale = this.locale === 'fr-CA' ? 'en-CA' : 'fr-CA';
    return this.page.getByRole('heading', { name: signupCopy[otherLocale].heading, exact: true });
  }

  otherLanguageEmailField() {
    const otherLocale = this.locale === 'fr-CA' ? 'en-CA' : 'fr-CA';
    return this.page.getByRole('textbox', { name: signupCopy[otherLocale].email, exact: true });
  }
}
