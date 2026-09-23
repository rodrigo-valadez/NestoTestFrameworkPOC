import { closeSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { dirname, join } from 'node:path';

const APPROVED_SAFE_FIELDS = new Set([
  'firstName',
  'lastName',
  'phoneCountry',
  'phone',
  'email',
  'leadDistributeConsentAgreement',
  'province',
  'provinceCode',
  'region',
  'id',
  'accountId',
  'userId'
]);

export type SignupAttemptState = 'reserved' | 'submitted' | 'created' | 'rejected' | 'ambiguous';

export interface SyntheticSignupIdentity {
  runId: string;
  firstName: string;
  lastName: string;
  phoneCountry: 'CA';
  phone: string;
  province: 'AB';
  email: string;
  partnerConsent: true;
}

export interface SignupAttempt {
  attemptId: string;
  caseId: 'SGN-006/primary-en-ca';
  state: SignupAttemptState;
  reservedAt: string;
  submittedAt?: string;
  resultAt?: string;
  reviewAt: string;
  browser: 'chromium';
  locale: 'en-CA';
  identity: SyntheticSignupIdentity;
  httpStatus?: number;
  endpointCategory?: string;
  outcome?: string;
  safeFieldNames?: string[];
  unexpectedFieldCount?: number;
  fieldsMatched?: boolean;
  identifierPresent?: boolean;
}

export interface SignupAccountLedger {
  environment: 'staging';
  feature: 'signup';
  owner: string;
  attemptBudgetApprovedAt: string;
  attemptBudgetAmendedAt: string;
  lifecycleApprovedAt: string;
  attemptCap: 20;
  retentionReviewDays: 30;
  reconciliationMethod: null;
  executable: boolean;
  attempts: SignupAttempt[];
}

export function createSyntheticSignupIdentity(runId = randomUUID()): SyntheticSignupIdentity {
  const compact = runId.replace(/-/g, '').toLowerCase();
  if (!/^[a-f0-9]{32}$/.test(compact)) throw new Error('Run ID must be a UUID.');
  const phoneSuffix = String(Number.parseInt(compact.slice(0, 4), 16) % 100).padStart(2, '0');
  const letterSuffix = compact
    .slice(-8)
    .replace(/[0-9]/g, digit => String.fromCharCode('g'.charCodeAt(0) + Number(digit)));
  return {
    runId,
    firstName: 'Qa',
    lastName: `Agent${letterSuffix}`,
    phoneCountry: 'CA',
    phone: `40355501${phoneSuffix}`,
    province: 'AB',
    email: `signup-automation-${runId}@qa.nesto.ca`,
    partnerConsent: true
  };
}

export function createSignupPassword(): string {
  return `Qa7${randomBytes(7).toString('hex').slice(0, 13)}`;
}

export function readSignupLedger(path: string): SignupAccountLedger {
  const serialized = readFileSync(path, 'utf8');
  const value = JSON.parse(serialized) as unknown;
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Signup ledger must be an object.');
  }
  const ledger = value as Partial<SignupAccountLedger>;
  if (
    ledger.environment !== 'staging' ||
    ledger.feature !== 'signup' ||
    typeof ledger.owner !== 'string' ||
    !ledger.lifecycleApprovedAt ||
    ledger.attemptBudgetAmendedAt !== '2026-09-23' ||
    ledger.attemptCap !== 20 ||
    ledger.retentionReviewDays !== 30 ||
    !Array.isArray(ledger.attempts)
  ) {
    throw new Error('Signup ledger does not match the approved lifecycle.');
  }
  if (!ledger.executable) throw new Error('Signup ledger is not executable.');
  const attempts = ledger.attempts as unknown[];
  if (attempts.length > ledger.attemptCap)
    throw new Error('Signup ledger exceeds its attempt cap.');
  const attemptIds = new Set<string>();
  const runIds = new Set<string>();
  const emails = new Set<string>();
  const phones = new Set<string>();
  for (const entry of attempts) {
    if (!isRecord(entry) || !isRecord(entry.identity)) {
      throw new Error('Signup ledger contains an invalid attempt.');
    }
    const attempt = entry as unknown as SignupAttempt;
    if (
      typeof attempt.attemptId !== 'string' ||
      attemptIds.has(attempt.attemptId) ||
      !['reserved', 'submitted', 'created', 'rejected', 'ambiguous'].includes(attempt.state) ||
      attempt.caseId !== 'SGN-006/primary-en-ca' ||
      attempt.browser !== 'chromium' ||
      attempt.locale !== 'en-CA' ||
      attempt.identity.partnerConsent !== true ||
      (attempt.safeFieldNames !== undefined &&
        (!Array.isArray(attempt.safeFieldNames) ||
          attempt.safeFieldNames.some(
            field => typeof field !== 'string' || !APPROVED_SAFE_FIELDS.has(field)
          ))) ||
      (attempt.unexpectedFieldCount !== undefined &&
        (!Number.isInteger(attempt.unexpectedFieldCount) || attempt.unexpectedFieldCount < 0)) ||
      (attempt.fieldsMatched !== undefined && typeof attempt.fieldsMatched !== 'boolean') ||
      (attempt.identifierPresent !== undefined && typeof attempt.identifierPresent !== 'boolean')
    ) {
      throw new Error('Signup ledger contains an invalid attempt.');
    }
    if (
      (attempt.state === 'submitted' && !attempt.submittedAt) ||
      (['created', 'rejected', 'ambiguous'].includes(attempt.state) &&
        (!attempt.resultAt || !attempt.outcome)) ||
      (attempt.state === 'created' &&
        (attempt.httpStatus !== 201 ||
          attempt.endpointCategory !== 'qa-account-creation-candidate' ||
          !attempt.safeFieldNames ||
          attempt.fieldsMatched !== true ||
          attempt.unexpectedFieldCount !== 0 ||
          typeof attempt.identifierPresent !== 'boolean'))
    ) {
      throw new Error('Signup ledger attempt is missing state evidence.');
    }
    if (
      runIds.has(attempt.identity.runId) ||
      emails.has(attempt.identity.email) ||
      phones.has(attempt.identity.phone)
    ) {
      throw new Error('Signup ledger contains reused identity data.');
    }
    attemptIds.add(attempt.attemptId);
    runIds.add(attempt.identity.runId);
    emails.add(attempt.identity.email);
    phones.add(attempt.identity.phone);
  }
  if (hasForbiddenKey(value)) throw new Error('Signup ledger contains a forbidden secret field.');
  return ledger as SignupAccountLedger;
}

