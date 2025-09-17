import {
  test as base,
  request as pwRequest,
  type APIRequestContext,
} from "@playwright/test";
import {
  API_CONFIG,
  generateTestUser,
  getAdminToken,
  registerAndLoginUser,
  type TestUser,
} from "../utils/test-helpers";

export type ApiFixtures = {
  user: TestUser;
  userToken: string;
  adminToken: string;
  apiBase: string;
  serviceHeaders: Record<string, string>;
  userHeaders: Record<string, string>;
  adminHeaders: Record<string, string>;
  svcRequest: APIRequestContext;
  userRequest: APIRequestContext;
  adminRequest: APIRequestContext;
};

export const test = base.extend<ApiFixtures>({
  apiBase: async ({}, use) => {
    await use(API_CONFIG.BASE_URL);
  },

  adminToken: async ({ request, apiBase }, use) => {
    const token = await getAdminToken(request, apiBase);
    await use(token);
  },

  user: async ({}, use) => {
    const u = generateTestUser();
    await use(u);
  },

  userToken: async ({ request, user, apiBase }, use) => {
    const { token } = await registerAndLoginUser(request, user, apiBase);
    await use(token);
  },

  serviceHeaders: async ({}, use) => {
    await use({
      "content-type": "application/json",
      "x-api-key": "service-secret",
    });
  },

  userHeaders: async ({ userToken }, use) => {
    await use({
      "content-type": "application/json",
      Authorization: `Bearer ${userToken}`,
    });
  },

  adminHeaders: async ({ adminToken }, use) => {
    await use({
      "content-type": "application/json",
      Authorization: `Bearer ${adminToken}`,
    });
  },

  svcRequest: async ({ serviceHeaders }, use) => {
    const ctx = await pwRequest.newContext({
      extraHTTPHeaders: serviceHeaders,
    });
    await use(ctx);
    await ctx.dispose();
  },

  userRequest: async ({ userHeaders }, use) => {
    const ctx = await pwRequest.newContext({ extraHTTPHeaders: userHeaders });
    await use(ctx);
    await ctx.dispose();
  },

  adminRequest: async ({ adminHeaders }, use) => {
    const ctx = await pwRequest.newContext({ extraHTTPHeaders: adminHeaders });
    await use(ctx);
    await ctx.dispose();
  },
});

export const expect = base.expect;
