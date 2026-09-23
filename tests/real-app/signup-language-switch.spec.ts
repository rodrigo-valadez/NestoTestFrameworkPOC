import { expect, test } from '../../src/fixtures/test';
import type { Page } from '@playwright/test';
import { loadLiveSignupText } from '../../src/i18n/live-signup-text';
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

test('SGN-002 signup language switch exposes the destination signup form @real-app', async ({
  page,
  liveSignupPage,
  liveSignupText
}) => {
  const expected = loadLiveSignupText(liveSignupText.languageSwitchTarget);

  await liveSignupPage.open();
  await liveSignupPage.switchLanguage();

  await expect(page).toHaveURL(new RegExp(`${liveSignupPage.otherLanguagePath}$`));
  await expect(page.getByRole('heading', { name: expected.heading, exact: true })).toBeVisible();
  await expect(page.getByLabel(expected.firstNameLabel, { exact: true })).toBeVisible();
  await expect(page.getByLabel(expected.lastNameLabel, { exact: true })).toBeVisible();
  const phoneCountry = phoneCountryControl(page, expected);
  await expect(phoneCountry).toHaveCount(1);
  await expect(phoneCountry).toBeVisible();
  await expect(phoneCountry).toHaveAccessibleName(/\S/);
  await expect(page.getByLabel(expected.phoneLabel, { exact: true })).toBeVisible();
  await expect(
    page.getByRole('combobox', { name: expected.provinceLabel, exact: true })
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: expected.emailLabel, exact: true })).toBeVisible();
  await expect(page.getByLabel(expected.passwordLabel, { exact: true })).toBeVisible();
  await expect(page.getByLabel(expected.passwordConfirmationLabel, { exact: true })).toBeVisible();
  await expect(
    page.getByRole('checkbox', { name: expected.partnerConsentLabel, exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: expected.submitButton, exact: true })
  ).toBeVisible();
});