export function reserveSignupAttempt(
  path: string,
  identity: SyntheticSignupIdentity,
  now = new Date()
): SignupAttempt {
  return withLedgerLock(path, () => {
    const ledger = readSignupLedger(path);
    if (ledger.attempts.length >= ledger.attemptCap) throw new Error('Signup attempt cap reached.');
    const usedPhones = new Set(ledger.attempts.map(attempt => attempt.identity.phone));
    const phone = Array.from(
      { length: 100 },
      (_, index) => `40355501${String(index).padStart(2, '0')}`
    ).find(candidate => !usedPhones.has(candidate));
    if (!phone) throw new Error('Synthetic signup phone pool is exhausted.');
    const reservedIdentity = { ...identity, phone };
    if (
      ledger.attempts.some(
        attempt =>
          attempt.identity.runId === reservedIdentity.runId ||
          attempt.identity.email === reservedIdentity.email
      )
    ) {
      throw new Error('Synthetic signup identity collides with the ledger.');
    }
    const attempt: SignupAttempt = {
      attemptId: randomUUID(),
      caseId: 'SGN-006/primary-en-ca',
      state: 'reserved',
      reservedAt: now.toISOString(),
      reviewAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      browser: 'chromium',
      locale: 'en-CA',
      identity: reservedIdentity
    };
    ledger.attempts.push(attempt);
    replaceLedger(path, ledger);
    return attempt;
  });
}

export function updateSignupAttempt(
  path: string,
  attemptId: string,
  update: Pick<SignupAttempt, 'state'> &
    Partial<
      Pick<
        SignupAttempt,
        | 'submittedAt'
        | 'resultAt'
        | 'httpStatus'
        | 'endpointCategory'
        | 'outcome'
        | 'safeFieldNames'
        | 'unexpectedFieldCount'
        | 'fieldsMatched'
        | 'identifierPresent'
      >
    >
): void {
  withLedgerLock(path, () => {
    const ledger = readSignupLedger(path);
    const attempt = ledger.attempts.find(candidate => candidate.attemptId === attemptId);
    if (!attempt) throw new Error('Signup attempt was not found.');
    const allowed: Record<SignupAttemptState, SignupAttemptState[]> = {
      reserved: ['submitted', 'ambiguous'],
      submitted: ['created', 'rejected', 'ambiguous'],
      created: [],
      rejected: [],
      ambiguous: []
    };
    if (!allowed[attempt.state].includes(update.state)) {
      throw new Error('Invalid signup attempt state transition.');
    }
    if (
      update.state === 'created' &&
      (update.httpStatus !== 201 ||
        update.endpointCategory !== 'qa-account-creation-candidate' ||
        !update.safeFieldNames ||
        update.safeFieldNames.some(field => !APPROVED_SAFE_FIELDS.has(field)) ||
        update.fieldsMatched !== true ||
        update.unexpectedFieldCount !== 0 ||
        typeof update.identifierPresent !== 'boolean' ||
        !update.resultAt ||
        !update.outcome)
    ) {
      throw new Error('Created signup attempt requires sanitized result evidence.');
    }
    Object.assign(attempt, update);
    if (update.state === 'rejected' || update.state === 'ambiguous') {
      ledger.executable = false;
    }
    replaceLedger(path, ledger);
  });
}

function withLedgerLock<T>(path: string, work: () => T): T {
  const lockPath = `${path}.lock`;
  let descriptor: number;
  try {
    descriptor = openSync(lockPath, 'wx', 0o600);
  } catch {
    throw new Error('Signup ledger is locked; review the lock manually.');
  }
  try {
    return work();
  } finally {
    closeSync(descriptor);
    unlinkSync(lockPath);
  }
}

function replaceLedger(path: string, ledger: SignupAccountLedger): void {
  const temporaryPath = join(dirname(path), `.signup-ledger-${randomUUID()}.tmp`);
  writeFileSync(temporaryPath, `${JSON.stringify(ledger, null, 2)}\n`, { mode: 0o600 });
  renameSync(temporaryPath, path);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasForbiddenKey(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(hasForbiddenKey);
  if (!isRecord(value)) return false;
  return Object.entries(value).some(
    ([key, nested]) =>
      /password|confirmation|secret|token|authorization|cookie/i.test(key) ||
      hasForbiddenKey(nested)
  );
}
