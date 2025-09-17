# UI Docs Index

[Docs Index](../README.md) • [Learn Hub](../../learn/INDEX.md)

- Tools UI (/ui): [TOOLS-UI.md](TOOLS-UI.md)
- Demo App (/demo): [DEMO-APP.md](DEMO-APP.md)
- UI Selectors & Best Practices: [../SELECTORS-AND-BEST-PRACTICES.md](../SELECTORS-AND-BEST-PRACTICES.md)
- QA Skills & Test Selection: [../../learn/QA-SKILLS-AND-TEST-SELECTION.md](../../learn/QA-SKILLS-AND-TEST-SELECTION.md)

See the Step-by-step sections inside each guide for common workflows. For broader hands-on scenarios, use [QA Exercises](../../learn/QA-EXERCISES.md).

How to run the UIs (Docker + Makefile):
- Start services: `make up`
- Open Tools UI: http://localhost:8080/ui
- Open Demo App: http://localhost:8080/demo

UI tests (via Makefile):
- All UI tests: `make test-ui` (uses BASE_URL=http://localhost:8080 by default)
- Modal-only: `make test-ui-modal`
- Tools UI subset: `make test-ui-tools`
- Full test matrix: `make test` (all projects) or `make test-all`

Run the CI flow locally (replicates GitHub Actions):
- Ensure Docker is running and port 8080 is free
- Then run: `bash scripts/ci-local.sh`
