# What is QA? (Manual & Automation)

[Back to Learn Hub](../INDEX.md) • [View Learning Path](../LEARNING-PATH.md)

Quality Assurance (QA) ensures we ship the right thing, the right way. It’s both a mindset and a set of practices.

## QA vs Testing
- QA: Prevent defects; build quality into process (requirements, design, CI/CD, observability).
- Testing: Detect defects; verify behavior (manual or automated).

## Manual QA
- Exploratory testing: learn the product, design charters, follow risk.
- Test design basics: equivalence classes, boundaries, state transitions, oracles.
- Good reports: clear repro steps, expected vs actual, logs/screens.
- Tools: browser devtools, Postman/curl, screen recorders.

## Automation QA
- Automate repeatable checks: API tests, UI flows, contract checks, performance checks.
- Design for maintainability: fixtures, data generators, stable selectors, isolation.
- CI first: run on every PR; fast, parallel; traces on failure.

## Where QA adds value
- Early: review requirements and APIs; ask “how will we know this works?”
- During: pair with devs; add testability hooks (data-testid), logs, metrics.
- After: analyze incidents; add regression checks.

## Skill map (starter)
- Foundations: HTTP, JSON, auth, Git, Docker basics.
- API: requests, status codes, auth headers; schema basics (OpenAPI).
- UI: DOM, selectors, accessibility roles; waiting strategies.
- Code: a language (TS/JS or Python), assertions, control flow, modules.
- CI: Playwright CLI, reporters; GitHub Actions basics.

## In this repo
- Practice API and UI testing against a realistic gateway.
- Learn Playwright: fixtures, APIRequest, projects, tagging.
- Try k6 performance basics.

## Next steps
- Read [Playwright for Manual QA](PLAYWRIGHT-FOR-MANUAL-QA.md).
- Do the exercises in [QA Exercises](../QA-EXERCISES.md).
- Explore the UIs: [UI Docs Index](../../docs/ui/INDEX.md).

Previous: [Glossary](GLOSSARY.md) | Next: [Playwright for Manual QA](PLAYWRIGHT-FOR-MANUAL-QA.md)
