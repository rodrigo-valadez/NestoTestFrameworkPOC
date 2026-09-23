# Test framework roadmap

This is the living plan for coverage, reporting, failure triage, and measurement. Update a row only when its acceptance criteria are met; a proposed tag or tool is not an implemented feature. Last reviewed: 2026-09-21.

For each roadmap item, record an owner and target date in the implementing issue or PR once assigned; none is assumed here. Review this document when a milestone PR merges and during the weekly failure-triage review. Change its state only with an evidence link (merged PR, passing check, or approved decision), and keep unresolved dependencies visible.

## Current baseline

- Playwright/TypeScript framework tests run locally and in the PR quality gate across Chromium, Firefox, and WebKit in `en-CA` and `fr-CA`. Edge is available as an opt-in project.
- Staging (`https://app.qa.nesto.ca`) has opt-in, read-only signup coverage across the visible form, language switching, selected negative validation, consent, and accessibility. The default suite does not contact it.
- Production execution is disabled. The staging API health route remains unknown. A separately gated account-creation project exists, but its local ledger is disabled after ten consumed attempts and requires a new explicit human decision before any further write.
- Playwright currently produces a terminal list, HTML report, failure-only screenshots/videos/traces, redacted browser diagnostics, and one sanitized committed latest-report summary. CI retains uploaded artifacts for 14 days. A manual one-day signup metrics baseline exists; automated cross-run clustering, weekly trends, and ROI tracking are **not** implemented.

## Coverage taxonomy

Use independent dimensions rather than one long list of interchangeable tags. Tag spelling and selection commands are **proposed**, not yet wired into Playwright.

| Dimension         | Proposed values                                            | Meaning                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Test type         | `ui`, `api`, `accessibility`, `readability`, `performance` | What is measured. A case may have more than one type only when it genuinely makes both assertions.                                                              |
| Purpose           | `smoke`, `regression`, `uat`                               | Why it is run. `uat` needs business-approved acceptance criteria; it is not a synonym for all UI checks.                                                        |
| Environment       | `self-contained`, `staging`, `production`                  | Where it runs. Environment comes from the run configuration, not a test title alone. A `production` classification does **not** authorize production execution. |
| Execution context | browser, locale, data profile                              | Captured as structured run metadata rather than hand-maintained tags.                                                                                           |

Every future case should also have a stable case ID, owner/feature area, expected outcome, data profile, and links to its requirement or bug where available. Decide the tag syntax and CI selection rules in a separate implementation PR; do not rename existing tests merely to simulate coverage.

## Roadmap

| Priority | State             | Deliverable                                          | Exit criteria / dependency                                                                                                                                                                                                            |
| -------- | ----------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0        | In place          | Self-contained framework and opt-in QA signup checks | Existing commands and safety boundaries documented in `README.md`.                                                                                                                                                                    |
| 1        | Next              | Case inventory and tag contract                      | Stable IDs and definitions for the dimensions above; initial signup cases mapped to requirements, with exclusions and ownership recorded.                                                                                             |
| 2        | Next              | Machine-readable reporting                           | Add a Playwright JSON or JUnit artifact alongside the existing HTML report; preserve run ID, commit, environment, case ID, browser, locale, retry, duration, and artifact links. Validate the schema in CI.                           |
| 3        | Next              | Failure triage workflow                              | Each distinct failure has an owner, classification, evidence, decision date, and optional issue link. Unknowns remain visible; retries do not silently erase failures.                                                                |
| 4        | Next              | Metrics baseline                                     | Publish weekly counts and trends using the definitions below, with a stated denominator and untriaged count. Calibrate before setting targets.                                                                                        |
| 5        | Evaluate          | Reporting/TestOps platform                           | Trial with real anonymized runs and a documented privacy, maintenance, integration, and cost comparison before adopting a hosted or self-hosted service.                                                                              |
| 6        | After contracts   | More QA coverage                                     | Confirm API endpoint; approve test-account lifecycle and cleanup before write-capable journeys; approve bilingual copy; then add API, accessibility, readability, performance, and broader regression cases with appropriate budgets. |
| 7        | Approval required | Production strategy                                  | Define permitted read-only checks, rate limits, data policy, owner, rollback/incident response, and explicit authorization. Until then production remains disabled.                                                                   |

