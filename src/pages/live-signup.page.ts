import { type Page } from '@playwright/test';
import type { LiveSignupText } from '../i18n/live-signup-text';

export interface LiveSignupData {
  firstName: string;
  lastName: string;
  phoneCountry: string;
  phone: string;
  province: string;
  email: string;
  password: string;
  passwordConfirmation?: string;
  partnerConsent: boolean;
}

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

  async completeForm(data: LiveSignupData): Promise<void> {
    await this.page.getByLabel(this.text.firstNameLabel, { exact: true }).fill(data.firstName);
    await this.page.getByLabel(this.text.lastNameLabel, { exact: true }).fill(data.lastName);
    // The French page currently exposes an English accessible name for this control.
    // Use its stable form name here; the accessibility test reports that defect separately.
    await this.page.locator('select[name="phoneCountry"]').selectOption(data.phoneCountry);
    await this.page.getByLabel(this.text.phoneLabel, { exact: true }).fill(data.phone);
    await this.page
      .getByRole('combobox', { name: this.text.provinceLabel, exact: true })
      .selectOption(data.province);
    await this.page.getByLabel(this.text.emailLabel, { exact: true }).fill(data.email);
    await this.page.getByLabel(this.text.passwordLabel, { exact: true }).fill(data.password);
    await this.page
      .getByLabel(this.text.passwordConfirmationLabel, { exact: true })
      .fill(data.passwordConfirmation ?? data.password);
    await this.page
      .getByRole('checkbox', { name: this.text.partnerConsentLabel, exact: true })
      .setChecked(data.partnerConsent);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: this.text.submitButton, exact: true }).click();
  }
}
