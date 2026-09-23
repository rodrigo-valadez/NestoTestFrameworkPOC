# Signup static security review

**Reviewed:** 2026-09-23. **Scope:** this Playwright repository, its dependency lock, and the browser-visible signup implementation already recorded in the UI analysis. Application and service source code were not available.

## Checks and results

| Check                           | Result                                                                                                                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locked dependency advisory scan | `pnpm audit --audit-level high` reported no known vulnerabilities.                                                                                                                                                                          |
| Repository secret patterns      | No private-key header, API-key name, or client-secret name was found outside generated and dependency directories. Password references were expected labels, documentation, test-case kinds, and in-memory generation code.                 |
| Dynamic code execution          | No `eval` or `new Function` use was found. The test runner uses `spawnSync` with `shell: false` and a fixed Playwright CLI path.                                                                                                            |
| Environment isolation           | Production selection throws before configuration or test execution. Live account creation requires staging, an explicit capability environment variable, one approved project, serial execution, no retry, and an executable capped ledger. |
| Secret-bearing artifacts        | Account-creation runs disable screenshots, video, traces, HTML reporting, and browser diagnostics. The response observer rejects secret-shaped keys and does not inspect or persist the token value.                                        |
| Request safety                  | Read-only negative cases intercept and abort unexpected account-creation requests. The overlong-email finding was reproduced without sending any of its six attempted writes.                                                               |
| Browser-visible controls        | Password fields use `type=password` but expose `autocomplete=off`; visible controls did not expose HTML `required` or `maxlength` constraints during Stage 3 inspection. These are review concerns, not standalone vulnerability claims.    |

## Findings and limits

No high-severity repository or dependency issue was found in this bounded review. The populated sensitive-shaped optional account response field remains intentionally unidentified because the privacy guard did not retain its name or value. It needs secure review by the API owner before the response allowlist changes.

No SQL injection, cross-site scripting, authentication bypass, rate-limit, account-enumeration, or other active security payload was sent. Those checks require service-owner authorization, a defined endpoint contract, monitoring, and cleanup. Application source analysis, infrastructure configuration, session-cookie flags, token claims, and server-side validation are outside the evidence available to this repository.

An OWASP ZAP baseline runner is now present but disabled. It is excluded from default tests and CI, requires an explicit enable flag and allowlisted QA target, and has not been executed. See [Security automation](SECURITY_AUTOMATION.md).
