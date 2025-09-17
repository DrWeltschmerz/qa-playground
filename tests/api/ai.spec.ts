import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { AiClient } from "../utils/api-clients";

const API_KEY = "service-secret";

test("healthz returns ok", async ({ request, apiBase }) => {
  const res = await request.get(`${apiBase}/healthz`);
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
});

test("ai complete with api key", async ({ svcRequest, apiBase }) => {
  const ai = new AiClient(svcRequest, apiBase);
  const res = await ai.complete({ prompt: "Hello", model: "adapter-a" });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.model).toBe("adapter-a");
  expect(typeof body.completion).toBe("string");
});

test("ai complete with JWT (fixture)", async ({ userRequest, apiBase }) => {
  const ai = new AiClient(userRequest, apiBase);
  const res = await ai.complete({
    prompt: "Hello from JWT",
    model: "adapter-b",
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.model).toBe("adapter-b");
  expect(typeof body.completion).toBe("string");
});
