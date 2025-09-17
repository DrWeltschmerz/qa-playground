import { expect, test } from "@playwright/test";

// Starter skeleton for Notifications CRUD & Status
// Maps to Exercise #5 in learn/QA-EXERCISES.md

const API_KEY = process.env.SERVICE_API_KEY || "service-secret";

test.describe.skip("Notifications: CRUD & status", () => {
  test("create → get → status", async ({ request }) => {
    const headers = {
      "x-api-key": API_KEY,
      "content-type": "application/json",
    };
    const create = await request.post("/v1/notifications/", {
      headers,
      data: { subject: `hello ${Date.now()}`, body: "from tests" },
    });
    expect(create.ok()).toBeTruthy();
    const cj = await create.json();
    const id = cj?.id || cj?.notificationId;
    expect(id).toBeTruthy();

    const got = await request.get(`/v1/notifications/${id}`, { headers });
    expect(got.ok()).toBeTruthy();

    const st = await request.get(`/v1/notifications/${id}/status`, { headers });
    expect(st.ok()).toBeTruthy();
    const sj = await st.json();
    expect(["pending", "sent", "delivered"]).toContain(sj?.status);
  });

  test("unknown id → 404", async ({ request }) => {
    const headers = { "x-api-key": API_KEY };
    const res = await request.get(`/v1/notifications/does-not-exist`, {
      headers,
    });
    expect(res.status()).toBe(404);
  });
});
