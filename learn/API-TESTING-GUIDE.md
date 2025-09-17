# API Testing Guide

[Back to Learn Hub](INDEX.md) • [View Learning Path](LEARNING-PATH.md)

At a glance
- Prerequisites: Fixtures & Patterns understood; baseURL and auth fixtures available.
- You’ll learn: using Playwright request context; auth headers; shape assertions; idempotent flows; negative tests.

Core patterns
- Build a request with baseURL and common headers.
- Use auth helpers to include JWT or x-api-key.
- Validate shapes (keys, types) not just status codes.
- Keep tests independent; generate data per test; clean up only when necessary.

Previous: [Fixtures & Patterns](FIXTURES-PATTERNS.md) | Next: [Using the UIs](ui/USING-THE-UIS.md)

## Why Playwright for APIs
- Same runner as UI tests; powerful fixtures and parallelism.
- Built-in `request` for HTTP, with tracing, screenshots, videos if you mix UI.
- Auth flows: login once, cache token in a fixture.
- Contract tests: use `toHaveProperty`, type guards, and light schema assertions.
- Filtering/pagination: assert params, sorting, edge cases.
- Error handling: 4xx/5xx branches, malformed JSON, timeouts.
- Idempotency: ensure POST/PUT semantics; 404 vs 400 checks.

## Patterns
- API clients per domain (users, workflows, analytics) in `tests/utils` for reuse.
- Data builders: small helpers to create valid payloads that you can tweak.
- Namespacing state by token or header to avoid cross-test bleed.

## Examples
- See `tests/analytics/*` for filters and grouping.
- See `tests/workflows/*` for CRUD + execution model.
- See `tests/notifications/*` for namespaced stores and broadcast.

## Perf hooks
- Use k6 for load; you can still use Playwright for lightweight perf sanity (response times, concurrency).
