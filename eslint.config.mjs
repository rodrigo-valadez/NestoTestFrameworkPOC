import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier';
import playwright from 'eslint-plugin-playwright';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/', 'playwright-report/', 'test-results/']
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-empty-pattern': ['error', { allowObjectPatternsAsParameters: true }]
    }
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended']
  },
  prettier
);
