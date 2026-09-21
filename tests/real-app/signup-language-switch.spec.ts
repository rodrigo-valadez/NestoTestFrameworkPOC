import { expect, test } from '../../src/fixtures/test';
import { requireRealAppEnvironment } from '../../src/config/environment';
import { LiveSignupPage } from '../../src/pages/live-signup.page';

test('signup language switch keeps the user on the signup page', async ({
  page,
  environment,
  locale
}) => {
  const target = requireRealAppEnvironment(environment);
  const signup = new LiveSignupPage(page, target, locale);

  await signup.open();
  await signup.switchLanguage();

  await expect(page).toHaveURL(new RegExp(`${signup.otherLanguagePath}$`));
  await expect(signup.otherLanguageHeading()).toBeVisible();
  await expect(signup.otherLanguageEmailField()).toBeVisible();
});
