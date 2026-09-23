# Signup accessibility baseline

**Observed:** 2026-09-23 on `https://app.qa.nesto.ca/signup` and `/fr/signup`.

SGN-009 ran axe-core against WCAG 2 A, 2 AA, 2.1 A, and 2.1 AA rules after loading the deployed signup page. It covered Chromium, Firefox, and WebKit in `en-CA` and `fr-CA`.

| Browser engine | English violation rules | French violation rules |
| -------------- | ----------------------: | ---------------------: |
| Chromium       |                       0 |                      0 |
| Firefox        |                       0 |                      0 |
| WebKit         |                       0 |                      0 |

No automated violation rule was reported, so there are no affected targets or severities to list for this run. Each run attaches a machine-readable list containing rule ID, impact, help text, and affected selector targets when violations exist.

This is a candidate no-regression baseline pending human approval. It covers rules detectable by axe-core on the initial page state. It does not replace keyboard, screen-reader, zoom, contrast under every state, error-message announcement, or readability review. SGN-001 separately confirms that all visible controls have accessible names, and SGN-017 checks keyboard-operable consent state changes.
