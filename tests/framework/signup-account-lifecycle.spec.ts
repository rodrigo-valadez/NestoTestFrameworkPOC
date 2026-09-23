import { closeSync, mkdtempSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import {
  createSignupPassword,
  createSyntheticSignupIdentity,
  readSignupLedger,
  reserveSignupAttempt,
  updateSignupAttempt
} from '../../src/test-data/signup-account-lifecycle';
import { classifySignupBody } from '../../src/workflows/signup-account-creation';

function ledgerPath(executable = true): string {
  const directory = mkdtempSync(join(tmpdir(), 'signup-ledger-'));
  const path = join(directory, 'ledger.json');
  writeFileSync(
    path,
    JSON.stringify({
      environment: 'staging',
      feature: 'signup',
      owner: 'requesting-user',
      attemptBudgetApprovedAt: '2026-09-22',
      attemptBudgetAmendedAt: '2026-09-23',
      lifecycleApprovedAt: '2026-09-23',
      attemptCap: 20,
      retentionReviewDays: 30,
      reconciliationMethod: null,
      executable,
      attempts: []
    })
  );
  return path;
}

test('rejects a lifecycle-approved ledger until execution is enabled', () => {
  const path = ledgerPath(false);
  expect(() => readSignupLedger(path)).toThrow('not executable');
});

test('reserves one unique attempt and never writes a password', () => {
  const path = ledgerPath();
  const identity = createSyntheticSignupIdentity('00000000-0000-4000-8000-000000000001');
  const password = createSignupPassword();
  const attempt = reserveSignupAttempt(path, identity, new Date('2026-09-23T00:00:00Z'));
  const written = readFileSync(path, 'utf8');

  expect(attempt.state).toBe('reserved');
  expect(attempt.identity.lastName).toMatch(/^[A-Za-z]+$/);
  expect(attempt.identity.email).toMatch(/^signup-automation-[a-f0-9-]+@qa\.nesto\.ca$/);
  expect(written).toContain(identity.email);
  expect(written).not.toContain(password);
  expect(JSON.parse(written).attempts).toHaveLength(1);
});

test('fails closed while another process owns the ledger lock', () => {
  const path = ledgerPath();
  const lock = openSync(`${path}.lock`, 'wx', 0o600);
  try {
    expect(() =>
      reserveSignupAttempt(
        path,
        createSyntheticSignupIdentity('00000000-0000-4000-8000-000000000002')
      )
    ).toThrow('Signup ledger is locked');
    expect(JSON.parse(readFileSync(path, 'utf8')).attempts).toHaveLength(0);
  } finally {
    closeSync(lock);
  }
});

test('rejects identity reuse and the twenty-first reservation', () => {
  const path = ledgerPath();
  const first = createSyntheticSignupIdentity('00010000-0000-4000-8000-000000000003');
  reserveSignupAttempt(path, first);
  expect(() => reserveSignupAttempt(path, first)).toThrow('collides');
  for (let index = 2; index <= 20; index += 1) {
    const prefix = index.toString(16).padStart(4, '0');
    reserveSignupAttempt(
      path,
      createSyntheticSignupIdentity(
        `${prefix}0000-0000-4000-8000-${String(index).padStart(12, '0')}`
      )
    );
  }
  expect(() =>
    reserveSignupAttempt(
      path,
      createSyntheticSignupIdentity('00150000-0000-4000-8000-000000000021')
    )
  ).toThrow('cap reached');
  const phones = readSignupLedger(path).attempts.map(attempt => attempt.identity.phone);
  expect(new Set(phones).size).toBe(20);
});

test('classifies only an exact 201 safe-field match as created', () => {
  const identity = createSyntheticSignupIdentity('00000000-0000-4000-8000-000000000006');
  const body = {
    firstName: identity.firstName,
    lastName: identity.lastName,
    phoneCountry: identity.phoneCountry,
    phone: identity.phone,
    email: identity.email,
    leadDistributeConsentAgreement: true,
    province: identity.province,
    id: 'account-1'
  };
  const result = classifySignupBody(
    201,
    'POST',
    'https://accounts.qa.nesto.ca/v1/accounts',
    body,
    identity
  );

  expect(result).toMatchObject({
    state: 'created',
    fieldsMatched: true,
    identifierPresent: true
  });
  expect(result.safeFieldNames).not.toContain('runId');
});

test('treats truthy consent strings and secret-bearing shapes as ambiguous', () => {
  const identity = createSyntheticSignupIdentity('00000000-0000-4000-8000-000000000007');
  const base = {
    firstName: identity.firstName,
    lastName: identity.lastName,
    phoneCountry: identity.phoneCountry,
    phone: identity.phone,
    email: identity.email,
    province: identity.province
  };

  expect(
    classifySignupBody(
      201,
      'POST',
      'https://accounts.qa.nesto.ca/v1/accounts',
      { ...base, leadDistributeConsentAgreement: 'true' },
      identity
    ).state
  ).toBe('ambiguous');
  expect(
    classifySignupBody(
      201,
      'POST',
      'https://accounts.qa.nesto.ca/v1/accounts',
      { ...base, password: 'must-not-appear' },
      identity
    ).outcome
  ).toBe('unsafe-response-shape');
});

test('persists only sanitized terminal result metadata', () => {
  const path = ledgerPath();
  const identity = createSyntheticSignupIdentity('00080000-0000-4000-8000-000000000008');
  const attempt = reserveSignupAttempt(path, identity);
  updateSignupAttempt(path, attempt.attemptId, {
    state: 'submitted',
    submittedAt: '2026-09-23T00:00:01Z'
  });
  updateSignupAttempt(path, attempt.attemptId, {
    state: 'created',
    resultAt: '2026-09-23T00:00:02Z',
    httpStatus: 201,
    endpointCategory: 'qa-account-creation-candidate',
    outcome: 'http-201-safe-fields-match',
    safeFieldNames: ['email', 'leadDistributeConsentAgreement'],
    unexpectedFieldCount: 0,
    fieldsMatched: true,
    identifierPresent: false
  });
  const stored = readSignupLedger(path).attempts[0];
  expect(stored).toMatchObject({
    state: 'created',
    safeFieldNames: ['email', 'leadDistributeConsentAgreement'],
    unexpectedFieldCount: 0,
    fieldsMatched: true,
    identifierPresent: false
  });
});

test('disables later reservations after an ambiguous terminal result', () => {
  const path = ledgerPath();
  const identity = createSyntheticSignupIdentity('00090000-0000-4000-8000-000000000009');
  const attempt = reserveSignupAttempt(path, identity);
  updateSignupAttempt(path, attempt.attemptId, {
    state: 'ambiguous',
    resultAt: '2026-09-23T00:00:02Z',
    outcome: 'correlated-response-count',
    safeFieldNames: [],
    unexpectedFieldCount: 0,
    fieldsMatched: false,
    identifierPresent: false
  });

  expect(JSON.parse(readFileSync(path, 'utf8')).executable).toBe(false);
  expect(() =>
    reserveSignupAttempt(
      path,
      createSyntheticSignupIdentity('00100000-0000-4000-8000-000000000010')
    )
  ).toThrow('not executable');
});
