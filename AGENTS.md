# Repository guide for test-writing agents

Applies to this repository. Read `README.md` and `docs/TEST_ROADMAP.md` before adding cases. Inspect the current implementation and target page/API; do not infer a live contract from the self-contained demo. Keep a new case focused on one behavior with a clear expected outcome and, when the roadmap's ID scheme is implemented, a stable case ID.

## Safety and scope

- Default to `self-contained`. Run live tests only through the explicit staging command. Production execution is disabled; a future `production` tag or route must not bypass that guard.
- Existing staging cases are read-only. Do not submit signup forms, create accounts, mutate APIs, or use real personal data without an approved account/data lifecycle and cleanup plan.
- Never commit credentials, cookies, tokens, real customer data, or sensitive screenshots. Treat traces, videos, console output, and HTML reports as potentially sensitive. Preserve the existing redaction and failure-only artifact behavior.
- Do not claim that a test covers a live environment unless it actually ran there. Separate static checks, test discovery, self-contained runs, and live QA results in the handoff.

## Test placement and execution

- Put framework contract checks in `tests/framework/`, opt-in deployed UI checks in `tests/real-app/`, and API checks in `tests/api/`. The default `pnpm test` and CI quality gate are self-contained; `pnpm run test:env staging` is opt-in.
- Browser/locale combinations are Playwright projects (`chromium`, `firefox`, `webkit` × `en-CA`/`fr-CA`; Edge is opt-in). Do not assume WebKit is branded Safari or silently multiply tests by environment.
- Follow the taxonomy in `docs/TEST_ROADMAP.md`. Its proposed tags and reporting schema are not yet implemented; do not invent a parallel tagging convention in individual cases.
- Prefer one meaningful case per test result. Use descriptive names and link a requirement or approved acceptance criterion when one exists. Do not treat UAT, smoke, regression, and environment labels as interchangeable.

## Locators and Page Objects

1. Prefer accessible roles and names (`getByRole`, `getByLabel`), then stable test IDs/attributes, scoped relationships, text patterns, and only then structural CSS/XPath.
2. Keep selectors semantic and unique. Do not use `nth()`, forced clicks, or fixed sleeps to mask ambiguity or timing problems.
3. When a real fallback is necessary, use `src/framework/locator-resolver.ts` with an explicit ordered list of named strategies. It records the winning strategy in test annotations and rejects ambiguous visible matches. `.or()` is a union, **not** ordered fallback.
4. Keep Page Objects task-oriented: encapsulate page controls/navigation, not assertions for whole business journeys. Deterministic navigation may return a destination Page Object; conditional multi-page flows belong in focused workflow classes, not a global controller.
5. Do not place translated UI strings in Page Objects. Use typed per-locale copy/fixtures as in `src/i18n/live-signup-text.ts` and `test-data/expected-copy/live-signup/`. Expected copy is a reviewed test baseline, not imported from the application's own translation files. The current QA baselines were observed, not yet product-owner approved.

## Test data

- Use synthetic, non-sensitive JSON cases under `test-data/scenarios/<profile>/` and select them through the environment/data-profile fixture. The existing example is `test-data/scenarios/self-contained/signup.json` with validation in `src/test-data/signup-cases.ts`.
- For a new case shape, add a typed parser that validates JSON at the boundary, rejects malformed/duplicate IDs, and fails before test execution. Keep one named data case visible as one test result when practical.
- Staging and production scenario directories are ignored by Git. Do not add live data files or write-capable tests until data ownership, consent, and cleanup are approved.

## Before a PR or handoff

- Run `pnpm run check:static` and the relevant self-contained tests; run a staging case only when it is read-only and the target is configured. Report exact pass/fail counts and constraints.
- Preserve screenshots, videos, and traces on failure; do not broaden artifact capture or retention without considering privacy and cost.
- Explain the case's purpose, test data, selector choice, alternatives/tradeoffs, validation, and any unresolved contract. Include visual/video evidence for visible page changes; documentation-only changes may say visual evidence is not applicable.
- Update the roadmap only when acceptance criteria are met. Do not mark a proposed reporter, tag, metric, or TestOps integration as delivered because it appears in a document.
