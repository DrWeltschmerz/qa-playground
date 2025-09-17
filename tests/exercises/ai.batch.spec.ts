import { expect, test } from "@playwright/test";

// Starter skeleton for Exercise #9: AI batch & job status
// See learn/QA-EXERCISES.md#9-ai-batch-completion--job-status

const API_KEY = process.env.SERVICE_API_KEY || "service-secret";

// Skip by default
test.describe.skip("AI: batch completion", () => {
  test("submit batch and poll job", async ({ request }) => {
    const headers = {
      "x-api-key": API_KEY,
      "content-type": "application/json",
    };

    const batch = await request.post("/v1/ai/batch", {
      headers,
      data: { inputs: ["hello", "world", "from qa"] },
    });

    expect([200, 202]).toContain(batch.status());
    const accepted = await batch.json();
    const jobId = accepted?.jobId || accepted?.id;
    expect(jobId).toBeTruthy();

    // poll with small backoff
    let done = false;
    for (let i = 0; i < 10 && !done; i++) {
      const job = await request.get(`/v1/ai/jobs/${jobId}`, { headers });
      expect(job.ok()).toBeTruthy();
      const js = await job.json();
      if (js?.status === "completed") {
        expect(Array.isArray(js?.outputs)).toBe(true);
        done = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    expect(done).toBe(true);
  });

  test("empty inputs should 400", async ({ request }) => {
    const headers = {
      "x-api-key": API_KEY,
      "content-type": "application/json",
    };
    const res = await request.post("/v1/ai/batch", {
      headers,
      data: { inputs: [] },
    });
    expect(res.status()).toBe(400);
  });
});
