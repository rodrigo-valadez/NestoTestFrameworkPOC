import { expect, test } from '../../src/fixtures/test';
import { requireRealAppEnvironment } from '../../src/config/environment';

test('signup route exposes a visible, accessibly named email field @real-app', async ({
  page,
  environment
}) => {
  const target = requireRealAppEnvironment(environment);

  const response = await page.goto(target.signupPath);
  expect(response?.ok(), 'Signup route should return a successful response').toBe(true);
  expect(new URL(page.url()).origin).toBe(new URL(target.uiBaseURL).origin);

  const email = page.locator('input[type="email"]');
  await expect(email).toHaveCount(1);
  await expect(email).toBeVisible();
  await expect(email).toHaveAccessibleName(/\S/);
});
