export type TestEnvironment = 'self-contained' | 'staging' | 'production';

export interface EnvironmentConfig {
  name: TestEnvironment;
  uiBaseURL?: string;
  apiBaseURL?: string;
  signupPath?: string;
  apiHealthPath?: string;
  dataProfile: string;
  capabilities: {
    realAppSmoke: boolean;
    accountCreation: boolean;
  };
}

export type RealAppEnvironmentConfig = EnvironmentConfig & {
  uiBaseURL: string;
  apiBaseURL: string;
  signupPath: string;
};

export type ApiHealthEnvironmentConfig = EnvironmentConfig & {
  apiBaseURL: string;
  apiHealthPath: string;
};

export function requireRealAppEnvironment(
  environment: EnvironmentConfig
): RealAppEnvironmentConfig {
  if (
    !environment.capabilities.realAppSmoke ||
    !environment.uiBaseURL ||
    !environment.apiBaseURL ||
    !environment.signupPath
  ) {
    throw new Error('Select a configured real-app TEST_ENV before running this smoke test.');
  }

  return environment as RealAppEnvironmentConfig;
}

export function requireApiHealthEnvironment(
  environment: EnvironmentConfig
): ApiHealthEnvironmentConfig {
  if (!environment.apiBaseURL || !environment.apiHealthPath) {
    throw new Error('Select a configured real-app TEST_ENV and API_HEALTH_PATH for API smoke.');
  }

  return environment as ApiHealthEnvironmentConfig;
}

function rootRelativePath(value: string | undefined, name: string): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    throw new Error(`${name} must be a root-relative path such as /signup.`);
  }
  return value;
}

function absoluteHttpURL(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is required for a real-application environment.`);
  }

  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${name} must be an absolute http(s) URL.`);
  }

  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
    throw new Error(`${name} must be an absolute http(s) URL without embedded credentials.`);
  }

  return parsed.toString().replace(/\/$/, '');
}

export function loadEnvironmentConfig(env: NodeJS.ProcessEnv = process.env): EnvironmentConfig {
  const name = env.TEST_ENV ?? 'self-contained';
  if (name !== 'self-contained' && name !== 'staging' && name !== 'production') {
    throw new Error(`Unsupported TEST_ENV: ${name}`);
  }

  if (name === 'self-contained') {
    return {
      name,
      dataProfile: 'self-contained',
      capabilities: { realAppSmoke: false, accountCreation: false }
    };
  }

  const uiBaseURL = absoluteHttpURL(env.UI_BASE_URL, 'UI_BASE_URL');
  const apiBaseURL = absoluteHttpURL(env.API_BASE_URL, 'API_BASE_URL');
  const signupPath = rootRelativePath(env.SIGNUP_PATH, 'SIGNUP_PATH');
  const apiHealthPath = env.API_HEALTH_PATH
    ? rootRelativePath(env.API_HEALTH_PATH, 'API_HEALTH_PATH')
    : undefined;
  const dataProfile = env.TEST_DATA_PROFILE ?? name;
  if (!/^[a-z][a-z0-9-]*$/.test(dataProfile)) {
    throw new Error(`Invalid TEST_DATA_PROFILE: ${dataProfile}`);
  }

  return {
    name,
    uiBaseURL,
    apiBaseURL,
    signupPath,
    apiHealthPath,
    dataProfile,
    capabilities: { realAppSmoke: true, accountCreation: false }
  };
}
