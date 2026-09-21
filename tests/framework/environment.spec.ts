import { expect, test } from '@playwright/test';
import { loadEnvironmentConfig, parseEnvironmentConfig } from '../../src/config/environment';

test('loads the checked-in self-contained profile by default', () => {
  expect(loadEnvironmentConfig({})).toEqual({
    name: 'self-contained',
    dataProfile: 'self-contained',
    capabilities: { realAppSmoke: false, accountCreation: false }
  });
});

test('loads the checked-in staging UI target without guessing an API endpoint', () => {
  expect(loadEnvironmentConfig({ TEST_ENV: 'staging' })).toMatchObject({
    name: 'staging',
    uiBaseURL: 'https://app.qa.nesto.ca',
    signupPath: '/signup',
    signupPathFr: '/fr/signup',
    dataProfile: 'staging',
    capabilities: { realAppSmoke: true, accountCreation: false }
  });
  expect(loadEnvironmentConfig({ TEST_ENV: 'staging' }).apiBaseURL).toBeUndefined();
});

test('rejects production, unknown targets, and unsafe configuration', () => {
  expect(() => loadEnvironmentConfig({ TEST_ENV: 'production' })).toThrow('disabled by policy');
  expect(() => loadEnvironmentConfig({ TEST_ENV: 'unknown' })).toThrow('Unsupported TEST_ENV');
  expect(() =>
    parseEnvironmentConfig('staging', {
      uiBaseURL: 'https://user:password@example.test',
      signupPath: '/signup'
    })
  ).toThrow('without embedded credentials');
  expect(() => parseEnvironmentConfig('staging', { uiBaseURL: null, signupPath: null })).toThrow(
    'Staging is not configured'
  );
});
