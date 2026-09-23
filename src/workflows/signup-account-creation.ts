import type { Page, Request, Response } from '@playwright/test';
import type { SyntheticSignupIdentity } from '../test-data/signup-account-lifecycle';

const SAFE_FIELDS = [
  'firstName',
  'lastName',
  'phoneCountry',
  'phone',
  'email',
  'leadDistributeConsentAgreement'
] as const;
const PROVINCE_FIELDS = ['province', 'provinceCode', 'region'] as const;
const IDENTIFIER_FIELDS = ['id', 'accountId', 'userId'] as const;
const UNSAFE_KEY = /password|secret|token|authorization|cookie/i;
const OBSERVED_ACCOUNT_FIELDS = new Set([
  'activated',
  'active',
  'accountId',
  'address',
  'advisorNumber',
  'ckTrackingId',
  'ckTrackingIdSpecified',
  'created',
  'createdAt',
  'dateOfBirth',
  'dateOfBirthSpecified',
  'deleted',
  'disabled',
  'email',
  'emailMachineValidationStatus',
  'emailMachineValidationStatusSpecified',
  'expires',
  'externalAuthenticationProviderUserID',
  'externalAuthenticationProviderUserIDSpecified',
  'firstName',
  'firstNameSpecified',
  'id',
  'identityId',
  'identityIdSpecified',
  'impressionsTrackingId',
  'impressionsTrackingIdSpecified',
  'isDigital',
  'isDigitalSpecified',
  'isGuarantor',
  'lastLoggedInOn',
  'lastName',
  'lastNameSpecified',
  'leadDistributeConsentAgreement',
  'leadDistributeConsentAgreementSpecified',
  'leadDistributionPlatformPartnerID',
  'loggedAtLeastOnce',
  'loggedAtLeastOnceSpecified',
  'nickname',
  'nicknameSpecified',
  'partialPostalCode',
  'partialPostalCodeSpecified',
  'partner',
  'partnerAgreement',
  'partnerAgreementSpecified',
  'partnerSpecified',
  'phone',
  'phoneCountry',
  'phoneExtension',
  'phoneExtensionSpecified',
  'phoneSpecified',
  'postalCode',
  'postalCodeSpecified',
  'preferredLanguage',
  'preferredLanguageSpecified',
  'prefersPaperCommunications',
  'prefersPaperMail',
  'prefersPaperMailSpecified',
  'province',
  'provinceCode',
  'region',
  'regionSpecified',
  'rid',
  'role',
  'sin',
  'slug',
  'socialLoginProvider',
  'socialLoginProviderSpecified',
  'socialLoginUserId',
  'subPartnerId',
  'subPartnerIdSpecified',
  'tenant',
  'tenantReferralId',
  'updated',
  'userId'
]);
const SENSITIVE_OPTIONAL_FIELDS = [
  'address',
  'dateOfBirth',
  'externalAuthenticationProviderUserID',
  'identityId',
  'partialPostalCode',
  'postalCode',
  'sin',
  'socialLoginProvider',
  'socialLoginUserId'
] as const;

export interface SanitizedSignupResult {
  state: 'created' | 'ambiguous';
  status?: number;
  method?: string;
  endpointCategory?: string;
  safeFieldNames: string[];
  unexpectedFieldCount: number;
  fieldsMatched: boolean;
  identifierPresent: boolean;
  outcome: string;
}

export async function observeSignupSubmission(
  page: Page,
  identity: SyntheticSignupIdentity,
  submit: () => Promise<void>,
  timeoutMs = 15_000
): Promise<SanitizedSignupResult> {
  const candidates: {
    response: Response;
    body: Record<string, unknown>;
    unsafeAccount: boolean;
  }[] = [];
  const pending = new Set<Promise<void>>();
  const handleResponse = async (response: Response) => {
    try {
      if (!isCandidateTransport(response, identity.email)) return;
      const body = (await response.json()) as unknown;
      if (!isExpectedAccountEnvelope(body)) {
        candidates.push({ response, body: {}, unsafeAccount: true });
        return;
      }
      const account = body.account;
      candidates.push({ response, body: account, unsafeAccount: hasUnsafeKey(account) });
    } catch {
      // An unreadable response cannot become a correlated candidate.
    }
  };
  const onResponse = (response: Response) => {
    const task = handleResponse(response);
    pending.add(task);
    void task.finally(() => pending.delete(task));
  };
  page.on('response', onResponse);
  try {
    await submit();
    await new Promise<void>(resolve => setTimeout(resolve, timeoutMs));
  } finally {
    page.off('response', onResponse);
  }
  await Promise.allSettled([...pending]);
  if (candidates.length !== 1) return ambiguous('correlated-response-count');
  if (candidates[0].unsafeAccount) return ambiguous('unsafe-response-shape');
  return classifySignupResponse(candidates[0].response, candidates[0].body, identity);
}

export function classifySignupBody(
  status: number,
  method: string,
  url: string,
  body: Record<string, unknown>,
  identity: SyntheticSignupIdentity
): SanitizedSignupResult {
  if (!isAllowedQaURL(url) || method === 'GET') return ambiguous('unapproved-transport');
  return classify(status, method, url, body, identity);
}

