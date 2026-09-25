# Security automation

## Disabled OWASP ZAP passive baseline

The repository includes an opt-in OWASP ZAP passive scan runner. It is disabled by default and is not part of `pnpm test`, `pnpm run check`, the staging Playwright suite, or GitHub Actions.

The runner generates a [ZAP Automation Framework](https://www.zaproxy.org/docs/automate/automation-framework/) plan. It uses the traditional spider followed by passive scanning and contains no active scan job. Passive scanning does not change requests or responses, but the spider still makes ordinary discovery requests to the QA application.

## Enforced boundary

The runner fails closed unless all of these conditions are met:

- the target is exactly the English or French QA signup URL;
- the scan starts unauthenticated;
- only URLs beneath the selected signup path are in the ZAP context;
- form processing and GET/POST form submission are disabled;
- robots, sitemap, and HTML-comment discovery are disabled;
- the traditional spider is limited to depth 1, ten children, one thread, and one minute;
- passive-scan draining is limited to two minutes;
- no AJAX/client spider, active scan, API import, forced browsing, fuzzing, or authentication job exists;
- the ZAP image is supplied explicitly and pinned to an approved SHA-256 digest.

The network can still receive ordinary GET requests for the selected signup page and links or resources below that same path. This is a bounded live test, not a zero-request static check.

## Review without contacting QA

Generate and print the complete plan without starting Docker or contacting QA:

```bash
ZAP_DRY_RUN=true \
SECURITY_SCAN_TARGET=https://app.qa.nesto.ca/signup \
corepack pnpm run test:security:baseline
```

The plan is written to the Git-ignored `security-results/zap-passive-plan.yaml` with owner-only file permissions.

## Run an approved scan

Docker Desktop must be installed and running. Resolve and approve the immutable digest through the organization's trusted image process, then run one allowlisted locale at a time:

```bash
ENABLE_ZAP_BASELINE=true \
SECURITY_SCAN_TARGET=https://app.qa.nesto.ca/signup \
ZAP_DOCKER_IMAGE=ghcr.io/zaproxy/zaproxy@sha256:<approved-64-character-digest> \
corepack pnpm run test:security:baseline
```

Repeat with `https://app.qa.nesto.ca/fr/signup` only if that locale is approved for the same window. HTML and JSON reports are written to `security-results/`. Review them for sensitive URLs or response data before sharing; the directory is ignored by Git.

The runner removes prior fixed-name reports immediately before starting Docker so a failed attempt cannot leave an older report looking current. A failed run may still leave a partial current report; treat reports as complete only when the command exits successfully.

## What the result means

This scan can report passive observations such as missing response headers, cookie attributes, cache controls, content security policy findings, mixed content, or information disclosure. It does not establish that SQL injection, cross-site scripting, authorization, authentication, business-logic, or rate-limit vulnerabilities are absent.

ZAP full scans and API scans remain absent because they can perform active attacks. Adding them requires a separate design and explicit human approval.

## Latest approved demonstration

The 2026-09-24 English and French scans used ZAP 2.17.0 from image digest `sha256:781a2bdaea47324e7bab583e2263f21d257b0aee61ed51521a5be45f5f5081ef`. Each sanitized report contains one exact-target GET and two alerts: missing Content Security Policy at medium risk/high confidence, and the informational “Modern Web Application” classification.

- [English sanitized report](security-report/en-CA/index.html)
- [French sanitized report](security-report/fr-CA/index.html)

The raw reports remain ignored because ZAP's modern HTML report includes headers, cookies, and response bodies. Publish reviewed minimal reports with `ZAP_IMAGE_DIGEST=sha256:<executed-image-digest> pnpm run test:report:security`.
