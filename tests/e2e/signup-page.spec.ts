import { expect, test } from '../../src/fixtures/test';

test('drives signup controls using the project locale', async ({ page, appText, signupPage }) => {
  await page.setContent(`
    <main>
      <h1>${appText.signup.heading}</h1>
      <label>${appText.signup.emailLabel}<input type="email" name="email"></label>
      <button>${appText.signup.submitButton}</button>
    </main>
  `);

  await signupPage.assertLoaded();
  await signupPage.enterEmail('qa@example.test');

  await expect(page.locator('input[name="email"]')).toHaveValue('qa@example.test');
});
