# Signup live execution and API investigation

## Stage 7: results analyst — SGN-006

- **Status:** approved; focused challenge coverage executed and live account execution paused by the response privacy guard
- **Prepared by and date:** coordinating agent, 2026-09-23
- **Inputs reviewed:** code-challenge PDF, guarded account-creation output, sanitized local ledger, deployed QA JavaScript, and privacy-safe response investigations
- **What was done:** Reserved and executed nine bounded SGN-006 investigation attempts while diagnosing the deployed signup flow, followed by one separately approved ordinary guarded confirmation. The investigation first exposed a hydration race, then an invalid generated surname, then the server rejection of `example.com` as a placeholder domain. With hydration complete, a letters-only surname, and a unique synthetic `qa.nesto.ca` address, the browser sent `POST /api/accounts` and received HTTP 201.
- **What the evidence shows:** The successful response had the exact top-level keys `account` and `token`. Without retaining their values, the observer verified that `account` semantically contained the submitted non-secret information: exact first name, last name, email, partner consent, province represented as `region`, a normalized Canadian phone matching the submitted digits, and a non-empty account identifier. Password was correctly absent. The top-level token value was never logged, attached, or persisted. The UI continued to `/getaquote`. This satisfies the challenge requirement that the API return 201 and that the response body contain the information entered in the form; it does not claim that every UI value is echoed byte-for-byte.
- **Other observed outcomes:** Two valid client submissions using `example.com` reached `POST /api/accounts` and returned HTTP 422 with `{ error, parameters }`: `invalid parameters` and `placeholder email detected`. Earlier attempts did not yield a safely correlated account response while the automation contract was being diagnosed. Those attempts remain consumed and uncertain.
- **Choices and reasons:** Kept every diagnostic attempt in the lifetime ledger. Raw request/response bodies, passwords, token values, identities, screenshots, traces, videos, and browser diagnostics were not retained. The diagnostic test was removed after the sanitized contract was established.
- **Checks:** The complete deployed read-only suite passed 54/54 across Chromium, Firefox, and WebKit in both locales; this includes six expected-failure observations for `BUG-SIGNUP-002`. Axe-core reported zero WCAG A/AA violation rules. The self-contained framework suite passed 228/228. Formatting, ESLint, TypeScript, and `git diff --check` passed.
- **Risks and open questions:** The ledger conservatively records all nine investigations as ambiguous, including the observed 201, because the diagnostic deliberately did not promote a result before the contract was reviewed. The final confirmation is also ambiguous because its privacy guard detected populated sensitive-shaped response data. A new account key or a missing required compared field fails closed; optional observed fields may be absent, and sensitive optional fields must be empty. Email delivery remains outside scope. The user states the QA environment owner will handle account cleanup.
- **Skeptical review:** Independent reviewer, 2026-09-23. Reviews drove durable ledger disabling, exact suite isolation, full envelope inspection, structured request correlation, strict Canadian phone normalization, trimmed identifiers, populated-sensitive-field rejection, unknown-field rejection, and current bookkeeping. The reviewer completed the focused recheck after the 19/19 validation and reported no remaining code or privacy blocker.
- **Human decision, 2026-09-23:** The requesting user approved completing the remaining challenge coverage after reviewing the observed `{ account, token }` contract and the proposal for one ordinary guarded SGN-006 confirmation. The local ignored ledger was re-enabled for exactly one confirmation attempt under the existing 20-attempt lifetime cap.
- **Final confirmation outcome:** The approved ordinary SGN-006 confirmation consumed attempt 10. The UI reached `/getaquote`, which is strong evidence that account creation completed, but the observer returned `sensitive-response-data` because an optional sensitive-shaped account field was populated. No field name or value, raw body, token, password, identity, screenshot, trace, or video was retained. The ledger automatically returned to disabled and no further write was attempted.
- **Read-only completion:** SGN-005 empty and malformed email, SGN-015 confirmation mismatch, SGN-016 weak password, and SGN-009 axe-core scans passed across six browser/locale projects. The email-exceeds-standard-length case attempted the account API in all six projects; every request was intercepted before leaving the browser and the behavior is recorded as `BUG-SIGNUP-002`.
- **Static security review:** The locked dependency audit reported no known vulnerabilities. Repository checks found no private-key, API-key-name, or client-secret-name matches, no `eval` or `new Function`, and confirmed production, live-write, artifact, and response-secret guards. No active attack payload was sent.
- **Recommended next step:** Proceed to Stage 8 metrics using reviewed execution counts and an explicit denominator. Separately review the populated optional account response field with the API owner through an approved secure channel before changing the observer or re-enabling live writes. Keep duplicate-account testing deferred until account-state reconciliation exists.

### Execution counts

