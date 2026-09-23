import { expect, test } from '../../src/fixtures/test';
import type { Page } from '@playwright/test';
import { requireRealAppEnvironment } from '../../src/config/environment';
import type { LiveSignupText } from '../../src/i18n/live-signup-text';

function phoneCountryControl(page: Page, text: LiveSignupText) {
  if (text.phoneCountryAccessibleName) {
    return page.getByRole('combobox', {
      name: text.phoneCountryAccessibleName,
      exact: true
    });
  }
  return page.locator('select[name="phoneCountry"]');
}

test('SGN-001 signup route exposes the complete visible form contract @real-app', async ({
  page,
  environment,
  locale,
  liveSignupText
}) => {
  const target = requireRealAppEnvironment(environment);

  const response = await page.goto(
    locale === 'fr-CA' ? (target.signupPathFr ?? target.signupPath) : target.signupPath
  );
  expect(response?.ok(), 'Signup route should return a successful response').toBe(true);
  expect(new URL(page.url()).origin).toBe(new URL(target.uiBaseURL).origin);

  const controls = [
    page.getByLabel(liveSignupText.firstNameLabel, { exact: true }),
    page.getByLabel(liveSignupText.lastNameLabel, { exact: true }),
    page.getByLabel(liveSignupText.phoneLabel, { exact: true }),
    page.getByRole('combobox', { name: liveSignupText.provinceLabel, exact: true }),
    page.getByLabel(liveSignupText.emailLabel, { exact: true }),
    page.getByLabel(liveSignupText.passwordLabel, { exact: true }),
    page.getByLabel(liveSignupText.passwordConfirmationLabel, { exact: true }),
    page.getByRole('checkbox', { name: liveSignupText.partnerConsentLabel, exact: true }),
    page.getByRole('button', { name: liveSignupText.submitButton, exact: true })
  ];
  const phoneCountry = phoneCountryControl(page, liveSignupText);

  await expect(
    page.getByRole('heading', { name: liveSignupText.heading, exact: true })
  ).toBeVisible();
  for (const control of [phoneCountry, ...controls]) {
    await expect(control).toHaveCount(1);
    await expect(control).toBeVisible();
    await expect(control).toHaveAccessibleName(/\S/);
  }
});

test('SGN-017 partner consent can be toggled without submission @real-app', async ({
  liveSignupPage,
  liveSignupText,
  page
}) => {
  await liveSignupPage.open();
  // The deployed form can finish client hydration after the load event and otherwise reset a fast toggle.
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState('networkidle');
  const consent = page.getByRole('checkbox', {
    name: liveSignupText.partnerConsentLabel,
    exact: true
  });

  await expect(consent).not.toBeChecked();
  await consent.check();
  await expect(consent).toBeChecked();
  await consent.uncheck();
  await expect(consent).not.toBeChecked();
});
