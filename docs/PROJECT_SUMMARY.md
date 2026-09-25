# Project summary

## Goal

This proof of concept demonstrates skills across several areas of quality assurance automation:

- front-end testing;
- back-end and API contract testing;
- static application security testing concepts and dependency review;
- dynamic application security testing with OWASP ZAP;
- accessibility;
- readability;
- performance-test planning;
- fault-test planning;
- continuous improvement through metrics, triage, and reporting.

It also demonstrates how AI agents can make quality work structured, reviewable, and reusable across other product areas. The repository defines specialist stages for feature analysis, test planning, UI/API analysis, selector design, data design, implementation, results, and metrics. A human approves the transition between stages, each stage records its decisions and open questions, and an independent skeptical agent challenges gaps and unnecessary complexity.

This was a time-boxed challenge. Some questions that would normally be raised with product, engineering, security, accessibility, and environment owners were converted into explicit assumptions so the project could demonstrate implementation choices. Those assumptions are documented below rather than presented as confirmed product requirements.

## Assumptions

1. **AI use is permitted.** AI agents may help analyze the challenge, draft artifacts, implement tests, and review work. Human approval remains required for product decisions and live execution boundaries.
2. **Synthetic accounts may be created in QA, but never production.** The QA owner will handle cleanup. Production execution remains disabled.
3. **No backend cleanup endpoint is available.** The framework therefore uses a capped persistent account ledger and does not automate duplicate-account testing that depends on reconciled account state.
4. **End-to-end email delivery may be omitted.** A reliable mailbox or email-event integration may require paid tooling or service API credentials. Mailinator or an equivalent remains future work.
5. **Destructive security scanning is forbidden.** Shared QA must not receive active attack payloads, broad fuzzing, forced browsing, load, or other activity that could affect availability or data. Only bounded passive DAST was executed.
6. **The deployed QA signup pages are the behavioral source of truth where no PRD exists.** Behavior that conflicts with common standards is recorded as a question or bug candidate rather than silently accepted.
7. **The challenge’s HTTP 201 requirement is authoritative.** The browser-triggered account response was observed and compared only through a privacy-safe allowlist; secrets and raw bodies were not retained.

## What was delivered

### Front-end

- Playwright and TypeScript framework covering Chromium, Firefox, and WebKit in English and French.
- Task-oriented Page Objects and fixture-injected localization contracts.
- Ordered semantic locator fallbacks that record the successful strategy and reject ambiguity.
- Self-contained tests plus explicitly selected QA tests.
- Data-driven negative samples, consent behavior, localization, and guarded account creation.

### Back-end and API

- A browser-observed `POST /api/accounts` contract confirmed one HTTP 201 response containing submitted non-secret account information.
- Response checks fail closed on unknown or sensitive fields and do not retain tokens, passwords, identities, or raw bodies.
- A browserless read-only API health scaffold exists, but execution is blocked until an approved API origin and health path are supplied.

### SAST and dependency review

- Formatting, ESLint, and TypeScript gates.
- Locked dependency audit and repository searches for common secret names, private keys, and unsafe dynamic execution patterns.
- Guard review for production access, write-capable tests, and artifact handling.

This is limited static review of the test repository. Full application SAST requires the Nesto application source and an approved SAST tool or policy.

### DAST

- Bounded OWASP ZAP 2.17.0 passive scans of the English and French signup pages.
- Exact target allowlist, immutable container digest, unauthenticated execution, GET-only published alert instances, disabled form processing, and no active scan jobs. The alert report is not a complete request history.
- Sanitized committed reports that exclude headers, cookies, bodies, page content, and raw evidence.

### Accessibility

- axe-core coverage across three browser engines and two locales.
- WCAG 2.1 AA target.
- Approved zero-violation baseline and a gate that fails only new or worsened serious/critical findings.
- Versioned exception registry with ownership, reason, disposition, and review-date validation.

Automated axe checks do not replace manual keyboard, screen-reader, zoom, visual, cognitive, or language-quality review.

### Readability

- Defined separate English and French scoring methods.
- Separated sentence-form content, labels/actions, and validation messages.
- Specified deterministic local collection, segmentation, syllable fixtures, evidence manifests, and first-run calibration.

The calculator, observed baseline, and numeric gate remain unimplemented.

### Performance and fault testing

