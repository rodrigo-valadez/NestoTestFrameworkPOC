import { type Page } from '@playwright/test';
import type { LiveSignupText } from '../i18n/live-signup-text';

/** Task-oriented controls for the deployed signup page; no account-creation workflow. */
export class LiveSignupPage {
  constructor(
    private readonly page: Page,
    public readonly path: string,
    public readonly otherLanguagePath: string,
    private readonly text: LiveSignupText
  ) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async switchLanguage(): Promise<void> {
    await this.page.getByRole('link', { name: this.text.languageSwitchLabel, exact: true }).click();
  }
}
