# Using the UIs: Tools and Demo

[Back to Learn Hub](../INDEX.md) • [View Learning Path](../LEARNING-PATH.md)

At a glance
- Prerequisites: API is up at http://localhost:8080; you know how to run Playwright tests.
- You’ll learn: how to exercise routes from Tools UI, realistic Demo App flows, and which elements are deliberately tricky.

This repo ships two UIs served by the API gateway:
- Tools UI: `/ui/` — an API exerciser for quick calls and learning.
- Demo App: `/demo/` — a realistic mini app for end-to-end browser testing.

## Why these UIs?
- Accelerate onboarding and demos (no extra client app needed).
- Teach API and UI testing side by side.
- Provide realistic tricky elements to automate (modals, downloads, iframes, new tabs, drag & drop).

## Tools UI `/ui/`
- Settings: set Base URL and Service API Key (x-api-key). Captures JWT after you log in.
- Users: Register, Login (by email), Me (GET /user/profile). Also a one-click “Run Flow”.
- Admin/Analytics/Notifications/Workflows/AI/Audit: buttons that exercise gateway routes.
- Adapters: quick calls to adapter A/B health and features.
- Exercises: generates curl & Playwright starter snippets with copy.

Usage tips:
- Start with Settings; Base should be `http://localhost:8080` when using docker compose.
- Use Run Flow to sanity check most routes.
- Watch toasts for success and error feedback.

Quick start
- Open http://localhost:8080/ui
- In Settings: set Base URL (http://localhost:8080) and API key (service-secret)
- Register a user, then Login; confirm JWT stored in localStorage

## Demo App `/demo/`
- Login / Sign up: creates a user via /register, logs in with /login (email + password). Stores JWT in localStorage.
- AI Compose: posts to /v1/ai/complete with a default model, shows result, allows copy.
- Publish Notification: sends to /v1/notifications/ with the composed text.
- Workflow: create & approve with a confirm modal; opens preview in a new tab.
- Activity: queries /v1/analytics/usage and lets you download a CSV.
- Extras: file input, drag & drop area, and an iframe widget that posts a message to the parent.

Usage tips:
- If buttons are disabled, complete the prerequisite step (e.g., Compose before Preview/Publish).
- Traces of requests can be observed in container logs or browser DevTools.

## Authentication Notes
- Gateway allows either `Authorization: Bearer <JWT>` or `x-api-key: <service-secret>` for most protected routes (see docs).
- Tools UI and Demo default to `x-api-key: service-secret` and capture JWT after login.

## Where to learn more
- Step-by-step UI guides: [docs/ui/INDEX.md](../../docs/ui/INDEX.md) (see the Step-by-step sections in each guide)
- Exercises (UI E2E drills): [QA Exercises](../QA-EXERCISES.md) and [tests/README.md](../../tests/README.md)
- Playwright for Manual QA: [learn/beginners/PLAYWRIGHT-FOR-MANUAL-QA.md](../beginners/PLAYWRIGHT-FOR-MANUAL-QA.md)
- API Test Plan: [docs/TEST-PLAN.md](../../docs/TEST-PLAN.md) and Swagger at `/swagger/index.html`.

Quick runs:
- UI demo project: `npx playwright test --project=ui-demo`
- Tools UI extended tests only: `npx playwright test tests/ui/tools-ui.more.spec.ts --project=ui-demo`

Previous: [API Testing Guide](../API-TESTING-GUIDE.md) | Next: [Debugging & CI](../DEBUGGING-AND-CI.md)
