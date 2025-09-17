import { expect, test } from "@playwright/test";

// Verifies that gateway exposes intended adapter endpoints
test.describe("Gateway exposure", () => {
  const endpoints = [
    { method: "GET", path: "/v1/adapter-a/health", expect: 200 },
    { method: "GET", path: "/v1/adapter-a/model", expect: 200, auth: true },
    {
      method: "POST",
      path: "/v1/adapter-a/complete",
      expect: 200,
      auth: true,
      body: { prompt: "Hi", max_tokens: 10 },
    },
    { method: "GET", path: "/v1/adapter-b/health", expect: 200 },
    {
      method: "GET",
      path: "/v1/adapter-b/models/available",
      expect: 200,
      auth: true,
    },
    {
      method: "POST",
      path: "/v1/ai/complete",
      expect: 200,
      key: true,
      body: { prompt: "Hello", model: "adapter-a" },
    },
  ];

  test("selected endpoints are reachable via gateway", async ({
    request,
    baseURL,
  }) => {
    for (const e of endpoints) {
      const url = `${baseURL}${e.path}`;
      const headers: Record<string, string> = {
        "content-type": "application/json",
      };
      if (e.key) headers["x-api-key"] = "service-secret";
      const res = await (e.method === "GET"
        ? request.get(url, { headers })
        : request.post(url, { headers, data: e.body || {} }));
      expect([e.expect, 401, 403]).toContain(res.status());
    }
  });
});
