import { expect, test } from "@playwright/test";

// Lightweight sanity for Tools UI (/ui)
// Focus: navigation, settings, users flow, AI complete button

const go = async (page: any) => {
  await page.goto("/ui", { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "QA Playground" }).waitFor();
  await page.evaluate(() => {
    localStorage.setItem("qa.key", "service-secret");
  });
};

test.describe("@smoke Tools UI sanity", () => {
  test("settings + users + ai", async ({ page, request, baseURL }) => {
    await go(page);

    // Open Settings (api key already set)
    await page.getByRole("link", { name: "Settings" }).click();
    await expect(page.getByPlaceholder("Service API Key")).toBeVisible();

    // Register/Login
    const email = `tools_${Date.now()}@example.com`;
    await request.post(`${baseURL}/register`, {
      data: { email, username: email.split("@")[0], password: "P@ssw0rd!" },
    });
    const login = await request.post(`${baseURL}/login`, {
      data: { email, password: "P@ssw0rd!" },
    });
    const token = (await login.json()).token as string;
    await page.addInitScript((t) => localStorage.setItem("qa.jwt", t), token);

    // Exercise AI section: list models to produce output
    await page.getByRole("link", { name: "AI" }).click();
    await page.getByRole("button", { name: "List Models" }).click();
    const out = page.locator("#ai-out");
    await expect(out).toBeVisible();
    await expect(out).not.toHaveText("");
  });
});
