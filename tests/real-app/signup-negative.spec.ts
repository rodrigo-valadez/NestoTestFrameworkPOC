/**
 * Read-only client-validation coverage with an account-request interception boundary.
 * Kept separate from account creation because these scenarios must never write even after a product regression.
 */
import { randomUUID } from 'node:crypto';
import type { Locator, Page } from '@playwright/test';
import { expect, test } from '../../src/fixtures/test';
import type { LiveSignupText } from '../../src/i18n/live-signup-text';
import { loadLiveSignupNegativeCases } from '../../src/test-data/live-signup-negative-cases';
import type { LiveSignupNegativeCase } from '../../src/test-data/live-signup-negative-cases';

const VALID_PASSWORD = 'QaAutomation7Pass';

async function preventAccountCreation(page: Page): Promise<() => number> {
  let attempts = 0;
  // This route is a safety boundary, not only an assertion: even a client-validation
  // regression cannot create a QA account from these read-only tests.
  await page.route('**/accounts', async route => {
    if (route.request().method() === 'POST') {
      attempts += 1;
      await route.abort('blockedbyclient');
      return;
    }
    await route.continue();
  });
  return () => attempts;
}

async function expectClientRejection(page: Page, target: Locator, attempts: () => number) {
  await expect.poll(attempts, { timeout: 1_000 }).toBe(0);
  await expect(target).toBeVisible();
  await expect
    .poll(async () =>
      target.evaluate(element => {
        const input = element as HTMLInputElement;
        return input.getAttribute('aria-invalid') === 'true' || !input.checkValidity();
      })
    )
    .toBe(true);
  await expect(page).toHaveURL(/\/signup$/);
}

async function expectLocalizedMessage(page: Page, message: string): Promise<void> {
  await expect(page.getByText(message, { exact: true })).toBeVisible();
}

function edgeInput(scenario: LiveSignupNegativeCase) {
  return {
    email:
      scenario.target === 'email'
        ? `${'a'.repeat(260)}@qa.nesto.ca`
        : `signup-negative-${randomUUID()}@qa.nesto.ca`,
    password: scenario.target === 'password' ? 'weak' : VALID_PASSWORD
  };
}

function edgeTarget(
  page: Page,
  text: LiveSignupText,
  target: LiveSignupNegativeCase['target']
): Locator {
  return page.getByLabel(target === 'email' ? text.emailLabel : text.passwordLabel, {
    exact: true
  });
}

test.beforeEach(async ({ liveSignupPage, page }) => {
  await liveSignupPage.open();
  // The deployed form accepts input before its client validation has hydrated.
  // eslint-disable-next-line playwright/no-networkidle
  await page.waitForLoadState('networkidle');
});

test('SGN-005 empty required signup fields are rejected before the API @real-app', async ({
  liveSignupPage,
  liveSignupText,
  page
}) => {
  const attempts = await preventAccountCreation(page);
  const email = page.getByLabel(liveSignupText.emailLabel, { exact: true });

  await liveSignupPage.submit();

  await expectClientRejection(page, email, attempts);
  await expect(page.getByText(liveSignupText.validation.required, { exact: true })).toHaveCount(2);
  await expectLocalizedMessage(page, liveSignupText.validation.invalidEmail);
  await expectLocalizedMessage(page, liveSignupText.validation.passwordMinimum);
  expect(attempts()).toBe(0);
});

test('SGN-005 malformed email is rejected before the API @real-app', async ({
  liveSignupPage,
  liveSignupText,
  page
}) => {
  const attempts = await preventAccountCreation(page);
  await liveSignupPage.completeForm({
    firstName: 'Qa',
    lastName: 'Negative',
    phoneCountry: 'CA',
    phone: '4035550198',
    province: 'AB',
    email: 'invalid-email',
    password: VALID_PASSWORD,
    partnerConsent: true
  });
  const email = page.getByLabel(liveSignupText.emailLabel, { exact: true });

  await liveSignupPage.submit();

  await expectClientRejection(page, email, attempts);
  await expectLocalizedMessage(page, liveSignupText.validation.invalidEmail);
  expect(attempts()).toBe(0);
});

test('SGN-015 password confirmation mismatch is rejected before the API @real-app', async ({
  liveSignupPage,
  liveSignupText,
  page
}) => {
  const attempts = await preventAccountCreation(page);
  await liveSignupPage.completeForm({
    firstName: 'Qa',
    lastName: 'Negative',
    phoneCountry: 'CA',
    phone: '4035550197',
    province: 'AB',
    email: `signup-negative-${randomUUID()}@qa.nesto.ca`,
    password: VALID_PASSWORD,
    passwordConfirmation: 'DifferentQa7Pass',
    partnerConsent: true
  });
  const confirmation = page.getByLabel(liveSignupText.passwordConfirmationLabel, { exact: true });

  await liveSignupPage.submit();

  await expectClientRejection(page, confirmation, attempts);
  await expectLocalizedMessage(page, liveSignupText.validation.passwordMismatch);
  expect(attempts()).toBe(0);
});

for (const scenario of loadLiveSignupNegativeCases()) {
  const input = edgeInput(scenario);
  const expectedFailure = scenario.id === 'email-exceeds-standard-length';

  test(`SGN-016/${scenario.id} file-driven edge input is rejected before the API @real-app`, async ({
    liveSignupPage,
    liveSignupText,
    page
  }) => {
    test.fail(
      expectedFailure,
      'BUG-SIGNUP-002: email exceeding standard length limits reaches the account API.'
    );
    const attempts = await preventAccountCreation(page);
    await liveSignupPage.completeForm({
      firstName: 'Qa',
      lastName: 'Negative',
      phoneCountry: 'CA',
      phone: '4035550196',
      province: 'AB',
      email: input.email,
      password: input.password,
      partnerConsent: true
    });
    const target = edgeTarget(page, liveSignupText, scenario.target);

    await liveSignupPage.submit();

    await expectClientRejection(page, target, attempts);
    await expectLocalizedMessage(page, liveSignupText.validation[scenario.expectedError]);
    expect(attempts()).toBe(0);
  });
}
