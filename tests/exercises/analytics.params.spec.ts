import { expect, test } from "@playwright/test";

// Starter skeleton for Exercise #4: Analytics parameters
// See learn/QA-EXERCISES.md#4-analytics-usage-performance-errors

const API_KEY = process.env.SERVICE_API_KEY || "service-secret";

// Skip by default
test.describe.skip("Analytics: parameter validation", () => {
  test("happy usage range & invalid range", async ({ request }) => {
    const headers = { "x-api-key": API_KEY };

    const now = new Date();
    const to = now.toISOString();
    const from = new Date(now.getTime() - 10 * 60 * 1000).toISOString();

    const ok = await request.get(
      `/v1/analytics/usage?from=${encodeURIComponent(
        from
      )}&to=${encodeURIComponent(to)}`,
      { headers }
    );
    expect(ok.ok()).toBeTruthy();
    const okJson = await ok.json();
    expect(Array.isArray(okJson?.data)).toBe(true);

    const bad = await request.get(
      `/v1/analytics/usage?from=${encodeURIComponent(
        to
      )}&to=${encodeURIComponent(from)}`,
      { headers }
    );
    expect(bad.status()).toBe(400);
  });
});
