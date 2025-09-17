# Performance Testing with k6

[Back to Learn Hub](INDEX.md) • [View Learning Path](LEARNING-PATH.md)

At a glance
- Prerequisites: API is reachable at http://localhost:8080; Docker available for running k6; Node not required for k6 itself.
- You’ll learn: smoke vs baseline vs stress vs soak; thresholds; scenarios; how to interpret results.

## Quick start
- Scripts in this repo: tests/perf/k6-smoke.js, k6-baseline.js, k6-stress.js, k6-soak.js
- Run a short smoke locally (fast sanity check)
	- Goal: verify endpoints are up; catch egregious latency
- Baseline run (slightly longer)
	- Goal: measure p95 latency and error rate under expected load; compare over time

Outputs to watch
- Checks: % passed
- Thresholds: pass/fail gates (e.g., http_req_duration{scenario:smoke}: p(95)<800)
- http_reqs, http_req_duration (p50/p95), errors

## Scenarios overview
- Smoke: low VUs, short duration (e.g., 1–5 VUs for 30–60s)
- Baseline: expected load for a few minutes (e.g., 5–20 VUs for 3–10m)
- Stress: ramp beyond normal to find breaking points
- Soak: moderate load for extended time to find leaks/degradation

## Tips
- Start with smoke on every PR; run baseline before merges or on schedule
- Keep scenarios realistic: include auth and a short business flow when possible
- Add explicit thresholds that match SLOs; fail fast when they’re violated
- Isolate external variables (network, background processes) to reduce noise

Previous: [Debugging & CI](DEBUGGING-AND-CI.md) | Next: [QA Skills & Test Selection](QA-SKILLS-AND-TEST-SELECTION.md)
