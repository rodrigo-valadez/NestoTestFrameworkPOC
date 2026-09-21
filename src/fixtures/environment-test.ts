import { test as base } from '@playwright/test';
import { loadEnvironmentConfig, type EnvironmentConfig } from '../config/environment';

export const test = base.extend<{ environment: EnvironmentConfig }>({
  environment: [
    async ({}, use, testInfo) => {
      const environment = loadEnvironmentConfig();
      testInfo.annotations.push({ type: 'environment', description: environment.name });
      testInfo.annotations.push({ type: 'data-profile', description: environment.dataProfile });
      await use(environment);
    },
    { auto: true }
  ]
});

export { expect } from '@playwright/test';
