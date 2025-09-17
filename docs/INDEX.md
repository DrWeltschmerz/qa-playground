# Documentation Portal

[Docs Index](README.md) • [Learn Hub](../learn/INDEX.md)

Quick links to the most useful docs in this repo. For the full list, see `docs/README.md`. This project is learning-first: use the Learn Hub (`learn/INDEX.md`) for guided, hands-on practice.

- Test Plan — [TEST-PLAN.md](TEST-PLAN.md)
- Test Matrix — [TEST-MATRIX.md](TEST-MATRIX.md)
- Coverage Analysis — [TEST-COVERAGE-ANALYSIS.md](TEST-COVERAGE-ANALYSIS.md)
- Load Test Strategy — [LOAD-TEST-STRATEGY.md](LOAD-TEST-STRATEGY.md)
- API Test Strategy (legacy; see Test Plan) — [API-TEST-STRATEGY.md](API-TEST-STRATEGY.md)
- UI Docs — [ui/INDEX.md](ui/INDEX.md)
- Selector & Best Practices — [SELECTORS-AND-BEST-PRACTICES.md](SELECTORS-AND-BEST-PRACTICES.md)
- Learn Hub — [learn/INDEX.md](../learn/INDEX.md)
- Roadmap — [ROADMAP.md](ROADMAP.md)

Run CI locally
- Local CI replica script — `scripts/ci-local.sh` (brings up services, runs k6 smoke + Playwright, collects artifacts)

Notes:
- The API Test Strategy was consolidated into the Test Plan; it’s kept for historical context.
- Both Tools UI (`/ui`) and Demo App (`/demo`) are served by the Gateway on port 8080.
