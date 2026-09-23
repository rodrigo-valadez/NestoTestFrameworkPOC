import { expect, test } from '../../src/fixtures/test';

test.use({ browserDiagnosticsEnabled: false });

test('fixture override disables diagnostics collection and attachment', async ({
  page,
  browserDiagnostics
}) => {
  expect(browserDiagnostics.collectionEnabled()).toBe(false);
  await page.evaluate(() => console.error('password=must-not-be-collected'));
  const attachments: string[] = [];
  await browserDiagnostics.attachOnFailure({
    status: 'failed',
    expectedStatus: 'passed',
    attach: async name => {
      attachments.push(name);
    }
  });
  expect(attachments).toEqual([]);
});
