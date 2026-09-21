import { expect, test } from '@playwright/test';
import { BrowserDiagnostics, redactDiagnostic } from '../../src/framework/browser-diagnostics';

test('redacts common sensitive values from browser diagnostics', () => {
  expect(
    redactDiagnostic(
      'Failed https://example.test/user?id=123 for qa@example.test Bearer abc123 token=secret'
    )
  ).toBe('Failed [url] for [email] Bearer [redacted] [credential]');
});

test('attaches redacted console diagnostics only on failure', async ({ page }) => {
  const diagnostics = new BrowserDiagnostics(page);
  await page.evaluate(() => console.error('Signup failed for qa@example.test token=secret'));

  const attachments: { name: string; body: string }[] = [];
  const testInfo = {
    status: 'failed',
    expectedStatus: 'passed',
    attach: async (name: string, options: { body: string }) => {
      attachments.push({ name, body: options.body });
    }
  } as Parameters<typeof diagnostics.attachOnFailure>[0];

  await diagnostics.attachOnFailure(testInfo);
  expect(attachments).toEqual([
    {
      name: 'browser-diagnostics',
      body: 'console.error: Signup failed for [email] [credential]'
    }
  ]);
});
