import { expect, test } from "@playwright/test";
// @swagger

// Basic swagger availability and shape checks to keep specs honest

test.describe("Swagger & OpenAPI", () => {
  test("gateway swagger UI is reachable", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/swagger/index.html`);
    expect([200, 302, 301]).toContain(res.status());
  });

  test("users swagger spec served by gateway", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/specs/users.json`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("openapi");
    expect(body).toHaveProperty("paths");
    expect(Object.keys(body.paths).length).toBeGreaterThan(0);
  });

  test("gateway openapi has ai route", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/specs/ai.json`);
    expect(res.status()).toBe(200);
    const spec = await res.json();
    const paths = spec.paths || {};
    expect(paths).toHaveProperty("/v1/ai/complete");
  });
});
