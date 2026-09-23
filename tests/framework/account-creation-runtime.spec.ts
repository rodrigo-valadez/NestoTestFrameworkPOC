import { expect, test } from '@playwright/test';
import {
  assertAccountCreationRuntime,
  type AccountCreationRuntime
} from '../../src/config/account-creation-runtime';

const approved: AccountCreationRuntime = {
  projectName: 'account-creation-chromium-en-CA',
  retries: 0,
  maxFailures: 1,
  workers: 1,
  fullyParallel: false
};

test('accepts only the approved account-creation runtime', () => {
  expect(() => assertAccountCreationRuntime(approved)).not.toThrow();
});

test('rejects retry, failure-limit, worker, parallel, and project overrides', () => {
  const overrides: Partial<AccountCreationRuntime>[] = [
    { retries: 1 },
    { maxFailures: 0 },
    { workers: 2 },
    { fullyParallel: true },
    { projectName: 'chromium-en-CA' }
  ];
  for (const override of overrides) {
    expect(() => assertAccountCreationRuntime({ ...approved, ...override })).toThrow('overridden');
  }
});
