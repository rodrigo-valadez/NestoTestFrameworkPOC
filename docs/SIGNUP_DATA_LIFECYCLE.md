# Signup data and account lifecycle

**Stage:** 5 — test data and lifecycle design. **Status:** approved and amended for Stage 6, 2026-09-23. The user increased the maximum from two to 20 potentially account-creating QA submissions. This document does not itself submit a form.

## Initial data profile

The first write-capable case is one English, Chromium signup using a unique synthetic identity:

| Field           | Proposed value rule                                                             | Stored after execution                                        |
| --------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Case ID         | `SGN-006/primary-en-ca`                                                         | Yes                                                           |
| Run ID          | Cryptographically generated UUID                                                | Yes                                                           |
| First name      | `Qa`                                                                            | Yes, in ignored ledger                                        |
| Last name       | `Agent<run-id-suffix>`                                                          | Yes, in ignored ledger                                        |
| Phone country   | Canada                                                                          | Yes                                                           |
| Phone           | Canadian fictional `555-01xx` number selected deterministically from the run ID | Yes, in ignored ledger                                        |
| Province        | Alberta                                                                         | Yes                                                           |
| Email           | `signup-automation-<run-id>@qa.nesto.ca`                                        | Yes, in ignored ledger; mailbox delivery is outside scope     |
| Password        | Generated in memory: 16 characters with uppercase, lowercase, and number        | Never stored, logged, attached, or placed in an error message |
| Confirmation    | Same in-memory password                                                         | Never stored                                                  |
| Partner consent | `true`, as directed by the human approver                                       | Yes                                                           |

The email domain may be rejected by server policy even when its syntax is valid. That would be observed behavior and consumes the reserved attempt; the test must not silently change to a real or personal address. A different QA-owned mailbox/domain requires a new human decision.

Before reservation, the generated run ID, email, and phone must be absent from every existing ledger attempt. A collision fails closed without submitting or silently regenerating. The fictional phone pool contains 100 values; the 20-attempt cap plus collision validation prevents reuse in this campaign.

The positive account-creation case explicitly checks the consent control before submission. When the response contains the allowlisted `leadDistributeConsentAgreement` field, it must be the JSON boolean `true`, exactly matching the submitted value; a truthy string such as `"true"` does not match. This is the approved test-data choice. It does not establish that consent is legally or technically mandatory for every signup; requiredness remains a separate behavior to verify at the appropriate lower test level and through one representative UI check.

Up to 20 SGN-006 attempts run serially with unique identities. `maxFailures: 1` stops the suite after the first rejected, ambiguous, or execution-failure result, preventing a broken contract from cascading through the remaining budget. There is no automatic retry, parallel execution, browser matrix, or locale matrix for write-capable cases.

## Ledger contract

The authoritative local ledger is `test-data/scenarios/staging/signup-account-ledger.json`. The directory is ignored by Git and survives normal Playwright report cleanup. The requesting user is the proposed owner. Stage 6 must validate this schema before opening the page:

- Environment and feature are exactly `staging` and `signup`.
- Attempt cap is exactly `20`; the original two-attempt approval date and the 2026-09-23 budget-amendment date are both present.
- Lifecycle approval timestamp is present before execution.
- Each attempt has a unique ID and one state: `reserved`, `submitted`, `created`, `rejected`, or `ambiguous`.
- Each attempt records reservation/submission/result timestamps, case ID, synthetic identity, browser, locale, outcome, HTTP status when observed, sanitized endpoint path, and 30-day review date.
- Passwords, confirmation, tokens, cookies, authorization values, and request/response bodies are forbidden.

Reservation requires an exclusive interprocess lock acquired through atomic file creation around the complete read-validate-reserve-write transaction. If the lock already exists, appears stale, cannot be inspected, or cannot be released safely, execution fails closed without opening the page; automation never deletes a stale lock. While holding the lock, validate the ledger and generated identity, verify fewer than 20 existing attempts, allocate the first unused fictional phone from the 100-number pool, append a `reserved` attempt, safely replace the ledger file, and then release the lock. Every reserved slot counts against the cap. A process failure after reservation leaves the slot consumed until human review; automation never deletes or releases a record to obtain another attempt.

The dedicated Playwright project must set `workers: 1`, `retries: 0`, and `fullyParallel: false`. These settings reduce accidental concurrency but do not replace the interprocess lock, which also protects against a second shell invocation. Stage 6 must test simultaneous reservation attempts and prove that only one can write.

