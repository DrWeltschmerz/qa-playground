Test Coverage Analysis (snapshot: 2025-09-18)

This is a concise, living pointer with a quick current-state summary. For the deep dive, see the refreshed analysis.

Highlights
- Suites: auth, api, adapters, integration, workflows, analytics, notifications, audit, admin, perf
- Tags/projects: `@smoke`, `@contract`, `@swagger`; projects include api-tests, notifications-single, exercises, ui-demo, smoke, contract
- Fixtures: role-scoped APIRequestContexts (svc/user/admin) + data factories; helpers and clients avoid hardcoded base URLs
- UI: deterministic seeding via API; localStorage injection for tokens; traces/screenshots/videos on failure

Gaps and next improvements
- Normalize negative tests to avoid multi-status assertions
- Add JSON schema checks for 1–2 critical endpoints in the contract suite
- Make notifications parallel-safe by removing cross-test shared state

Coverage deep-dive
- See: [TEST-COVERAGE-ANALYSIS-REFRESH.md](TEST-COVERAGE-ANALYSIS-REFRESH.md)