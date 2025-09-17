# UI Selectors & Test Best Practices

[Docs Index](README.md) • [Learn Hub](../learn/INDEX.md)

## Selector strategy
- Prefer stable attributes: `data-testid` / `data-test-id` for automation.
- Use ARIA roles and accessible names when appropriate (getByRole).
- Avoid brittle selectors: CSS classes, dynamic IDs, full text matches.
- Keep test IDs human-meaningful and scoped by feature (e.g., `publish`, `compose-out`).

## Patterns from this repo
- Demo and Tools UIs expose `data-testid` for primary controls and outputs.
- Preview inline fallback uses `data-testid="preview-inline"`.
- Modal dialog has `data-testid="confirm-modal"` and buttons `modal-ok`/`modal-cancel`.

## Robustness
- Wait for UI state transitions, not network events.
- Use `expect.poll` for content that fills asynchronously.
- Seed data via API to avoid UI-auth flakiness.
- Prefer idempotent flows; isolate by namespace (API key/JWT) where supported.

## Typical pitfalls
- Tests depending on toasts: prefer durable side-effects (localStorage, DOM content).
- Disabled buttons: assert `toBeEnabled()` after triggering the prerequisite.
- Popups blocked in headless: provide an inline fallback and assert it.

## Repo patterns
- Use fixtures for auth seeding; keep baseURL consistent.
- Split projects to avoid duplicates (see `playwright.config.ts`).
