# Signup accessibility baseline

**Observed:** 2026-09-23 on `https://app.qa.nesto.ca/signup` and `/fr/signup`.

SGN-009 ran axe-core against WCAG 2 A, 2 AA, 2.1 A, and 2.1 AA rules after loading the deployed signup page. It covered Chromium, Firefox, and WebKit in `en-CA` and `fr-CA`.

| Browser engine | English violation rules | French violation rules |
| -------------- | ----------------------: | ---------------------: |
| Chromium       |                       0 |                      0 |
| Firefox        |                       0 |                      0 |
| WebKit         |                       0 |                      0 |

No automated violation rule was reported, so there are no affected targets or severities to list for this run. Each run attaches a machine-readable list containing rule ID, impact, help text, and affected selector targets when violations exist.

## Approved automated gate

The human QA approver accepted this baseline on 2026-09-23 for **WCAG 2.1 AA** axe rules with these conditions:

- Continue reporting every axe violation and severity.
- Fail the automated gate only for a new `serious` or `critical` finding, or when a recorded finding worsens to one of those impacts.
- Store accepted pre-existing findings and explicit exceptions in [`test-data/accessibility/signup-axe-baseline.json`](../test-data/accessibility/signup-axe-baseline.json), including project, rule, target, recorded impact, disposition, nonblank reason, nonblank owner, and ISO review date. Duplicate records, malformed dates, and blank governance fields fail validation; an expired record stops suppressing the finding.
- Keep the current zero-violation result as the initial approved axe baseline. The registry therefore starts empty.
- Do not add manual accessibility checks to this gate at this time.

Lower-impact findings remain visible in the attachment and report but do not fail the test. A serious or critical finding cannot be silently added to the registry: its reason, owner, disposition, and review date must be reviewed in the repository change. A recorded finding that disappears is reported as a resolved registry entry so the obsolete exception can be removed.

This gate covers only rules detectable by axe-core on the initial page state. The documented French phone-country language defect remains open because axe does not determine whether an accessible name uses the correct language. SGN-001 separately confirms that visible controls have accessible names, and SGN-017 checks that the consent control can be toggled by keyboard; neither is represented as a broader manual accessibility audit.

## Gate verification

The refreshed [committed sanitized report](test-report/latest/index.html) records 54/54 expected outcomes from source revision `07343b3`, which contains the enforced gate and exception governance. All six SGN-009 browser/locale executions returned an empty axe violation list, so the current observed value remains **zero violation rules** and the empty registry is consistent with QA. Five focused self-contained gate checks cover new and worsened findings, accepted and report-only impacts, expired records, invalid governance, duplicate records, and severity-policy changes. A local run reported all five passing; no separate focused-run result artifact is committed.

The first report-generation attempt at the same revision had one unrelated Firefox/French SGN-005 timeout while the browser reported failed script loads; all six axe checks still passed with empty lists. The immediate complete rerun passed 54/54. This inconsistent SGN-005 result is recorded as an untriaged flake candidate rather than hidden by the successful latest report. No account write occurred in either run.
