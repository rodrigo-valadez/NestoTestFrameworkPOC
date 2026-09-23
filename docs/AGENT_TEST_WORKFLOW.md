# Agent workflow for feature testing

Status: repository guidance, 2026-09-21. Use this with [AGENTS.md](../AGENTS.md), the [test roadmap](TEST_ROADMAP.md), and a feature plan such as [signup](SIGNUP_TEST_PLAN.md). These are role contracts for people or coding agents; this document does not install an agent runner, execute a stage, or authorize live tests.

## Operating model

One coordinating agent maintains the feature plan and hands a bounded task to the next role. A role may be a separate agent with fresh context or the coordinator explicitly working under that role's contract. Record which role actually did the work; do not imply that a separate agent reviewed it when none did. Keep artifacts in the repo or linked issues so the process works without a particular agent product. Do not build a new orchestration framework until repeated handoffs show a concrete need.

Each stage ends with a concise [stage handoff](STAGE_HANDOFF_TEMPLATE.md). It states the evidence, choices and alternatives, work performed, validation, unresolved questions, and the next decision in plain language. The receiving role checks the handoff against current repository state and may return it when a contract is missing. Human owners approve product behavior, UAT, account lifecycle, production access, and external publication.

| Stage / role         | Inputs                                                                | Required output                                                                                                                      | Exit condition                                                                                        |
| -------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| 1. Feature analyst   | Feature description, approved requirements, current app/repo evidence | Scope, user-visible behaviors, acceptance criteria and sources, unknowns, owner decisions                                            | Proposed behavior is distinguishable from approved behavior.                                          |
| 2. Test planner      | Stage 1, roadmap taxonomy, existing coverage                          | Feature plan with stable proposed case IDs, priority, one expected outcome per case, type/purpose/environment, coverage and blockers | Existing coverage and gaps are mapped without overstating live validation.                            |
| 3. UI/API analyst    | Plan, authorized target, environment config                           | Observed routes, controls, states, locale differences, API schema/evidence, and safe interaction limits                              | Selectors and assertions can cite an observed or approved contract; unknowns remain blocked.          |
| 4. Selector designer | UI inventory, Page Objects, accessibility tree                        | Semantic locator choices; ordered named fallback candidates only where needed; ambiguity risks                                       | Unique, visible matches and fallback annotation can be verified without brittle positional selection. |
| 5. Data designer     | Cases, schemas, data policy                                           | Synthetic JSON cases, typed boundary validation, isolation and cleanup or capped-retention design                                    | No write-capable QA data work until its lifecycle is approved.                                        |
| 6. Test implementer  | Approved ready cases and prior outputs                                | Focused tests, task-oriented Page Objects and focused workflows, minimal supporting code, cleanup behavior where authorized          | Static checks and relevant self-contained tests pass; live execution follows environment guards.      |
| 7. Results analyst   | Actual run artifacts and metadata                                     | Run summary, distinct failure clusters, triage record, sanitized evidence links                                                      | Retries and skipped/blocked cases remain visible; no result is claimed without execution.             |
| 8. Metrics analyst   | Reviewed cases, run/triage ledger, approved requirement set           | Trends using roadmap denominators, uncertainty and missing data, proposed actions                                                    | Counts distinguish runs, executions, clusters, and unique bugs; no unsupported ROI claim.             |

Stages may combine when a change is small, but identify each stage in the handoff and obtain an explicit human decision covering each one. Reporting and metrics operate on actual executions, so they cannot be completed by writing a plan. A feature can stop after planning when the next stage is blocked.

## Human stage gate

After the stage output and any required skeptical review are ready, the coordinator presents the handoff to the named human decision owner. Ask for a concrete decision: **approve this stage and its stated next step**, **revise**, or **pause**. Record who decided, when, the artifact revision or link reviewed, the decision, conditions, and which next actions it covers. A clear affirmative reply to that specific decision request counts as approval; silence, elapsed time, an agent recommendation, or an ambiguous comment does not. If the decision is missing, mark the gate **pending** and do not start dependent work in the next stage. Non-dependent investigation and documentation may continue, clearly labeled as such.

