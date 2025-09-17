# Coverage Analysis (Refreshed)

This maps verified paths to the workflows and highlights edges and assumptions.

## Requirements → Tests
- Onboarding (register/login/profile): tests/auth/*, integration/*
- AI completion and adapters: tests/api/*, tests/adapters/*, tests/integration/*
- Workflows CRUD+execute+approve: tests/workflows/*
- Notifications CRUD/broadcast: tests/notifications/*
- Analytics usage/perf/errors: tests/analytics/*
- Audit logs: tests/audit/*, UI sanity in `tests/ui/tools-ui.audit.spec.ts`
- Admin system: tests/admin/*
 - UI: Demo App E2E `tests/ui/demo.spec.ts`, Demo extras `tests/ui/demo.extra.spec.ts`, modal-only `tests/ui/demo.modal.spec.ts`, Tools UI `tests/ui/tools-ui.spec.ts`, extended `tests/ui/tools-ui.more.spec.ts`

## Edge cases covered
- Input validation: missing/invalid fields, bad dates, limits
- Concurrency: concurrent completions, batch, fine-tune requests
- Downtime: unreachable adapter paths
- Large payloads: long prompts and response limits
- Security: invalid/expired tokens, malformed headers

## Gaps / next up
- Deeper contract validation vs OpenAPI schema (can add schema validator)
- More chaos scenarios: latency injections and retry verification
- Wider data permutations for workflows
 - UI: Add visual regression snapshots for stable components; extend Tools UI coverage for Adapters quick calls and AI examples; consider story-based fixtures for deterministic rendering
 
Exercises:
- Add an OpenAPI schema assertion to an existing API test and observe failures when the contract drifts.
- Create a simple chaos scenario (artificial adapter delay) and assert client-side timeouts/retries.
- Record one visual snapshot for a stable header and tune the diff threshold to pass reliably.

## Artifacts
- Playwright JSON + HTML reports under test-results/ and playwright-report/
- k6 JSON (when run via Docker with --out json)

This doc complements TEST-PLAN.md and will evolve as we add UI and more load suites.