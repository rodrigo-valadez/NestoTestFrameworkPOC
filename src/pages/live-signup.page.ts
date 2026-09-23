import { type Locator, type Page } from '@playwright/test';
import { LocatorResolver } from '../framework/locator-resolver';
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
    private readonly text: LiveSignupText,
    private readonly resolver: LocatorResolver
  ) {}

  async open(): Promise<void> {
    await this.page.goto(this.path);
  }

  async switchLanguage(): Promise<void> {
    await this.page.getByRole('link', { name: this.text.languageSwitchLabel, exact: true }).click();
  }

  async completeForm(data: LiveSignupData): Promise<void> {
    await (
      await this.field('first name', this.text.firstNameLabel, 'firstName')
    ).fill(data.firstName);
    await (await this.field('last name', this.text.lastNameLabel, 'lastName')).fill(data.lastName);
    await (await this.phoneCountry()).selectOption(data.phoneCountry);
    await (await this.field('phone', this.text.phoneLabel, 'phone')).fill(data.phone);
    await (await this.province()).selectOption(data.province);
    await (await this.field('email', this.text.emailLabel, 'email')).fill(data.email);
    await (await this.field('password', this.text.passwordLabel, 'password')).fill(data.password);
    await (
      await this.field(
        'password confirmation',
        this.text.passwordConfirmationLabel,
        'passwordConfirmation'
      )
    ).fill(data.passwordConfirmation ?? data.password);
    await (await this.partnerConsent()).setChecked(data.partnerConsent);
  }

  async submit(): Promise<void> {
    await this.page.getByRole('button', { name: this.text.submitButton, exact: true }).click();
  }

  private async field(strategy: string, label: string, name: string): Promise<Locator> {
    return this.resolver.resolve([
      {
        name: `${strategy} accessible label`,
        locate: page => page.getByLabel(label, { exact: true })
      },
      { name: `${strategy} form name`, locate: page => page.locator(`input[name="${name}"]`) }
    ]);
  }

  private async phoneCountry(): Promise<Locator> {
    const candidates = this.text.phoneCountryAccessibleName
      ? [
          {
            name: 'phone country accessible name',
            locate: (page: Page) =>
              page.getByRole('combobox', {
                name: this.text.phoneCountryAccessibleName,
                exact: true
              })
          }
        ]
      : [];
    return this.resolver.resolve([
      ...candidates,
      {
        name: 'phone country form name',
        locate: page => page.locator('select[name="phoneCountry"]')
      }
    ]);
  }

  private async province(): Promise<Locator> {
    return this.resolver.resolve([
      {
        name: 'province accessible label',
        locate: page => page.getByRole('combobox', { name: this.text.provinceLabel, exact: true })
      },
      { name: 'province region label', locate: page => page.locator('select[aria-label="region"]') }
    ]);
  }

  private async partnerConsent(): Promise<Locator> {
    return this.resolver.resolve([
      {
        name: 'partner consent accessible name',
        locate: page =>
          page.getByRole('checkbox', { name: this.text.partnerConsentLabel, exact: true })
      },
      {
        name: 'partner consent form name',
        locate: page => page.locator('input[name="leadDistributeConsentAgreement"]')
      }
    ]);
  }
}
