# Nesto Test Framework POC

A narrow Playwright + TypeScript foundation for maintainable UI and REST API testing.

For planned coverage, reporting, failure triage, and metrics, see [the test roadmap](docs/TEST_ROADMAP.md). Contributors and coding agents should follow [the repository test-writing guide](AGENTS.md).

The signup flow has approved artifacts through the guarded [Stage 6 implementation handoff](docs/SIGNUP_IMPLEMENTATION_HANDOFF.md). Bounded QA investigation identified the deployed `POST /api/accounts` contract and observed one privacy-safe HTTP 201 response with submitted account information; see the current [Stage 7 result](docs/SIGNUP_RESULTS.md). Ten lifetime slots are consumed, ten remain, and further live execution is paused because the final observer found a populated sensitive-shaped optional response field. Read-only negative and accessibility coverage remains safe to run.

For a repeatable feature-to-metrics handoff with human decisions and independent skeptical review, see the [agent test workflow](docs/AGENT_TEST_WORKFLOW.md) and [stage handoff template](docs/STAGE_HANDOFF_TEMPLATE.md).

Challenge evidence is summarized in the [signup results](docs/SIGNUP_RESULTS.md), [coverage depth](docs/SIGNUP_COVERAGE_DEPTH.md), [accessibility baseline](docs/SIGNUP_ACCESSIBILITY_BASELINE.md), [static security review](docs/SIGNUP_SECURITY_REVIEW.md), and [bug report](docs/SIGNUP_BUG_REPORT.md). The [reporting guide](docs/TEST_REPORTING.md) explains local, CI, and the single committed latest report. [Questions for Nesto](docs/NESTO_CHALLENGE_QUESTIONS.md) records the decisions that would materially change scope or expectations. Assumptions and deferred cases remain explicit in the [signup test plan](docs/SIGNUP_TEST_PLAN.md).

## First implementation

- Locale-specific `en-CA` and `fr-CA` projects across Chromium, Firefox, WebKit, and Microsoft Edge.
- Typed, fixture-injected `AppText` loaded outside Page Objects.
- Independently maintained expected-copy files for language assertions.
- Deployed signup copy is kept in typed per-locale baseline files under `test-data/expected-copy/live-signup/` and injected into its Page Object; adding a locale requires a new baseline and registry entry, not more conditional text in the Page Object.
- A task-oriented `SignupPage`; multi-page conditional journeys should use focused workflow classes.
- An ordered `LocatorResolver` that records the successful strategy in test annotations and rejects ambiguous visible matches. It does not mutate selectors or use opaque healing.
- Playwright's built-in `request` fixture is available for REST API tests without adding another client.
- JSON-driven signup scenarios with runtime validation and a separate Playwright test per case.
- A separately guarded QA account-creation project with a 20-attempt ledger, exclusive reservation lock, synthetic data, safe response correlation, artifact suppression, and stop-on-first-failure execution.
- Read-only negative integration checks that abort any unexpected account request, plus an axe-core WCAG A/AA baseline in both locales and all three bundled browsers.

Locator priority should remain: accessible role/label, stable attributes or test IDs, scoped relationships, text patterns, then structural CSS/XPath as a last resort.

## Run locally

From a fresh clone, one command installs locked dependencies and any missing bundled browsers, removes generated results, and runs all static build checks:

```bash
corepack pnpm run build
```

Run the complete bundled-browser test suite with:

```bash
corepack pnpm test
```

