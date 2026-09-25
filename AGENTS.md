# Repository guide for test-writing agents

Applies to this repository. Read `README.md` and `docs/TEST_ROADMAP.md` before adding cases. Inspect the current implementation and target page/API; do not infer a live contract from the self-contained demo. Keep a new case focused on one behavior with a clear expected outcome and, when the roadmap's ID scheme is implemented, a stable case ID.

## Agent-driven feature planning

Follow [the agent test workflow](docs/AGENT_TEST_WORKFLOW.md) for role handoffs, explicit human stage decisions, and independent skeptical review. End each stage with the [handoff summary](docs/STAGE_HANDOFF_TEMPLATE.md). A reviewer challenges gaps and unnecessary complexity, records evidence-linked findings, and cannot approve product decisions or bypass environment guards. Do not start a dependent next stage while its human gate is pending.

For Stage 1 feature analysis, use the repo-local [`feature-brief` skill](.agents/skills/feature-brief/SKILL.md); it produces an evidence-based brief and leaves unknown product requirements for a human owner. The [signup feature brief](docs/SIGNUP_FEATURE_BRIEF.md) is the first example under this workflow.

Before adding coverage for a feature, create or update its reviewable plan under `docs/` using [the signup feature test plan](docs/SIGNUP_TEST_PLAN.md) as the current example. The agent owns the evidence gathering and draft: inspect repository state, existing tests, Page Objects, fixtures, environment guards, data, approved requirements, and the target contract when access is authorized. Record what was observed, what is inferred, and what still needs an owner decision. A plan is a proposed inventory, not permission to run a test or evidence that coverage exists.

For each proposed case, provide a stable proposed ID, priority, one behavior and expected outcome, prerequisites and synthetic data, type/purpose/environment classifications from the roadmap, browser/locale scope, and a clear ready/blocked state. Map existing coverage without calling a self-contained check a live test. Identify missing API routes, approved copy, account lifecycle and cleanup, quality budgets, and business acceptance criteria explicitly. Include the planned Page Object/workflow boundary, selector and locale strategy, report metadata, triage, and measurement links when relevant.

Keep feature plans discoverable from `README.md`. Update the plan when evidence or decisions change; preserve IDs when their meaning stays the same, and document any split or retirement. Ask the responsible owner to approve product requirements and UAT outcomes rather than treating an agent draft as approved. Implement only cases whose contracts and safety prerequisites are met. In the handoff, list changed files, sources inspected, checks actually run, unresolved decisions, and whether any live target was contacted.

## Safety and scope

- Default to `self-contained`. Run live tests only through the explicit staging command. Production execution is disabled; a future `production` tag or route must not bypass that guard.
- Ordinary staging cases are read-only. A separately gated QA account-creation project exists, but its local ledger is disabled after ten consumed attempts. A documented lifecycle, numeric cap, unique synthetic data, ownership, ledger, and retention or cleanup remain necessary prerequisites; they do not authorize another write. No write-capable case may run without a new explicit human decision that covers the proposed attempt. Never use real personal data.
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
- Staging and production scenario directories are ignored by Git. Do not add live data files or enable write-capable tests until data ownership, consent, and an approved capped-retention or cleanup plan are documented.

## Before a PR or handoff

- Run `pnpm run check:static` and the relevant self-contained tests. Ordinary staging cases are read-only. The separately gated signup write project remains disabled after ten attempts; do not re-enable or run it without a new explicit human decision, even when its lifecycle and environment capability are otherwise satisfied. Report exact pass/fail counts and constraints.
- Preserve screenshots, videos, and traces on ordinary test failures. Write-capable cases follow their approved privacy design and may disable those artifacts when entered secrets could be exposed.
- Explain the case's purpose, test data, selector choice, alternatives/tradeoffs, validation, and any unresolved contract. Include visual/video evidence for visible page changes; documentation-only changes may say visual evidence is not applicable.
- Update the roadmap only when acceptance criteria are met. Do not mark a proposed reporter, tag, metric, or TestOps integration as delivered because it appears in a document.
