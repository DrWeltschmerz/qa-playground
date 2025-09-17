# QA Glossary (ISTQB-aligned)

[Back to Learn Hub](../INDEX.md) • [View Learning Path](../LEARNING-PATH.md)

A practical, concise glossary aligned with ISTQB Foundation Level terminology, tailored to how we test in this repo. Terms are grouped by theme and listed alphabetically within each group.

See also: [Learn Hub](../INDEX.md), [Learning Path](../LEARNING-PATH.md), [QA Skills & Test Selection](../QA-SKILLS-AND-TEST-SELECTION.md), and [UI Selectors & Best Practices](../../docs/SELECTORS-AND-BEST-PRACTICES.md).

## Core testing terms
- Assertion: A check that verifies expected behavior or data.
- Defect (Bug): An imperfection in a component or system that can cause it to fail to perform its required function. Report with clear repro steps, expected vs actual, and evidence.
- Error (Mistake): A human action that produces an incorrect result (e.g., misunderstanding a requirement, writing a wrong condition).
- Failure: Deviation of the component/system from expected behavior observed during execution (e.g., wrong HTTP status or incorrect UI state).
- Incident/Anomaly: Any event that requires investigation (e.g., unexpected log entry or flake); may lead to a defect report.
- Test Case: A set of inputs, preconditions, actions, and expected results to verify a test objective.
- Test Suite: A set of test cases grouped by purpose or scope (e.g., smoke, regression, API users).
- Test Basis: The information used as the basis for test analysis and design (e.g., requirements, OpenAPI specs, UX flows).
- Test Oracle: A mechanism to determine expected results (e.g., OpenAPI schema, business rule docs, a reference implementation, database state).
- Test Environment: Hardware, software, data, and configurations under which tests are executed (here: docker-compose services + Playwright config).
- Test Data: Data used to execute tests. Prefer generated, unique, and minimal data per test to ensure independence.

## Test levels and types
- Test Level: A group of test activities at a specific scope.
	- Component (Unit): Focus on individual functions or classes.
	- Integration: Verify interactions between components/services (our API tests through gateway).
	- System: Validate the entire system against requirements (end-to-end flows, including UI).
	- Acceptance: Validate against business needs; often user- or customer-driven.
- Test Type: A group of tests based on specific testing objectives.
	- Functional: Validate what the system does (correct outputs, rules, state changes).
	- Non-functional: Validate how the system behaves (performance, security, usability, reliability).
	- Structural (White-box): Coverage of code structure; less emphasized here.
	- Change-related: Regression testing and re-testing (confirmation testing).
- Regression Testing: Re-executing tests to detect defects introduced by changes.
- Re-testing (Confirmation): Re-running a test that previously failed to confirm the fix.
- Smoke Test: A quick set of checks to verify the system is up and basic flows work.
- Sanity Check: A narrow, focused test to verify basic functionality after minor changes.

## Test strategy and planning
- Test Strategy: High-level approach that describes test levels/types, coverage, tooling, and quality criteria for a product/organization.
- Test Plan: Document (often lightweight) outlining scope, items to test, techniques, environment, schedule, responsibilities, and risks for a test effort.
- Entry Criteria: Conditions that must be met to start a given test activity (e.g., service is up, seed data loaded, OpenAPI updated).
- Exit Criteria (Definition of Done for testing): Conditions to stop testing (e.g., critical defects resolved, pass rate >= threshold, no open P0s).
- Risk: A factor that could result in future negative consequences (likelihood × impact). Guides test selection and prioritization.
- Risk-based Testing: Focusing test effort proportionally to risk, emphasizing business-critical flows and likely failure points.

## Test design techniques
- Equivalence Partitioning: Divide inputs into groups that should be treated similarly; test one value per partition.
- Boundary Value Analysis: Test values at, just below, and just above boundaries.
- Decision Table Testing: Derive tests from combinations of conditions and actions.
- State Transition Testing: Design tests to cover valid/invalid state transitions.
- Pairwise/Combinatorial Testing: Select a minimal set of combinations that covers interactions between parameters.
- Checklist-based Testing: Use concise, risk-focused checklists for consistent coverage.
- Exploratory Testing: Concurrent test design and execution guided by learning and investigation; often time-boxed (session-based).

## Execution and reporting
- Flake (Flaky Test): A test that sometimes passes and sometimes fails without code changes; usually a timing or environment issue.
- Deterministic: Producing the same outcome every time for the same input; preferred property of tests.
- Idempotent: An operation that can be repeated without changing the result beyond the initial application (important for safe tests and APIs).
- Coverage: The degree to which specified elements are exercised by a test suite (requirements, statements, branches, paths). Avoid chasing numeric targets blindly.
- Traceability: Ability to link test cases to requirements/bugs and vice versa; enables impact analysis and coverage reasoning.
- Priority vs Severity: Priority = business order to fix; Severity = impact of the defect on the system.
- Metrics (examples): Pass rate, defect density, mean time to detect (MTTD), mean time to repair (MTTR). Use metrics to learn, not to game.

## Non-functional testing terms
- Performance Testing: Assess responsiveness, stability, scalability under a workload.
- Load Test: Measure performance at expected load.
- Stress Test: Push beyond normal limits to find the breaking point.
- Soak (Endurance) Test: Evaluate behavior over an extended time (leaks, degradation).
- Baseline: A reference measurement for comparison over time.
- SLO/SLA: Service Level Objective/Agreement; targets for reliability and performance.
- NFRs (Non-functional Requirements): Performance, security, reliability, usability, etc.

## Process and quality
- Verification vs Validation: Verification = building the thing right (meets specs); Validation = building the right thing (meets user needs).
- Static Testing: Examination of work products without execution (reviews, walkthroughs, linting).
- Dynamic Testing: Execute code/system and observe behavior (our test automation and manual testing).
- Testware: Artifacts produced during testing (test cases, data, scripts, fixtures, reports).

## Useful concepts for this repo
- Fixture: Test setup/teardown utilities that provide context (like logged-in user) to tests.
- Parallelism: Running tests concurrently to speed up total runtime.
- Test Pyramid: More unit tests than integration, fewer end-to-end; emphasizes fast feedback and maintainability.

---

Tips for use here:
- Prefer API tests for business rules and contracts; keep UI E2E lean but meaningful.
- Use OpenAPI as a test oracle for shape checks; add schema assertions where valuable.
- Design independent, deterministic, idempotent tests; generate fresh data per test.

Previous: [Beginners Guide](BEGINNERS-GUIDE.md) | Next: [What is QA?](WHAT-IS-QA.md)
