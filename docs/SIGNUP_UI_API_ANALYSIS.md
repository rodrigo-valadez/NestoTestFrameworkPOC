# Signup deployed UI and API analysis

**Stage:** 3 — UI/API analysis. **Status:** approved for Stage 4, 2026-09-22. Stage 2 and a maximum of two potentially account-creating QA submissions were approved by the requesting user. No form was submitted during this analysis, so the approved attempt budget remains unused.

## Evidence and limits

The agent inspected `https://app.qa.nesto.ca/signup` and `/fr/signup` in the deployed QA environment on 2026-09-22 using the browser accessibility tree and read-only DOM evaluation. This records current deployed behavior at that time. It does not establish future behavior, server-side validation, or the account-creation response because no submission occurred.

## Observed controls

Both locales exposed the same user-facing control set:

- First and last name
- Phone country and phone number
- Province of purchase
- Email
- Password and password confirmation
- Partner-contact consent checkbox; its requiredness was not established by read-only inspection
- Create-account submit button
- Language switch, login, terms, and privacy links

The English route had no province selected in the accessibility snapshot. The French route exposed Alberta as selected during inspection; Stage 4 should determine whether this is persisted browser state, geolocation/default behavior, or a locale-specific difference before asserting it.

## Read-only DOM contract

The deployed controls exposed the names `firstName`, `lastName`, `phoneCountry`, `phone`, `email`, `password`, `passwordConfirmation`, and `leadDistributeConsentAgreement`. The province control had no HTML `name` attribute in the observed DOM. The form reported a GET action to the current signup URL, which does not reveal the account-creation endpoint or transport. The actual API endpoint and payload remain unverified until a bounded submission observes the browser response.

The email input used `type="text"`. Password inputs used `type="password"` and `autocomplete="off"`. No inspected visible field exposed an HTML `required` or `maxlength` attribute, so validation may be implemented in JavaScript or on the server. These observations are concerns to investigate, not proof that validation is absent.

## Accessibility and language observations

- Every visible text entry control had an accessible name in the browser accessibility tree.
- The consent checkbox had a detailed accessible description in both locales.
- The French phone-country selector was announced as “Phone number country” in English.
- French password guidance contained the text “au entre 12 et 32,” which appears grammatically incorrect and should be reviewed by a French-language owner.
- Keyboard order, visible focus, automated rule violations, and severity have not yet been measured. The repository does not currently include an accessibility scanner dependency, so no automated violation report is claimed.

## Candidate selector contract for Stage 4

Prefer label and role locators for text fields, consent, submit, and language switching. The observed field IDs such as `field-2` and `field-4` appear generated and should not be primary selectors. Stable form names may be fallback candidates after uniqueness is verified. The province selector needs focused analysis because its accessible label differs from its visible text and it lacks a form name.

## Write-capable observation design

This design is **not executable yet**. The user approved bounded QA writes, but the lifecycle and artifact prerequisites below must be completed and approved before that permission can be exercised.

Before the first submission:

1. Reserve one of two approved attempt slots in `test-data/scenarios/staging/signup-account-ledger.json`, which is ignored by Git. The requesting user is the proposed ledger and account owner.
2. Generate a unique synthetic identity and password in memory; never save the password.
3. Disable screenshots, video, traces, and `BrowserDiagnostics` attachments for the write-capable run. Before enabling any diagnostic output, prove with focused tests that its redaction covers the generated secret shapes and that request/response bodies cannot reach list, HTML, console, error, or attachment output.
4. Observe the browser-triggered response without logging request or response bodies.
5. Record only status, method, endpoint path, safe returned field names, navigation outcome, and sanitized visible result.
6. Treat an ambiguous result as a consumed slot until the ledger owner reconciles account state.

At this stage, one successful English signup was the first proposed write and a second slot was held for recovery. The human owner superseded that historical cap on 2026-09-23 by approving Stage 6 for up to 20 serial SGN-006 attempts with automatic stop on the first failure or ambiguous result. Review retained account records 30 days after execution; because no cleanup exists, the review records their status and escalates the need for deletion to the environment owner.

Before execution, the human owner must approve that retention rule and an account-state reconciliation method. If no independent account lookup or login method is available, an ambiguous attempt remains permanently consumed and cannot be retried beyond the remaining budget.

## Sanitized observation record

- **Observed at:** 2026-09-22T20:14:33Z; QA EN and FR signup routes.
- **Method:** browser accessibility-tree snapshots plus read-only DOM evaluation of form and control attributes. No values were entered and no form was submitted.
- **EN roles/names:** heading “Create a nesto account”; text fields First name, Last name, Phone number, Email, Password, Confirm password; selectors Phone number country and Province of purchase; consent checkbox; button Create your account; FR language link.
- **FR roles/names:** heading “Créez un compte nesto”; text fields Prénom, Nom, Téléphone, Courriel, Mot de passe, Confirmation du mot de passe; selectors Phone number country and Province de l'achat; consent checkbox; button Créez votre compte; EN language link.
- **Sanitized attributes:** form action was the current locale signup URL with reported method GET; visible input types were text, tel, password, and checkbox; password autocomplete was off; no visible inspected control exposed an HTML `required` or `maxlength` attribute.
- **Evidence handling:** this compact record intentionally excludes full DOM, scripts, user data, credentials, and request/response content.

## Stage 3 handoff

- **Prepared by:** Codex UI/API analyst, 2026-09-22.
- **Observed:** deployed EN and FR control inventory, accessible names, DOM attributes, locale differences, and selector candidates.
- **Not observed:** submission endpoint, request shape, HTTP 201, returned fields, post-signup UI, server validation, email delivery, keyboard/focus behavior, or automated accessibility violations.
- **Key concerns:** English accessible text in the French phone-country control; questionable French password copy; unexplained French province selection; client-side constraints not expressed through inspected HTML attributes.
- **Skeptical review:** independent reviewer, 2026-09-22. The initial review identified incomplete lifecycle ownership/reconciliation, unaddressed browser diagnostics, collapsed stage boundaries, missing retained evidence, and an unsupported form-transport inference. Those findings were corrected. The reviewer rechecked content revision `84b20cef8956d493b3712fd0c7cdc585a3e36bcc`; the final minor ledger ambiguity was corrected by separating approved attempt budget from pending lifecycle approval and ownership. No blocker or major remains. The reviewer could not independently verify the live QA observations or the still-unobserved endpoint/201.
- **Recommended next step:** approve the Stage 3 findings and selector direction. Stage 4 produces selector contracts only. Stage 5 finalizes the ledger, data, retention, reconciliation, and artifact design; Stage 6 implements the test after those outputs receive their required human approvals. The existing write approval remains bounded by these prerequisites.

### Human decision

- **Decision requested from:** requesting user.
- **Decision requested:** approve these Stage 3 observations and the proposed selector direction, including the proposed requesting-user ledger ownership and 30-day retention review; request revision; or pause. Account-state reconciliation remains unresolved and must be decided in Stage 5 before execution.
- **Decision:** approved for Stage 4 selector design.
- **Decision maker, date, and reviewed revision:** requesting user, 2026-09-22, revision `201e3f5ab300213bc15df13ff94747fd8d2fe5d3`. The affirmative response followed the specific Stage 3 approval request.
- **Conditions:** selector-contract work only. Existing bounded write approval remains subject to the pending Stage 5 lifecycle and artifact controls.
