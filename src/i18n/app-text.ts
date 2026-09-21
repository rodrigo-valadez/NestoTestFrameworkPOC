export const supportedLocales = ['en-CA', 'fr-CA'] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

/** Copy used for language-quality assertions, maintained independently of app resources. */
export interface AppText {
  signup: {
    heading: string;
    emailLabel: string;
    submitButton: string;
  };
}

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && supportedLocales.includes(value as SupportedLocale);
}
