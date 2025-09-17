# Demo App (/demo)

[Docs Index](../README.md) • [Learn Hub](../../learn/INDEX.md)

Purpose: A realistic surface to practice robust UI automation with Playwright.

## Features
- Auth: Sign up/Login (email+password) → JWT stored in localStorage.
- AI Compose: POST /v1/ai/complete (model: adapter-a), loading state → content.
- Preview: Opens a new tab with a minimal HTML preview or renders inline fallback when popups blocked.
- Publish: Creates a notification with the composed message.
- Workflow: Create (valid steps), auto-execute, Approve via confirm modal.
- Activity: Fetch usage and download CSV.
- Extras: file input, drag&drop, iframe messaging.

## Deterministic states for tests
- Compose sets `Loading…` immediately and enables Preview on success.
- Preview inline fallback `data-testid="preview-inline"` when window.open is blocked.
- Workflow Approve posts a valid payload; create triggers `/execute` automatically.

## Auth headers
- x-api-key used by default; JWT from localStorage `qa.jwt` if available.

## Troubleshooting
- If anything 401s, ensure `qa.key` is set to `service-secret` or login first.
- If Preview is disabled, Compose first.

## Step-by-step workflows

1) Auth and Compose
- Open http://localhost:8080/demo
- Sign up (or Sign in) — JWT is saved to localStorage `qa.jwt`.
- Click Compose — you should see "Loading…" then the generated text in `compose-out`.

2) Preview and Copy
- After Compose, Preview becomes enabled.
- Click Open Preview — a new tab with the content appears. If popups are blocked, an inline `preview-inline` block is shown instead.
- Click Copy to Clipboard to copy the composed content.

3) Publish Notification (optional)
- Click Publish Notification — the UI posts a validated payload to `/v1/notifications/`.
- The saved id is placed into `localStorage.qa.notifId`.

4) Workflow Approval
- Click Create Workflow — a valid workflow definition is sent, and execution is triggered.
- Click Approve — confirm in the modal. Output appears in `wf-out`.

5) Activity & CSV
- Click Refresh — the usage response is shown in `activity-out`.
- Click Download CSV — a file `analytics.csv` is downloaded with header `timestamp,value`.
