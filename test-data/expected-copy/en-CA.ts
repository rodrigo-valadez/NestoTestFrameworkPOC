/** Self-contained English copy fixture; separate by locale so adding a language does not grow a shared map. */
import type { AppText } from '../../src/i18n/app-text';

export const enCA = {
  signup: {
    heading: 'Create your account',
    emailLabel: 'Email address',
    submitButton: 'Continue'
  }
} satisfies AppText;
