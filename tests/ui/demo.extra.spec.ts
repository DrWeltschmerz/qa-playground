import { expect, test } from "@playwright/test";

// Extra Demo UI tests focusing on negative modal flow and CSV structure

test.describe("Demo UI extras", () => {
  test.beforeEach(async ({ context, page, baseURL, request }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], {
      origin: baseURL!,
    });
    // Seed API key and JWT via API
    const email = `e2e_${Date.now()}_${Math.random()
      .toString(36)
      .slice(2, 6)}@example.com`;
    const password = "P@ssw0rd!";
    await request.post(`${baseURL}/register`, {
      data: { email, username: email.split("@")[0], password },
    });
    const login = await request.post(`${baseURL}/login`, {
      data: { email, password },
    });
    const token = (await login.json()).token as string;
    await page.addInitScript((t) => {
      (window as any).localStorage.setItem("qa.key", "service-secret");
      (window as any).localStorage.setItem("qa.jwt", t);
    }, token);
  });

  test("modal cancel prevents approve call", async ({ page, request }) => {
    await page.goto("/demo", { waitUntil: "domcontentloaded" });
    // Create and execute a workflow via API but do not auto-approve
    const wfResp = await page.request.post(`/v1/workflows/`, {
      headers: {
        "x-api-key": "service-secret",
        "content-type": "application/json",
      },
      data: {
        name: `wf-${Date.now()}`,
        steps: [{ id: "start", name: "Start", type: "task" }],
      },
    });
    expect(wfResp.ok()).toBeTruthy();
    const wf = await wfResp.json();
    await page.request.post(`/v1/workflows/${wf.id}/execute`, {
      headers: {
        "x-api-key": "service-secret",
        "content-type": "application/json",
      },
      data: { triggered_by: "e2e" },
    });

    await page.evaluate((id) => {
      localStorage.setItem("qa.wfId", id);
      const btn = document.getElementById("approve-wf") as HTMLButtonElement;
      if (btn) btn.disabled = false;
    }, wf.id as string);

    await page.getByTestId("approve-wf").click();
    const modal = page.getByTestId("confirm-modal");
    await expect(modal).toBeVisible();
    await page.getByTestId("modal-cancel").click();
    await expect(modal).toBeHidden();
    // The UI shows a toast when cancelled; verify wf-out did not change to an approved status
    const text = await page.getByTestId("wf-out").textContent();
    expect(text ?? "").not.toMatch(/approved/i);
  });

  test("csv has header row", async ({ page }) => {
    await page.goto("/demo", { waitUntil: "domcontentloaded" });
    // Compose to unlock preview/publish is not needed for CSV; just trigger Activity and download
    await page.getByTestId("refresh-activity").click();

    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByTestId("download-csv").click(),
    ]);
    const content = await download.createReadStream();
    let buf = "";
    for await (const chunk of content!) buf += chunk.toString();
    const firstLine = buf.split(/\r?\n/)[0] || "";
    expect(firstLine.trim()).toBe("timestamp,value");
  });
});
