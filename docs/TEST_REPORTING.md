# Test reporting

## Current report generation

Playwright produces two reports for ordinary framework and deployed read-only runs:

1. The `list` reporter prints each test, project, duration, and outcome in the terminal and CI log.
2. The `html` reporter writes an interactive report to `playwright-report/index.html` without opening it automatically.

Failure-focused artifacts are written under `test-results/`:

- screenshot on failure;
- video retained on failure;
- Playwright trace retained on failure;
- redacted browser console and page-error diagnostics attached on failure;
- SGN-009 attaches a sanitized accessibility JSON list with rule, severity, help text, and affected selector targets.

Open the latest local HTML report with:

```bash
corepack pnpm exec playwright show-report
```

Generate the authorized full staging suite and replace the single committed demonstration report with:

```bash
corepack pnpm run test:report:staging
```

The command publishes a sanitized report to `docs/test-report/latest/`. It deletes that fixed directory before writing the new HTML and JSON summary, so repository history has one current report snapshot rather than timestamped report folders. The committed version contains only test names, browser/locale projects, outcomes, durations, totals, timestamp, and source revision. Page snapshots, form values, source excerpts, traces, media, console output, and raw attachments remain local. The command cannot select the write-capable account-creation project.

The GitHub Actions `Quality gate` runs static checks and the self-contained browser suite, then uploads `playwright-report/` and `test-results/` as the `playwright-artifacts` artifact for 14 days. The workflow does not contact QA. A staging report is generated only when a person explicitly runs `corepack pnpm run test:env staging` in an authorized environment.

## ZAP report publishing

Raw ZAP HTML can contain request and response headers, cookies, and complete page bodies, so `security-results/` remains ignored. After approved English and French passive scans, publish the fixed sanitized examples with:

```bash
ZAP_IMAGE_DIGEST=sha256:<executed-image-digest> pnpm run test:report:security
```

The publisher reads and validates both locale JSON files in a temporary directory before replacing `docs/security-report/`. It rejects any **alert instance** whose recorded method is not `GET` or whose URI is not the exact approved signup target. ZAP's traditional JSON alert list is not a complete request history. The committed HTML and JSON contain only scan metadata, the caller-declared image digest, rule ID, finding name, risk, confidence, method, and approved URI.

- [English passive DAST report](security-report/en-CA/index.html)
- [French passive DAST report](security-report/fr-CA/index.html)

## Privacy exception for account creation

The write-capable account-creation project uses only the terminal `list` reporter. Screenshots, video, traces, HTML reporting, and browser diagnostics are disabled. Its persistent ledger stores sanitized outcome metadata and never stores passwords, tokens, cookies, raw request bodies, or raw response bodies.

## Known reporting limits

- Expected failures such as `BUG-SIGNUP-002` appear as expected outcomes in the aggregate pass count. The test name and bug report explain why the behavior is still open.
- The committed demonstration includes a sanitized machine-readable run summary. A general JSON or JUnit CI artifact for every run is not yet implemented.
- Cross-run failure clustering, ownership, issue synchronization, flake metrics, and trend dashboards remain roadmap work.
- The committed screenshot and video for `BUG-SIGNUP-002` were captured through a deliberate synthetic reproduction with its account request blocked. Ordinary successful tests do not retain media.
