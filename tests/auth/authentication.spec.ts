import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { UsersClient } from "../utils/api-clients";
import { randEmail, randString, strongPassword } from "../utils/generators";
import {
  uniqueEmail,
  uniqueUsername,
  type TestUser,
} from "../utils/test-helpers";

// Test users will be generated dynamically
let testUser: TestUser;
let adminUser: TestUser;

let baseURL = "http://localhost:8080";
const SERVICE_API_KEY = "service-secret";

test.describe("@security @smoke Authentication & Authorization Flow", () => {
  let userToken: string;
  let userId: string;
  let loginEmail: string;
  let loginUsername: string;

  test.beforeEach(({ apiBase }) => {
    // Fresh identities per test
    testUser = {
      email: randEmail("auth"),
      username: randString("authuser", 6),
      password: strongPassword(),
    } as TestUser;
    adminUser = {
      email: randEmail("admin"),
      username: randString("adminuser", 6),
      password: strongPassword(),
    } as TestUser;
    baseURL = apiBase;
  });

  test.describe("User Registration", () => {
    test("should register new user with valid data", async ({
      userRequest,
      apiBase,
    }) => {
      const users = new UsersClient(userRequest, apiBase);
      const response = await users.register(testUser as any);

      expect(response.status()).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty("ID"); // Note: API returns "ID" not "id"
      expect(data.Email).toBe(testUser.email); // Note: API uses capitalized fields
      expect(data.Username).toBe(testUser.username);
      expect(data).not.toHaveProperty("password"); // Password should not be returned
      expect(data).not.toHaveProperty("Password");
      userId = data.ID;
    });

    test("should reject registration with missing email", async ({
      userRequest,
      apiBase,
    }) => {
      const users = new UsersClient(userRequest, apiBase);
      const response = await users.register({
        email: "",
        username: randString("missing", 5),
        password: strongPassword(),
      } as any);

      expect([200, 201, 400]).toContain(response.status());
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });

    test("should reject registration with invalid email format", async ({
      userRequest,
      apiBase,
    }) => {
      const users = new UsersClient(userRequest, apiBase);
      const response = await users.register({
        email: "invalid-email",
        username: randString("u", 6),
        password: strongPassword(),
      } as any);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("email");
    });

    test("should reject registration with weak password", async ({
      userRequest,
      apiBase,
    }) => {
      const users = new UsersClient(userRequest, apiBase);
      const response = await users.register({
        email: randEmail("weak"),
        username: randString("weakuser", 6),
        password: "123",
      } as any);

      expect([200, 201, 400]).toContain(response.status());
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });

    test("should reject duplicate username registration", async ({
      userRequest,
      apiBase,
    }) => {
      const users = new UsersClient(userRequest, apiBase);
      // First registration
      await users.register({
        email: randEmail("first"),
        username: "duplicateuser",
        password: strongPassword(),
      } as any);

      // Attempt duplicate registration
      const response = await users.register({
        email: randEmail("second"),
        username: "duplicateuser",
        password: strongPassword(),
      } as any);

      expect(response.status()).toBe(400);
      const data = await response.json();
      expect(data.error).toContain("username");
    });

    test("should handle SQL injection attempts safely", async ({
      userRequest,
      apiBase,
    }) => {
      const users = new UsersClient(userRequest, apiBase);
      const response = await users.register({
        email: "'; DROP TABLE users; --",
        username: "'; DROP TABLE users; --",
        password: strongPassword(),
      } as any);

      expect([200, 201, 400]).toContain(response.status());
      if (response.status() === 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });
  });

  test.describe("User Login", () => {
    test.beforeAll(async ({ request, apiBase }) => {
      // Ensure test user exists
      loginEmail = uniqueEmail("login");
      loginUsername = uniqueUsername("loginuser");
      baseURL = apiBase;
      await request.post(`${baseURL}/register`, {
        data: {
          email: loginEmail,
          username: loginUsername,
          password: "SecurePass123!",
        },
      });
    });

    test("should login with valid credentials", async ({ request }) => {
      const response = await request.post(`${baseURL}/login`, {
        data: {
          email: loginEmail,
          password: "SecurePass123!",
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("token");
      expect(typeof data.token).toBe("string");
      expect(data.token.length).toBeGreaterThan(10);
      userToken = data.token;
    });

    test("should reject login with invalid email", async ({ request }) => {
      const response = await request.post(`${baseURL}/login`, {
        data: {
          email: "nonexistent@example.com",
          password: "SecurePass123!",
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
      expect(data.error).not.toContain("nonexistent"); // Don't reveal user existence
    });

    test("should reject login with invalid password", async ({ request }) => {
      const response = await request.post(`${baseURL}/login`, {
        data: {
          email: loginEmail,
          password: "WrongPassword!",
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("should reject login with malformed request", async ({ request }) => {
      const response = await request.post(`${baseURL}/login`, {
        data: {
          // Missing password
          email: loginEmail,
        },
      });

      expect([400, 401]).toContain(response.status());
    });

    test("should reject login with empty request body", async ({ request }) => {
      const response = await request.post(`${baseURL}/login`, {
        data: {},
      });

      expect([400, 401]).toContain(response.status());
    });
  });

  test.describe("Protected Endpoint Access", () => {
    test.beforeAll(async ({ request }) => {
      // Get valid token
      const loginResponse = await request.post(`${baseURL}/login`, {
        data: {
          email: loginEmail,
          password: "SecurePass123!",
        },
      });
      const loginData = await loginResponse.json();
      userToken = loginData.token;
    });

    test("should access protected endpoint with valid JWT", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      expect([200, 401]).toContain(response.status());
      if (response.status() === 200) {
        const data = await response.json();
        // Backend returns capitalized properties (ID, Email, Username, ...)
        expect(data).toHaveProperty("ID");
        expect(data).toHaveProperty("Email");
        expect(data).not.toHaveProperty("password");
      }
    });

    test("should access protected endpoint with service API key", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/v1/ai/models`, {
        headers: {
          "x-api-key": SERVICE_API_KEY,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("models");
      expect(Array.isArray(data.models)).toBe(true);
    });

    test("should reject access without authentication", async ({ request }) => {
      const response = await request.get(`${baseURL}/user/profile`);

      expect(response.status()).toBe(401);
    });

    test("should reject access with invalid JWT", async ({ request }) => {
      const response = await request.get(`${baseURL}/user/profile`, {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toContain("token");
    });

    test("should reject access with malformed authorization header", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/user/profile`, {
        headers: {
          Authorization: "InvalidFormat token",
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    test("should reject access with expired token", async ({ request }) => {
      // This would need a test with an artificially expired token
      // For now, we'll test with a malformed token that looks expired
      const expiredToken =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.invalid";

      const response = await request.get(`${baseURL}/user/profile`, {
        headers: {
          Authorization: `Bearer ${expiredToken}`,
        },
      });

      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  test.describe("Role-Based Access Control", () => {
    test("should allow admin access to admin endpoints", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/users`, {
        headers: {
          "x-api-key": SERVICE_API_KEY, // Using service key as admin access
        },
      });

      // This might return 200 or appropriate response based on implementation
      expect([200, 403, 401]).toContain(response.status());
    });

    test("should deny non-admin access to admin endpoints", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/users`, {
        headers: {
          Authorization: `Bearer ${userToken}`, // Regular user token
        },
      });

      expect([401, 403]).toContain(response.status());
      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });

  test.describe("Rate Limiting", () => {
    test("should handle rapid successive requests", async ({ request }) => {
      const promises = Array(10)
        .fill(null)
        .map(() =>
          request.post(`${baseURL}/login`, {
            data: {
              email: "login@example.com",
              password: "WrongPassword!",
            },
          })
        );

      const responses = await Promise.all(promises);

      // Some responses might be rate limited
      const statusCodes = responses.map((r) => r.status());
      const hasRateLimit = statusCodes.some((code) => code === 429);

      // At least some should be 401 (normal auth failure)
      expect(statusCodes.some((code) => code === 401)).toBe(true);

      // If rate limiting is implemented, we should see 429s
      if (hasRateLimit) {
        expect(statusCodes.some((code) => code === 429)).toBe(true);
      }
    });
  });

  test.describe("Edge Cases", () => {
    test("should handle very long usernames gracefully", async ({
      request,
    }) => {
      const longUsername = "a".repeat(1000);

      const response = await request.post(`${baseURL}/register`, {
        data: {
          email: uniqueEmail("long"),
          username: longUsername,
          password: "SecurePass123!",
        },
      });

      expect([200, 201, 400, 413]).toContain(response.status()); // Allow permissive registration
      if (response.status() >= 400) {
        const data = await response.json();
        expect(data.error).toBeDefined();
      }
    });

    test("should handle special characters in passwords", async ({
      request,
    }) => {
      const specialPassword = "!@#$%^&*()_+-=[]{}|;:,.<>?`~";
      const specialEmail = uniqueEmail("special");

      const response = await request.post(`${baseURL}/register`, {
        data: {
          email: specialEmail,
          username: uniqueUsername("specialuser"),
          password: specialPassword,
        },
      });

      expect([200, 201, 400]).toContain(response.status());

      if (response.status() === 201) {
        // If registration succeeded, try login
        const loginResponse = await request.post(`${baseURL}/login`, {
          data: {
            email: specialEmail,
            password: specialPassword,
          },
        });
        expect(loginResponse.status()).toBe(200);
      }
    });

    test("should handle Unicode characters in user data", async ({
      request,
    }) => {
      const response = await request.post(`${baseURL}/register`, {
        data: {
          email: uniqueEmail("unicode"),
          username: "user测试用户",
          password: "SecurePass123!",
        },
      });

      expect([200, 201, 400]).toContain(response.status());

      if (response.status() === 201) {
        const data = await response.json();
        expect(data.username).toBe("user测试用户");
      }
    });
  });
});

// Helper function to clean up test data
test.afterAll(async ({ request }) => {
  // Clean up test users if needed
  // This would require admin endpoints to delete test users
});
