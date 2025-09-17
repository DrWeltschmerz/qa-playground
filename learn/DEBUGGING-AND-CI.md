# Debugging & CI

[Back to Learn Hub](INDEX.md) • [View Learning Path](LEARNING-PATH.md)

At a glance
- Prerequisites: You can run tests locally; Docker is installed.
- You’ll learn: how to capture/play back traces, rerun flakes, and replicate CI locally with `scripts/ci-local.sh`.
## Debugging locally
- Use `--debug` to open Playwright Inspector.
- Turn trace to `on` for a suspect spec.
- Keep tests small; bisect failures to the smallest repro.

## CI guidance
- Retry on CI is enabled; keep flaky test count at zero.
- Publish `playwright-report` and `test-results` as artifacts.
- Run API stack in services (docker compose) before tests.
 - Local CI: run `scripts/ci-local.sh` to simulate CI and collect artifacts (see `test-results/` and `playwright-report/`).

## Parallelism
- Use projects to isolate special cases (e.g., serial notifications).
- Prefer stateless tests; when stateful, namespace by token or key.

Previous: [Using the UIs](ui/USING-THE-UIS.md) | Next: [Performance (k6)](PERFORMANCE-K6.md)
