# Load Test Strategy (k6)

[Docs Index](README.md) • [Learn Hub](../learn/INDEX.md)

This is a pragmatic load testing strategy for this QA playground. Targets are fictional but sensible for a small "enterprise-like" demo.

## Non-Functional Requirements (NFRs)
- Availability: 99.5% during business hours
- Error rate: < 1% (http_req_failed)
- Latency (p95):
  - Auth endpoints: < 300ms
  - AI completion: < 1200ms
  - CRUD endpoints: < 500ms
- Throughput: sustain 50 RPS baseline, burst 200 RPS for 2 minutes without breaching p95 targets
- Resilience: graceful degradation on adapter failures (no cascading errors)

## Scenarios
- Smoke: tiny, runs in CI to catch regressions
- Baseline: steady load at 10-30 VUs to validate NFRs
- Stress: ramp to find breaking point, observe error/latency
- Soak: 20-30 VUs for 30-60 minutes, looking for leaks/degradation

## Running
- Locally: run via Docker or native k6
- CI: optional step (kept short)

Artifacts: JSON summary per run and optional trends.

## What we check
- p95/p99 durations
- Error rates
- RPS stability
- Per-endpoint thresholds for critical paths