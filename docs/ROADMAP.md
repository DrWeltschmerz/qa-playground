# Roadmap

[Docs Index](README.md) • [Learn Hub](../learn/INDEX.md)

This repository is a QA automation showcase and learning playground. The roadmap focuses on deepening practical value with a learning-first, portfolio-grade approach.

## Near-term (1–2 weeks)
- Visual regression testing
  - Introduce snapshot testing for stable UI sections (headers, layout, key panels)
  - Wire Playwright image comparisons with threshold tuning
  - Exercises: add hands-on snapshot tasks (create baseline, review diffs, tune thresholds) in `learn/`.
- UI polish and coverage
  - Extend Tools UI tests to cover Adapters quick calls, AI examples area
  - Add deterministic data-open flags where needed; reduce flakiness further
  - Exercises: expand UI tests using best-practice selectors and deterministic waits in `learn/`.

## Mid-term (1–2 months)
- SQL playground with seeded DB
  - Provide a small SQLite DB with seed data and a handful of SQL challenges (SELECT, JOIN, GROUP BY, window functions)
  - Add `learn/SQL-PLAYGROUND.md` with prompts and solutions hidden behind collapsible sections
  - Optional: small Go/Node API to query the DB with guardrails
  - Exercises: solve SQL challenges and write an API test validating expected results.
- Contract validation
  - Validate responses against OpenAPI schemas in Playwright API tests
  - Add schema drift checks to CI
  - Exercises: add schema assertions to an existing API spec; break and fix to observe failures.
- Chaos and resilience
  - Inject latency/failures in adapter containers and verify retries, timeouts, and fallback behavior
  - Exercises: run chaos scenarios locally and assert client-side resilience in tests.
- Performance enhancements
  - Expand k6 from smoke to baseline and stress profiles; publish summary artifacts
  - Exercises: design a mini performance hypothesis and validate it with k6 thresholds.

## Long-term (3–6 months)
- Extend UI set
  - Add a minimal React or Svelte admin demo for broader UI workflows
  - Add a mini reports UI and include visual regression via snapshots
  - Exercises: write page-object-style tests for new UI flows and add snapshots.
- Test data orchestration
  - Introduce factories/fixtures library with seed scenarios
  - Optional: synthetic data pipeline for large-scale tests
  - Exercises: build a reusable fixture and data factory; document setup/teardown patterns.
- Observability
  - Correlate Playwright step IDs with backend request IDs in logs to speed up debugging
  - Exercises: trace a failing test through logs and add a correlation assertion.

## CI/CD Improvements
- Upload trace bundles and summarize test metrics in a single summary artifact (already partially done via `scripts/collect-metrics.js`)
- Exercises: run the CI flow locally with `scripts/ci-local.sh`, intentionally break a test, and triage artifacts.
