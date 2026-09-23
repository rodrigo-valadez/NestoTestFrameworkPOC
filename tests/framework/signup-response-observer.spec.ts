import { expect, test } from '@playwright/test';
import type { Page, Response } from '@playwright/test';
import { EventEmitter } from 'node:events';
import { createSyntheticSignupIdentity } from '../../src/test-data/signup-account-lifecycle';
import {
  classifySignupBody,
  observeSignupSubmission
} from '../../src/workflows/signup-account-creation';

function responseBody(identity: ReturnType<typeof createSyntheticSignupIdentity>) {
  return {
    firstName: identity.firstName,
    lastName: identity.lastName,
    phoneCountry: identity.phoneCountry,
    phone: identity.phone,
    email: identity.email,
    leadDistributeConsentAgreement: true,
    province: identity.province
  };
}

function requestBodyFor(shape: 'malformed' | 'wrong-key', email: string): unknown {
  if (shape === 'malformed') throw new Error('malformed');
  return { note: email };
}

test('persists a fixed endpoint category for dynamic or encoded paths', () => {
  const identity = createSyntheticSignupIdentity('00090000-0000-4000-8000-000000000009');
  const paths = [
    '/accounts/user%40example.com',
    '/accounts/opaque-token-slug',
    '/accounts/550e8400-e29b-41d4-a716-446655440000',
    '/accounts/123?email=user@example.com#token'
  ];
  for (const path of paths) {
    expect(
      classifySignupBody(
        201,
        'POST',
        `https://accounts.qa.nesto.ca${path}`,
        responseBody(identity),
        identity
      ).endpointCategory
    ).toBe('qa-account-creation-candidate');
  }
});

test('does not treat empty, whitespace, or non-finite identifiers as present', () => {
  const identity = createSyntheticSignupIdentity('00100000-0000-4000-8000-000000000010');
  for (const id of ['', '   ', Number.NaN]) {
    const result = classifySignupBody(
      201,
      'POST',
      'https://accounts.qa.nesto.ca/accounts',
      { ...responseBody(identity), id },
      identity
    );
    expect(result.identifierPresent).toBe(false);
    expect(result.state).toBe('ambiguous');
  }
});

test('rejects unexpected account fields and invalid phone prefixes', () => {
  const identity = createSyntheticSignupIdentity('00160000-0000-4000-8000-000000000016');
  const base = { ...responseBody(identity), id: 'account-16' };
  expect(
    classifySignupBody(
      201,
      'POST',
      'https://accounts.qa.nesto.ca/accounts',
      { ...base, unexpectedAccountField: true },
      identity
    )
  ).toMatchObject({ state: 'ambiguous', unexpectedFieldCount: 1 });
  expect(
    classifySignupBody(
      201,
      'POST',
      'https://accounts.qa.nesto.ca/accounts',
      { ...base, phone: `99${identity.phone}` },
      identity
    ).state
  ).toBe('ambiguous');
});

test('rejects populated sensitive optional account fields', () => {
  const identity = createSyntheticSignupIdentity('00190000-0000-4000-8000-000000000019');
  for (const sensitive of [{ sin: 'populated' }, { dateOfBirth: '2000-01-01' }]) {
    expect(
      classifySignupBody(
        201,
        'POST',
        'https://accounts.qa.nesto.ca/accounts',
        { ...responseBody(identity), id: 'account-19', ...sensitive },
        identity
      )
    ).toMatchObject({ state: 'ambiguous', outcome: 'sensitive-response-data' });
  }
});

test('correlates one matching account record inside a response envelope', async () => {
  const identity = createSyntheticSignupIdentity('00130000-0000-4000-8000-000000000013');
  const emitter = new EventEmitter();
  const page = emitter as unknown as Page;
  const response = {
    request: () => ({
      method: () => 'POST',
      resourceType: () => 'fetch',
      postDataJSON: () => ({ email: identity.email }),
      postData: () => JSON.stringify({ email: identity.email })
    }),
    url: () => 'https://accounts.qa.nesto.ca/accounts',
    headers: () => ({ 'content-type': 'application/json' }),
    status: () => 201,
    json: async () => ({
      account: { ...responseBody(identity), phone: `+1${identity.phone}`, id: 'account-13' },
      token: 'must-not-be-persisted'
    })
  } as unknown as Response;

  const result = await observeSignupSubmission(
    page,
    identity,
    async () => {
      emitter.emit('response', response);
    },
    0
  );

  expect(result).toMatchObject({
    state: 'created',
    outcome: 'http-201-safe-fields-match',
    identifierPresent: true
  });
});

test('ignores the expected top-level token while classifying the safe account object', async () => {
  const identity = createSyntheticSignupIdentity('00140000-0000-4000-8000-000000000014');
  const emitter = new EventEmitter();
  const page = emitter as unknown as Page;
  const response = {
    request: () => ({
      method: () => 'POST',
      resourceType: () => 'fetch',
      postDataJSON: () => ({ email: identity.email }),
      postData: () => JSON.stringify({ email: identity.email })
    }),
    url: () => 'https://accounts.qa.nesto.ca/accounts',
    headers: () => ({ 'content-type': 'application/json' }),
    status: () => 201,
    json: async () => ({
      account: { ...responseBody(identity), id: 'account-14' },
      token: 'must-not-be-persisted'
    })
  } as unknown as Response;

  const result = await observeSignupSubmission(
    page,
    identity,
    async () => {
      emitter.emit('response', response);
    },
    0
  );

  expect(result).toMatchObject({ state: 'created', outcome: 'http-201-safe-fields-match' });
});

