/**
 * Test utilities for generating dynamic test data and common test operations
 */

export interface TestUser {
  email: string;
  username: string;
  password: string;
}

export interface AdminCredentials {
  email: string;
  password: string;
}

/**
 * Create a short unique suffix for IDs/emails/usernames
 */
export function uniqueSuffix(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}${random}`;
}

/**
 * Generate a unique email suitable for tests
 */
export function uniqueEmail(prefix: string = "user"): string {
  return `${prefix}-${uniqueSuffix()}@example.com`;
}

/**
 * Generate a unique username suitable for tests
 */
export function uniqueUsername(prefix: string = "user"): string {
  return `${prefix}-${uniqueSuffix()}`;
}

/**
 * Generate a unique test user with timestamp-based identifiers
 */
export function generateTestUser(prefix: string = "test"): TestUser {
  return {
    email: uniqueEmail(prefix),
    username: uniqueUsername(`${prefix}user`),
    password: "SecurePass123!",
  };
}

/**
 * Generate a unique admin user for testing
 */
export function generateAdminUser(): TestUser {
  return generateTestUser("admin");
}

/**
 * Get predefined admin credentials (seeded admin user)
 */
export function getSeededAdminCredentials(): AdminCredentials {
  return {
    email: "admin@example.com",
    password: "adminpass",
  };
}

/**
 * Login helper function
 */
export async function loginUser(
  request: any,
  credentials: { email: string; password: string },
  baseURL: string = API_CONFIG.BASE_URL
) {
  const response = await request.post(`${baseURL}/login`, {
    data: credentials,
  });

  if (!response.ok()) {
    throw new Error(
      `Login failed: ${response.status()} ${await response.text()}`
    );
  }

  const data = await response.json();
  return data.token;
}

/**
 * Register a new user and return the user data
 */
export async function registerUser(
  request: any,
  user: TestUser,
  baseURL: string = API_CONFIG.BASE_URL
) {
  const response = await request.post(`${baseURL}/register`, {
    data: user,
  });

  if (!response.ok()) {
    throw new Error(
      `Registration failed: ${response.status()} ${await response.text()}`
    );
  }

  return response.json();
}

/**
 * Register a user and get their auth token in one step
 */
export async function registerAndLoginUser(
  request: any,
  user?: TestUser,
  baseURL: string = API_CONFIG.BASE_URL
) {
  const testUser = user || generateTestUser();
  await registerUser(request, testUser, baseURL);
  const token = await loginUser(
    request,
    {
      email: testUser.email,
      password: testUser.password,
    },
    baseURL
  );
  return { user: testUser, token };
}

/**
 * Get admin auth token using seeded admin credentials
 */
export async function getAdminToken(
  request: any,
  baseURL: string = API_CONFIG.BASE_URL
) {
  const adminCreds = getSeededAdminCredentials();
  return loginUser(request, adminCreds, baseURL);
}

/**
 * Generate unique resource names for testing
 */
export function generateResourceName(prefix: string = "test"): string {
  return `${prefix}-${uniqueSuffix()}`;
}

/**
 * Generate unique notification data
 */
export function generateNotificationData(recipient?: string) {
  const id = generateResourceName("notif");
  return {
    title: `Test Notification ${id}`,
    message: `This is a test notification created at ${new Date().toISOString()}`,
    type: "info",
    priority: "medium",
    recipient: recipient || uniqueEmail("notif-user"),
  };
}

/**
 * Generate unique workflow data
 */
export function generateWorkflowData() {
  const id = generateResourceName("workflow");
  return {
    name: `Test Workflow ${id}`,
    description: `Test workflow created at ${new Date().toISOString()}`,
    steps: [
      {
        id: "step1",
        name: "Initial Step",
        type: "manual",
        description: "First step in the workflow",
      },
      {
        id: "step2",
        name: "Processing Step",
        type: "automated",
        description: "Automated processing step",
      },
    ],
  };
}

/**
 * Generate unique audit log data
 */
export function generateAuditLogData(userId?: string) {
  const id = generateResourceName("audit");
  return {
    action: "test.action",
    user_id: userId || "test-user",
    resource_type: "test_resource",
    resource_id: `resource-${id}`,
    details: {
      test: true,
      timestamp: new Date().toISOString(),
      action_id: id,
    },
  };
}

/**
 * Wait for a condition to be true with timeout
 */
export async function waitFor(
  condition: () => Promise<boolean>,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  throw new Error(`Condition not met within ${timeout}ms`);
}

/**
 * Common API constants
 */
export const API_CONFIG = {
  BASE_URL: "http://localhost:8080",
  SERVICE_API_KEY: "service-secret",
  TIMEOUT: 10000,
} as const;
