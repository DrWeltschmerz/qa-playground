import { expect, test } from "@playwright/test";

// Tools UI: Audit logs basic search & pagination via the UI buttons

const setup = async (page: any) => {
  await page.goto("/ui", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("qa.key", "service-secret"));
  await page.locator('header nav a[href="#audit"]').click();
};

test.describe("Tools UI - Audit logs", () => {
  test("search and navigate pages", async ({ page }) => {
    await setup(page);

    // Create an audit entry via API for deterministic results
    const created = await page.request.post("/v1/audit/logs", {
      headers: {
        "x-api-key": "service-secret",
        "content-type": "application/json",
      },
      data: {
        user_id: "admin",
        action: "backup:create",
        resource_type: "backup",
        resource_id: "bk-1",
        details: { status: "completed" },
      },
    });
    expect([201, 200]).toContain(created.status());

    // Fill filters matching the created entry
    await page.locator("#audit-actor").fill("admin");
    await page.locator("#audit-action").fill("backup:create");

    // Search
    await page.locator("#audit-search").click();

    // Tools UI renders plain lines, not JSON; assert non-empty content
    await expect
      .poll(
        async () =>
          (await page.locator("#audit-out").textContent())?.trim().length || 0,
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0);

    // Next and Prev pagination buttons should keep content non-empty
    await page.locator("#audit-next").click();
    await expect
      .poll(
        async () =>
          (await page.locator("#audit-out").textContent())?.trim().length || 0,
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0);

    await page.locator("#audit-prev").click();
    await expect
      .poll(
        async () =>
          (await page.locator("#audit-out").textContent())?.trim().length || 0,
        { timeout: 10_000 }
      )
      .toBeGreaterThan(0);
  });
});
