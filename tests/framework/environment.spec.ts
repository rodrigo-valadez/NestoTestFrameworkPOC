import { expect, test } from '@playwright/test';
import { loadEnvironmentConfig } from '../../src/config/environment';

test('defaults to a read-only self-contained environment', () => {
  expect(loadEnvironmentConfig({})).toEqual({
    name: 'self-contained',
    dataProfile: 'self-contained',
    capabilities: { realAppSmoke: false, accountCreation: false }
  });
});

test('requires explicit endpoints and signup path for staging', () => {
  expect(() => loadEnvironmentConfig({ TEST_ENV: 'staging' })).toThrow('UI_BASE_URL is required');
  expect(
    loadEnvironmentConfig({
      TEST_ENV: 'staging',
      UI_BASE_URL: 'https://staging.example.test',
      API_BASE_URL: 'https://api-staging.example.test',
      SIGNUP_PATH: '/signup',
      API_HEALTH_PATH: '/health'
    })
  ).toMatchObject({
    name: 'staging',
    dataProfile: 'staging',
    signupPath: '/signup',
    apiHealthPath: '/health',
    capabilities: { realAppSmoke: true, accountCreation: false }
  });
});

test('rejects unsafe or malformed environment values', () => {
  expect(() => loadEnvironmentConfig({ TEST_ENV: 'unknown' })).toThrow('Unsupported TEST_ENV');
  expect(() =>
    loadEnvironmentConfig({
      TEST_ENV: 'production',
      UI_BASE_URL: 'https://user:password@example.test',
      API_BASE_URL: 'https://api.example.test',
      SIGNUP_PATH: '/signup'
    })
  ).toThrow('without embedded credentials');
});
