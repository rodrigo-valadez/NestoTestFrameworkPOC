import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const generatedJson = resolve(root, 'test-results/latest-report.json');
const destination = resolve(root, 'docs/test-report/latest');

const run = spawnSync(process.execPath, ['scripts/run-tests.mjs', 'staging'], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, PUBLISH_LATEST_REPORT: 'true' }
});
if (run.error) throw run.error;
if (run.status !== 0) process.exit(run.status ?? 1);

const report = JSON.parse(readFileSync(generatedJson, 'utf8'));
const revision = spawnSync('git', ['rev-parse', 'HEAD'], {
  cwd: root,
  encoding: 'utf8'
}).stdout.trim();
const cases = report.suites.flatMap(suite =>
  suite.specs.flatMap(spec =>
    spec.tests.map(test => {
      const result = test.results.at(-1);
      const outcome =
        test.expectedStatus === 'failed' && result?.status === 'failed'
          ? 'known issue'
          : (result?.status ?? 'unknown');
      return {
        case: spec.title,
        project: test.projectName,
        outcome,
        durationMs: result?.duration ?? 0
      };
    })
  )
);
const summary = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  sourceRevision: revision,
  environment: 'staging',
  suite: 'real-app',
  command: 'pnpm run test:report:staging',
  results: report.stats,
  cases
};

const escapeHtml = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
const rows = cases
  .map(
    item => `<tr>
      <td>${escapeHtml(item.case)}</td>
      <td>${escapeHtml(item.project)}</td>
      <td><span class="status ${item.outcome === 'passed' ? 'passed' : 'known'}">${escapeHtml(item.outcome)}</span></td>
      <td>${(item.durationMs / 1000).toFixed(1)}s</td>
    </tr>`
  )
  .join('\n');
const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Latest signup staging report</title>
  <style>
    body { font: 15px system-ui, sans-serif; margin: 0 auto; max-width: 1180px; padding: 32px; color: #172033; }
    h1 { margin-bottom: 4px; }
    .summary { display: flex; flex-wrap: wrap; gap: 12px; margin: 24px 0; }
    .card { background: #f5f7fb; border-radius: 8px; min-width: 140px; padding: 14px 18px; }
    .value { display: block; font-size: 24px; font-weight: 700; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border-bottom: 1px solid #dce1eb; padding: 10px; text-align: left; }
    th { background: #f5f7fb; position: sticky; top: 0; }
    .status { border-radius: 999px; display: inline-block; font-weight: 650; padding: 3px 9px; }
    .passed { background: #dcfce7; color: #166534; }
    .known { background: #fef3c7; color: #92400e; }
    .meta { color: #526078; }
  </style>
</head>
<body>
  <h1>Latest signup staging report</h1>
  <p class="meta">Generated ${escapeHtml(summary.generatedAt)} from ${escapeHtml(summary.sourceRevision)}</p>
  <div class="summary">
    <div class="card"><span class="value">${report.stats.expected}</span>expected outcomes</div>
    <div class="card"><span class="value">${report.stats.unexpected}</span>unexpected</div>
    <div class="card"><span class="value">${report.stats.flaky}</span>flaky</div>
    <div class="card"><span class="value">${(report.stats.duration / 1000).toFixed(1)}s</span>duration</div>
  </div>
  <p>This sanitized demonstration contains case names, browser and locale projects, outcomes, and durations only. It excludes page snapshots, form values, source excerpts, traces, screenshots, videos, console output, and raw attachments.</p>
  <table>
    <thead><tr><th>Case</th><th>Project</th><th>Outcome</th><th>Duration</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>\n`;

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
writeFileSync(resolve(destination, 'index.html'), html);
writeFileSync(resolve(destination, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);

process.stdout.write(`Published the latest staging report to ${destination}\n`);
