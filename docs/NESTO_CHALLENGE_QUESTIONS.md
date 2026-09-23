# Questions for Nesto about the QA automation challenge

These questions are ordered by how much their answers would change the test design or interpretation of the results.

## Account API and expected behavior

1. Is `{ account, token }` the approved HTTP 201 response contract for `POST /api/accounts`?
2. Which submitted fields must be echoed, and which account fields are intentionally populated even though the user did not enter them?
3. Is returning a token directly from signup expected, and which response fields should never appear for privacy or security reasons?
4. What are the supported maximum lengths and normalization rules for email, name, and phone fields?
5. Should an email exceeding standard length limits be rejected in the browser, by the API with a specific 4xx response, or both? Is the current generic error expected?
6. What is the intended duplicate-email status code and user-facing response? Should the response avoid revealing that an account exists?

## Test accounts and environment lifecycle

7. Is there an approved email domain, naming convention, or account prefix for synthetic QA users?
8. Can Nesto provide an account cleanup endpoint, scheduled purge, or administrative reconciliation method?
9. Are there rate limits, anti-bot controls, or maximum parallel account creations the suite must respect?
10. Is QA data reset on a schedule, and can tests rely on any seeded users or state?
11. Can Nesto provide a controlled mailbox or email-service event source for verifying signup delivery later?

## Scope and acceptance

12. Does the requested signup flow end after the account API returns 201, after navigation to `/getaquote`, or after the user selects and begins a mortgage journey?
13. Is email delivery part of acceptance for this challenge, or should HTTP 201 be the final automated success signal?
14. Which negative cases are most valuable to Nesto: browser validation, API validation, duplicate handling, abuse prevention, or recovery behavior?
15. Which browsers and mobile viewports are required? Is Playwright WebKit sufficient for Safari coverage?
16. Should French and English run every case, or is a risk-based locale sample acceptable for account-creating cases?

## Accessibility and localization

17. Which accessibility standard and level should be enforced: WCAG 2.1 AA, WCAG 2.2 AA, or another internal standard?
18. Can Nesto provide approved English and French copy or a language owner for reviewing the current baselines?
19. Is the English accessible name on the French phone-country control a known issue?
20. Should automated axe results be a strict zero-violation gate, or should Nesto maintain an approved exception baseline?

## Security boundaries

21. Are active security tests such as injection payloads, account enumeration, rate-limit checks, or session tests authorized in QA?
22. Is there a preferred security standard or checklist, such as an internal policy or selected OWASP ASVS controls?
23. Who should securely review the populated sensitive-shaped optional field that caused the response observer to stop?

## Reporting and evaluation

24. Does Nesto expect a committed sample report, CI artifact, JUnit/JSON output, or integration with an internal test-management system?
25. Should known defects remain as expected failures that fail when unexpectedly fixed, or be excluded from the required quality gate?
26. What matters most in evaluating the challenge: breadth, reliability, maintainability, debugging evidence, execution speed, or architecture?
27. Is the repository expected to demonstrate only QA automation, or may it also describe unit and component tests that belong in the application repository?