test('rejects missing, extra, or secret-bearing top-level envelope fields', async () => {
  const identity = createSyntheticSignupIdentity('00170000-0000-4000-8000-000000000017');
  const envelopes = [
    { data: { ...responseBody(identity), id: 'account-17' }, token: 'secret' },
    { account: { ...responseBody(identity), id: 'account-17' }, token: 'secret', extra: true },
    {
      account: { ...responseBody(identity), id: 'account-17' },
      token: 'secret',
      password: 'never-accept'
    },
    {
      account: { ...responseBody(identity), id: 'account-17' },
      token: 'secret',
      authorization: 'never-accept'
    }
  ];
  for (const envelope of envelopes) {
    const emitter = new EventEmitter();
    const page = emitter as unknown as Page;
    const response = {
      request: () => ({
        method: () => 'POST',
        resourceType: () => 'xhr',
        postDataJSON: () => ({ email: identity.email }),
        postData: () => JSON.stringify({ email: identity.email })
      }),
      url: () => 'https://app.qa.nesto.ca/api/accounts',
      headers: () => ({ 'content-type': 'application/json' }),
      status: () => 201,
      json: async () => envelope
    } as unknown as Response;
    const result = await observeSignupSubmission(
      page,
      identity,
      async () => {
        emitter.emit('response', response);
      },
      0
    );
    expect(result).toMatchObject({ state: 'ambiguous', outcome: 'unsafe-response-shape' });
  }
});

test('fails closed when request email correlation is malformed or under the wrong key', async () => {
  const identity = createSyntheticSignupIdentity('00180000-0000-4000-8000-000000000018');
  for (const requestShape of ['malformed', 'wrong-key'] as const) {
    const emitter = new EventEmitter();
    const page = emitter as unknown as Page;
    const response = {
      request: () => ({
        method: () => 'POST',
        resourceType: () => 'xhr',
        postDataJSON: () => requestBodyFor(requestShape, identity.email),
        postData: () => identity.email
      }),
      url: () => 'https://app.qa.nesto.ca/api/accounts',
      headers: () => ({ 'content-type': 'application/json' }),
      status: () => 201,
      json: async () => ({
        account: { ...responseBody(identity), id: 'account-18' },
        token: 'secret'
      })
    } as unknown as Response;
    const result = await observeSignupSubmission(
      page,
      identity,
      async () => {
        emitter.emit('response', response);
      },
      0
    );
    expect(result).toMatchObject({ state: 'ambiguous', outcome: 'correlated-response-count' });
  }
});

test('rejects a shallow match when a sibling secret is nested beyond correlation depth', async () => {
  const identity = createSyntheticSignupIdentity('00150000-0000-4000-8000-000000000015');
  const emitter = new EventEmitter();
  const page = emitter as unknown as Page;
  const response = {
    request: () => ({
      method: () => 'POST',
      resourceType: () => 'fetch',
      postDataJSON: () => ({ email: identity.email }),
      postData: () => JSON.stringify({ email: identity.email })
    }),
    url: () => 'https://accounts.qa.nesto.ca/accounts',
    headers: () => ({ 'content-type': 'application/json' }),
    status: () => 201,
    json: async () => ({
      account: {
        ...responseBody(identity),
        id: 'account-15',
        metadata: { one: { two: { three: { four: { five: { token: 'never-persist' } } } } } }
      },
      token: 'expected-top-level-token'
    })
  } as unknown as Response;

  const result = await observeSignupSubmission(
    page,
    identity,
    async () => {
      emitter.emit('response', response);
    },
    0
  );

  expect(result).toMatchObject({ state: 'ambiguous', outcome: 'unsafe-response-shape' });
});

test('marks delayed duplicate correlated responses ambiguous', async ({ page }) => {
  const identity = createSyntheticSignupIdentity('00110000-0000-4000-8000-000000000011');
  await page.route('https://accounts.qa.nesto.ca/**', route =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify(responseBody(identity))
    })
  );
  await page.goto('data:text/html,<button id="submit">submit</button>');

  const result = await observeSignupSubmission(
    page,
    identity,
    async () => {
      await page.evaluate(email => {
        void fetch('https://accounts.qa.nesto.ca/accounts', {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        setTimeout(() => {
          void fetch('https://accounts.qa.nesto.ca/accounts', {
            method: 'POST',
            body: JSON.stringify({ email })
          });
        }, 50);
      }, identity.email);
    },
    150
  );

  expect(result).toMatchObject({ state: 'ambiguous', outcome: 'correlated-response-count' });
});

test('awaits response bodies still pending at the observation deadline', async () => {
  const identity = createSyntheticSignupIdentity('00120000-0000-4000-8000-000000000012');
  const emitter = new EventEmitter();
  const page = emitter as unknown as Page;
  const fakeResponse = (jsonDelay: number) =>
    ({
      request: () => ({
        method: () => 'POST',
        resourceType: () => 'fetch',
        postDataJSON: () => ({ email: identity.email }),
        postData: () => JSON.stringify({ email: identity.email })
      }),
      url: () => 'https://accounts.qa.nesto.ca/accounts',
      headers: () => ({ 'content-type': 'application/json' }),
      status: () => 201,
      json: async () => {
        await new Promise<void>(resolve => setTimeout(resolve, jsonDelay));
        return { account: { ...responseBody(identity), id: 'account-12' } };
      }
    }) as unknown as Response;

  const result = await observeSignupSubmission(
    page,
    identity,
    async () => {
      emitter.emit('response', fakeResponse(0));
      setTimeout(() => emitter.emit('response', fakeResponse(100)), 25);
    },
    50
  );

  expect(result).toMatchObject({ state: 'ambiguous', outcome: 'correlated-response-count' });
});
