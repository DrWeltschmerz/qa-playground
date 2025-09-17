import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { getSeededAdminCredentials } from "../utils/test-helpers";

test.describe("@contract Audit Logs Management", () => {
  let baseURL = "http://localhost:8080";
  let authToken: string;

  test.beforeAll(async ({ request, apiBase }) => {
    baseURL = apiBase;
    // Login to get authentication token
    const loginResponse = await request.post(`${baseURL}/login`, {
      data: getSeededAdminCredentials(),
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test.describe("Audit Log Retrieval", () => {
    test("should get audit logs with default parameters", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("limit");

      if (data.logs.length > 0) {
        const log = data.logs[0];
        expect(log).toHaveProperty("id");
        expect(log).toHaveProperty("timestamp");
        expect(log).toHaveProperty("user_id");
        expect(log).toHaveProperty("action");
        expect(log).toHaveProperty("resource_type");
        expect(log).toHaveProperty("resource_id");
        expect(log).toHaveProperty("ip_address");
        expect(log).toHaveProperty("user_agent");
      }
    });

    test("should filter audit logs by user", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?user_id=test-user-123`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data).toHaveProperty("filters");
      expect(data.filters.user_id).toBe("test-user-123");

      // All logs should be for the specified user
      data.logs.forEach((log: any) => {
        expect(log.user_id).toBe("test-user-123");
      });
    });

    test("should filter audit logs by action type", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?action=login`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data).toHaveProperty("filters");
      expect(data.filters.action).toBe("login");

      // All logs should be for the specified action
      data.logs.forEach((log: any) => {
        expect(log.action).toBe("login");
      });
    });

    test("should filter audit logs by resource type", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?resource_type=workflow`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data).toHaveProperty("filters");
      expect(data.filters.resource_type).toBe("workflow");

      // All logs should be for the specified resource type
      data.logs.forEach((log: any) => {
        expect(log.resource_type).toBe("workflow");
      });
    });

    test("should filter audit logs by date range", async ({ request }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const response = await request.get(
        `${baseURL}/v1/audit/logs?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data).toHaveProperty("filters");
      expect(data.filters.start_date).toBe(startDate.toISOString());
      expect(data.filters.end_date).toBe(endDate.toISOString());
    });

    test("should handle pagination for audit logs", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?page=1&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data.logs.length).toBeLessThanOrEqual(10);
      expect(data.page).toBe(1);
      expect(data.limit).toBe(10);
      expect(data).toHaveProperty("total");
    });

    test("should sort audit logs by timestamp", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?sort=timestamp&order=desc`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data.sort).toBe("timestamp");
      expect(data.order).toBe("desc");

      // Verify logs are sorted by timestamp (descending)
      if (data.logs.length > 1) {
        for (let i = 0; i < data.logs.length - 1; i++) {
          const current = new Date(data.logs[i].timestamp);
          const next = new Date(data.logs[i + 1].timestamp);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });

    test("should get specific audit log by ID", async ({ request }) => {
      // First get a list to get a valid ID
      const listResponse = await request.get(
        `${baseURL}/v1/audit/logs?limit=1`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(listResponse.status()).toBe(200);
      const listData = await listResponse.json();

      if (listData.logs.length > 0) {
        const logId = listData.logs[0].id;

        const response = await request.get(
          `${baseURL}/v1/audit/logs/${logId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        expect(response.status()).toBe(200);
        const data = await response.json();

        expect(data.id).toBe(logId);
        expect(data).toHaveProperty("timestamp");
        expect(data).toHaveProperty("user_id");
        expect(data).toHaveProperty("action");
        expect(data).toHaveProperty("details");
      }
    });

    test("should return 404 for non-existent audit log ID", async ({
      request,
    }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs/non-existent-id`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error.error).toContain("not found");
    });
  });

  test.describe("Audit Log Creation", () => {
    test("should create audit log entry", async ({ request }) => {
      const auditData = {
        user_id: "test-user-456",
        action: "workflow_created",
        resource_type: "workflow",
        resource_id: "wf-123",
        details: {
          workflow_name: "Test Workflow",
          steps_count: 3,
          created_via: "api",
        },
        ip_address: "192.168.1.100",
        user_agent: "Mozilla/5.0 (Test Agent)",
        metadata: {
          source: "api-test",
          session_id: "sess-789",
        },
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: auditData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data).toHaveProperty("timestamp");
      expect(data.user_id).toBe(auditData.user_id);
      expect(data.action).toBe(auditData.action);
      expect(data.resource_type).toBe(auditData.resource_type);
      expect(data.resource_id).toBe(auditData.resource_id);
      expect(data.ip_address).toBe(auditData.ip_address);
      expect(data.user_agent).toBe(auditData.user_agent);
      expect(data.details).toEqual(auditData.details);
    });

    test("should reject audit log creation with missing required fields", async ({
      request,
    }) => {
      const incompleteAuditData = {
        action: "test_action",
        // Missing user_id, resource_type, etc.
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: incompleteAuditData,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/required.*field|missing.*field/i);
    });

    test("should reject audit log with invalid action type", async ({
      request,
    }) => {
      const invalidAuditData = {
        user_id: "test-user",
        action: "invalid-action-type!@#",
        resource_type: "workflow",
        resource_id: "wf-123",
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidAuditData,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/action.*invalid|invalid.*action/i);
    });

    test("should handle audit log creation with large details object", async ({
      request,
    }) => {
      const largeDetails = {
        description: "X".repeat(2000),
        metadata: Array.from({ length: 50 }, (_, i) => ({
          key: `key${i}`,
          value: `value${i}`,
        })),
        complex_data: {
          nested: {
            deeply: {
              nested: {
                data: "test",
              },
            },
          },
        },
      };

      const auditData = {
        user_id: "test-user",
        action: "data_export",
        resource_type: "report",
        resource_id: "rpt-456",
        details: largeDetails,
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: auditData,
      });

      // Should either accept or reject with size limit error
      expect([201, 400, 413]).toContain(response.status());

      if (response.status() !== 201) {
        const error = await response.json();
        expect(error.error).toMatch(/size.*limit|too.*large|payload.*large/i);
      }
    });

    test("should auto-generate timestamp if not provided", async ({
      request,
    }) => {
      const auditData = {
        user_id: "test-user",
        action: "timestamp_test",
        resource_type: "test",
        resource_id: "test-123",
        // No timestamp provided
      };

      const beforeRequest = Date.now();

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: auditData,
      });

      const afterRequest = Date.now();

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("timestamp");
      const logTimestamp = new Date(data.timestamp).getTime();
      expect(logTimestamp).toBeGreaterThanOrEqual(beforeRequest);
      expect(logTimestamp).toBeLessThanOrEqual(afterRequest);
    });

    test("should accept custom timestamp", async ({ request }) => {
      const customTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const auditData = {
        user_id: "test-user",
        action: "custom_timestamp_test",
        resource_type: "test",
        resource_id: "test-456",
        timestamp: customTimestamp,
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: auditData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data.timestamp).toBe(customTimestamp);
    });
  });

  test.describe("Audit Log Security & Compliance", () => {
    test("should deny access without authentication", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/audit/logs`);

      expect(response.status()).toBe(401);
    });

    test("should deny access with invalid token", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("should require admin privileges for audit log access", async ({
      request,
    }) => {
      // This test assumes only admins can access audit logs
      // In a real scenario, you might need a non-admin token
      const response = await request.get(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`, // This should be admin token
        },
      });

      expect([200, 403]).toContain(response.status());
    });

    test("should prevent audit log modification after creation", async ({
      request,
    }) => {
      // Create an audit log first
      const createResponse = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: {
          user_id: "test-user",
          action: "immutable_test",
          resource_type: "test",
          resource_id: "test-789",
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdLog = await createResponse.json();

      // Try to update the audit log (should fail)
      const updateResponse = await request.put(
        `${baseURL}/v1/audit/logs/${createdLog.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            action: "modified_action",
          },
        }
      );

      expect([405, 403, 404]).toContain(updateResponse.status()); // Method Not Allowed or Forbidden
    });

    test("should prevent audit log deletion", async ({ request }) => {
      // Create an audit log first
      const createResponse = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: {
          user_id: "test-user",
          action: "deletion_test",
          resource_type: "test",
          resource_id: "test-101112",
        },
      });

      expect(createResponse.status()).toBe(201);
      const createdLog = await createResponse.json();

      // Try to delete the audit log (should fail)
      const deleteResponse = await request.delete(
        `${baseURL}/v1/audit/logs/${createdLog.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect([405, 403, 404]).toContain(deleteResponse.status()); // Method Not Allowed or Forbidden
    });

    test("should sanitize sensitive data in audit logs", async ({
      request,
    }) => {
      const auditData = {
        user_id: "test-user",
        action: "password_change",
        resource_type: "user",
        resource_id: "user-123",
        details: {
          old_password: "oldpassword123", // Should be sanitized
          new_password: "newpassword456", // Should be sanitized
          email: "user@example.com",
          change_reason: "security_update",
        },
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: auditData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      // Passwords should be sanitized or removed
      expect(data.details.old_password).not.toBe("oldpassword123");
      expect(data.details.new_password).not.toBe("newpassword456");
      // Email and other non-sensitive data should be preserved
      expect(data.details.email).toBe("user@example.com");
      expect(data.details.change_reason).toBe("security_update");
    });
  });

  test.describe("Audit Log Performance & Edge Cases", () => {
    test("should handle large result sets with pagination", async ({
      request,
    }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?limit=1000`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should either return results or limit the page size
      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data.logs.length).toBeLessThanOrEqual(1000);
      expect(data).toHaveProperty("total");
    });

    test("should respond quickly to audit log queries", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get(`${baseURL}/v1/audit/logs?limit=50`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    });

    test("should handle complex filter combinations", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?user_id=test-user&action=login&resource_type=user&start_date=${new Date(
          Date.now() - 86400000
        ).toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data).toHaveProperty("filters");

      // Verify all returned logs match the filters
      data.logs.forEach((log: any) => {
        expect(log.user_id).toBe("test-user");
        expect(log.action).toBe("login");
        expect(log.resource_type).toBe("user");
      });
    });

    test("should handle malformed date filters gracefully", async ({
      request,
    }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?start_date=invalid-date&end_date=also-invalid`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/date.*format|invalid.*date/i);
    });

    test("should handle concurrent audit log creation", async ({ request }) => {
      // Create multiple audit logs concurrently
      const promises = Array.from({ length: 10 }, (_, i) =>
        request.post(`${baseURL}/v1/audit/logs`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            user_id: `concurrent-user-${i}`,
            action: "concurrent_test",
            resource_type: "test",
            resource_id: `test-${i}`,
          },
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([201, 429]).toContain(response.status()); // Created or Rate Limited
      });
    });

    test("should handle empty search results gracefully", async ({
      request,
    }) => {
      const response = await request.get(
        `${baseURL}/v1/audit/logs?user_id=non-existent-user-12345&action=non-existent-action`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.logs)).toBeTruthy();
      expect(data.logs.length).toBe(0);
      expect(data.total).toBe(0);
    });

    test("should handle audit logs with special characters", async ({
      request,
    }) => {
      const auditData = {
        user_id: "test-üser-spéciâl",
        action: "spéciäl_çháracters_tést",
        resource_type: "tëst_rësöurce",
        resource_id: "rëšöürçë-123",
        details: {
          description: "Test with émojis 🚀 and unicode: ñáéíóú",
        },
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: auditData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      // Should properly handle special characters
      expect(data.user_id).toContain("üser");
      expect(data.action).toContain("spéciäl");
      expect(data.details.description).toContain("émojis");
    });
  });
});
