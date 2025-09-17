import { expect, test } from "@playwright/test";

test.describe("@swagger Swagger proxy availability", () => {
  test("unified docs page responds", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/docs/unified`);
    expect([200, 302]).toContain(res.status());
  });

  test("static specs route lists users.json", async ({ request, baseURL }) => {
    const res = await request.get(`${baseURL}/specs/users.json`);
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json).toHaveProperty("paths");
  });
});
