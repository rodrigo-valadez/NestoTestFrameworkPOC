import type { SupportedLocale } from './app-text';
import { enCA } from '../../test-data/expected-copy/live-signup/en-CA';
import { frCA } from '../../test-data/expected-copy/live-signup/fr-CA';

export interface LiveSignupText {
  heading: string;
  firstNameLabel: string;
  lastNameLabel: string;
  phoneLabel: string;
  phoneCountryAccessibleName?: string;
  provinceLabel: string;
  emailLabel: string;
  passwordLabel: string;
  passwordConfirmationLabel: string;
  partnerConsentLabel: string;
  submitButton: string;
  languageSwitchLabel: string;
  languageSwitchTarget: SupportedLocale;
}

const expectedCopy: Record<SupportedLocale, LiveSignupText> = {
  'en-CA': enCA,
  'fr-CA': frCA
};

export function loadLiveSignupText(locale: SupportedLocale): LiveSignupText {
  return expectedCopy[locale];
}
