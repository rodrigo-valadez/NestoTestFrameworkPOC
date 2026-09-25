import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync
} from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(root, 'security-results');
const destinationRoot = resolve(root, 'docs/security-report');
const backupRoot = resolve(root, 'docs/.security-report-backup');
const imageDigest = process.env.ZAP_IMAGE_DIGEST;
const scans = [
  { locale: 'en-CA', target: 'https://app.qa.nesto.ca/signup' },
  { locale: 'fr-CA', target: 'https://app.qa.nesto.ca/fr/signup' }
];

if (!imageDigest?.match(/^sha256:[a-f0-9]{64}$/u)) {
  throw new Error('ZAP_IMAGE_DIGEST must be a SHA-256 digest from the executed image.');
}
const temporaryRoot = mkdtempSync(resolve(root, 'docs/.security-report-'));

const escapeHtml = value =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

try {
  for (const scan of scans) {
    const source = resolve(sourceRoot, scan.locale, 'zap-passive-report.json');
    const raw = JSON.parse(readFileSync(source, 'utf8'));
    const sites = raw.site ?? [];
    const alerts = sites.flatMap(site =>
      (site.alerts ?? []).map(alert => {
        const instances = alert.instances ?? [];
        const requests = instances.map(instance => ({
          method: instance.method,
          uri: instance.uri
        }));
        if (
          requests.length === 0 ||
          requests.some(request => request.method !== 'GET' || request.uri !== scan.target)
        ) {
          throw new Error(`Unsafe or unexpected request evidence in ${scan.locale} ZAP report.`);
        }
        return {
          pluginId: String(alert.pluginid),
          name: alert.name,
          risk: alert.riskdesc,
          confidence: alert.confidence,
          instances: requests
        };
      })
    );
    const summary = {
      schemaVersion: 2,
      generatedAt: raw['@generated'],
      zapVersion: raw['@version'],
      declaredImageDigest: imageDigest,
      declaredScanProfile: {
        scanType: 'unauthenticated-passive',
        activeScan: false,
        formProcessing: false
      },
      evidenceScope: 'ZAP alert instances only; not a complete request history',
      locale: scan.locale,
      target: scan.target,
      alerts
    };
    const rows = alerts
      .map(
        alert => `<tr>
        <td>${escapeHtml(alert.pluginId)}</td>
        <td>${escapeHtml(alert.name)}</td>
        <td>${escapeHtml(alert.risk)}</td>
        <td>${escapeHtml(alert.confidence)}</td>
        <td>${escapeHtml(alert.instances[0].method)}</td>
        <td><code>${escapeHtml(alert.instances[0].uri)}</code></td>
      </tr>`
      )
      .join('\n');
    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ZAP passive report — ${escapeHtml(scan.locale)}</title>
  <style>
    body { color: #172033; font: 15px system-ui, sans-serif; margin: 0 auto; max-width: 1100px; padding: 32px; }
    code { overflow-wrap: anywhere; }
    .meta { background: #f5f7fb; border-radius: 8px; padding: 16px; }
    table { border-collapse: collapse; margin-top: 24px; width: 100%; }
    th, td { border-bottom: 1px solid #dce1eb; padding: 10px; text-align: left; vertical-align: top; }
    th { background: #f5f7fb; }
  </style>
</head>
<body>
  <h1>ZAP passive report — ${escapeHtml(scan.locale)}</h1>
  <div class="meta">
    <p><strong>Target:</strong> <code>${escapeHtml(scan.target)}</code></p>
    <p><strong>Generated:</strong> ${escapeHtml(summary.generatedAt)}</p>
    <p><strong>ZAP:</strong> ${escapeHtml(summary.zapVersion)}</p>
    <p><strong>Scan:</strong> unauthenticated passive scan; active scanning and form processing disabled</p>
    <p><strong>Declared image:</strong> <code>${escapeHtml(imageDigest)}</code></p>
  </div>
  <p>This sanitized report excludes request and response headers, bodies, cookies, page content, and raw evidence. Method and URI validation covers the published alert instances; the source JSON is not a complete request history. The local raw report remains Git-ignored.</p>
  <table>
    <thead><tr><th>Rule</th><th>Finding</th><th>Risk</th><th>Confidence</th><th>Method</th><th>URI</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>\n`;
    const destination = resolve(temporaryRoot, scan.locale);
    mkdirSync(destination, { recursive: true });
    writeFileSync(resolve(destination, 'index.html'), html);
    writeFileSync(resolve(destination, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
  }

  rmSync(backupRoot, { recursive: true, force: true });
  if (existsSync(destinationRoot)) renameSync(destinationRoot, backupRoot);
  try {
    renameSync(temporaryRoot, destinationRoot);
  } catch (error) {
    if (existsSync(backupRoot)) renameSync(backupRoot, destinationRoot);
    throw error;
  }
  rmSync(backupRoot, { recursive: true, force: true });
} catch (error) {
  rmSync(temporaryRoot, { recursive: true, force: true });
  throw error;
}

process.stdout.write(`Published sanitized ZAP reports to ${destinationRoot}\n`);