- Risks and prerequisites were identified, but no executable tests were added.
- A credible implementation needs agreed workloads, budgets, environment ownership, monitoring, fault models, and stop conditions.

This project does not present an arbitrary response-time check or unsafe shared-environment fault injection as meaningful coverage.

### Metrics and reporting

- Sanitized Playwright and ZAP reports.
- Failure-focused local screenshots, videos, traces, diagnostics, and accessibility attachments.
- Metrics distinguish runs, executions, distinct failure clusters, and unique bugs.
- Initial coverage and triage baseline with limitations and proposed future collection fields.

## Bugs found

The detailed records and evidence are in the [signup bug report](SIGNUP_BUG_REPORT.md).

| ID                 | Summary                                                                    | Status                                                                                |
| ------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `BUG-SIGNUP-001`   | French phone-country control has an English accessible name.               | Open; product and language-owner review requested.                                    |
| `BUG-SIGNUP-002`   | Signup sends an email exceeding standard length limits to the account API. | Open; reproduced across six browser/locale projects with requests safely aborted.     |
| `BUG-SECURITY-001` | Signup pages do not return a Content Security Policy header.               | Open security finding; ZAP reported medium risk with high confidence in both locales. |

The ZAP “Modern Web Application” result is informational and is not counted as a bug.

## Reports generated

| Report                                                         | Contents                                                                                |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Latest signup staging report](test-report/latest/index.html)  | Sanitized Playwright case, project, outcome, and duration results.                      |
| [English ZAP passive report](security-report/en-CA/index.html) | Sanitized English signup passive DAST findings.                                         |
| [French ZAP passive report](security-report/fr-CA/index.html)  | Sanitized French signup passive DAST findings.                                          |
| [Accessibility baseline](SIGNUP_ACCESSIBILITY_BASELINE.md)     | Six browser/locale axe results, approved gate, and limitations.                         |
| [Stage 7 signup results](SIGNUP_RESULTS.md)                    | Live UI/API evidence, execution accounting, privacy controls, and triage.               |
| [Stage 8 metrics baseline](SIGNUP_METRICS_BASELINE.md)         | Initial execution, cluster, bug, and coverage snapshot; human approval remains pending. |
| [Static security review](SIGNUP_SECURITY_REVIEW.md)            | Dependency and repository static checks, guards, and limits.                            |
| [Readability method](SIGNUP_READABILITY_METHOD.md)             | Proposed measurement contract; no observed score yet.                                   |

Raw Playwright and ZAP reports remain local and ignored because they can contain page bodies, response headers, form data, cookies, screenshots, traces, and other sensitive material.

## Agent-driven lifecycle

The implemented repository workflow is:

1. feature description and evidence brief;
2. risk-based test plan;
3. deployed UI/API analysis;
4. selector contract;
5. test data and lifecycle design;
6. implementation and cleanup controls;
7. results, bugs, and reporting;
8. metrics and continuous-improvement baseline.

Each stage ends with a structured handoff describing evidence, decisions, alternatives, checks, unknowns, and the requested human decision. The next dependent stage waits for human approval. A distinct skeptical reviewer checks safety, gaps, unsupported claims, and unnecessary complexity. The complete contract is in the [agent test workflow](AGENT_TEST_WORKFLOW.md), [stage handoff template](STAGE_HANDOFF_TEMPLATE.md), repository-local [`feature-brief` skill](../.agents/skills/feature-brief/SKILL.md), and [agent guide](../AGENTS.md).

## Remaining work

- Obtain the approved API origin and health route, then complete read-only API smoke coverage.
- Add account cleanup or reconciliation before duplicate-account tests.
- Add a controlled mailbox or email event integration if email delivery becomes required.
- Implement readability collection and scoring, establish the first baseline, and approve thresholds.
- Add manual accessibility checks or a documented external audit process.
- Confirm whether the CSP finding is accepted, planned, or requires an exception.
- Define performance budgets and a representative environment before adding performance tests.
- Define safe fault hypotheses, observability, and recovery criteria before adding fault tests.
- Collect several comparable runs before approving trend thresholds or ROI claims.

## Closing assessment

The project demonstrates reliable UI automation, guarded live-environment testing, privacy-aware API observation, automated accessibility, passive DAST, sanitized evidence, and an agent-driven SDLC process. It also makes incomplete work visible: direct API coverage, full SAST, readability execution, manual accessibility, performance, fault testing, mailbox verification, and trend automation are not represented as finished.
