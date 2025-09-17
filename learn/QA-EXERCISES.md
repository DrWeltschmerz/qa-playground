# QA Exercises: API QA Playground

[Back to Learn Hub](INDEX.md) • [View Learning Path](LEARNING-PATH.md)

Use these hands-on flows to practice API testing in this repo. Each exercise lists the story, endpoints, Swagger links, hints, and acceptance criteria (AC). Base URL: http://localhost:8080

Tip: Static OpenAPI specs are served by the gateway for offline browsing:
- Gateway JSON: http://localhost:8080/specs/gateway.json
- Users JSON: http://localhost:8080/specs/users.json
- AI YAML (sample): http://localhost:8080/specs/ai.yaml

Auth heads-up:
- Service API key: add header `x-api-key: service-secret` for admin/system routes.
- Admin JWT: use login/fixture if available; otherwise call the helper route exposed in tests.

---

UI E2E extras and drills:
- Demo App reference tests: `tests/ui/demo.spec.ts` and `tests/ui/demo.extra.spec.ts`
- Tools UI tests: `tests/ui/tools-ui.spec.ts` and `tests/ui/tools-ui.more.spec.ts`
- UI guides: `docs/ui/INDEX.md` (step-by-step sections inside each guide)

Suggested UI drills (quick practice):
1. Basic auth flow: sign up/in and assert JWT in localStorage.
2. Compose and publish: compose with custom prompt, expect.poll for non-empty output, publish a notification, assert durable side-effect (e.g., `qa.notifId`).
3. Modal confirmation: approve flow open→ok→close; negative cancel case.
4. New-tab preview: assert composed text; headless fallback via `data-testid="preview-inline"`.
5. Clipboard: copy to clipboard and verify buffer.
6. Downloads: trigger CSV and validate header.
7. Drag & Drop: simulate dragover/leave; optionally drop a file.
8. Iframe postMessage: ping parent and assert `widget-out` update.
9. Resilience: prefer state waits; seed via API; capture trace on failure.
10. Visual snapshots (optional): snapshot stable sections (headers, layout).

---

## 1) System Status and Maintenance Mode
Story: As a system admin, I need to check system status and toggle maintenance.

Endpoints:
- GET /admin/status
- POST /admin/maintenance { enabled: boolean }

Swagger:
- /admin/status — see 200 schema: routes.AdminSystemStatusResponse
- /admin/maintenance — request: routes.AdminMaintenanceRequest, response: routes.AdminUpdateResponse

Hints:
- Assert shape using JSON path (status, uptimeSeconds, maintenance.enabled)
- Negative: missing/invalid API key should 401

AC:
- Toggling maintenance returns 200 and reflects in subsequent GET /admin/status
- Unauthorized requests return 401 with error JSON

---

## 2) Update and Fetch System Config
Story: As an admin, I can update allowed origins and feature flags.

Endpoints:
- GET /admin/config
- PUT /admin/config { security: { allowedOrigins: [] }, features: { ... } }

Swagger:
- routes.AdminSystemConfig (response)
- routes.AdminUpdateResponse (after update)

Hints:
- Create a new unique origin and verify it persists
- Validate type errors when sending wrong shapes

AC:
- Config is fetched, updated, and GET shows the update
- Invalid payload returns 400 with details

---

## 3) Backup Lifecycle
Story: As an admin, I create a backup and check its status.

Endpoints:
- POST /admin/backups
- GET /admin/backups
- GET /admin/backups/{id}

Swagger:
- routes.BackupEntry, routes.BackupListResponse

Hints:
- Capture the created backup id and poll until status is completed
- Ensure list contains the new entry

AC:
- Created backup is visible in list and status transitions to completed

---

## 4) Analytics: Usage, Performance, Errors
Story: As a product analyst, I inspect usage metrics and validate inputs.

Endpoints:
- GET /analytics/usage?from=...&to=...
- GET /analytics/performance?window=1h
- GET /analytics/errors?service=api

Swagger:
- Check 200 schema examples

Hints:
- Use a narrow time range; test invalid ranges (from>to)
- Validate required query params; assert 400 on bad input

AC:
- Happy path returns arrays with expected fields; invalid inputs return 400

---

## 5) Notifications CRUD + Status
Story: As a support agent, I manage notifications and check delivery.

Endpoints:
- POST /notifications
- GET /notifications/{id}
- GET /notifications/{id}/status

Swagger:
- See typed response examples in notifications routes

