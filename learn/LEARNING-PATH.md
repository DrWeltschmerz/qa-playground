# Learning Path (Start here)

A guided path from fundamentals to advanced topics, with hands-on tasks in this repo. Each step lists prerequisites, what you’ll learn, and a practical exercise. Skim learn/beginners/GLOSSARY.md to align on terms as you go.

1) Foundations: What is QA? → Manual to Automation
- Read: [What is QA?](beginners/WHAT-IS-QA.md)
- Optional: [Playwright for Manual QA](beginners/PLAYWRIGHT-FOR-MANUAL-QA.md) and the [Glossary](beginners/GLOSSARY.md)
- Outcome: Shared vocabulary (defect, test case, regression), expectations for QA work, and where automation fits.

Next → Playwright 101

2) Playwright 101 (Core mechanics)
- Read: [Playwright 101](PLAYWRIGHT-101.md)
- Learn: locators, assertions, auto-waits, traces, running tests locally.
- Do: Run one existing test; open HTML report; capture a trace on purpose.

Next → Fixtures & Patterns

3) Fixtures & Patterns (Reusable, testable design)
- Read: [Fixtures & Patterns](FIXTURES-PATTERNS.md)
- Learn: auth fixtures, data generators, table-driven tests, tagging.
- Do: Add a small data generator and use it in a simple API test.

Next → API Testing Guide

4) API Testing (Integration-level)
- Read: [API Testing Guide](API-TESTING-GUIDE.md)
- Learn: request context, auth headers, shape assertions with OpenAPI as oracle, idempotent flows, negative tests.
- Do: Pick an exercise from learn/QA-EXERCISES.md (e.g., Notifications CRUD + Status).

Next → Using the UIs

5) Using the UIs (Tools UI & Demo App)
- Read: [Using the UIs](ui/USING-THE-UIS.md) and [UI Selectors & Best Practices](../docs/SELECTORS-AND-BEST-PRACTICES.md)
- Learn: demo flows, stable selectors (getByRole/testId), deterministic waits.
- Do: Recreate the modal confirmation flow using robust selectors.

Next → Debugging & CI

6) Debugging & CI
- Read: [Debugging & CI](DEBUGGING-AND-CI.md)
- Learn: tracing, retries, artifacts, running CI locally with scripts/ci-local.sh
- Do: Break one test intentionally, run local CI, inspect artifacts, and fix.

Next → Performance (k6)

7) Performance (k6 basics)
- Read: [Performance (k6)](PERFORMANCE-K6.md)
- Learn: smoke vs baseline vs stress vs soak; thresholds; scenarios; how to read k6 output.
- Do: Add a threshold to k6-smoke.js and run locally.

Next → QA Skills & Test Selection

8) QA Skills & Test Selection
- Read: [QA Skills & Test Selection](QA-SKILLS-AND-TEST-SELECTION.md)
- Learn: when to choose API vs UI vs visual vs perf; triage strategies.
- Do: Outline a test strategy for one workflow, noting risks and exit criteria.

Next → Hands-on Exercises

9) Hands-on Exercises (capstone)
- Read/Do: [QA Exercises](QA-EXERCISES.md)
- Pick 2–3 flows across Admin, Analytics, and Workflows; add at least one negative case.

Next → Advanced (Roadmap-aligned)

10) Advanced Modules (as they land)
- Visual Regression: snapshot basics and rebaselining.
- Contract Validation: schema checks with OpenAPI.
- Chaos & Resilience: latency/downtime drills.
- SQL Playground: data reasoning + API.
- CI/CD Triage Drill: break/fix with artifacts.

Finish: You should be able to design, implement, and debug robust test suites here and in similar projects.

Previous: [Learn Hub](INDEX.md) | Next: [Playwright 101](PLAYWRIGHT-101.md)