Human approval is bounded. Approval of a test plan does not approve product requirements that remain open, write-capable QA, production runs, publication, or external services. Request those decisions separately from their responsible owners when the reviewed proposal is concrete. If evidence or scope materially changes after approval, summarize the change and return to the human gate before promoting the revised stage. Keep the decision record with the feature plan or linked issue so a future agent can verify it.

## Skeptical reviewer

Assign a reviewer distinct from the author or coordinating agent at two points: after the feature plan and before a change is handed off for PR review. Give the reviewer the feature request, stage artifact, relevant source files, and constraints. Ask it to challenge the work, not to rewrite it by default. Use a separate agent or human reviewer with independent context. If one is unavailable, mark the gate **pending**; self-review cannot satisfy it. The reviewer has no authority to approve product behavior or bypass safety gates.

The reviewer checks both **gaps** and **excess**:

- Are assertions grounded in an approved requirement or observed target? Are locale, browser, API, error, accessibility, cleanup, and privacy risks covered where relevant?
- Is a self-contained demo being mistaken for live coverage? Are blocked cases described as ready or executed? Do classifications match the roadmap's independent axes?
- Does a new abstraction remove demonstrated duplication or risk? Could a simpler test, Page Object method, fixture, or existing resolver suffice? Are speculative frameworks, tags, budgets, services, or helper layers being added ahead of a contract?
- Are tests isolated and deterministic? Do selectors fail on ambiguity, and do retries preserve evidence? Are write actions and production execution still guarded?
- Is the evidence proportionate: exact check results, links to source decisions, and a practical next step?

Return findings in priority order with file/line or case ID, evidence, impact, and the smallest corrective action. Use `blocker` for unsafe execution or a false coverage claim, `major` for an unmet requirement or likely unreliable test, and `minor` for maintainability or clarity. State “no findings” if warranted and list unverified assumptions separately. The coordinator either fixes each finding or records why it is not applicable; unresolved blockers stop promotion. Record the reviewer, date, findings, disposition, and revision checked in the feature handoff. The distinct reviewer checks the revision rather than assuming a response resolved it.

### Reusable reviewer request

> Act as the skeptical test-workflow reviewer. Review the named stage artifact against the feature request, `AGENTS.md`, `docs/TEST_ROADMAP.md`, and the current implementation. Look for missing behaviors, unsupported assumptions, false coverage claims, unsafe live actions, brittle selectors or data, and abstractions that add complexity without demonstrated need. Return prioritized, evidence-linked findings with the smallest fix. Do not edit files or approve product decisions. State what you could not verify.

## Execution boundaries

The default suite is self-contained. Existing staging checks are opt-in and read-only. The human approver permits future QA account creation with capped persistent synthetic accounts; no agent may submit signup, create accounts, mutate APIs, or add staging data before an approved lifecycle with a numeric cap, unique data, owner, ledger, and retention or cleanup policy. Production execution remains disabled. Keep real personal data, credentials, tokens, and sensitive artifacts out of commits and external services. A planned production case or UAT label is not execution authorization.

Use `src/framework/locator-resolver.ts` for genuine ordered fallback and record the winner. Use typed per-locale copy from independent baselines and keep translated strings out of Page Objects. Keep one named JSON data case visible as one test result where practical. A deterministic page transition may return a Page Object; conditional multi-page journeys belong in focused workflow classes.

## First application: signup

The signup artifacts passed their human gates through Stage 7. On 2026-09-23, the human owner revised the QA write budget to at most 20 serial SGN-006 attempts. Nine bounded investigation attempts and one ordinary guarded confirmation consumed ten lifetime slots. The confirmation reached `/getaquote`, but the response observer stopped on `sensitive-response-data`; no sensitive field name or value was retained. The local ledger is disabled with ten unused slots. The human owner approved the [sanitized Stage 7 result](SIGNUP_RESULTS.md) on 2026-09-23. Stage 8 metrics is next and remains incomplete. Do not submit another signup without a new explicit human decision; Stage 7 approval does not re-enable live writes.
