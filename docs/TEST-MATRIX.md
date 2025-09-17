# Test Matrix: Business Flows ↔ API ↔ Tests ↔ NFRs

This matrix maps user/business workflows to concrete API endpoints, the specs that validate them, and relevant NFRs/edge cases. Keep it pragmatic and evolving.

## Legend

[Docs Index](README.md) • [Learn Hub](../learn/INDEX.md)

## 1) Onboarding: Register → Login → Profile → AI call
- Endpoints:
  - POST /register
  - POST /login
  - GET /user/profile
  - POST /v1/ai/complete
- Tests:
  - `tests/auth/authentication.spec.ts` (@security, @smoke)
  - `tests/api/ai.spec.ts` (AI with key + JWT)
- Projects/Tags: api-tests, smoke
- NFRs: LAT: auth < 300ms p95; AI < 1200ms p95; ERR < 1%
- Edge cases: invalid email/weak password; malformed login; missing token; long prompts
- Status: ✅

## 2) Admin workflows: list users → assign role → maintenance/backup
- Endpoints (via users adapter & admin):
  - GET /users, GET /roles, POST /users/{id}/assign-role
  - GET /v1/admin/system/status
  - POST /v1/admin/system/maintenance
  - GET/PUT /v1/admin/system/config
  - POST /v1/admin/system/backup, GET /v1/admin/system/backups
- Tests:
  - `tests/admin/system-admin.spec.ts` (@contract)
- Projects/Tags: api-tests, contract
- NFRs: AVA > 99.5%, ERR < 1%
- Edge cases: insufficient permissions, invalid config payloads
- Status: ✅

## 3) AI flows: completion → batch → job status → adapter details
- Endpoints:
  - POST /v1/ai/complete, GET /v1/ai/models, GET /v1/ai/models/{model}/status, POST /v1/ai/models/{model}/configure
  - POST /v1/ai/batch, GET /v1/ai/jobs/{jobId}
  - Proxy: /v1/adapter-a/*, /v1/adapter-b/*
- Tests:
  - `tests/api/ai.spec.ts`, `tests/adapters/adapter-a.spec.ts`, `tests/adapters/adapter-b.spec.ts`, `tests/integration/integration.spec.ts`, `tests/integration/gateway-exposure.spec.ts` (@swagger on swagger-proxy only)
- Projects/Tags: api-tests (grepInvert @swagger), contract (subset), integrations
- NFRs: LAT < 1200ms p95; THR steady baseline 50 RPS; ERR < 1%
- Edge cases: unreachable adapters; rate limits; invalid configs; long prompts; concurrent requests
- Status: ✅

## 4) Workflow engine: create → execute → approve/reject → status
- Endpoints:
  - /v1/workflows/ (GET, POST)
  - /v1/workflows/{id} (GET, PUT)
  - /v1/workflows/{id}/execute (POST)
  - /v1/workflows/{id}/status (GET)
  - /v1/workflows/{id}/approve|reject (POST)
- Tests:
  - `tests/workflows/workflow-management.spec.ts`
- Projects/Tags: api-tests, contract (subset)
- NFRs: LAT < 500ms p95; ERR < 1%
- Edge cases: invalid definitions; wrong state transitions; permissions
- Status: ✅

## 5) Notifications: CRUD + broadcast
- Endpoints:
  - /v1/notifications/ (GET, POST)
  - /v1/notifications/{id} (GET, PUT, DELETE)
  - /v1/notifications/{id}/read|unread (PUT)
  - /v1/notifications/broadcast (POST)
- Tests:
  - `tests/notifications/notifications.spec.ts` (suite configured serial)
- Projects/Tags: notifications-single, contract
- NFRs: LAT < 500ms p95; ERR < 1%
- Edge cases: invalid payloads, pagination, filtering
- Status: ✅

## 6) Analytics & Monitoring: usage, perf, errors, custom events
- Endpoints:
  - /v1/analytics/usage (GET)
  - /v1/analytics/performance (GET)
  - /v1/analytics/errors (GET)
  - /v1/analytics/events (POST), /v1/analytics/events/batch (POST)
- Tests:
  - `tests/analytics/analytics-monitoring.spec.ts` (@contract)
- Projects/Tags: api-tests, contract
- NFRs: query LAT < 1s p95; ERR < 1%
- Edge cases: invalid time ranges; bad group_by/limit params
- Status: ✅

## 7) Audit logs
- Endpoints:
  - /v1/audit/logs (GET, filtered)
  - /v1/audit/logs/{id} (GET)
  - /v1/audit/logs (POST)
- Tests:
  - `tests/audit/audit-logs.spec.ts` (@contract)
- Projects/Tags: api-tests, contract
- NFRs: LAT < 800ms p95; ERR < 1%
- Edge cases: filtering params; malformed payloads
- Status: ✅

## 8) System health
- Endpoints:
  - /healthz, /metrics
- Tests:
  - `tests/api/ai.spec.ts` (healthz basic), `tests/admin/system-admin.spec.ts`
  - k6 smoke/baseline/stress/soak
- Projects/Tags: api-tests, smoke
- NFRs: AVA > 99.5%; LAT < 300ms p95
- Edge cases: spikes; degraded adapter
- Status: ✅

---

## NFR coverage via k6
- Smoke: quick regressions, thresholds for ERR/LAT
- Baseline: constant VUs; p95 under targets
- Stress: ramping; observe breakpoints and error ramps
- Soak: 30m stability; look for leaks

Artifacts: k6 outputs (use Docker flag --out json to persist), plus Playwright JSON summaries in `test-results/`.
