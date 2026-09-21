import { expect, test } from '../../src/fixtures/test';
import { loadLiveSignupText } from '../../src/i18n/live-signup-text';

test('signup language switch keeps the user on the signup page', async ({
  page,
  liveSignupPage,
  liveSignupText
}) => {
  const expected = loadLiveSignupText(liveSignupText.languageSwitchTarget);

  await liveSignupPage.open();
  await liveSignupPage.switchLanguage();

  await expect(page).toHaveURL(new RegExp(`${liveSignupPage.otherLanguagePath}$`));
  await expect(page.getByRole('heading', { name: expected.heading, exact: true })).toBeVisible();
  await expect(page.getByRole('textbox', { name: expected.emailLabel, exact: true })).toBeVisible();
});
