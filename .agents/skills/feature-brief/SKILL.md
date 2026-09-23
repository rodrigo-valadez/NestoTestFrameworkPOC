---
name: feature-brief
description: Draft or revise a Stage 1 feature brief and human handoff for this test repository when given a feature description or asked to formalize feature requirements. Do not use for implementing tests or approving product behavior.
---

# Stage 1 feature brief

Read the repository `AGENTS.md`, `docs/AGENT_TEST_WORKFLOW.md`, and `docs/STAGE_HANDOFF_TEMPLATE.md`. Inspect the feature request and relevant repo evidence. Treat existing tests and UI observations as evidence of current behavior, not as approved requirements.

Create or update a feature brief in `docs/` that separates source-backed facts, proposed user outcomes, exclusions, and unresolved product questions. Trace each proposed acceptance criterion to a supplied requirement or label it **proposed**. Do not invent a PRD, owner, API contract, success state, or approval. Keep a short Stage 1 handoff using the repo template, including choices, alternatives, exact checks, and whether a live target was contacted.

Present the brief to a named human decision owner when known. Leave the gate **pending** when the owner or decision is missing. Do not promote the brief to approved requirements, retroactively approve an existing test plan, or start dependent Stage 2 work without the human decision. Existing drafts may be referenced as downstream material awaiting reconciliation.
