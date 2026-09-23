import { resolve } from 'node:path';
import { expect, test } from '../../../src/fixtures/test';
import { requireAccountCreationEnvironment } from '../../../src/config/environment';
import { assertAccountCreationRuntime } from '../../../src/config/account-creation-runtime';
import {
  createSignupPassword,
  createSyntheticSignupIdentity,
  readSignupLedger,
  reserveSignupAttempt,
  updateSignupAttempt
} from '../../../src/test-data/signup-account-lifecycle';
import { observeSignupSubmission } from '../../../src/workflows/signup-account-creation';

test.use({ browserDiagnosticsEnabled: false });

function recordExecutionError(
  ledgerPath: string,
  attemptId: string,
  resultRecorded: boolean
): void {
  if (resultRecorded) return;
  updateSignupAttempt(ledgerPath, attemptId, {
    state: 'ambiguous',
    resultAt: new Date().toISOString(),
    outcome: 'execution-error'
  });
}

for (let attemptNumber = 1; attemptNumber <= 20; attemptNumber += 1) {
  test(`SGN-006 creates synthetic QA account attempt ${attemptNumber}`, async ({
    environment,
    liveSignupPage,
    page
  }, testInfo) => {
    requireAccountCreationEnvironment(environment);
    assertAccountCreationRuntime({
      projectName: testInfo.project.name,
      retries: testInfo.project.retries,
      maxFailures: testInfo.config.maxFailures,
      workers: testInfo.config.workers,
      fullyParallel: testInfo.config.fullyParallel
    });
    const ledgerPath = resolve('test-data/scenarios/staging/signup-account-ledger.json');
    const ledger = readSignupLedger(ledgerPath);
    // A previous authorized run may have consumed part of the lifetime cap.
    // eslint-disable-next-line playwright/no-skipped-test
    test.skip(
      ledger.attempts.length >= ledger.attemptCap,
      'The approved lifetime signup-attempt cap is exhausted.'
    );
    const identity = createSyntheticSignupIdentity();
    const password = createSignupPassword();
    const attempt = reserveSignupAttempt(ledgerPath, identity);
    const reservedIdentity = attempt.identity;
    let resultRecorded = false;

    try {
      await liveSignupPage.open();
      // The deployed form can otherwise accept values before client hydration and submit as a native GET.
      // eslint-disable-next-line playwright/no-networkidle
      await page.waitForLoadState('networkidle');
      await liveSignupPage.completeForm({ ...reservedIdentity, password });
      const submittedAt = new Date().toISOString();
      updateSignupAttempt(ledgerPath, attempt.attemptId, { state: 'submitted', submittedAt });
      const result = await observeSignupSubmission(page, reservedIdentity, () =>
        liveSignupPage.submit()
      );
      updateSignupAttempt(ledgerPath, attempt.attemptId, {
        state: result.state,
        resultAt: new Date().toISOString(),
        httpStatus: result.status,
        endpointCategory: result.endpointCategory,
        outcome: result.outcome,
        safeFieldNames: result.safeFieldNames,
        unexpectedFieldCount: result.unexpectedFieldCount,
        fieldsMatched: result.fieldsMatched,
        identifierPresent: result.identifierPresent
      });
      resultRecorded = true;
      expect(result.state, 'Signup result was not safely confirmed.').toBe('created');
    } catch (error) {
      recordExecutionError(ledgerPath, attempt.attemptId, resultRecorded);
      throw error;
    }
  });
}