## Outcome and reconciliation rules

The user-stated success contract is an HTTP 201 from the browser-triggered account-creation request with safe submitted fields represented in the response. Response observation begins immediately before `submit()` and ends on the first of a bounded timeout or a uniquely correlated response. A candidate must:

- Be a non-GET fetch/XHR response initiated during that submit window.
- Use HTTPS on `app.qa.nesto.ca` or a host ending in `.qa.nesto.ca`, keeping discovery within the approved QA boundary.
- Have a JSON response whose allowlisted `email` value exactly matches the in-memory synthetic email.

Zero or multiple candidates are `ambiguous`; an unrelated 201 cannot qualify on status alone. Persist only the allowlisted QA origin, method, and a sanitized static endpoint route template or approved route category. Always drop query and fragment data. If a path contains an unapproved dynamic segment or sensitive value that cannot be replaced safely with a fixed placeholder, the result is `ambiguous` and the path is not recorded. Request and response bodies are never persisted.

The only response fields permitted for in-memory comparison are `firstName`, `lastName`, `phoneCountry`, `phone`, `email`, `leadDistributeConsentAgreement`, and one province field named `province`, `provinceCode`, or `region`. Optional identifiers `id`, `accountId`, or `userId` may be checked for a non-empty primitive value, but only the identifier field name and a boolean presence indicator are persisted. Password, confirmation, tokens, cookies, authorization fields, and any key containing `password`, `secret`, `token`, `authorization`, or `cookie` are excluded from comparison and evidence.

The first successful response must contain the submitted email plus the visible submitted non-secret fields under these allowlisted names. Any unknown shape, missing required safe field, conflicting province aliases, unsafe parse, or secret-bearing evidence path is `ambiguous` pending human review. The implementation may inspect the response in memory but records only:

- HTTP method, status, allowlisted QA origin, and sanitized endpoint route template/category
- Names of returned fields intersecting the allowlist; unexpected field names are recorded only as a count, never their values
- A single boolean stating whether approved non-secret fields matched
- Final allowlisted QA origin and sanitized static route template/category plus a sanitized visible outcome category; query and fragment are always dropped, and an unapproved dynamic/sensitive path makes the result `ambiguous`

It must not use value-bearing Playwright assertions that print email, phone, password, or response content on failure. Compare in memory and throw a fixed, non-sensitive error when the safe-field match fails.

### Observed QA response amendment — approved and exercised

Bounded investigation on 2026-09-23 observed `POST /api/accounts`. A valid synthetic `qa.nesto.ca` submission returned HTTP 201 with exactly `{ account, token }`; the `account` object contained the submitted non-secret information and a non-empty identifier, while phone was normalized to the Canadian country-code form. The token value was never retained. The executable contract requires that exact envelope, ignores the token value, compares only the safe account fields in memory, permits only the observed account-field schema, and rejects missing or extra envelope keys, unknown account keys, malformed request JSON, wrong-key email correlation, non-Canadian phone prefixes, whitespace identifiers, and unsafe keys inside `account`. The human owner approved exactly one ordinary confirmation under this amendment. Attempt 10 reached `/getaquote` but stopped as `sensitive-response-data`; another live attempt requires a new explicit human decision.

Classify account state as follows:

- `created`: observed 201 and all approved safe fields matched.
- `rejected`: an observed non-201 response and stable visible rejection were both captured. This label describes the observed request outcome; it does not prove that no backend record exists.
- `ambiguous`: missing/interrupted response, conflicting UI and response, unsafe/unparseable response, navigation timeout, or any result that does not satisfy the two definitions above.

There is no independent admin lookup, cleanup endpoint, or approved mailbox/login reconciliation source. Therefore `rejected` and `ambiguous` attempts remain consumed and are never retried automatically. The ledger owner reviews them manually. The suite stops on the first failure or ambiguous result and never expands beyond 20 reservations.

## Retention and ownership

- **Proposed owner:** requesting user acting as QA approver.
- **Review date:** 30 days after each submission.
- **At review:** record whether the account is known active, rejected, ambiguous, or removed by an environment owner. Do not claim deletion without evidence.
- **Cleanup:** none currently available. The owner raises removal with the QA environment owner when a supported method exists.
- **Repository retention:** the ignored ledger remains local until all entries have a documented final review. Sanitized aggregate test results may remain in reports; account identities do not enter committed files.

