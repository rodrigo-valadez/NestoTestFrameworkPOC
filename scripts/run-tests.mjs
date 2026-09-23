import { spawnSync } from 'node:child_process';
import process from 'node:process';
import { fileURLToPath, URL } from 'node:url';

const [environment, suiteArgument, ...playwrightArgs] = process.argv.slice(2);
const suites = ['framework', 'real-app', 'api', 'account-creation'];

if (!['self-contained', 'staging'].includes(environment)) {
  process.stderr.write(
    'Usage: pnpm run test:env <self-contained|staging> [framework|real-app|api|account-creation] [Playwright options]\n'
  );
  process.exitCode = 2;
} else {
  const suite =
    suiteArgument && suites.includes(suiteArgument)
      ? suiteArgument
      : environment === 'self-contained'
        ? 'framework'
        : 'real-app';
  const options =
    suiteArgument && suites.includes(suiteArgument)
      ? playwrightArgs
      : suiteArgument
        ? [suiteArgument, ...playwrightArgs]
        : playwrightArgs;
  if ((environment === 'self-contained') !== (suite === 'framework')) {
    process.stderr.write(
      'Framework tests require self-contained; live smoke tests require staging.\n'
    );
    process.exitCode = 2;
  } else {
    const cli = fileURLToPath(new URL('../node_modules/@playwright/test/cli.js', import.meta.url));
    const testPath =
      suite === 'account-creation' ? 'tests/real-app/account-creation' : `tests/${suite}`;
    const result = spawnSync(process.execPath, [cli, 'test', testPath, ...options], {
      stdio: 'inherit',
      env: { ...process.env, TEST_ENV: environment, LIVE_SUITE: suite }
    });
    if (result.error) throw result.error;
    process.exitCode = result.status ?? 1;
  }
}
