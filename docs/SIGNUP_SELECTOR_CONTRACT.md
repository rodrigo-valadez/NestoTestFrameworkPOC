# Signup selector contract

**Stage:** 4 — selector design. **Status:** approved for Stage 5, 2026-09-22. This document defines locator choices only; it does not implement or run a signup test.

**Current implementation:** simplified after review. Each control now has one locator; the earlier runtime fallback resolver was removed.

## Design rules

- Prefer exact accessible labels or roles backed by typed `en-CA` and `fr-CA` copy.
- Use one locator per control. Playwright's strict locator behavior reports ambiguity.
- If a known accessibility defect prevents a semantic locator, use one documented stable attribute and keep the accessibility assertion separate.
- Do not use generated-looking IDs such as `field-2`, positional selectors, selector loops, forced clicks, fixed sleeps, or `.or()` unions.
- Keep observed copy in locale fixtures rather than embedding English or French strings in `LiveSignupPage`.

## Control contract

| Control               | Chosen locator                                                           | Decision and risk                                                                                                                       |
| --------------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Page heading          | `getByRole('heading', { name: text.heading, exact: true })`              | Confirms page identity using the locale baseline.                                                                                       |
| First name            | `getByLabel(text.firstNameLabel, { exact: true })`                       | Unique semantic label in EN and FR.                                                                                                     |
| Last name             | `getByLabel(text.lastNameLabel, { exact: true })`                        | Unique semantic label in EN and FR.                                                                                                     |
| Phone country         | `locator('select[name="phoneCountry"]')`                                 | Stable functional selector used because the French accessible name is incorrectly English; SGN-009 reports accessibility independently. |
| Phone number          | `getByLabel(text.phoneLabel, { exact: true })`                           | Unique semantic label in EN and FR.                                                                                                     |
| Province              | `getByRole('combobox', { name: text.provinceLabel, exact: true })`       | Unique in both locales. Province value is test data, not page identity.                                                                 |
| Email                 | `getByLabel(text.emailLabel, { exact: true })`                           | Unique in both locales; the deployed input type is text, so type is not used as identity.                                               |
| Password              | `getByLabel(text.passwordLabel, { exact: true })`                        | Exact matching prevents collision with confirmation. Never log its value.                                                               |
| Password confirmation | `getByLabel(text.passwordConfirmationLabel, { exact: true })`            | Unique semantic label in EN and FR. Never log its value.                                                                                |
| Partner consent       | `getByRole('checkbox', { name: text.partnerConsentLabel, exact: true })` | Uses the reviewed locale-specific accessible name.                                                                                      |
| Submit                | `getByRole('button', { name: text.submitButton, exact: true })`          | Unique semantic locator; no forced click.                                                                                               |
| Language switch       | `getByRole('link', { name: text.languageSwitchLabel, exact: true })`     | Unique in both locales; destination path is asserted separately.                                                                        |

## Verification evidence

On 2026-09-22, read-only checks against both deployed locale routes found exactly one match for the proposed semantic first name, last name, phone, province, email, password, password-confirmation, consent, submit, and language-switch controls. The phone-country selector also had one match under its currently observed English accessible name in both locales. No values were entered and no submission occurred.

The stable `select[name="phoneCountry"]` exception had exactly one visible match on both locale routes. Playwright's strict actions fail if the chosen locator later matches more than one element.

A later read-only check observed Alberta selected on both locale routes within the shared browser context. This did not reproduce the earlier EN/FR difference and does not establish a default. Selector design therefore treats province value as test data, not page identity.

## Page Object boundary

`LiveSignupPage` should expose task-level operations for opening the page, reading or entering individual visible fields, choosing province/country, setting consent, and submitting through a `submit()` action. It should not return a raw submit locator or own account-budget reservation, synthetic identity generation, response evidence, or multi-page conditional behavior. Those belong to Stage 5 data/lifecycle design and, if branching is confirmed, a focused Stage 6 signup workflow. A workflow or test can coordinate response observation around the `submit()` promise without receiving the locator.

No selector abstraction is needed: use the direct locators above and let Playwright report missing or ambiguous matches.

## Stage 4 handoff

- **Prepared by:** Codex selector designer, 2026-09-22.
- **Evidence:** deployed EN/FR accessibility and DOM inventory from Stage 3 plus read-only uniqueness counts for the proposed semantic locators.
- **Choices:** one semantic exact-match locator per control, with one stable-name exception for phone country; generated IDs, positional selection, and runtime selector loops rejected.
- **Validation:** read-only EN/FR checks found exactly one match per chosen locator. The historical two-attempt budget was untouched at this stage; it was later superseded by the 2026-09-23 Stage 6 amendment to 20 serial SGN-006 attempts.
- **Skeptical review:** independent reviewer, 2026-09-22. The original design validated ordered fallbacks. A later maintainability review removed that abstraction and retained only the direct contracts above.
- **Unresolved:** product-approved French phone-country accessible name and consent copy; province default behavior, which belongs to the data contract rather than selector identity.
- **No execution claim:** no Page Object was changed, no data was entered, and no account attempt was consumed.
- **Recommended next step:** after human approval, Stage 5 defines synthetic data, ledger ownership, retention, reconciliation, and artifact protection using this selector contract.

### Human decision

- **Decision requested from:** requesting user.
- **Decision requested:** approve this selector contract for Stage 5 data/lifecycle design, request revision, or pause.
- **Decision:** approved for Stage 5 data and lifecycle design.
- **Decision maker, date, and reviewed revision:** requesting user, 2026-09-22, after explicitly stating “I approve this Signup Selector Contract.”
- **Conditions:** design work only. No account submission or implementation is authorized until the Stage 5 lifecycle is approved and Stage 6 implements the guarded test.
