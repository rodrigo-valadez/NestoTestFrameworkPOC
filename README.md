# Nesto quality automation proof of concept

This repository demonstrates a maintainable, agent-guided quality automation approach for the Nesto signup challenge. It combines Playwright UI coverage, guarded API observation, accessibility checks, passive OWASP ZAP DAST, reporting, and reusable human approval gates.

Start with the [project summary](docs/PROJECT_SUMMARY.md) for goals, assumptions, results, bugs, reports, and remaining work. Test-writing agents must also follow [AGENTS.md](AGENTS.md) and the [agent test workflow](docs/AGENT_TEST_WORKFLOW.md).

## Current capability

| Area                  | Status              | What is available                                                                                                                                                               |
| --------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI                    | Implemented         | Self-contained framework tests and opt-in English/French QA signup tests across Chromium, Firefox, and WebKit.                                                                  |
| API                   | In progress         | Browser-observed signup contract evidence and a read-only health-test scaffold. Direct API execution is blocked until an approved API base URL and health route are configured. |
| Accessibility         | Implemented         | axe-core WCAG 2.1 A/AA reporting with an approved serious/critical no-regression gate.                                                                                          |
| Readability           | Method defined      | English Flesch/Flesch–Kincaid and French Kandel–Moles methodology is documented. Collection, scoring, baseline, and thresholds are not implemented.                             |
| DAST                  | Implemented, opt-in | Path-scoped, unauthenticated OWASP ZAP passive scans for the English and French QA signup pages. Active attacks and form processing are disabled.                               |
| SAST                  | Limited             | Dependency audit and repository static security review. Full application SAST is unavailable because application source is outside this repository.                             |
| Performance           | Planned             | No workload, environment profile, or approved budget exists.                                                                                                                    |
| Fault testing         | Planned             | No approved fault model or safe execution environment exists.                                                                                                                   |
| Metrics and reporting | Initial baseline    | Sanitized committed UI and DAST reports plus an initial metrics model. Cross-run trend automation remains future work.                                                          |

## Requirements

- Node.js 22
- Corepack
- pnpm 11.19.0, pinned in `package.json`
- Git
- Docker Desktop only for ZAP scans
- Microsoft Edge only for the optional branded Edge projects

## Install

```bash
corepack enable
corepack prepare pnpm@11.19.0 --activate
pnpm install --frozen-lockfile
pnpm exec playwright install chromium firefox webkit
```

On Linux CI, install browser system dependencies too:

```bash
pnpm exec playwright install --with-deps chromium firefox webkit
```

Verify formatting, lint, and TypeScript:

```bash
pnpm run check:static
```

## UI tests

### Self-contained suite

The default suite runs against local HTML fixtures and does not contact QA:

```bash
pnpm test
```

Run only Chromium for faster feedback:

```bash
pnpm run test:chromium
```

Run a single project:

```bash
pnpm exec playwright test --project=firefox-fr-CA
```

### Read-only QA suite

This explicitly contacts `https://app.qa.nesto.ca` and runs the deployed signup contract, localization, negative, accessibility, and consent checks. Negative cases intercept unexpected account requests.

```bash
pnpm run test:env staging real-app
```

Run one browser/locale project:

```bash
pnpm run test:env staging real-app --project=chromium-en-CA
```

The account-creation suite is separate, write capable, and currently disabled by its local attempt ledger. Historical approval does not authorize more accounts.

### Optional Edge coverage

```bash
pnpm exec playwright install msedge
pnpm run test:edge
```

Playwright WebKit provides Safari-engine coverage; it is not branded Safari.

## API tests — in progress

The repository contains a browserless health-test scaffold:

```bash
pnpm run test:env staging api
```

It currently fails closed because `apiBaseURL` and `apiHealthPath` are intentionally `null` in `config/environments/staging.json`. Configure only an approved read-only endpoint before enabling it.

The signup UI investigation observed `POST /api/accounts` returning HTTP 201 with submitted non-secret account information. That evidence is documented in [signup results](docs/SIGNUP_RESULTS.md); it is not a reusable direct API test and does not authorize another account write.

## Accessibility

Accessibility runs as `SGN-009` inside the read-only QA suite. Run it alone with:

```bash
pnpm exec cross-env TEST_ENV=staging LIVE_SUITE=real-app playwright test tests/real-app/signup-accessibility.spec.ts
```

The gate targets WCAG 2.1 AA axe rules. It reports every violation and fails only for a new or worsened serious/critical violation relative to the approved registry.

- Baseline and interpretation: [Signup accessibility baseline](docs/SIGNUP_ACCESSIBILITY_BASELINE.md)
- Approved exceptions and pre-existing findings: `test-data/accessibility/signup-axe-baseline.json`
- Limit: axe does not replace keyboard, screen-reader, zoom, language-quality, or other manual accessibility checks.

## Readability — method defined

There is no executable readability test or report yet. The approved design separates page/instruction copy, short labels/actions, and validation messages, and uses language-specific formulas:

- English: Flesch Reading Ease and Flesch–Kincaid Grade Level
- French: Kandel–Moles

See [Signup readability measurement method](docs/SIGNUP_READABILITY_METHOD.md). Do not claim a threshold or result until collection, syllable fixtures, the first baseline, and human approval exist.

## Security testing

### SAST and dependency review

Run the repository’s static checks:

```bash
pnpm run check:static
pnpm audit --audit-level high
```

This checks the automation repository and its dependencies. It is not full Nesto application SAST because the application source is not present. See the [static security review](docs/SIGNUP_SECURITY_REVIEW.md).

### OWASP ZAP passive DAST