| Measure                        | Count |
| ------------------------------ | ----: |
| Authorized lifetime maximum    |    20 |
| Reserved and executed          |    10 |
| Observed API 201               |     1 |
| Observed API 422               |     2 |
| Other uncertain investigations |     6 |
| Privacy-stopped confirmation   |     1 |
| Ledger state `ambiguous`       |    10 |
| Unused lifetime slots          |    10 |
| Confirmed email deliveries     |     0 |

### Human decision

- **Decision requested from:** requesting user and ledger owner
- **Decision requested:** approve or reject the observed response contract: correlate the structured `POST /api/accounts` request by its exact in-memory email; require exactly the top-level keys `account` and `token`; never inspect or persist the token value; require HTTP 201; require the allowlisted `account` schema, submitted non-secret fields, normalized Canadian phone, and non-empty identifier; reject unknown fields or shapes. If approved, authorize exactly one live confirmation attempt.
- **Decision:** approved for one ordinary confirmation as part of completing the remaining challenge coverage
- **Decision maker, date, and reviewed revision:** requesting user, 2026-09-23
- **Current execution state:** ledger disabled; ten attempts consumed and ten remain

### Evidence and triage

Execution count is the number of test or investigation observations. Cluster count groups repeated observations with the same apparent cause; it is not a bug count.

| Record                          | Executions | Distinct clusters | Failure classification       | State and owner                                                                | Sanitized evidence                                                                                                                                                           |
| ------------------------------- | ---------: | ----------------- | ---------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BUG-SIGNUP-002`                |          6 | 1                 | `product-bug`                | Open; product owner, recorded 2026-09-23                                       | [Bug report](SIGNUP_BUG_REPORT.md#bug-signup-002--signup-sends-an-email-exceeding-standard-length-limits-to-the-account-api), [latest report](test-report/latest/index.html) |
| Placeholder-email rejection     |          2 | 1                 | `test-data`                  | Product behaved as observed; synthetic domain unsuitable; QA owner, 2026-09-23 | [Result narrative](#stage-7-results-analyst--sgn-006)                                                                                                                        |
| Earlier diagnostic uncertainty  |          6 | Unknown           | `untriaged`                  | Consumed and retained as uncertain; QA owner, 2026-09-23; no retry             | [Execution counts](#execution-counts)                                                                                                                                        |
| Safe HTTP 201 contract evidence |          1 | N/A               | N/A (successful observation) | Reviewed; QA owner, 2026-09-23                                                 | [Result narrative](#stage-7-results-analyst--sgn-006)                                                                                                                        |
| Privacy-stopped confirmation    |          1 | 1                 | `untriaged`                  | Ledger disabled; API owner review requested, 2026-09-23; no retry authorized   | [Final confirmation](#stage-7-results-analyst--sgn-006), [security review](SIGNUP_SECURITY_REVIEW.md)                                                                        |

The six `BUG-SIGNUP-002` executions are one product-bug cluster across the browser/locale matrix. The six earlier uncertain executions have an unknown distinct-cluster count because their causes were not safely established. The account-creation rows describe the same ten lifetime attempts counted in the table above: two 422 responses, six other uncertain investigations, one safe 201 observation, and one privacy-stopped confirmation. They must not be added to the six read-only bug reproductions as though all 16 observations were account writes or unique bugs. Write-capable evidence contains no committed screenshots, videos, traces, identities, or response bodies by design.

### Stage 7 approval

- **Decision requested from:** requesting user and ledger owner
- **Decision requested:** approve this Stage 7 result and its handoff to Stage 8 metrics while keeping live writes disabled
- **Decision:** approved
- **Decision maker, date, and reviewed revision:** requesting user and ledger owner, 2026-09-23, after reviewing the Stage 7 result at revision `4d68752108ada2a0ce433d17b4651a6a68415052` and explicitly approving Stage 7. The later cleanup reconciles status, triage, and provenance without changing execution evidence, scope, or authorization.
- **Conditions:** no additional QA write is authorized; the local ledger remains disabled with ten attempts consumed and ten unused; Stage 8 must distinguish executions, failure clusters, and unique bugs and must state its denominator

### Final skeptical review

- **Reviewer, date, and revision:** distinct skeptical review agent, 2026-09-23, revision `4dc4dd8`
- **Findings:** no blocker. Two major process gaps required a Stage 7 triage/evidence table and an explicit new-decision boundary in agent guidance. Two minor gaps required current README status/next steps and exact approval/review provenance.
- **Disposition and recheck:** the four initial findings were corrected in `abe140c`. On recheck of that exact revision, the reviewer confirmed the safety guidance, README, counts, and evidence links, then identified incorrect approval provenance and a noncanonical cluster/classification table. Both were corrected in the following record-only revision. The changes are editorial and process controls; they do not change run evidence, approved scope, the disabled ledger, or the Stage 7 human decision. No blocker or unsafe live-write authorization remains.
- **Unverified assumptions:** the reviewer did not rerun browser suites or inspect sensitive ledger identity values; it relied on the committed sanitized report, prior recorded checks, and aggregate ledger state.
