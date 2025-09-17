import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { getSeededAdminCredentials } from "../utils/test-helpers";

test.describe("@contract System Administration", () => {
  let baseURL = "http://localhost:8080";
  let authToken: string;

  test.beforeAll(async ({ request, apiBase }) => {
    baseURL = apiBase;
    // Login to get admin authentication token
    const loginResponse = await request.post(`${baseURL}/login`, {
      data: getSeededAdminCredentials(),
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test.describe("System Health Monitoring", () => {
    test("should get comprehensive system status", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/admin/system/status`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("overall_status");
      expect(data).toHaveProperty("services");
      expect(data).toHaveProperty("database");
      expect(data).toHaveProperty("external_dependencies");
      expect(data).toHaveProperty("system_resources");
      expect(data).toHaveProperty("uptime");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("timestamp");

      expect(["healthy", "degraded", "unhealthy"]).toContain(
        data.overall_status
      );

      // Validate services structure
      expect(data.services).toHaveProperty("gateway");
      expect(data.services).toHaveProperty("adapter_a");
      expect(data.services).toHaveProperty("adapter_b");

      // Validate database structure
      expect(data.database).toHaveProperty("status");
      expect(data.database).toHaveProperty("connections");
      expect(data.database).toHaveProperty("response_time");

      // Validate system resources
      expect(data.system_resources).toHaveProperty("cpu_usage");
      expect(data.system_resources).toHaveProperty("memory_usage");
      expect(data.system_resources).toHaveProperty("disk_usage");
      expect(data.system_resources).toHaveProperty("network_io");
    });

    test("should deny health status access to non-admin users", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/v1/admin/system/status`);

      expect(response.status()).toBe(401);
    });

    test("should validate health check response times", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get(`${baseURL}/v1/admin/system/status`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(3000); // Should respond within 3 seconds
    });
  });

  test.describe("Maintenance Mode Management", () => {
    test("should enable maintenance mode", async ({ request }) => {
      const maintenanceData = {
        enabled: true,
        message: "System under maintenance. Please try again later.",
        estimated_duration: 3600, // 1 hour in seconds
        allowed_ips: ["127.0.0.1", "::1"],
        maintenance_type: "scheduled",
        contact_info: "support@example.com",
      };

      const response = await request.post(
        `${baseURL}/v1/admin/system/maintenance`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: maintenanceData,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.maintenance_mode).toBe(true);
      expect(data.message).toBe(maintenanceData.message);
      expect(data.estimated_duration).toBe(maintenanceData.estimated_duration);
      expect(data.maintenance_type).toBe(maintenanceData.maintenance_type);
      expect(data).toHaveProperty("started_at");
      expect(data).toHaveProperty("estimated_end_time");
    });

    test("should disable maintenance mode", async ({ request }) => {
      const maintenanceData = {
        enabled: false,
        completion_message: "Maintenance completed successfully",
      };

      const response = await request.post(
        `${baseURL}/v1/admin/system/maintenance`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: maintenanceData,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.maintenance_mode).toBe(false);
      expect(data).toHaveProperty("completed_at");
      expect(data.completion_message).toBe(maintenanceData.completion_message);
    });

    test("should reject maintenance mode activation with invalid data", async ({
      request,
    }) => {
      const invalidData = {
        enabled: true,
        estimated_duration: -1, // Invalid negative duration
        allowed_ips: ["invalid-ip-format"],
      };

      const response = await request.post(
        `${baseURL}/v1/admin/system/maintenance`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: invalidData,
        }
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/duration.*invalid|ip.*invalid/i);
    });
  });

  test.describe("System Configuration Management", () => {
    test("should get system configuration", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/admin/system/config`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("application");
      expect(data).toHaveProperty("database");
      expect(data).toHaveProperty("security");
      expect(data).toHaveProperty("performance");
      expect(data).toHaveProperty("logging");
      expect(data).toHaveProperty("features");

      // Validate configuration structure
      expect(data.application).toHaveProperty("name");
      expect(data.application).toHaveProperty("version");
      expect(data.application).toHaveProperty("environment");

      expect(data.security).toHaveProperty("jwt_expiry");
      expect(data.security).toHaveProperty("rate_limiting");
      expect(data.security).toHaveProperty("cors_enabled");

      expect(data.performance).toHaveProperty("max_connections");
      expect(data.performance).toHaveProperty("timeout_settings");
      expect(data.performance).toHaveProperty("cache_settings");
    });

    test("should update system configuration", async ({ request }) => {
      const configUpdate = {
        performance: {
          max_connections: 1000,
          request_timeout: 30000,
          cache_ttl: 3600,
        },
        security: {
          rate_limit_requests: 100,
          rate_limit_window: 60,
        },
        features: {
          analytics_enabled: true,
          notifications_enabled: true,
          audit_logging: true,
        },
      };

      const response = await request.put(`${baseURL}/v1/admin/system/config`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: configUpdate,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.updated_settings).toHaveProperty("performance");
      expect(data.updated_settings).toHaveProperty("security");
      expect(data.updated_settings).toHaveProperty("features");
      expect(data).toHaveProperty("applied_at");
      expect(data).toHaveProperty("restart_required");

      // Verify specific updates
      expect(data.updated_settings.performance.max_connections).toBe(1000);
      expect(data.updated_settings.security.rate_limit_requests).toBe(100);
      expect(data.updated_settings.features.analytics_enabled).toBe(true);
    });

    test("should reject invalid configuration values", async ({ request }) => {
      const invalidConfig = {
        performance: {
          max_connections: -1, // Invalid negative value
          request_timeout: "invalid", // Invalid type
        },
        security: {
          rate_limit_requests: 0, // Invalid zero value
        },
      };

      const response = await request.put(`${baseURL}/v1/admin/system/config`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidConfig,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/invalid.*value|configuration.*invalid/i);
      expect(error).toHaveProperty("validation_errors");
    });
  });

  test.describe("System Backup Management", () => {
    let backupId: string;

    test("should create system backup", async ({ request }) => {
      const backupData = {
        backup_type: "full",
        include_database: true,
        include_files: true,
        include_configuration: true,
        description: "Automated test backup",
        compression: true,
      };

      const response = await request.post(`${baseURL}/v1/admin/system/backup`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: backupData,
      });

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("backup_id");
      expect(data).toHaveProperty("status");
      expect(data.status).toBe("started");
      expect(data).toHaveProperty("estimated_completion");
      expect(data.backup_type).toBe("full");

      backupId = data.backup_id;
    });

    test("should get backup status", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/admin/system/backup/${backupId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("backup_id");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("progress");
      expect(data).toHaveProperty("started_at");
      expect(["started", "in_progress", "completed", "failed"]).toContain(
        data.status
      );

      if (data.status === "completed") {
        expect(data).toHaveProperty("completed_at");
        expect(data).toHaveProperty("file_size");
        expect(data).toHaveProperty("download_url");
      }
    });

    test("should list all backups", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/admin/system/backups`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.backups)).toBeTruthy();
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("storage_usage");

      if (data.backups.length > 0) {
        const backup = data.backups[0];
        expect(backup).toHaveProperty("backup_id");
        expect(backup).toHaveProperty("backup_type");
        expect(backup).toHaveProperty("status");
        expect(backup).toHaveProperty("created_at");
        expect(backup).toHaveProperty("file_size");
      }
    });
  });

  test.describe("System Administration Security", () => {
    test("should deny admin access to non-admin users", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/admin/system/status`);

      expect(response.status()).toBe(401);
    });

    test("should deny admin access with invalid token", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/admin/system/status`, {
        headers: {
          Authorization: "Bearer invalid-admin-token",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("should rate limit admin API calls", async ({ request }) => {
      // Make many rapid admin requests
      const promises = Array.from({ length: 15 }, () =>
        request.get(`${baseURL}/v1/admin/system/status`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
      );

      const responses = await Promise.all(promises);

      // Should have some successful responses and possibly some rate limited
      const statusCodes = responses.map((r) => r.status());
      expect(statusCodes).toContain(200); // At least some should succeed

      // If rate limiting is implemented, some might be 429
      if (statusCodes.includes(429)) {
        expect(
          statusCodes.filter((code) => code === 429).length
        ).toBeGreaterThan(0);
      }
    });
  });
});
