# Signup bug report

Observed against the QA signup application on 2026-09-23. No production target was contacted.

## BUG-SIGNUP-001 — French phone-country control has an English accessible name

- **Severity:** Low
- **Status:** Open, product and language-owner review requested
- **Scope:** `/fr/signup`
- **Observed:** The visible French form exposes the phone-country selector with an English accessible name. The test uses the stable form name fallback because the French expected-copy baseline cannot truthfully supply a translated label.
- **Expected:** Controls on the French signup page should expose an approved French accessible name.
- **Impact:** A French screen-reader user encounters mixed-language control naming.

## BUG-SIGNUP-002 — Overlong email reaches the account-creation API

- **Severity:** Medium
- **Status:** Open, reproducible in the automated matrix
- **Scope:** English and French signup in Chromium, Firefox, and WebKit
- **Observed:** A 260-character local part plus `@qa.nesto.ca` passed client-side validation and attempted `POST */accounts` in all six browser/locale combinations.
- **Expected:** The UI should reject an email beyond the supported account-service limit and show accessible feedback before sending an account-creation request.
- **Safety control:** Automation intercepted and aborted all six requests. No account was created by this case.
- **Regression test:** `SGN-016/overlong-email` is marked as an expected failure. A product fix produces an unexpected pass so the issue and baseline must be reviewed.

## Investigation note — pre-hydration form submission

During bounded SGN-006 investigation, interacting before client hydration could trigger native GET submission and reset the form. The guarded workflow now waits for hydration. This remains an investigation note because it was observed under fast automation and has not been confirmed as a user-reproducible defect.

## Not reported as product bugs

- `example.com` addresses returned HTTP 422 with a placeholder-email explanation; this is treated as intentional validation.
- The final SGN-006 response contained a populated sensitive-shaped optional field. The privacy guard intentionally did not retain its name or value, so ownership review is required before classifying it as a defect.
- Axe-core reported zero WCAG A/AA violation rules in the initial-page baseline. Manual accessibility and readability review remain incomplete.
