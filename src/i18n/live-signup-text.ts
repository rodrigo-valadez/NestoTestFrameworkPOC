import type { SupportedLocale } from './app-text';
import { enCA } from '../../test-data/expected-copy/live-signup/en-CA';
import { frCA } from '../../test-data/expected-copy/live-signup/fr-CA';

export interface LiveSignupText {
  heading: string;
  emailLabel: string;
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
