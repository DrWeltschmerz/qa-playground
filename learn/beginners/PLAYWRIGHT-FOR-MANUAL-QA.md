# Playwright for Manual QA: Zero to First Green Test

[Back to Learn Hub](../INDEX.md) • [View Learning Path](../LEARNING-PATH.md)

This short guide helps manual testers write their first automated browser test.

## Why Playwright?
- Fast and reliable cross-browser automation
- First-class tracing, screenshots, and videos on failures
- Easy to start with: one binary, one config, rich selectors

## Install and Run
- Ensure Node.js 18+ is installed.
- In this repo, Playwright is already set up.
- Run all tests: `npx playwright test`
- Run only the Demo UI tests: `npx playwright test --project=ui-demo`

## Key Concepts
- Test: the smallest check. Use `test('name', async ({ page }) => { ... })`.
- Locator: a robust selector, e.g., `page.getByTestId('signin')`.
- Assertion: `await expect(locator).toHaveText(/Welcome/)`.
- Trace: debug by opening traces with `npx playwright show-report`.

## Your First Test (Demo Login)
```ts
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/demo');
  await page.getByTestId('signup').click();
  await page.getByTestId('signin').click();
  // Expect JWT persisted (app stores it in localStorage)
  const jwt = await page.evaluate(() => localStorage.getItem('qa.jwt'));
  expect(jwt).toBeTruthy();
});
```

## Tips
- Prefer `getByTestId` or `getByRole` for stability.
- Avoid network waits; prefer UI state waits (e.g., `expect.poll` on content).
- Traces, screenshots, and videos on failure are enabled.
- Read: `docs/SELECTORS-AND-BEST-PRACTICES.md` and UI guides in `docs/ui/INDEX.md`.

## Next Steps
- Open `tests/ui/demo.spec.ts` and run tests visually: `npx playwright test --ui`.
- Try the exercises in [QA Exercises](../QA-EXERCISES.md) to build muscle memory.

Previous: [What is QA?](WHAT-IS-QA.md) | Next: [Beginners Guide](BEGINNERS-GUIDE.md)
