# QA Beginners Guide (Hands-on)

[Back to Learn Hub](../INDEX.md) • [View Learning Path](../LEARNING-PATH.md)

This is a practical, zero-to-one path for manual QAs entering automation.

## 1) Setup & Orientation
- Install Node.js LTS and Docker.
- Clone repo; run `docker compose up -d --build`.
- Verify: http://localhost:8080/ui and http://localhost:8080/demo.

## 2) First API checks (manual)
- Register via curl or Postman; login; call `/v1/ai/complete` with `x-api-key` or JWT.
- Observe status codes and JSON shape; try an invalid payload.

## 3) First automated API test
- Open `tests/api/ai.spec.ts` and run `npx playwright test --project=api-tests -g "ai complete with api key"`.
- Read the fixture usage in `tests/fixtures`.

## 4) First UI test
- Read `tests/ui/demo.spec.ts` (look for expect.poll, inline preview fallback).
- Run `npx playwright test --project=ui-demo -g "Demo UI e2e"`.

## 5) Selectors & Waiting
- Read [UI Selectors & Best Practices](../../docs/SELECTORS-AND-BEST-PRACTICES.md).
- Replace a brittle selector with `getByTestId` or `getByRole`.

## 6) Add a small test
- Copy `tests/ui/tools-ui.spec.ts` and tweak it to assert a second AI call.
- Keep it independent; seed JWT via API.

## 7) Debugging & CI
- Trigger a failure, inspect trace HTML.
- Open GitHub Actions (if configured) and map the reporter outputs.

## 8) Performance peek
- Open `tests/perf/k6-smoke.js`; run a tiny local smoke (optional).

## Mindset
- Start simple; make tests stable first.
- Prefer durable assertions (state/content) over toasts/network idles.
- Learn by doing: iterate quickly with focused test runs.
Previous: [Playwright for Manual QA](PLAYWRIGHT-FOR-MANUAL-QA.md) | Next: [Glossary](GLOSSARY.md)