Docker Desktop must be installed and running. Review the exact generated plan without contacting QA:

```bash
ZAP_DRY_RUN=true \
SECURITY_SCAN_TARGET=https://app.qa.nesto.ca/signup \
pnpm run test:security:baseline
```

Run one approved locale with an approved immutable image digest:

```bash
ENABLE_ZAP_BASELINE=true \
SECURITY_SCAN_TARGET=https://app.qa.nesto.ca/signup \
ZAP_DOCKER_IMAGE=ghcr.io/zaproxy/zaproxy@sha256:<approved-digest> \
pnpm run test:security:baseline
```

Use `https://app.qa.nesto.ca/fr/signup` for French. The runner rejects other targets and mutable image tags. It disables form processing, POST forms, robots, sitemap, AJAX/client spiders, authentication, API import, fuzzing, and active scanning. See [Security automation](docs/SECURITY_AUTOMATION.md) for the complete boundary.

Publish sanitized English and French reports after both local scans exist:

```bash
ZAP_IMAGE_DIGEST=sha256:<executed-image-digest> pnpm run test:report:security
```

The publisher rejects evidence containing a method other than `GET` or a URI other than the approved locale target.

## Performance and fault testing — planned

No executable performance or fault-injection suites are included. Both require an approved environment, workload or fault model, ownership, monitoring, stop conditions, and measurable acceptance criteria. Running an unbounded load test or injecting faults into shared QA would not be responsible evidence.

## Reports

### Playwright

Ordinary runs create:

- terminal `list` output;
- `playwright-report/index.html`;
- failure-only screenshots, video, traces, and redacted diagnostics under `test-results/`.

Open the local HTML report:

```bash
pnpm exec playwright show-report
```

Generate and replace the committed sanitized QA demonstration report:

```bash
pnpm run test:report:staging
```

Committed examples:

- [Latest sanitized signup report](docs/test-report/latest/index.html)
- [English ZAP passive report](docs/security-report/en-CA/index.html)
- [French ZAP passive report](docs/security-report/fr-CA/index.html)

The committed reports exclude page bodies, headers, cookies, form values, screenshots, traces, and raw attachments. Read [Test reporting](docs/TEST_REPORTING.md) for retention and interpretation.

### Reading results

- One browser/locale execution is one test execution, not one unique bug.
- Group repeated failures into a reviewed cause cluster before counting defects.
- A Playwright expected failure represents a known issue and must be reviewed if it unexpectedly passes.
- ZAP alert risk and confidence are triage inputs; an alert is not proof of exploitability.
- A passing axe scan covers only the automated rules and page states exercised.
- Missing API, readability, performance, or fault reports mean those capabilities remain incomplete.

## Continuous integration

### GitHub Actions

`.github/workflows/quality-gate.yml` already runs on pull requests and pushes to `main`. It installs locked dependencies, runs static checks, installs Chromium/Firefox/WebKit/Edge, runs the self-contained suites, and uploads Playwright artifacts for 14 days.

After the workflow runs once, make the `Quality gate` job a required status check in the `main` branch ruleset. Keep live QA, account creation, and ZAP scans out of pull-request automation unless Nesto supplies explicit environment authorization, protected secrets, concurrency limits, and a manual approval environment.

### Jenkins

Create a Pipeline job connected to this repository and use a Linux agent with Node 22. A minimal self-contained stage is:

```groovy
pipeline {
  agent any
  stages {
    stage('Quality gate') {
      steps {
        sh 'corepack enable'
        sh 'corepack prepare pnpm@11.19.0 --activate'
        sh 'pnpm install --frozen-lockfile'
        sh 'pnpm run check:static'
        sh 'pnpm exec playwright install --with-deps chromium firefox webkit'
        sh 'pnpm test'
      }
    }
  }
  post {
    always {
      archiveArtifacts artifacts: 'playwright-report/**,test-results/**', allowEmptyArchive: true
    }
  }
}
```

Use separate manually approved Jenkins stages for live QA or ZAP. Restrict those stages to authorized agents, use immutable images, prevent concurrent scans, retain sanitized reports only, and never expose production or account-writing switches through ordinary build parameters.

## Architecture

```text
.agents/skills/             repository-local agent skills
config/environments/       environment targets and safety capabilities
docs/                       plans, handoffs, results, bugs, and reports
scripts/                    guarded runners and sanitized report publishers
src/fixtures/               Playwright dependency injection
src/framework/              locator and test infrastructure
src/i18n/                   locale contracts
src/pages/                  task-oriented Page Objects
test-data/                  copy, scenario, and accessibility baselines
tests/framework/            self-contained framework tests
tests/real-app/             opt-in deployed UI checks
tests/api/                  read-only API scaffold
```

The agent workflow moves from feature brief through test plan, UI/API analysis, selector contract, test data, implementation, results, and metrics. Every dependent stage requires human approval, and a separate skeptical reviewer challenges gaps and unnecessary complexity.

## Project records

- [Project summary](docs/PROJECT_SUMMARY.md)
- [Signup bug report](docs/SIGNUP_BUG_REPORT.md)
- [Signup test plan](docs/SIGNUP_TEST_PLAN.md)
- [Signup results](docs/SIGNUP_RESULTS.md)
- [Coverage depth](docs/SIGNUP_COVERAGE_DEPTH.md)
- [Metrics baseline](docs/SIGNUP_METRICS_BASELINE.md)
- [Questions for Nesto](docs/NESTO_CHALLENGE_QUESTIONS.md)
- [Agent workflow](docs/AGENT_TEST_WORKFLOW.md)
