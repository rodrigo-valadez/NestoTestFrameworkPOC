# Signup guarded implementation handoff

**Stage:** 6 — test implementation. **Status:** approved and executed within the 20-attempt limit, 2026-09-23. One QA form was submitted; its result was ambiguous, so the guarded runner stopped before the remaining 19 attempts.

## Implemented behavior

- Expanded `LiveSignupPage` with typed task methods for the full visible form, partner consent set to `true`, and submission.
- Expanded independent EN/FR copy baselines without inventing a French phone-country accessibility translation; the unresolved French defect uses the documented functional fallback.
- Added an explicit `QA_ACCOUNT_CREATION=true` staging capability guard.
- Added a dedicated `account-creation` Playwright suite with Chromium/en-CA only, one worker, no retries, no parallel execution, list reporting only, and screenshots/video/traces disabled.
- Added a diagnostics fixture option that prevents browser console/page-error capture for the write-capable test.
- Added a local ledger parser, exclusive interprocess lock, atomic replacement, collision checks, 20-attempt cap, state transitions, 30-day review date, and forbidden-secret-key rejection.
- Added synthetic UUID-based identity generation and a 16-character in-memory password satisfying the observed uppercase/lowercase/number rules.
- Added response observation limited to non-GET fetch/XHR responses on the approved QA host boundary, exact email correlation, exact JSON boolean consent, safe-field comparison, secret-key rejection, and sanitized endpoint categories.
- Added 20 serial SGN-006 test instances. Each reserves the ledger before navigation, records sanitized state changes, and throws a fixed non-sensitive failure when creation is not safely confirmed. The runner stops after the first failure.

## Defense in depth

Execution requires all of these conditions:

1. `TEST_ENV=staging`.
2. `LIVE_SUITE=account-creation`.
3. `QA_ACCOUNT_CREATION=true`.
4. The dedicated Chromium/en-CA project.
5. An approved local ledger whose `executable` value is `true` and that has an available slot.

Before execution, the checked local ledger was executable under the explicit 2026-09-23 Stage 6 approval and began with zero attempts. After the first attempt became ambiguous, the ledger was disabled. The default suite and CI remain self-contained, and production remains rejected.

## Validation performed

- `pnpm run check:static`: passed formatting, ESLint, and TypeScript.
- Final self-contained scope after the 20-attempt amendment, shown as a normalized reproducible command: `TEST_ENV=self-contained LIVE_SUITE=framework pnpm exec playwright test tests/framework --project=chromium-en-CA --reporter=line` — 30 passed. This includes 7 lifecycle/ledger tests, 4 response-observer tests, 2 runtime-override guard tests, and 1 diagnostics-fixture suppression test. The local run used the bundled Node executable directly because the shell did not expose `node` on its default path.
- Pre-execution account-creation discovery with staging suite selection and `--list`: exactly 20 tests in one dedicated project; this check only discovered them. The later authorized run executed one and stopped 19.
- `git diff --check`: passed.
- Live QA account-creation execution: one attempt ran. It became `ambiguous` because the observer did not find exactly one safely correlated response during the bounded window. The configured first-failure stop prevented the remaining 19 attempts.

An initial all-browser attempt inside the restricted sandbox could not launch its browser processes. The same complete Chromium/en-CA framework scope passed outside that browser sandbox. Firefox/WebKit were not rerun because the new write implementation is intentionally limited to Chromium and the focused implementation risks were covered there.

## Files and boundaries

- `src/test-data/signup-account-lifecycle.ts`: local data, validation, locking, reservation, and state transitions.
- `src/workflows/signup-account-creation.ts`: response correlation and sanitized classification.
- `tests/real-app/account-creation/signup-create.spec.ts`: separately gated SGN-006 QA write instances under the deployed-app suite, with runtime safety assertions.
- `playwright.config.ts`: isolated project and artifact settings.
- `src/pages/live-signup.page.ts`: page controls only; lifecycle and response analysis remain outside the Page Object.
- `test-data/scenarios/staging/signup-account-ledger.json`: ignored local ledger; contains one ambiguous attempt and 19 unused slots under the explicit 2026-09-23 amendment.

## Known limitations

- `example.com` may be rejected by server policy, consuming the first slot without proving creation.
- The actual endpoint and response shape remain unobserved. A shape outside the approved allowlist becomes `ambiguous` rather than being logged or guessed.
- No mailbox, admin lookup, cleanup endpoint, or independent account reconciliation exists.
- No accessibility scanner was added in this implementation stage.
- The French phone-country accessible name and consent copy still require product/language-owner review.

## Skeptical review

Independent reviewer, 2026-09-23. The initial review found unsafe dynamic endpoint persistence, an observation window that could miss a delayed duplicate response, discarded safe result metadata, permissive empty identifiers, and incomplete diagnostics-fixture evidence. The implementation now persists a fixed endpoint category, observes the full bounded window, treats delayed duplicate candidates as ambiguous, awaits response bodies still pending at the deadline, stores validated sanitized result metadata, rejects empty/non-finite identifiers, and tests the actual disabled diagnostics fixture. The reviewer completed the focused recheck and reported no remaining code safety findings; that pre-amendment bookkeeping recorded the then-current 28-test validation scope.

The 20-attempt amendment review then found CLI override risk, probable random phone collision, stale two-attempt documentation, and missing approval-amendment provenance. Runtime settings are now asserted before reservation, phone suffixes are allocated uniquely while holding the ledger lock, current-contract documentation reflects 20 serial attempts, and the ledger preserves both approval dates. The reviewer rechecked the amendment after the 30/30 self-contained validation and reported no remaining code or configuration safety findings.

## Recommended next step

Review the sanitized Stage 7 result and investigate the response-correlation gap without submitting another form. A future live attempt requires a new explicit human decision because this approved run stopped on ambiguity.

## Post-execution QA-suite amendment — 2026-09-23

- Moved the separately gated SGN-006 write test under `tests/real-app/account-creation/`; ordinary `real-app` selection still excludes it.
- Expanded SGN-001, SGN-002, and SGN-017 into deployed QA functional checks across Chromium, Firefox, and WebKit in both locales. The final read-only matrix passed 18/18 without submitting a form.
- Extended response correlation to accept exactly one safe matching account record inside a bounded nested JSON envelope. Secret-key inspection covers the complete parsed envelope and fails closed after 1,000 inspected container nodes. Focused observer coverage passed 7/7.
- Static formatting, ESLint, TypeScript, and `git diff --check` passed. Account-creation discovery still lists 20 serial tests in the dedicated project.
- No additional signup was submitted. The local ledger remains disabled with one ambiguous attempt and 19 unused slots.

This section records the state at that amendment. Later bounded Stage 7 investigation consumed nine lifetime slots in total and left eleven. It identified the hydration requirement, letters-only name validation, placeholder-email rejection, and the actual `POST /api/accounts` response: HTTP 201 with an `{ account, token }` envelope, submitted non-secret account information, normalized phone, and an identifier. The current ledger remains disabled pending approval of the exact observed contract in `SIGNUP_RESULTS.md`.

### Human decision

- **Decision requested from:** requesting user and ledger owner.
- **Decision requested:** superseded by the explicit 20-attempt approval below.
- **Decision:** approved for at most 20 live SGN-006 attempts.
- **Decision maker and date:** requesting user and ledger owner, 2026-09-23, stating “I approve stage 6 for 20 live SGN-006 attempts.”
- **Conditions:** serial Chromium/en-CA execution, unique synthetic identity per reservation, no retries, 30-day review, artifact suppression, ledger cap 20, and automatic stop on first failure or ambiguous result.
