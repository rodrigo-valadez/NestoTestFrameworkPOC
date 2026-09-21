# Nesto Test Framework POC

A narrow Playwright + TypeScript foundation for maintainable UI and REST API testing.

## First implementation

- Locale-specific `en-CA` and `fr-CA` Playwright projects.
- Typed, fixture-injected `AppText` loaded outside Page Objects.
- Independently maintained expected-copy files for language assertions.
- A task-oriented `SignupPage`; multi-page conditional journeys should use focused workflow classes.
- An ordered `LocatorResolver` that records the successful strategy in test annotations and rejects ambiguous visible matches. It does not mutate selectors or use opaque healing.
- Playwright's built-in `request` fixture is available for REST API tests without adding another client.

Locator priority should remain: accessible role/label, stable attributes or test IDs, scoped relationships, text patterns, then structural CSS/XPath as a last resort.

## Run locally

```bash
corepack pnpm install
corepack pnpm exec playwright install chromium
corepack pnpm run check
```

Set `BASE_URL` when tests begin navigating to a deployed application. The initial tests use local HTML so the framework contract can be validated independently of an environment.

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
