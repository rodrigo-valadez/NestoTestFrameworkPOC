import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

if (process.env.ENABLE_ZAP_BASELINE !== 'true') {
  process.stdout.write(
    'OWASP ZAP baseline is installed but disabled. See docs/SECURITY_AUTOMATION.md.\n'
  );
  process.exit(0);
}

const approvedTargets = new Set([
  'https://app.qa.nesto.ca/signup',
  'https://app.qa.nesto.ca/fr/signup'
]);
const target = process.env.SECURITY_SCAN_TARGET;
if (!target || !approvedTargets.has(target)) {
  throw new Error('SECURITY_SCAN_TARGET must be an explicitly approved QA signup URL.');
}

const root = resolve(import.meta.dirname, '..');
const results = resolve(root, 'security-results');
mkdirSync(results, { recursive: true });
const image = process.env.ZAP_DOCKER_IMAGE ?? 'ghcr.io/zaproxy/zaproxy:stable';
const run = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--volume',
    `${results}:/zap/wrk:rw`,
    image,
    'zap-baseline.py',
    '-t',
    target,
    '-T',
    '2',
    '-r',
    'zap-baseline.html',
    '-J',
    'zap-baseline.json'
  ],
  { cwd: root, stdio: 'inherit', shell: false }
);
if (run.error) throw run.error;
process.exit(run.status ?? 1);
