# Learn: API QA Playground

[Back to Learn Hub](INDEX.md) • [View Learning Path](LEARNING-PATH.md)

Start here: [Learning Path](LEARNING-PATH.md) (guided)
Browse hub: [Learn Hub](INDEX.md) (quick links)

This folder is your training ground to become a strong QA. Follow the path, then practice with the exercises.

Quick wins
- Warm-up: write a test that registers a user; add a negative login test (missing password)
- Intermediate: extract a reusable admin-token fixture; add a data generator for realistic users
- Advanced: add OpenAPI-based shape assertions; simulate adapter downtime and assert gateway behavior

Performance
- Run k6 smoke locally (`tests/perf/k6-smoke.js`); tweak thresholds
- Model a business scenario (register → login → AI) using `tests/perf/k6-baseline.js`

Tips
- Look at tests/fixtures and tests/utils for patterns
- Keep tests independent; generate fresh data per test
- Prefer durable assertions and stable selectors (see [UI Selectors & Best Practices](../docs/SELECTORS-AND-BEST-PRACTICES.md))

See also
- Exercises: [QA Exercises](QA-EXERCISES.md) (start with 1–4, then 5–8, finish with 9–12)
- UIs: http://localhost:8080/ui/ (Tools) and http://localhost:8080/demo/ (Demo)
- UI guides: [Tools UI](../docs/ui/TOOLS-UI.md), [Demo App](../docs/ui/DEMO-APP.md), [Selectors & Best Practices](../docs/SELECTORS-AND-BEST-PRACTICES.md)
- Beginners: [What is QA?](beginners/WHAT-IS-QA.md), [Beginners Guide](beginners/BEGINNERS-GUIDE.md), [Glossary](beginners/GLOSSARY.md)

Next: [Learning Path](LEARNING-PATH.md)
