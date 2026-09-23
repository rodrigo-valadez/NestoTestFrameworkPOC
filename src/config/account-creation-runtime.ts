export interface AccountCreationRuntime {
  projectName: string;
  retries: number;
  maxFailures: number;
  workers: number;
  fullyParallel: boolean;
}

export function assertAccountCreationRuntime(runtime: AccountCreationRuntime): void {
  if (
    runtime.projectName !== 'account-creation-chromium-en-CA' ||
    runtime.retries !== 0 ||
    runtime.maxFailures !== 1 ||
    runtime.workers !== 1 ||
    runtime.fullyParallel
  ) {
    throw new Error('Account creation runtime safety settings were overridden.');
  }
}
