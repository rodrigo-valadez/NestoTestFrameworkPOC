/** Self-contained French copy fixture; separate by locale so reviews expose language-specific changes. */
import type { AppText } from '../../src/i18n/app-text';

export const frCA = {
  signup: {
    heading: 'Créez votre compte',
    emailLabel: 'Adresse courriel',
    submitButton: 'Continuer'
  }
} satisfies AppText;
