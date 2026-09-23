# Security automation

## Disabled OWASP ZAP baseline

The repository includes an opt-in OWASP ZAP baseline runner. It is disabled by default and is not part of `pnpm test`, `pnpm run check`, the staging Playwright suite, or GitHub Actions.

The baseline scan uses the [official ZAP Docker baseline command](https://www.zaproxy.org/docs/docker/baseline-scan/) and packaged `zap-baseline.py` script. It spiders the selected page and waits for passive scanning; it does not run ZAP's active attack rules. The scan still contacts the QA application and may discover linked pages, so Nesto authorization is required before enabling it.

Running the command without authorization performs no network or Docker action:

```bash
corepack pnpm run test:security:baseline
```

After Nesto explicitly approves the target and execution boundary, enable one allowlisted QA route:

```bash
ENABLE_ZAP_BASELINE=true \
SECURITY_SCAN_TARGET=https://app.qa.nesto.ca/signup \
corepack pnpm run test:security:baseline
```

The runner accepts only the English or French QA signup URL. Production and arbitrary URLs fail closed. Reports are written to the Git-ignored `security-results/` directory and must be reviewed for sensitive URLs or response data before sharing.

## Before enabling

Obtain decisions on:

1. written authorization for passive spidering;
2. permitted routes, request rate, time window, and monitoring contact;
3. whether unauthenticated discovery may follow links outside signup;
4. approved ZAP Docker image or immutable digest;
5. alert severity threshold and exception process;
6. report handling, retention, and disclosure path.

Full and API scans remain absent because they can perform active attacks. Adding either requires a separate design and human approval.
