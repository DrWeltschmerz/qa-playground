# Tests: conventions & structure

- Folders map to domains: auth, api, workflows, analytics, notifications, audit, admin, adapters, integration, perf
- Fixtures live in `tests/fixtures`; generators & clients in `tests/utils`
- Tags:
  - `@swagger` — swagger-only specs (excluded by default)
  - `@smoke` — fast happy-path checks
  - `@security` — auth/permission and negative coverage
  - `@contract` — shape/contract checks
- Reporters: list, HTML, JUnit, JSON (see playwright.config.ts)
- Traces/screenshots/videos retained on failure

Quick runs
- All API tests: `npx playwright test --project=api-tests`
- UI demo project: `npx playwright test --project=ui-demo`
- Increase concurrency locally: `npx playwright test --workers=10`

Tag-based projects
- Smoke slice: `npx playwright test --project=smoke`
- Contract checks: `npx playwright test --project=contract`

Replicate CI locally (brings up stack, runs k6 smoke + UI/API, collects artifacts):
- `bash scripts/ci-local.sh`

How to:
- Use api-fixtures for tokens and headered request contexts
- Prefer API clients (`tests/utils/api-clients.ts`) over raw requests in complex specs
- Keep tests independent; generate data per test

Parallel runs:
- We default to parallel. Notifications run in a dedicated serial project to avoid ordering issues.
- Use `--workers=N` locally to speed up (e.g., `--workers=10`).

See also
- Learn: `learn/PLAYWRIGHT-101.md`, `learn/FIXTURES-PATTERNS.md`, `learn/API-TESTING-GUIDE.md`
- Debugging: `learn/DEBUGGING-AND-CI.md` (traces, artifacts, CI flow)
