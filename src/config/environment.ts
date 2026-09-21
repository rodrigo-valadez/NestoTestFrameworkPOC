import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type TestEnvironment = 'self-contained' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: TestEnvironment;
  uiBaseURL?: string;
  apiBaseURL?: string;
  signupPath?: string;
  signupPathFr?: string;
  apiHealthPath?: string;
  dataProfile: string;
  capabilities: { realAppSmoke: boolean; accountCreation: boolean };
}

export type RealAppEnvironmentConfig = EnvironmentConfig & {
  uiBaseURL: string;
  signupPath: string;
};
export type ApiHealthEnvironmentConfig = EnvironmentConfig & {
  apiBaseURL: string;
  apiHealthPath: string;
};

export function requireRealAppEnvironment(
  environment: EnvironmentConfig
): RealAppEnvironmentConfig {
  if (!environment.capabilities.realAppSmoke || !environment.uiBaseURL || !environment.signupPath) {
    throw new Error('Select a configured staging TEST_ENV before running this smoke test.');
  }
  return environment as RealAppEnvironmentConfig;
}

export function requireApiHealthEnvironment(
  environment: EnvironmentConfig
): ApiHealthEnvironmentConfig {
  if (!environment.apiBaseURL || !environment.apiHealthPath) {
    throw new Error('Configure apiBaseURL and apiHealthPath for staging before API smoke.');
  }
  return environment as ApiHealthEnvironmentConfig;
}

function optionalString(value: unknown, name: string): string | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`${name} must be a string.`);
  return value;
}

function rootRelativePath(value: unknown, name: string): string | undefined {
  const path = optionalString(value, name);
  if (path && (!path.startsWith('/') || path.startsWith('//'))) {
    throw new Error(`${name} must be a root-relative path such as /signup.`);
  }
  return path;
}

function absoluteHttpURL(value: unknown, name: string): string | undefined {
  const url = optionalString(value, name);
  if (!url) return undefined;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`${name} must be an absolute http(s) URL.`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error(`${name} must be an absolute http(s) URL without embedded credentials.`);
  }
  return parsed.toString().replace(/\/$/, '');
}

export function parseEnvironmentConfig(name: TestEnvironment, value: unknown): EnvironmentConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} environment config must be a JSON object.`);
  }
  const raw = value as Record<string, unknown>;
  const dataProfile = optionalString(raw.dataProfile, 'dataProfile') ?? name;
  if (!/^[a-z][a-z0-9-]*$/.test(dataProfile))
    throw new Error(`Invalid dataProfile: ${dataProfile}`);
  const uiBaseURL = absoluteHttpURL(raw.uiBaseURL, 'uiBaseURL');
  const apiBaseURL = absoluteHttpURL(raw.apiBaseURL, 'apiBaseURL');
  const signupPath = rootRelativePath(raw.signupPath, 'signupPath');
  const signupPathFr = rootRelativePath(raw.signupPathFr, 'signupPathFr');
  const apiHealthPath = rootRelativePath(raw.apiHealthPath, 'apiHealthPath');

  if (name === 'production') {
    throw new Error('Production test execution is disabled by policy.');
  }
  if (name === 'self-contained') {
    if (uiBaseURL || apiBaseURL || signupPath || signupPathFr || apiHealthPath) {
      throw new Error('self-contained must not point to a deployed application.');
    }
    return { name, dataProfile, capabilities: { realAppSmoke: false, accountCreation: false } };
  }
  if (!uiBaseURL || !signupPath) {
    throw new Error(
      'Staging is not configured. Set uiBaseURL and signupPath in config/environments/staging.json.'
    );
  }
  return {
    name,
    uiBaseURL,
    apiBaseURL,
    signupPath,
    signupPathFr,
    apiHealthPath,
    dataProfile,
    capabilities: { realAppSmoke: true, accountCreation: false }
  };
}

export function loadEnvironmentConfig(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
  const name = env.TEST_ENV ?? 'self-contained';
  if (name !== 'self-contained' && name !== 'staging' && name !== 'production') {
    throw new Error(`Unsupported TEST_ENV: ${name}`);
  }
  if (name === 'production') throw new Error('Production test execution is disabled by policy.');
  const file = resolve(__dirname, '../../config/environments', `${name}.json`);
  return parseEnvironmentConfig(name, JSON.parse(readFileSync(file, 'utf8')) as unknown);
}