The default suite is self-contained and never navigates to a deployed application. Use `test:env` to select the QA target explicitly; see [Environment and data profiles](#environment-and-data-profiles).

Playwright's WebKit build provides Safari-engine coverage, but it is not the branded Safari browser. WebKit on macOS is the closest automated approximation when Safari-specific behaviour matters.

### Quality gates

- `pnpm run check:static` verifies formatting, ESLint rules, and TypeScript.
- `pnpm run build` installs dependencies and browsers, cleans generated output, and runs static checks.
- `pnpm test` runs Chromium, Firefox, and WebKit in both locales.
- `pnpm run test:chromium` provides a faster local browser check.
- `pnpm run test:edge` runs the branded Edge projects after `pnpm exec playwright install msedge`; installing Edge may require administrator access.
- Husky runs lint-staged checks before each commit.
- GitHub Actions runs static checks plus Chromium, Firefox, WebKit, and Edge for pull requests and changes to `main`.

To make the GitHub check mandatory, configure the `Quality gate` job as a required status check in the repository's branch protection or ruleset for `main` after this workflow has run once.

### Run one browser and locale

Every browser/locale combination is a separate Playwright project. Select one with `--project`:

```bash
# Chromium
corepack pnpm exec playwright test --project=chromium-en-CA
corepack pnpm exec playwright test --project=chromium-fr-CA

# Firefox
corepack pnpm exec playwright test --project=firefox-en-CA
corepack pnpm exec playwright test --project=firefox-fr-CA

# WebKit (Safari engine)
corepack pnpm exec playwright test --project=webkit-en-CA
corepack pnpm exec playwright test --project=webkit-fr-CA

# Microsoft Edge; requires Edge to be installed
corepack pnpm exec cross-env PLAYWRIGHT_INCLUDE_EDGE=true playwright test --project=edge-en-CA
corepack pnpm exec cross-env PLAYWRIGHT_INCLUDE_EDGE=true playwright test --project=edge-fr-CA
```

Additional Playwright arguments can follow the project selection. For example, this runs one test file in headed French Firefox:

```bash
corepack pnpm exec playwright test tests/framework/signup-page.spec.ts --project=firefox-fr-CA --headed
```

### Test artifacts

The default configuration is failure-focused:

- Screenshots are captured only when a test fails.
- Videos and Playwright traces are retained only when a test fails.
- Local artifacts are written under `test-results/`; the HTML report is written under `playwright-report/`.
- CI uploads both directories for 14 days, including failure screenshots, videos, and traces.
- Test runner output is visible in the terminal and CI logs. Console warnings/errors and uncaught page errors are attached to failed tests from the app fixture after basic redaction. Treat these artifacts as potentially sensitive and do not put credentials or real personal data in test cases.
- The write-capable signup project disables screenshots, video, traces, HTML reporting, and browser diagnostics. Its local ledger must also be marked executable after the Stage 6 human gate before a submission can occur.

Run `corepack pnpm run clean` to remove local reports and test artifacts.

### Data-driven scenarios

Edit `test-data/scenarios/self-contained/signup.json` to add or remove synthetic signup cases:

```json
{
  "cases": [
    { "id": "standard-email", "email": "qa@example.test" },
    { "id": "plus-addressed-email", "email": "qa+signup@example.test" }
  ]
}
```

Each case runs as its own test in every selected browser/locale project, so failures name the case that failed. The loader checks for missing or duplicate IDs and malformed email values before the test suite runs; it does not prove an email address is deliverable. Keep committed cases synthetic and non-sensitive; the framework example still uses self-contained HTML, not a live signup endpoint.

### Environment and data profiles

Pass the environment as a command argument. Configuration lives in `config/environments/`, so no URL exports are needed:

```bash
corepack pnpm run test:env self-contained
corepack pnpm run test:env staging
corepack pnpm run test:env staging --project=chromium-en-CA
```

`staging` maps to `https://app.qa.nesto.ca/signup`, as supplied by the project owner; the page's French link points to `/fr/signup`, which is configured separately. The default staging run executes SGN-001 full-form contract, SGN-002 language switching, SGN-005 client-side email rejection, SGN-009 accessibility reporting, SGN-015 password mismatch, SGN-016 file-driven edge cases, and SGN-017 consent toggling across the configured browser/locale projects. Negative cases intercept and abort any unexpected `POST */accounts`; the known overlong-email defect is recorded as an expected failure. Account creation lives under `tests/real-app/account-creation/` but is excluded from ordinary staging runs and requires its dedicated capability, runtime constraints, and executable ledger. The API target and health path are not known yet, so `corepack pnpm run test:env staging api` fails closed until both are added to `config/environments/staging.json`. Production execution is intentionally disabled, including if someone sets `TEST_ENV=production` directly. `pnpm test` and CI continue to run only self-contained framework tests. The API smoke is a single browserless project; the UI suite runs across browser/locale projects.

The environment file selects a matching `dataProfile`. Tests can request the `signupCases` fixture, which loads and validates `test-data/scenarios/<profile>/signup.json`. Synthetic self-contained and read-only real-app negative profiles are committed. Staging and production account data directories are ignored by Git. The final guarded signup confirmation reached the quote page, but its observer rejected the API response because a sensitive-shaped optional field was populated. Its local ledger is disabled after that ambiguous response-contract result. Keep secrets and personal data out of the versioned environment files.

## Structure

```text
src/framework/             reusable test infrastructure
config/environments/       versioned, non-secret environment targets
src/fixtures/              Playwright dependency injection
src/i18n/                  locale contracts and loading
src/pages/                 task-oriented Page Objects
test-data/expected-copy/   independently approved language baselines
test-data/scenarios/       environment-selected JSON-driven test cases
tests/framework/           self-contained framework contract tests
tests/real-app/            opt-in deployed UI checks; account creation is separately gated
tests/api/                 opt-in read-only API smoke tests
```

## Next increments

1. Confirm the real signup route, health path, stable identity contracts, and approved bilingual copy.
2. Add the first environment-backed signup journey and a focused workflow only if it crosses pages or branches; define test-account creation and capped-retention or cleanup policy first.
3. Review and approve the recorded axe-core WCAG A/AA baseline before enforcing a no-regression gate.
4. Define measurable performance budgets before selecting browser timing or Lighthouse coverage.
5. Add data builders and API setup/cleanup around concrete test cases.
6. Add GitHub Actions and Jenkins stages only after the local suite and deployment environments are agreed.
