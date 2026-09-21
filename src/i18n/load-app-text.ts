import type { AppText, SupportedLocale } from './app-text';
import { enCA } from '../../test-data/expected-copy/en-CA';
import { frCA } from '../../test-data/expected-copy/fr-CA';

const expectedCopy: Record<SupportedLocale, AppText> = {
  'en-CA': enCA,
  'fr-CA': frCA
};

export function loadAppText(locale: SupportedLocale): AppText {
  return expectedCopy[locale];
}
