# Fixtures, Data, and Patterns

[Back to Learn Hub](INDEX.md) • [View Learning Path](LEARNING-PATH.md)

At a glance
- Prerequisites: You can run a basic Playwright test and view reports.
- You’ll learn: suite vs test fixtures, data builders, parallel-safe IDs, and practical helpers.

## Fixtures
- Global: baseURL, headers, admin token (see `tests/fixtures/api-fixtures.ts`).
- Per-suite: domain-specific setup (e.g., seeded workflows).
- Avoid per-test heavy setup when a suite-scope fixture is enough.

## Data
- Use builder functions that return valid defaults with override options.
- Ensure unique IDs in parallel: `Date.now()` + random segments.

## Patterns
- Table-driven tests for permutations.
- Helpers for RFC3339 dates and ranges.
- Validation helpers for `page/limit/sort/order` query patterns.

Previous: [Playwright 101](PLAYWRIGHT-101.md) | Next: [API Testing Guide](API-TESTING-GUIDE.md)
