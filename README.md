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

```bash
corepack pnpm install
corepack pnpm exec playwright install chromium firefox webkit
corepack pnpm run check
```

Set `BASE_URL` when tests begin navigating to a deployed application. The initial tests use local HTML so the framework contract can be validated independently of an environment.

Playwright's WebKit build provides Safari-engine coverage, but it is not the branded Safari browser. WebKit on macOS is the closest automated approximation when Safari-specific behaviour matters.

### Quality gates

- `pnpm run check:static` verifies formatting, ESLint rules, and TypeScript.
- `pnpm test` runs Chromium, Firefox, and WebKit in both locales.
- `pnpm run test:chromium` provides a faster local browser check.
- `pnpm run test:edge` runs the branded Edge projects after `pnpm exec playwright install msedge`; installing Edge may require administrator access.
- Husky runs lint-staged checks before each commit.
- GitHub Actions runs static checks plus Chromium, Firefox, WebKit, and Edge for pull requests and changes to `main`.

To make the GitHub check mandatory, configure the `Quality gate` job as a required status check in the repository's branch protection or ruleset for `main` after this workflow has run once.

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