## Artifact and output policy

Write-capable tests require a dedicated project/configuration with screenshots, video, and traces set to `off`. The automatic `BrowserDiagnostics` attachment must have an explicit opt-out that is exercised for these cases. Stage 6 must test that the opt-out prevents attachment even on failure.

The test title and annotations contain only case ID, locale, browser, and environment. Reporters, console messages, thrown errors, steps, network logs, and attachments must not contain entered values, credentials, headers, query values, or bodies. Response inspection stays in memory. The sanitized result record is constructed from allowlisted metadata; redaction is a secondary defense, not permission to collect secrets.

The existing general redactor is insufficient as the primary control because arbitrary generated passwords may appear without a `password=` label. Write tests therefore disable diagnostics rather than relying on that pattern.

## Typed boundary and implementation handoff

Stage 6 may add a separate staging-only data type and parser. It should not expand the current email-only self-contained `SignupCase` into a union that complicates framework examples. The staging profile is generated or written locally under the ignored directory and validated before use.

The account-creation capability remains false by default. Stage 6 should require all of the following before collecting data or opening the write flow:

1. `TEST_ENV=staging` and the real-app suite.
2. A dedicated explicit account-creation switch.
3. A valid lifecycle-approved ledger with an available slot.
4. The single approved project, locale, and case ID.
5. Artifact and diagnostics suppression active.

Production remains rejected. CI, retries, full parallelism, and the general browser matrix remain disabled for the write case.

## Stage 5 handoff

- **Prepared by:** Codex data/lifecycle designer, 2026-09-22.
- **Inputs:** approved Stage 2 write budget, approved Stage 3 limits, approved Stage 4 selector contract, current environment guards, diagnostics fixture, reporters, and ignored staging-data policy.
- **Decisions approved:** one synthetic EN/Chromium profile per attempt with partner consent set to `true`; requesting user as owner; 20 consumed-on-reservation slots; 30-day review; no automatic retries; stop on first failure; response-based outcome classification; no claim that rejection proves non-creation; diagnostics and Playwright artifacts disabled.
- **Open risk:** the originally proposed reserved `example.com` address was later rejected by the deployed server with HTTP 422 and replaced with unique synthetic `qa.nesto.ca` data. There is no independent account lookup or cleanup.
- **Validation at Stage 5 review:** repository static checks and document formatting passed. Design inspection covered environment guards, automatic diagnostics, report artifacts, ignored data, and the existing signup parser. At that time, no data had been entered, no live test had run, and all 20 write slots were unused.
- **Skeptical review:** independent reviewer, 2026-09-22. Initial findings identified a non-exclusive ledger transaction, weak response correlation, an undefined response allowlist, an unsupported password symbol, possible identity reuse, and missing handoff bookkeeping. The design was corrected in content revision `71d2d954d00f9beb85aa7628c69c8b415c803293`. Subsequent URL-persistence and consent-consistency concerns were corrected. After the human changed partner consent to `true`, the reviewer confirmed exact JSON boolean comparison and consistent unresolved requiredness language, with no remaining actionable findings.
- **Current execution state:** ten attempts are consumed, ten are unused, and the ledger is disabled. The ledger records both the historical two-attempt approval date and the 20-attempt amendment date.
- **Stage 5 next step at handoff:** approve this lifecycle and data contract for Stage 6 implementation, request revision, or pause. That decision was later approved as recorded below.

### Human decision

- **Decision requested from:** requesting user and proposed ledger owner.
- **Decision requested:** superseded by the human owner's 2026-09-23 approval of Stage 6 for 20 live SGN-006 attempts under the amended serial, stop-on-first-failure lifecycle.
- **Decision:** approved for Stage 6 implementation.
- **Decision maker and date:** requesting user and ledger owner, 2026-09-23, after stating “stage 5 looks good.”
- **Conditions at the Stage 5 decision:** implementation and self-contained validation only; a separate Stage 6 human gate was required before live execution. That condition was satisfied by the Stage 6 amendment below.
- **Stage 6 amendment:** requesting user and ledger owner, 2026-09-23, explicitly approved Stage 6 for 20 live SGN-006 attempts. This supersedes the earlier two-attempt cap. All attempts remain consumed on reservation, serial, without retries, and execution stops on the first failure or ambiguous result.
