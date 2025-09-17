import { expect, test } from "@playwright/test";

// Starter skeleton for Workflows submit → approve/reject
// Maps to Exercise #6 in learn/QA-EXERCISES.md

const API_KEY = process.env.SERVICE_API_KEY || "service-secret";

test.describe.skip("Workflows: approval flow", () => {
  test("create → approve", async ({ request }) => {
    const headers = {
      "x-api-key": API_KEY,
      "content-type": "application/json",
    };

    const created = await request.post("/v1/workflows/", {
      headers,
      data: { name: `wf-${Date.now()}`, steps: [{ name: "start" }] },
    });
    expect(created.ok()).toBeTruthy();
    const cj = await created.json();
    const id = cj?.id || cj?.workflowId;
    expect(id).toBeTruthy();

    const appr = await request.post(`/v1/workflows/${id}/approve`, {
      headers,
      data: { reason: "ok" },
    });
    expect(appr.ok()).toBeTruthy();

    const got = await request.get(`/v1/workflows/${id}`, { headers });
    expect(got.ok()).toBeTruthy();
    const gj = await got.json();
    expect(["approved", "rejected", "completed"]).toContain(
      gj?.status || gj?.state
    );
  });
});