function classifySignupResponse(
  response: Response,
  body: Record<string, unknown>,
  identity: SyntheticSignupIdentity
): SanitizedSignupResult {
  return classify(response.status(), response.request().method(), response.url(), body, identity);
}

function classify(
  status: number,
  method: string,
  url: string,
  body: Record<string, unknown>,
  identity: SyntheticSignupIdentity
): SanitizedSignupResult {
  const keys = Object.keys(body);
  if (keys.some(key => UNSAFE_KEY.test(key))) return ambiguous('unsafe-response-shape');
  const provinceKeys = PROVINCE_FIELDS.filter(key => key in body);
  if (provinceKeys.length !== 1) return ambiguous('province-shape');
  const expected: Record<string, unknown> = {
    firstName: identity.firstName,
    lastName: identity.lastName,
    email: identity.email,
    leadDistributeConsentAgreement: true,
    [provinceKeys[0]]: identity.province
  };
  const phoneMatched = phoneValuesMatch(body.phone, identity.phone);
  const fieldsMatched =
    phoneMatched && Object.entries(expected).every(([key, value]) => body[key] === value);
  const allowed = new Set<string>([...SAFE_FIELDS, ...PROVINCE_FIELDS, ...IDENTIFIER_FIELDS]);
  const identifierPresent = IDENTIFIER_FIELDS.some(
    key =>
      (typeof body[key] === 'string' && body[key].trim().length > 0) ||
      (typeof body[key] === 'number' && Number.isFinite(body[key]))
  );
  const unexpectedFieldCount = keys.filter(key => !OBSERVED_ACCOUNT_FIELDS.has(key)).length;
  if (SENSITIVE_OPTIONAL_FIELDS.some(key => !isEmptyOptionalValue(body[key]))) {
    return ambiguous('sensitive-response-data');
  }
  const base = {
    status,
    method,
    endpointCategory: endpointCategory(url),
    safeFieldNames: keys.filter(key => allowed.has(key)).sort(),
    unexpectedFieldCount,
    fieldsMatched,
    identifierPresent
  };
  if (
    status === 201 &&
    fieldsMatched &&
    base.identifierPresent &&
    base.endpointCategory &&
    base.unexpectedFieldCount === 0
  ) {
    return { ...base, state: 'created', outcome: 'http-201-safe-fields-match' };
  }
  return { ...base, state: 'ambiguous', outcome: 'response-contract-mismatch' };
}

function isCandidateTransport(response: Response, email: string): boolean {
  const request = response.request();
  return (
    request.method() === 'POST' &&
    ['fetch', 'xhr'].includes(request.resourceType()) &&
    isAllowedQaURL(response.url()) &&
    new URL(response.url()).pathname.endsWith('/accounts') &&
    requestContainsEmail(request, email) &&
    (response.headers()['content-type'] ?? '').includes('application/json')
  );
}

function isAllowedQaURL(value: string): boolean {
  const url = new URL(value);
  return (
    url.protocol === 'https:' &&
    (url.hostname === 'app.qa.nesto.ca' || url.hostname.endsWith('.qa.nesto.ca'))
  );
}

function endpointCategory(value: string): string | undefined {
  const path = new URL(value).pathname;
  if (!path.startsWith('/')) return undefined;
  return 'qa-account-creation-candidate';
}

function ambiguous(outcome: string): SanitizedSignupResult {
  return {
    state: 'ambiguous',
    safeFieldNames: [],
    unexpectedFieldCount: 0,
    fieldsMatched: false,
    identifierPresent: false,
    outcome
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requestContainsEmail(request: Request, email: string): boolean {
  try {
    return findValue(request.postDataJSON(), 'email', email);
  } catch {
    return false;
  }
}

function findValue(value: unknown, key: string, expected: unknown, depth = 0): boolean {
  if (depth > 5) return false;
  if (Array.isArray(value)) return value.some(item => findValue(item, key, expected, depth + 1));
  if (!isRecord(value)) return false;
  if (value[key] === expected) return true;
  return Object.values(value).some(item => findValue(item, key, expected, depth + 1));
}

function phoneValuesMatch(actual: unknown, expected: string): boolean {
  if (typeof actual !== 'string') return false;
  const actualDigits = actual.replace(/\D/g, '');
  const expectedDigits = expected.replace(/\D/g, '');
  return actualDigits === expectedDigits || actualDigits === `1${expectedDigits}`;
}

function isExpectedAccountEnvelope(
  value: unknown
): value is { account: Record<string, unknown>; token: unknown } {
  if (!isRecord(value) || !isRecord(value.account)) return false;
  const keys = Object.keys(value).sort();
  return keys.length === 2 && keys[0] === 'account' && keys[1] === 'token';
}

function isEmptyOptionalValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (isRecord(value)) return Object.keys(value).length === 0;
  return false;
}

function hasUnsafeKey(value: unknown): boolean {
  const seen = new WeakSet<object>();
  let inspectedNodes = 0;
  const inspect = (node: unknown): boolean => {
    if (typeof node !== 'object' || node === null) return false;
    inspectedNodes += 1;
    if (inspectedNodes > 1_000) return true;
    if (seen.has(node)) return false;
    seen.add(node);
    if (Array.isArray(node)) return node.some(inspect);
    return Object.entries(node).some(([key, nested]) => UNSAFE_KEY.test(key) || inspect(nested));
  };
  return inspect(value);
}