## Failure triage

Classify a **distinct failure cluster**, not every browser/locale repetition, as one of:

- `product-bug`: confirmed application defect; link the issue and mark new versus known.
- `automation-bug`: test, selector, assertion, or framework defect.
- `test-data`: invalid, missing, expired, or contaminated fixture/data.
- `environment`: deployment, service, network, or infrastructure issue.
- `expected-change`: intentional behavior/copy change requiring baseline approval.
- `no-defect`: investigation found no actionable defect; record why.
- `untriaged`: default until a person investigates; never silently count it as a product bug or false positive.

Minimum record: run ID and timestamp, commit/branch, environment, stable case ID, browser/locale, first-failing step, retry history, sanitized artifact links, classification, triage owner/date, and linked issue/decision. Group repetitions by a reviewed fingerprint; do not assume identical error text always has the same root cause. Reopen a cluster when new evidence contradicts its classification. Keep secrets and personal data out of reports and external platforms.

## Metrics and ROI

Keep **runs**, **test executions**, **distinct failure clusters**, and **unique bugs** separate. A single bug can fail several tests across browsers and locales.

| Metric                  | Initial definition                                                                                                                                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Confirmed bugs caught   | Count unique, new `product-bug` issue IDs first detected by these tests during the period; also show known-bug recurrences separately.                                                                                        |
| Actionable failure rate | Triaged clusters classified `product-bug` / all triaged clusters. Show untriaged clusters alongside it.                                                                                                                       |
| False-alarm rate        | Triaged clusters classified `automation-bug`, `test-data`, `environment`, or `no-defect` / all triaged clusters. Break down the categories; do not hide infrastructure problems in one percentage.                            |
| Flake candidate rate    | Cases with inconsistent outcomes on the same commit and environment (including retry-pass candidates) / executed cases. Human triage confirms whether the cause is test flakiness, product nondeterminism, or infrastructure. |
| Investigation cost      | Median time from first failure to classification, plus total triage hours per period.                                                                                                                                         |
| Coverage trend          | Approved requirements or risk areas with at least one mapped case / approved in-scope requirements or risk areas. A test count alone is not coverage.                                                                         |
| Escaped defects         | Production bugs in an agreed scope that existing tests could reasonably have caught, reviewed after the fact; do not assume all production bugs were preventable.                                                             |

Start with counts and trends, not a claimed dollar ROI. A later estimate can compare measured manual effort and avoided incident cost with automation build, execution, maintenance, platform, and triage costs. Publish the assumptions and ranges; do not treat a failed execution as a saved bug.

## Platform decision

Start with Playwright's existing HTML report and an exportable JSON/JUnit artifact. Keep classification and issue links in a small reviewable ledger or issue workflow until volume justifies a service. Candidates to evaluate:

- [Allure Report](https://allurereport.org/docs/v3/): open-source report rendering and a [Playwright integration](https://allurereport.org/docs/playwright/); not the same product as paid Allure TestOps.
- [ReportPortal](https://github.com/reportportal/reportportal): open-source, self-hosted reporting and [failure classification](https://reportportal.io/docs/work-with-reports/InvestigationOfFailure/); adds operational overhead.
- [Kiwi TCMS](https://kiwitcms.org/): open-source test-case and manual-test management, if planning/execution management becomes the primary need.
- [Allure TestOps](https://allurereport.org/docs/v3/): commercial option for a later comparison; do not assume an open-source license.

Evaluate data residency, access control, artifact redaction/retention, stable IDs, CI/issue-tracker integration, exportability, administration effort, and total cost. Do not send QA logs or recordings to a third party without approval.

## Open decisions

1. Who approves requirements, translated copy, UAT outcomes, triage decisions, and metric definitions?
2. What are the staging API origin and health route?
3. What accounts, synthetic data, cleanup, and consent are permitted for write-capable QA tests?
4. Which issues system should hold confirmed bugs, and who owns the weekly review?
5. Is any production test permitted? Current answer is **no** until explicitly changed.
