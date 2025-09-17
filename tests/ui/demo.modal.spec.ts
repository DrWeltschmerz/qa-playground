import { expect, test } from "@playwright/test";

// Demo App: confirm modal in Extras section (independent of workflow approve)

test.describe("Demo UI - Extras modal", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await page
      .context()
      .grantPermissions(["clipboard-read", "clipboard-write"], {
        origin: baseURL!,
      });
    await page.addInitScript(() =>
      localStorage.setItem("qa.key", "service-secret")
    );
  });

  test("open, cancel, and ok flows", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "domcontentloaded" });
    await expect(page.locator("body")).toHaveAttribute("data-demo-ready", "1");
    const modal = page.getByTestId("confirm-modal");

    // Open and cancel
    await page.getByTestId("open-modal").click();
    await expect(modal).toHaveAttribute("data-open", "1");
    await page.getByTestId("modal-cancel").click();
    await expect(modal).not.toHaveAttribute("data-open", "1");

    // Open and ok
    await page.getByTestId("open-modal").click();
    await expect(modal).toHaveAttribute("data-open", "1");
    await page.getByTestId("modal-ok").click();
    await expect(modal).not.toHaveAttribute("data-open", "1");
  });
});
