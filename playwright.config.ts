import { defineConfig } from "@playwright/test";

// Centralized Playwright config for both local and CI runs.
// Defaults are test-friendly: retries on CI, trace/screenshot on failures, JSON report for metrics.
export default defineConfig({
  testDir: "tests",
  timeout: 30_000,
  forbidOnly: !!process.env.CI,
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["junit", { outputFile: "test-results/junit-results.xml" }],
    ["json", { outputFile: "test-results/playwright.json" }],
  ],
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:8080",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: {
      "content-type": "application/json",
    },
  },
  projects: [
    {
      name: "api-tests",
      testDir: "tests",
      // prevent overlap with UI and other specialized suites
      testIgnore: [
        "tests/ui/**",
        "tests/notifications/**",
        "tests/exercises/**",
      ],
      // keep excluding swagger-tagged tests from this project
      grepInvert: /@swagger/,
    },
    {
      name: "smoke",
      testDir: "tests",
      grep: /@smoke/,
      // run a quick cut across suites
      retries: 0,
    },
    {
      name: "contract",
      testDir: "tests",
      grep: /@contract/,
      retries: 0,
    },
    {
      name: "notifications-single",
      testDir: "tests",
      testMatch: /notifications\/notifications\.spec\.ts/,
      testIgnore: ["tests/ui/**", "tests/exercises/**"],
      fullyParallel: false,
    },
    {
      name: "exercises",
      testDir: "tests/exercises",
      fullyParallel: true,
    },
    {
      name: "ui-demo",
      testDir: "tests/ui",
      use: {
        baseURL: process.env.BASE_URL || "http://localhost:8080",
        permissions: ["clipboard-read", "clipboard-write"],
        acceptDownloads: true,
      },
    },
  ],
});
