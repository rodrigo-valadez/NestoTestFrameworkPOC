import { expect, type Page } from '@playwright/test';
import type { AppText } from '../i18n/app-text';

export class SignupPage {
  constructor(
    private readonly page: Page,
    private readonly text: AppText
  ) {}

  async assertLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: this.text.signup.heading })).toBeVisible();
  }

  async enterEmail(email: string): Promise<void> {
    await this.page.getByLabel(this.text.signup.emailLabel, { exact: true }).fill(email);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: this.text.signup.submitButton }).click();
  }
}