Hints:
- Generate unique subject/body; status may be async—poll once or twice
- Negative: GET unknown id returns 404

AC:
- Created notification can be fetched and has a valid status path

---

## 6) Workflows: Submit → Approve/Reject
Story: As an operator, I submit a workflow and make a decision.

Endpoints:
- POST /workflows
- POST /workflows/{id}/approve or /reject
- GET /workflows/{id}

Swagger:
- Workflow schemas in docs; states: submitted → approved/rejected

Hints:
- IDs are unique and safe for parallel runs
- Assert final state and decision metadata

AC:
- Approving or rejecting reflects in the GET response deterministically

---

## 7) Audit Logs: Filters
Story: As an auditor, I search logs by actor and action.

Endpoints:
- GET /audit/logs?actor=admin&action=backup.create

Swagger:
- Audit routes describe filters and examples

Hints:
- Trigger an action first (e.g., create backup) then filter for it
- Validate pagination defaults if present

AC:
- Matching log entries are returned with expected fields

---

## 8) AI: List Models and Metrics
Story: As an AI platform user, I list available models and check metrics.

Endpoints:
- GET /ai/models
- GET /ai/metrics

Swagger:
- routes.AiModelsResponse, routes.AiMetricsResponse

Hints:
- Validate model ids and availability flags
- Confirm metrics include totalRequests and errorRate fields

AC:
- Responses match typed schemas and contain sane values

---

## 9) AI: Batch Completion + Job Status
Story: As a user, I submit a batch for completion and poll job status.

Endpoints:
- POST /ai/batch { inputs: [...] }
- GET /ai/jobs/{id}

Swagger:
- routes.AiBatchRequest, routes.AiBatchAccepted, routes.AiJobStatusResponse

Hints:
- Submit 3 short inputs; poll until status is completed
- Negative: empty inputs should 400

AC:
- Job transitions to completed with outputs for each input

---

## 10) Users Service: Register → Login
Story: As a user, I register, then login and access a protected route.

Endpoints:
- POST /users/register
- POST /users/login
- GET /users/me (with JWT)

Swagger:
- See users.json; fields: id/email/token

Hints:
- Use realistic email generator; assert token presence and format
- Negative: duplicate registration returns 409 or 400 depending on checks

AC:
- Login returns JWT; /users/me returns the created user

---

## 11) Chaos: Adapter Downtime
Story: As an SRE, I validate resilience when an adapter is down.

Setup:
- Stop adapter-a container (or toggle failure mode if available)

Endpoint:
- Any gateway route that proxies adapter-a

Hints:
- Expect 502/504 with JSON error; gateway should not crash
- Restore and assert recovery

AC:
- Clear error semantics during outage; normal behavior after restore

---

## 12) Perf Flow: Happy-path Business Scenario
Story: As a perf engineer, I model a user journey.

Flow:
- Register → Login → AI completion → Analytics usage read

Hints:
- Start from k6-baseline.js and add a scenario
- Add checks and thresholds on end-to-end p95

AC:
- Scenario runs green locally; thresholds aren’t violated

---

Appendix: Testing Tips
- Prefer idempotent tests; clean up only when needed
- Use fixtures for tokens and base URL
- Validate not just status codes but also response shapes
- Cross-check swagger definitions at /specs/gateway.json and /specs/users.json

---

## Upcoming Exercises (from Roadmap)
These will be added as the features land:

- Visual Regression Basics
	- Task: Capture a snapshot for the Demo header and tune the diff threshold.
	- Goal: Understand stable regions, rebaseline discipline, and flake reduction.

- Contract Validation with OpenAPI
	- Task: Add schema assertions to an API test; break the contract and observe the failure.
	- Goal: Guard against drift and tighten test oracles.

- Chaos: Latency & Downtime
	- Task: Introduce adapter latency or a temporary stop; verify client timeouts/retries.
	- Goal: Validate resilience paths and error semantics.

- SQL Playground
	- Task: Solve SELECT/JOIN/GROUP BY queries on a seeded SQLite DB and verify via a thin API.
	- Goal: Practice data validation and query reasoning tied to API tests.

- CI/CD Triage Drill
	- Task: Run `scripts/ci-local.sh`, intentionally fail a test, collect artifacts, and file a brief RCA.
	- Goal: Build habits for quick failure isolation and reporting.

Previous: [QA Skills & Test Selection](QA-SKILLS-AND-TEST-SELECTION.md) | Next: [Learn Hub](INDEX.md)
