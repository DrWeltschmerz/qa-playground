# Tools UI (/ui)

[Docs Index](../README.md) • [Learn Hub](../../learn/INDEX.md)

Purpose: A lightweight API exerciser to explore and validate the gateway features without writing code.

## Sections
- Settings: Base URL, x-api-key (service key), and JWT capture.
- Users: Register, Login, Me.
- Admin: System status, maintenance, config, backups.
- Analytics: Usage and performance.
- Notifications: CRUD, broadcast.
- Workflows: CRUD, execute, approve/reject.
- AI: Models, complete, batch, metrics.
- Adapters: Adapter A/B status and features.
- Exercises: Copyable curl and Playwright snippets.

## Auth
- Defaults to x-api-key from localStorage `qa.key` (service-secret). When you login, JWT is stored in `qa.jwt` and added as `Authorization: Bearer`.

## Typical flows
- Quick sanity: Settings → Run Flow (Users register/login → AI complete → Notification → Analytics).
- Admin check: Toggle maintenance and verify status.
- AI: Compose text, list models, check metrics.

## Errors/Toasts
- Success toasts only on HTTP 2xx; errors show the message body or status code.

## Notes
- Gateway Swagger at `/swagger/index.html`.
- Static OpenAPI under `/specs`.

## Step-by-step guides

1) Quick sanity flow (Run Flow)
- Settings: ensure Base URL is `http://localhost:8080` and `Service API Key` is `service-secret`.
- Users: click `Run Flow` to register → login → submit AI batch → read analytics.
- Observe results in the Users pane, and note `qa.jwt`/`qa.aiJobId` in localStorage.

2) Admin maintenance
- Admin: toggle `Maintenance` on, click `Status` and assert maintenance is reflected.
- Toggle it off to restore.

3) Notifications
- Notifications: fill Subject/Body and click `Create`.
- Copy the id from localStorage `qa.notifId` into the id field, then `Get` and `Status`.

4) Workflows
- Workflows: `Create` with a name (defaults provided), then copy id into the id field.
- `Approve` or `Reject` and assert the response in the Workflows pane.
