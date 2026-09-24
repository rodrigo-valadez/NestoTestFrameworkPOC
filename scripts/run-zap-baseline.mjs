import { chmodSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const approvedTargets = new Map([
  ['https://app.qa.nesto.ca/signup', '^https://app\\.qa\\.nesto\\.ca/signup(?:[/?#].*)?$'],
  ['https://app.qa.nesto.ca/fr/signup', '^https://app\\.qa\\.nesto\\.ca/fr/signup(?:[/?#].*)?$']
]);

const enabled = process.env.ENABLE_ZAP_BASELINE === 'true';
const dryRun = process.env.ZAP_DRY_RUN === 'true';

if (!enabled && !dryRun) {
  process.stdout.write(
    'OWASP ZAP passive baseline is installed but disabled. See docs/SECURITY_AUTOMATION.md.\n'
  );
  process.exit(0);
}

const target = process.env.SECURITY_SCAN_TARGET;
const includePath = target ? approvedTargets.get(target) : undefined;
if (!target || !includePath) {
  throw new Error('SECURITY_SCAN_TARGET must be an explicitly approved QA signup URL.');
}

const image = process.env.ZAP_DOCKER_IMAGE;
if (!dryRun && !image?.match(/^ghcr\.io\/zaproxy\/zaproxy@sha256:[a-f0-9]{64}$/u)) {
  throw new Error(
    'ZAP_DOCKER_IMAGE must be an approved ghcr.io/zaproxy/zaproxy image pinned by sha256 digest.'
  );
}

const root = resolve(import.meta.dirname, '..');
const results = resolve(root, 'security-results');
const planPath = resolve(results, 'zap-passive-plan.yaml');
mkdirSync(results, { recursive: true });

const plan = `---
env:
  contexts:
    - name: signup-page-only
      urls:
        - ${target}
      includePaths:
        - ${includePath}
  parameters:
    failOnError: true
    failOnWarning: false
    progressToStdout: true
  configs:
    spider.processform: false
    spider.postform: false
    spider.parseRobotsTxt: false
    spider.parseSitemapXml: false
    spider.parseComments: false
    spider.maxDepth: 1
    spider.maxChildren: 10
    spider.threadCount: 1
jobs:
  - type: spider
    parameters:
      context: signup-page-only
      url: ${target}
      maxDuration: 1
      maxDepth: 1
      maxChildren: 10
      processForm: false
      postForm: false
      parseComments: false
      parseRobotsTxt: false
      parseSitemapXml: false
      threadCount: 1
  - type: passiveScan-wait
    parameters:
      maxDuration: 2
  - type: report
    parameters:
      template: modern
      reportDir: /zap/wrk
      reportFile: zap-passive-report.html
      reportTitle: Nesto QA signup passive security scan
      reportDescription: Unauthenticated, path-scoped passive scan with form processing disabled.
      displayReport: false
    sites:
      - https://app.qa.nesto.ca
  - type: report
    parameters:
      template: traditional-json
      reportDir: /zap/wrk
      reportFile: zap-passive-report.json
      reportTitle: Nesto QA signup passive security scan
      reportDescription: Unauthenticated, path-scoped passive scan with form processing disabled.
      displayReport: false
    sites:
      - https://app.qa.nesto.ca
`;

writeFileSync(planPath, plan, { encoding: 'utf8', mode: 0o600 });
chmodSync(planPath, 0o600);

if (dryRun) {
  process.stdout.write(`Dry run only; Docker and QA were not contacted.\n\n${plan}`);
  process.exit(0);
}

for (const report of ['zap-passive-report.html', 'zap-passive-report.json']) {
  rmSync(resolve(results, report), { force: true });
}

const run = spawnSync(
  'docker',
  [
    'run',
    '--rm',
    '--volume',
    `${results}:/zap/wrk:rw`,
    image,
    'zap.sh',
    '-cmd',
    '-autorun',
    '/zap/wrk/zap-passive-plan.yaml'
  ],
  { cwd: root, stdio: 'inherit', shell: false }
);
if (run.error) throw run.error;
process.exit(run.status ?? 1);
