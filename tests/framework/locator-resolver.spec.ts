import { expect, test } from '../../src/fixtures/test';

test('uses the first unique visible locator and records its strategy', async ({
  page,
  locatorResolver
}, testInfo) => {
  await page.setContent('<label>Email address <input name="email"></label>');

  const input = await locatorResolver.resolve([
    { name: 'missing test id', locate: currentPage => currentPage.getByTestId('email') },
    { name: 'accessible label', locate: currentPage => currentPage.getByLabel('Email address') }
  ]);

  await input.fill('qa@example.test');
  await expect(input).toHaveValue('qa@example.test');
  expect(testInfo.annotations).toContainEqual({
    type: 'locator-strategy',
    description: 'accessible label'
  });
});

test('ignores hidden matches when exactly one match is visible', async ({
  page,
  locatorResolver
}) => {
  await page.setContent(`
    <button class="action" hidden>Continue</button>
    <button class="action">Continue</button>
  `);

  const button = await locatorResolver.resolve([
    { name: 'action class', locate: currentPage => currentPage.locator('.action') }
  ]);

  await expect(button).toBeVisible();
});

test('fails instead of guessing when a strategy is ambiguous', async ({
  page,
  locatorResolver
}) => {
  await page.setContent('<button>Continue</button><button>Continue</button>');

  await expect(
    locatorResolver.resolve([
      { name: 'continue role', locate: currentPage => currentPage.getByRole('button') }
    ])
  ).rejects.toThrow('Locator strategy "continue role" is ambiguous: 2 visible elements matched.');
});
