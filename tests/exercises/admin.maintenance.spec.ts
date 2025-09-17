import { expect, test } from "@playwright/test";

// Starter skeleton for Exercise #1: System Status & Maintenance Mode
// See learn/QA-EXERCISES.md#1-system-status-and-maintenance-mode

const API_KEY = process.env.SERVICE_API_KEY || "service-secret";

// Skip by default; unskip when ready to implement
test.describe.skip("Admin: maintenance mode", () => {
  test("toggle maintenance reflects in status", async ({ request }) => {
    const headers = {
      "x-api-key": API_KEY,
      "content-type": "application/json",
    };

    // 1) Get initial status
    const status1 = await request.get("/v1/admin/system/status", { headers });
    expect(status1.ok()).toBeTruthy();
    const body1 = await status1.json();
    expect(body1).toHaveProperty("status");

    // 2) Toggle maintenance on
    const resOn = await request.post("/v1/admin/system/maintenance", {
      headers,
      data: { enabled: true },
    });
    expect(resOn.ok()).toBeTruthy();

    // 3) Get status again and assert
    const status2 = await request.get("/v1/admin/system/status", { headers });
    expect(status2.ok()).toBeTruthy();
    const body2 = await status2.json();
    expect(body2?.maintenance?.enabled ?? false).toBe(true);

    // 4) Toggle maintenance off (cleanup)
    await request.post("/v1/admin/system/maintenance", {
      headers,
      data: { enabled: false },
    });
  });

  test("requires API key", async ({ request }) => {
    const res = await request.get("/v1/admin/system/status");
    expect(res.status()).toBe(401);
    const err = await res.json();
    expect(err).toHaveProperty("error");
  });
});
