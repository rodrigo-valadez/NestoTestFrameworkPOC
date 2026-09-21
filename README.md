# Nesto Test Framework POC

A narrow Playwright + TypeScript foundation for maintainable UI and REST API testing.

## First implementation

- Locale-specific `en-CA` and `fr-CA` projects across Chromium, Firefox, WebKit, and Microsoft Edge.
- Typed, fixture-injected `AppText` loaded outside Page Objects.
- Independently maintained expected-copy files for language assertions.
- A task-oriented `SignupPage`; multi-page conditional journeys should use focused workflow classes.
- An ordered `LocatorResolver` that records the successful strategy in test annotations and rejects ambiguous visible matches. It does not mutate selectors or use opaque healing.
- Playwright's built-in `request` fixture is available for REST API tests without adding another client.

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

Set `BASE_URL` when tests begin navigating to a deployed application. The initial tests use local HTML so the framework contract can be validated independently of an environment.

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
corepack pnpm exec playwright test tests/e2e/signup-page.spec.ts --project=firefox-fr-CA --headed
```

### Test artifacts

The default configuration is failure-focused:

- Screenshots are captured only when a test fails.
- Videos and Playwright traces are retained only when a test fails.
- Local artifacts are written under `test-results/`; the HTML report is written under `playwright-report/`.
- CI uploads both directories for 14 days, including failure screenshots, videos, and traces.
- Test runner output is visible in the terminal and CI logs. Browser console messages are not currently saved to dedicated log files.

Run `corepack pnpm run clean` to remove local reports and test artifacts.

## Structure

```text
src/framework/             reusable test infrastructure
src/fixtures/              Playwright dependency injection
src/i18n/                  locale contracts and loading
src/pages/                 task-oriented Page Objects
test-data/expected-copy/   independently approved language baselines
tests/framework/           framework contract tests
tests/e2e/                 user-facing journey tests
```

## Next increments

1. Confirm the real signup route, stable identity contracts, and approved bilingual copy.
2. Add the first environment-backed signup journey and a focused workflow only if it crosses pages or branches.
3. Add `@axe-core/playwright` accessibility checks and agreed WCAG rules.
4. Define measurable performance budgets before selecting browser timing or Lighthouse coverage.
5. Add data builders and API setup/cleanup around concrete test cases.
6. Add GitHub Actions and Jenkins stages only after the local suite and deployment environments are agreed.
