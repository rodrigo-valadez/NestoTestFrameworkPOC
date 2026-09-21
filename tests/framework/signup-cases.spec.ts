import { expect, test } from '@playwright/test';
import { parseSignupCases } from '../../src/test-data/signup-cases';

test('parses named signup cases from JSON-shaped data', () => {
  expect(parseSignupCases({ cases: [{ id: 'standard-email', email: 'qa@example.test' }] })).toEqual(
    [{ id: 'standard-email', email: 'qa@example.test' }]
  );
});

test('rejects duplicate case IDs', () => {
  expect(() =>
    parseSignupCases({
      cases: [
        { id: 'same', email: 'first@example.test' },
        { id: 'same', email: 'second@example.test' }
      ]
    })
  ).toThrow('Duplicate signup case id: same');
});

test('rejects invalid email data', () => {
  expect(() => parseSignupCases({ cases: [{ id: 'bad-email', email: 'invalid' }] })).toThrow(
    'Signup case "bad-email" needs a syntactically valid email address.'
  );
});
