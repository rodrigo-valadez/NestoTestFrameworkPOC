# Signup metrics baseline

## Stage 8: metrics analyst — signup

- **Status:** ready for human review
- **Measurement period:** 2026-09-23 snapshot; no prior comparable period exists
- **Prepared by and date:** coordinating agent, 2026-09-23
- **Inputs reviewed:** approved [Stage 7 result](SIGNUP_RESULTS.md), [latest committed read-only report](test-report/latest/index.html), its [machine-readable summary](test-report/latest/summary.json), [bug report](SIGNUP_BUG_REPORT.md), [coverage depth](SIGNUP_COVERAGE_DEPTH.md), [test plan](SIGNUP_TEST_PLAN.md), and [roadmap definitions](TEST_ROADMAP.md#metrics-and-roi)

This baseline separates runs, test executions, account attempts, failure clusters, and bugs. It is a one-day calibration snapshot. It does not establish a weekly trend, quality target, escaped-defect rate, cost saving, or dollar return on investment.

## Measurement boundaries

| Unit                               | Count   | Denominator and interpretation                                                                                                                                                     |
| ---------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Committed read-only test runs      | 1       | One staging `real-app` run in the latest report. This is the only run with a committed aggregate summary; it does not contain every roadmap triage field.                          |
| Read-only test executions          | 54      | All cases in that run: 48 passed and six recorded the expected outcome for one known issue. No execution was skipped, unexpected, or flaky.                                        |
| Browser/locale projects            | 6       | Chromium, Firefox, and WebKit in `en-CA` and `fr-CA`. These are execution contexts, not six independent requirements.                                                              |
| Stable case IDs in the report      | 7       | SGN-001, SGN-002, SGN-005, SGN-009, SGN-015, SGN-016, and SGN-017. A case ID may have multiple scenarios and project executions.                                                   |
| Guarded account attempts           | 10      | Separate lifetime ledger denominator: nine bounded investigations and one ordinary confirmation. These are not included in the 54 read-only executions.                            |
| Account-attempt runner invocations | Unknown | The sanitized evidence preserves attempts and outcomes, but not enough invocation metadata to reconstruct a reliable run count.                                                    |
| Self-contained executions          | 228     | The approved Stage 7 handoff records 228 passing framework executions. They validate the framework and are excluded from deployed signup behavior and product-failure percentages. |

The latest report's six `known issue` executions are expected Playwright outcomes, not six passing product behaviors and not six bugs. They reproduce `BUG-SIGNUP-002` once in each browser/locale project and form one reviewed product-bug cluster.

## Baseline metrics

| Metric                           | Baseline                                                                                                                                                                                                                                                                           |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmed bugs caught            | **1 unique automated product-bug cluster:** `BUG-SIGNUP-002`, observed in six executions. `BUG-SIGNUP-001` is a second documented open bug found through DOM/accessibility analysis, but it was not produced as a failure cluster in the committed run and is shown separately.    |
| Known-bug recurrence             | **Not measurable yet.** Six same-run repetitions across projects are cross-browser evidence for one newly recorded bug, not recurrence across periods.                                                                                                                             |
| Actionable failure rate          | **50% (1/2 classified clusters).** Numerator: one `product-bug`. Denominator: two clusters with a completed classification, consisting of one `product-bug` and one `no-defect` placeholder-email validation cluster. This very small mixed sample is for calibration only.        |
| False-alarm rate                 | **50% (1/2 classified clusters).** The numerator is one `no-defect` cluster. Counts for `automation-bug`, `test-data`, and `environment` are zero. The label describes triage disposition; it does not mean the two rejected account attempts were unnecessary.                    |
| Untriaged clusters               | **At least 1, exact total unknown.** The privacy-stopped confirmation is one known untriaged API-contract outcome. Six earlier uncertain investigation executions may contain one or more additional clusters, but the sanitized evidence cannot support a distinct-cluster count. |
| Published-suite flake candidates | **0/54 executions (0%).** The committed summary reports zero flaky results and no retries. This does not prove long-term stability from a single run. Account attempts are excluded because diagnostic conditions changed and were not repeated on an equivalent contract.         |
| Investigation cost               | **Unavailable.** Start/end triage timestamps and human effort were not recorded, so median time to classification and total triage hours cannot be calculated.                                                                                                                     |
| Escaped defects                  | **Unavailable.** There is no agreed production-defect scope or linked production incident set, and production execution is disabled.                                                                                                                                               |
| Dollar ROI                       | **Not calculated.** Build, maintenance, execution, triage, manual-comparison, and avoided-incident costs are not measured. A failed execution is not treated as money saved.                                                                                                       |

## Coverage baseline

The coverage denominator is the ten approved first-pass goal areas in the Stage 1 brief. Mailbox receipt and active security probes were explicitly deferred, so they remain visible exclusions rather than silently lowering or inflating this denominator.

| Approved goal area                       | Mapped artifact or case                          | Executed evidence in this period | Current limit                                                                                        |
| ---------------------------------------- | ------------------------------------------------ | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Complete visible form and consent        | SGN-001, SGN-017                                 | Yes                              | Requiredness and product-approved bilingual copy remain unresolved.                                  |
| Positive account creation and safe 201   | SGN-006                                          | Yes, guarded                     | One 201 was observed; final confirmation stopped at the privacy guard. Email delivery is excluded.   |
| English/French language change           | SGN-002                                          | Yes                              | Current deployed copy is observed, not product-owner approved.                                       |
| Duplicate-account behavior               | SGN-014                                          | No                               | Requires account-state reconciliation and a new write decision.                                      |
| Empty and invalid email                  | SGN-005                                          | Yes                              | Representative browser integration coverage, not an exhaustive validation matrix.                    |
| Invalid password and confirmation        | SGN-015 and SGN-016 weak-password scenario       | Yes                              | Exhaustive policy permutations belong at unit/component level.                                       |
| File-driven boundary and invalid entries | SGN-016                                          | Yes, limited                     | Email length and weak password are covered; other field families remain recommendations.             |
| Accessibility report and severity        | SGN-009 and accessibility baseline               | Yes                              | Automated baseline is not yet approved as a no-regression quality gate; manual review is incomplete. |
| Readability                              | SGN-010                                          | No                               | No locale-aware method or threshold is approved.                                                     |
| First-pass static security review        | Signup security review and disabled ZAP scaffold | Yes                              | No active payload, application-source, infrastructure, or token analysis was performed.              |

- **Inventory mapping:** 10/10 goal areas have a named case or review artifact.
- **Executed-evidence coverage:** 8/10 goal areas have evidence in this snapshot (**80%**).
- **Fully closed acceptance coverage:** not calculated because several executed areas retain explicit contract, approval, or depth limits. Mapping or execution alone does not prove requirement acceptance.

## Missing trend data and proposed collection

The repository should collect at least several comparable read-only runs before proposing a target. Each future weekly snapshot should preserve:

1. run ID, timestamp, source revision, environment, suite, and duration;
2. execution outcome by stable case ID, project, locale, retry, and data profile;
3. reviewed failure fingerprint, distinct cluster ID, classification, owner, decision date, and issue link;
4. first-failure and classification timestamps for investigation cost;
5. requirement/risk-area mapping changes, with denominator changes explained;
6. known-bug recurrence separately from newly confirmed bugs.

Do not combine self-contained framework executions, read-only deployed checks, and write-capable account attempts into one pass rate. Do not set a zero-flake, zero-defect, accessibility, or ROI target from this single snapshot.

## Stage 8 handoff

- **What was done:** calculated a first signup metrics snapshot using the roadmap definitions; separated one committed run, 54 read-only executions, ten account attempts, reviewed clusters, and bug records; added an approved-goal coverage denominator and explicit missing data.
- **What the evidence shows:** the published run has 48 passes and six expected observations of one known bug; one automated product-bug cluster is confirmed; at least one cluster remains untriaged; eight of ten approved goal areas have executed evidence.
- **Choices and reasons:** used the ten human-approved first-pass goal areas as the coverage denominator and excluded explicitly deferred mailbox and active-probe work. Reported rates only where a numeric reviewed denominator exists. Kept framework checks and account attempts outside the deployed read-only pass-rate denominator.
- **Checks:** reconciled the report summary against its 54 case entries and six projects; reconciled the ten account attempts and triage classifications against the approved Stage 7 result; repository formatting and static checks are required before handoff.
- **Risks and open questions:** the sample is one day and one published run; the exact number of uncertain diagnostic clusters, investigation time, production escapes, and costs are unavailable. The human owner must decide whether the ten goal areas are the ongoing coverage denominator and who owns periodic triage.
- **Skeptical review:** pending distinct review of the committed draft revision.
- **Recommended next step:** approve this as the initial calibration baseline and begin collecting comparable weekly read-only snapshots; do not set thresholds until enough periods exist to show normal variation.

### Human decision

- **Decision requested from:** requesting user and QA approver
- **Decision requested:** approve this Stage 8 baseline, its ten-area coverage denominator, and the proposed comparable weekly collection fields; request revision; or pause
- **Decision:** pending
- **Decision maker, date, and reviewed revision:** pending
- **Conditions and actions authorized:** this document does not authorize another live write, production execution, an external reporting service, or enforcement of a new quality threshold
