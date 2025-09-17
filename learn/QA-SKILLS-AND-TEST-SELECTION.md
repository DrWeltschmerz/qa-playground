# QA Skills & Test Selection Guide

[Back to Learn Hub](INDEX.md) • [View Learning Path](LEARNING-PATH.md)

This guide lists core technologies and skills for a modern QA, and when to choose different test types.

## Core technologies for QA
- Programming language: TypeScript/JavaScript or Python (plus basic Go/Java familiarity helps)
- HTTP & REST: status codes, methods, headers, auth, idempotency
- JSON & serialization formats; basics of OpenAPI/Swagger
- SQL: SELECT, JOIN, GROUP BY, window functions; simple DDL/DML
- Git & CI/CD: branching, PRs, GitHub Actions or similar
- Containers: Docker & docker-compose for reproducible environments
- Observability: logs, metrics, traces; reading dashboards
- OS & shell: Linux basics, bash/zsh, environment variables
- Performance testing: fundamentals with k6 or JMeter
- Security basics: auth flows (JWT, API keys), rate limiting, common pitfalls

## Recommended tooling
- API: Playwright request, Postman/Insomnia for exploration
- UI: Playwright for browser automation, snapshot testing where stable
- Contract: openapi-schema validation tools
- Perf: k6 for load and baseline
- Lint/format: Prettier/ESLint (or language-specific linters)

## Test types and when to use them
- Unit tests
  - Scope: single function or small module
  - Use when: complex logic with many edge cases; cheapest feedback loop
  - Avoid for: external systems (prefer to mock)
- API tests (integration-level)
  - Scope: service endpoints through the gateway
  - Use when: verifying business rules, data contracts, auth, and error handling
  - Benefits: fast, reliable, easier to isolate
  - Prefer API tests over E2E when: UI adds no unique value or risk for the case
- End-to-end UI tests
  - Scope: real browser flows across pages and services
  - Use when: validating user experience, integrations, and flows
  - Keep minimal, cover happy-path + a few critical edge cases; seed data via API to reduce flakiness
- Visual regression tests
  - Scope: pixel-level or snapshot differences
  - Use when: UI layout/styling must stay stable (e.g., nav, headers)
  - Tune thresholds and focus on stable regions to avoid noise
- Contract tests
  - Scope: response shapes vs. OpenAPI schemas
  - Use when: backend services evolve; prevents drift and breakage
- Performance tests
  - Scope: throughput, latency, resource usage
  - Use when: setting NFRs, guarding regressions, validating scaling behavior
- Exploratory testing
  - Scope: unscripted; discover unknown unknowns
  - Use when: new features, major refactors, after incidents

## Test selection heuristics
- Prefer API tests for business rules and contract coverage; add UI E2E for end-to-end confidence at the flow level
- Use visual regression for stable UI components that consumers notice (branding, nav)
- Add contract validation when multiple teams/services ship independently
- Use k6 smoke on every PR; baseline/stress on schedule or before release

## Product lifecycle guidance
- Early development: heavy unit and API tests; a few UI E2E for critical flows; visual snapshots only for very stable components
- Pre-release hardening: add more E2E and perf coverage; expand negative tests; run k6 baseline
- Post-release: monitor failures, add tests for escaped bugs; keep UI E2E small but robust; invest in contract tests for versioning

## Learning path from this repo
- Start with [Playwright 101](PLAYWRIGHT-101.md) and the [API Testing Guide](API-TESTING-GUIDE.md)
- Do the hands-on scenarios in [QA Exercises](QA-EXERCISES.md)
- Explore [UI Docs Index](../docs/ui/INDEX.md) for the Tools UI and Demo App guides

Previous: [Performance (k6)](PERFORMANCE-K6.md) | Next: [QA Exercises](QA-EXERCISES.md)
