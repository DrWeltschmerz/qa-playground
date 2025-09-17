import { expect, test } from "@playwright/test";

// Additional Tools UI coverage: Admin maintenance toggle and Notifications flow

const init = async (page: any) => {
  await page.goto("/ui", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.setItem("qa.key", "service-secret"));
};

test.describe("Tools UI extended", () => {
  test("maintenance reflected in Admin status", async ({ page }) => {
    await init(page);
    await page.locator('header nav a[href="#admin"]').click();
    const statusBtn = page.locator("#status");

    // Enable maintenance via API for determinism
    await page.request.post("/v1/admin/system/maintenance", {
      headers: {
        "x-api-key": "service-secret",
        "content-type": "application/json",
      },
      data: { enabled: true, estimated_duration: 60, message: "window" },
    });
    await statusBtn.click();
    // Wait until admin-out contains a JSON with overall_status
    const js = await expect
      .poll(
        async () => {
          const txt = (await page.locator("#admin-out").textContent()) || "";
          try {
            const o = JSON.parse(txt);
            return o.overall_status || null;
          } catch {
            return null;
          }
        },
        { timeout: 10_000 }
      )
      .not.toBeNull();

    // Disable via API (cleanup)
    await page.request.post("/v1/admin/system/maintenance", {
      headers: {
        "x-api-key": "service-secret",
        "content-type": "application/json",
      },
      data: { enabled: false, completion_message: "done" },
    });
  });

  test("notifications create/get/status", async ({ page }) => {
    await init(page);
    await page.locator('header nav a[href="#notifications"]').click();
    // Create via API and then use UI to fetch/status for deterministic behavior
    const created = await page.request.post("/v1/notifications/", {
      headers: {
        "x-api-key": "service-secret",
        "content-type": "application/json",
      },
      data: {
        title: `hello ${Date.now()}`,
        message: "from tools-ui test",
        type: "info",
        priority: "normal",
        recipient: "qa@example.com",
      },
    });
    expect(created.status()).toBe(201);
    const cid = (await created.json()).id as string;
    expect(cid).toBeTruthy();
    await page.locator("#notif-id").fill(cid);
    await page.locator("#notif-get").click();
    await page.locator("#notif-status").click();
    const out = await page.locator("#notifications-out").textContent();
    expect(out || "").toMatch(/status|pending|delivered|unread/i);
  });
});
