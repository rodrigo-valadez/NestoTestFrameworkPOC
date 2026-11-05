/** Local HTML contract for fixture and Page Object wiring; it intentionally makes no deployed-application claim. */
import { expect, test } from '../../src/fixtures/test';
import { loadSignupCases } from '../../src/test-data/signup-cases';

for (const signupCase of loadSignupCases('self-contained')) {
  test(`drives signup controls for ${signupCase.id} using the project locale`, async ({
    page,
    appText,
    signupPage
  }) => {
    await page.setContent(`
    <main>
      <h1>${appText.signup.heading}</h1>
      <label>${appText.signup.emailLabel}<input type="email" name="email"></label>
      <button>${appText.signup.submitButton}</button>
    </main>
  `);

    await signupPage.assertLoaded();
    await signupPage.enterEmail(signupCase.email);

    await expect(page.locator('input[name="email"]')).toHaveValue(signupCase.email);
  });
}
