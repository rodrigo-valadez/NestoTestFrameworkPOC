import { expect, type Page } from '@playwright/test';
import type { AppText } from '../i18n/app-text';
import { LocatorResolver } from '../framework/locator-resolver';

export class SignupPage {
  constructor(
    private readonly page: Page,
    private readonly text: AppText,
    private readonly resolver: LocatorResolver
  ) {}

  async assertLoaded(): Promise<void> {
    await expect(this.page.getByRole('heading', { name: this.text.signup.heading })).toBeVisible();
  }

  async enterEmail(email: string): Promise<void> {
    const emailInput = await this.resolver.resolve([
      {
        name: 'email accessible label',
        locate: page => page.getByLabel(this.text.signup.emailLabel)
      },
      {
        name: 'email test id',
        locate: page => page.getByTestId('signup-email')
      },
      {
        name: 'email semantic attributes',
        locate: page => page.locator('input[type="email"][name="email"]')
      }
    ]);

    await emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: this.text.signup.submitButton }).click();
  }
}
