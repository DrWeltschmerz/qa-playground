# QA Playground — API-first tests (Go + TS)

[![CI](https://github.com/DrWeltschmerz/qa-playground/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/DrWeltschmerz/qa-playground/actions/workflows/ci.yml)
[![Playwright](https://img.shields.io/badge/Playwright-1.55.0-45ba4b?logo=playwright)](https://playwright.dev)

Heads up: this repo is about the tests. The API and services are just a sandbox to practice automation.

Docs Portal: see [docs/INDEX.md](docs/INDEX.md) for quick links (UI guides, selector best practices, test plan, matrices). For a guided onboarding, use [learn/LEARNING-PATH.md](learn/LEARNING-PATH.md).
Roadmap: see [docs/ROADMAP.md](docs/ROADMAP.md) for planned improvements.

## What’s included
- API Gateway (Go + Gin) using users modules:
  - users-core + users-adapter-gorm + users-adapter-gin + jwt-auth
  - SQLite in-memory for dev/test, auto-migrated on boot
  - JWT-protected endpoints via your adapter; also x-api-key for service calls
  - /v1/ai/complete routes to mock adapters with retries/timeouts
  - /healthz and /metrics (Prometheus)
- Mock model adapters (Go + Gin): adapter-a, adapter-b
- Docker Compose to run the stack locally
- Playwright API tests with fixtures, data generators, and good structure
- k6 load tests (smoke/baseline/stress/soak) + strategy doc
- CI (GitHub Actions): bring up stack, run Playwright, publish reports

## Run locally
```zsh
# Start services
docker compose up -d --build
# Health check
curl -fsS http://localhost:8080/healthz
```

Run the CI flow locally (includes k6 smoke + Playwright UI/API):

```zsh
bash scripts/ci-local.sh
```

Register → Login → AI call:
```zsh
# Register (per container lifecycle; DB is in-memory)
curl -s -X POST http://localhost:8080/register \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.c","username":"alice","password":"pass1234"}'

# Login and capture token (requires jq)
TOKEN=$(curl -s -X POST http://localhost:8080/login \
  -H 'content-type: application/json' \
  -d '{"email":"a@b.c","password":"pass1234"}' | jq -r '.token')

echo "$TOKEN"

# AI call (JWT)
curl -s -X POST http://localhost:8080/v1/ai/complete \
  -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d '{"prompt":"Hello","model":"adapter-a"}' | jq .

# Service-to-service (API key)
curl -s -X POST http://localhost:8080/v1/ai/complete \
  -H 'x-api-key: service-secret' -H 'content-type: application/json' \
  -d '{"prompt":"Hello","model":"adapter-b"}' | jq .
```

## UIs
- Tools UI: http://localhost:8080/ui/ — see [docs/ui/TOOLS-UI.md](docs/ui/TOOLS-UI.md)
- Demo App: http://localhost:8080/demo/ — see [docs/ui/DEMO-APP.md](docs/ui/DEMO-APP.md)

Swagger & Specs:
- Swagger UI: http://localhost:8080/swagger/index.html
- Static OpenAPI specs: http://localhost:8080/specs

## Tests
- Playwright covers: auth, workflows, analytics, notifications, audit, admin, adapters, integration.
- Fixtures live in `tests/fixtures`, generators in `tests/utils`.
- HTML report: `playwright-report/index.html`. JSON summary under `test-results/`.
  
Quick runs (Playwright projects are defined in `playwright.config.ts`):
- All API tests (parallel): `npx playwright test --project=api-tests`
- Notifications (serial): `npx playwright test --project=notifications-single`
- UI Demo: `npx playwright test --project=ui-demo`
- Exercises: `npx playwright test --project=exercises`

Parallelism & projects:
- Default is fully-parallel runs. Notifications spec is isolated under a dedicated project for predictable ordering.
- Example fast runs:
  - All api-tests (parallel): `npx playwright test --project=api-tests`
  - Notifications (serial): `npx playwright test --project=notifications-single`
  - Crank up workers locally: `npx playwright test --workers=10`

## Config
- In-memory SQLite by default: `DB_DSN=:memory:`
- JWT secret: `JWT_SECRET=dev-secret`
- Service API key (optional): `SERVICE_API_KEY=service-secret`
- Adapter URLs: `ADAPTER_A_URL=http://adapter-a:8081`, `ADAPTER_B_URL=http://adapter-b:8082`

## Why this exists
- This is a QA automation playground: to show structure, fixtures, data generators, tagging, and perf checks.
- The API and any UI are props. Don’t judge the backend too harshly—it’s intentionally simple.

Docs:
- Docs Index: [docs/README.md](docs/README.md) (see also quick links: [docs/INDEX.md](docs/INDEX.md))
- UI Docs Index: [docs/ui/INDEX.md](docs/ui/INDEX.md)
- Selector & Best Practices: [docs/SELECTORS-AND-BEST-PRACTICES.md](docs/SELECTORS-AND-BEST-PRACTICES.md)
- Roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)
- Test Plan: [docs/TEST-PLAN.md](docs/TEST-PLAN.md)
- Test Matrix (flows ↔ endpoints ↔ tests ↔ NFRs): [docs/TEST-MATRIX.md](docs/TEST-MATRIX.md)
- Load Strategy: [docs/LOAD-TEST-STRATEGY.md](docs/LOAD-TEST-STRATEGY.md)


Learn path for QAs:
- Start here: [Learning Path](learn/LEARNING-PATH.md)
- Playwright 101: [learn/PLAYWRIGHT-101.md](learn/PLAYWRIGHT-101.md)
- Deep-dive API testing with Playwright: [learn/API-TESTING-GUIDE.md](learn/API-TESTING-GUIDE.md)
- QA Skills & Test Selection: [learn/QA-SKILLS-AND-TEST-SELECTION.md](learn/QA-SKILLS-AND-TEST-SELECTION.md)
- Fixtures, data, and patterns: [learn/FIXTURES-PATTERNS.md](learn/FIXTURES-PATTERNS.md)
- Debugging, traces, CI tips: [learn/DEBUGGING-AND-CI.md](learn/DEBUGGING-AND-CI.md)
- Perf & k6 basics: [learn/PERFORMANCE-K6.md](learn/PERFORMANCE-K6.md)

## Load testing
- Strategy in [docs/LOAD-TEST-STRATEGY.md](docs/LOAD-TEST-STRATEGY.md)
- k6 scripts in `tests/perf/`

## Next steps (optional enhancements)
- Request ID middleware + structured logging
- Minimal React UI + Playwright UI tests (planned under /ui)
- OpenAPI schema contract validation in tests


# UIs in this repo

This repo already includes two UIs served by the API gateway:

- Tools UI — http://localhost:8080/ui/ (API exerciser)
- Demo App — http://localhost:8080/demo/ (realistic UI for e2e tests)

Docs:
- UI Index: `docs/ui/INDEX.md`
- Tools UI: `docs/ui/TOOLS-UI.md`
- Demo App: `docs/ui/DEMO-APP.md`

See also: `docs/SELECTORS-AND-BEST-PRACTICES.md` for robust selectors and waiting patterns.

---

PS: Not everything might work, I tried to clean-up and prepare for push the local version, but it might be not perfect. After all its still WIP.