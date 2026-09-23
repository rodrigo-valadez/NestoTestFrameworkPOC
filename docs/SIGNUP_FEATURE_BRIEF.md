# Signup feature brief

**Stage:** 1 — feature analysis. **Status:** approved for Stage 2 planning, 2026-09-22. Prepared with the repo's [`feature-brief` skill](../.agents/skills/feature-brief/SKILL.md) and [agent workflow](AGENT_TEST_WORKFLOW.md). This records the human approver's test goals and current QA evidence. The earlier [Stage 2 test plan](SIGNUP_TEST_PLAN.md) now needs reconciliation.

## Sources and confidence

There is no PRD or issue. The requesting user is the human approver and identifies the intended signup user as a person seeking a mortgage. The user designates [QA signup](https://app.qa.nesto.ca/signup) as the source of truth for **current application behavior**, while asking agents to flag possible standards concerns. The user's statement that account creation returns HTTP 201 with submitted form information is the **expected contract supplied by the approver**; this agent has not observed an account-creation response.

| Source                                                                                                                                                    | What is established                                                                                                                                                                                                                                                                        | What remains unknown                                                                                                                |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| [English QA signup](https://app.qa.nesto.ca/signup) and [French QA signup](https://app.qa.nesto.ca/fr/signup), read-only browser inspection on 2026-09-21 | Both pages visibly have first name, last name, phone, province of purchase, email, password, password confirmation, partner-contact consent, account-creation control, and a language link. English guidance says passwords have 12–32 characters with uppercase, lowercase, and a number. | Requiredness, server validation, duplicate handling, consent behavior, response payload, and email delivery. No form was submitted. |
| `config/environments/staging.json`                                                                                                                        | QA UI paths are configured; API origin and health path are `null`.                                                                                                                                                                                                                         | Account-creation API route and schema.                                                                                              |
| Existing `tests/real-app/` signup cases                                                                                                                   | Read-only route/email-field and language-switch assertions are implemented.                                                                                                                                                                                                                | Whether they passed during this Stage 1 review or cover the full form.                                                              |
| Human approver's 2026-09-22 clarification                                                                                                                 | Mortgage-seeker user; expected 201 creation response with submitted information; every visible field and consent control is in scope; QA account creation and capped persistence are allowed.                                                                                              | Exact persistent-account cap, ownership, ledger, and safe response fields.                                                          |

The QA pages were viewed without entering data or submitting forms. Two observations warrant later review: the French page's phone-country selector exposes the English accessibility description “Phone number country,” and French password guidance includes “au entre.” These are concerns to triage, not confirmed defects. Current UI behavior should be recorded as observed, while potential conflicts can be compared with candidate references such as [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/) and [OWASP ASVS](https://owasp.org/projects/asvs). Their applicable levels and checks remain to be chosen.

## Human-supplied test goals

- Cover the full visible signup form and consent controls, not only email. The critical positive end-to-end case creates a QA account. Its expected account-creation response is HTTP 201 and includes submitted information; compare only safe fields and explicitly exclude password, password confirmation, tokens, and other secrets from response assertions and reports.
- Cover English/French language change, repeated email/duplicate-account behavior, empty and invalid email, invalid password, email length limits, and other invalid field entries. Agents should **discover actual UI responses** through authorized observation before fixing negative-case assertions or flagging a concern.
- Drive selected edge cases from a synthetic JSON file, with stable named cases visible as separate test results.
- Produce an accessibility report with violations and severity. After a human reviews a QA baseline, propose a gate that prevents degradation from it. Readability remains in scope but needs a later locale-aware method and threshold.
- In the first pass, perform a basic static review of potential security concerns and safe test ideas. Do **not** run SQL-injection probes or other active security tests now. This repository lacks application source, so it cannot support source-level security analysis of the application.
- Defer Mailinator or another test-mailbox integration because of budget. Email receipt verification remains a TODO; an HTTP 201 or provider “sent” event alone would not prove inbox delivery.

**Working outcome for human approval:** a mortgage seeker uses the QA signup form to create a nesto account. The user expects HTTP 201 with safe submitted fields in the response. Email inbox evidence is deferred. This is a desired outcome and human-supplied contract, not a result observed in this review.

## Narrow first slice for Stage 2 planning

1. **Form and language:** inventory every visible field and consent control in both locales; verify read-only route and language behavior and record copy/accessibility concerns.
2. **One controlled creation:** design one synthetic E2E case that checks the expected 201 response and safe echoed fields. Account creation in QA and capped persistence are authorized in principle. Before running, define a small numeric cap, unique synthetic identities, an account ledger, owner, and retention approach; no cleanup method exists.
3. **Focused negative behavior:** select empty/invalid email, password, and duplicate-email paths first. Explore actual UI responses within the approved QA lifecycle and distinguish cases that require submission from read-only validation.
4. **Small data and accessibility baseline:** use a concise JSON edge-case file; collect EN/FR accessibility violations with severity and propose a no-regression gate only after the baseline is reviewed.

Later increments: mailbox receipt, deeper readability criteria, security probes, performance, UAT, and production. This ordering narrows test planning; it does not enable write-capable tests or revise the existing Stage 2 plan by itself.

## Open decisions for the next stage

1. What numeric cap, account ledger, owner, and retention period govern persistent synthetic QA accounts? The human approver has allowed capped persistence but no cleanup method exists.
2. Which non-secret response fields may be compared to the form? Exclude password and confirmation even if they were submitted. Where is the creation route, and does QA actually return 201? If a password or token appears in the response, raise a security concern and do not retain it in reports.
3. Which fields and consent controls are mandatory, and what responses does QA show for duplicates and invalid entries? Agents must gather this evidence before asserting exact messages.
4. What severity mapping and approved baseline will govern the accessibility no-regression gate? Which locale-specific readability method follows later?
5. When affordable, which private test mailbox and retention policy will be used, and will success mean an email-service event, inbox receipt, or both?

The approver permits QA account creation and capped persistent test accounts. The repo's safety guard still requires a documented account lifecycle before an account-creating run. Active security probing and production execution remain unauthorized.

## Stage 1 handoff

- **Status:** approved for Stage 2 planning; execution decisions remain separate.
- **Prepared by and date:** Codex feature analyst using the repo-local `feature-brief` skill, 2026-09-22.
- **Inputs reviewed:** the requesting user's scope and decisions in this conversation; read-only QA EN/FR pages; repository `AGENTS.md`, `README.md`, `docs/AGENT_TEST_WORKFLOW.md`, staging configuration, existing signup tests and locale baselines, and the earlier Stage 2 draft on `docs/agentic-test-workflow` based on `c419be5`.
- **What was done:** captured the mortgage-seeker user, expected 201 contract, all-field scope, capped persistent QA account permission, deferred mailbox work, accessibility baseline goal, and first-pass security limit. Proposed a smaller Stage 2 slice.
- **What the evidence shows:** QA visibly has the fields and consent described above; the 201 response is human-supplied and unverified. Existing repo tests cover only read-only route/email and language behavior. There is no PRD, mailbox integration, or account cleanup.
- **Choices and reasons:** start with a small critical slice and discover negative UI responses before encoding them. Defer inbox integration for budget and active security probes per the user's instruction. Keep current QA observations distinct from standards expectations.
- **Checks:** read-only source and QA-page inspection; no data entry, form submission, API probe, or test run for this brief. `pnpm run check:static` passed (Prettier, ESLint, TypeScript), and `git diff --check` passed.
- **Risks and open questions:** the five decisions above, especially the account cap/ledger and safe 201 response fields.
- **Skeptical review:** separate review agent, 2026-09-22; it asked for secret response fields to be excluded explicitly and for the old Stage 2 handoff to be marked superseded. Both were corrected. It rechecked the revised brief (Git blob `76b43f3bd2dc56358daeedc7621106c851e29fa1` before this review-record update) and Stage 2 draft (`311bebe5475d4dce88045e2a3421508467f68e00`) with no remaining findings.
- **Recommended next step:** reconcile and narrow the pre-existing Stage 2 plan; do not treat it as retroactively approved.

### Human decision

- **Decision requested from:** the requesting user, acting as feature/test approver.
- **Decision requested:** approve this narrowed Stage 1 scope and QA-as-current-behavior evidence rule, or request changes. The lifecycle, response, and accessibility details above may remain Stage 2 blockers.
- **Decision:** approved for Stage 2 planning. The approver replied “It looks good” to the explicit Stage 1 approval request.
- **Decision maker, date, and reviewed revision:** requesting user, 2026-09-22; reviewed brief Git blob `870c26a99c094746d6bb06a608f892b4b1da5f5f` before this decision record was added.
- **Conditions and actions authorized:** Stage 2 plan reconciliation only. The user's earlier messages permit planning for capped persistent QA accounts; account-creating execution awaits a documented lifecycle. Active security tests, production execution, and publication remain unauthorized.
