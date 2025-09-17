# Test Plan: QA Playground

[Docs Index](README.md) • [Learn Hub](../learn/INDEX.md)

This repo is a QA automation playground. The app is deliberately simple; the tests are the main course.

## What this system simulates
- Gateway with users, workflows, notifications, analytics, and AI adapters A/B
- Typical enterprise-ish flows over HTTP APIs

## Business workflows (short + informal)
- New user onboarding: register → login → view/update profile → call AI
- Admin workflows: list users → assign role → backup config → maintenance
- AI flows: prompt completion via gateway → batch → check job → adapter details
- Workflow engine: create definition → execute → approve/reject → status
- Notifications: create → mark read/unread → broadcast
- Analytics: usage/performance/errors over time; track custom events

## API design and contracts
- JWT or x-api-key for protected routes
- Stable JSON shapes with explicit fields; Swagger served at /swagger and /specs
- Adapters expose their own Swagger; gateway proxies them under /v1/adapter-*

## Test strategy (tools & patterns)
- Playwright as the primary engine (API + UI)
	- Fixtures provide role-scoped APIRequestContexts (service/user/admin), tokens, and data factories
	- Domain clients (e.g., `AiClient`, `UsersClient`) for readability and reuse
	- Tags power fast slices: `@smoke` for confidence, `@contract` for shapes, `@swagger` for doc-only
- k6 for load (smoke, baseline, stress, soak)
- Contract sanity via Swagger presence checks and shape asserts
- Integration tests through gateway to each adapter and cross-service chains
- Security checks: auth, RBAC, input validation, rate limits

## How we organize tests
- tests/auth, tests/api, tests/adapters, tests/integration, tests/workflows, tests/analytics, tests/notifications, tests/audit, tests/admin, tests/perf
- fixtures in `tests/fixtures`; clients and generators in `tests/utils`

## Playwright projects and tags
- Projects (see `playwright.config.ts`):
	- api-tests: default API suite (excludes `@swagger`)
	- notifications-single: runs the notifications suite in isolation (non-parallel)
	- exercises: training playground
	- ui-demo: UI sanity against `/ui` and `/demo`
	- smoke: tag-selected `@smoke` slice
	- contract: tag-selected `@contract` slice
- Reporters: list, HTML, JUnit, JSON; traces/screenshots/video retained on failure
- Notable config:
	- Fully parallel by default; notifications suite is configured `serial` internally to avoid shared-state races
	- Base URL comes from env (`BASE_URL`), fixtures pass it into helpers (no hardcoded host)

## Execution matrix
- Local
	- docker compose up; then `npm test` or Make targets
	- quick slices: `npm run test:smoke`, `npm run test:contract`
	- focused: `npm run test:api`, `npm run test:ui`, `npm run test:exercises`
	- Local CI replica (smoke + UI/API with artifacts): `scripts/ci-local.sh`
- CI
	- GitHub Actions builds services with Docker Compose and runs UI/API via Makefile
	- Artifacts: Playwright HTML report and JSON/JUnit in `test-results/`
	- Optional: k6 smoke stage using dockerized k6

See also: `docs/TEST-MATRIX.md` for a mapping of business flows ↔ endpoints ↔ tests ↔ NFRs.

## Risks & edges we cover
- Bad auth and malformed bodies
- Long prompts, concurrent requests, adapter downtime
- Pagination/filter params and parameter validation
- Idempotency where relevant; state cleanup via ephemeral data

## Exit criteria (for the demo)
- All Playwright tests pass locally (or slice-selection green as appropriate)
- k6 smoke meets thresholds
- Swagger endpoints serve specs (`/docs/unified`, `/specs/*`)

---

Appendix: This document fuses the previous API strategy with business flows so it’s the single source of truth for this repo.