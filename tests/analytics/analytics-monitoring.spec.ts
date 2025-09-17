import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";

test.describe("@contract Analytics & Monitoring", () => {
  // Fallbacks for tests still using request + headers
  let baseURL = "http://localhost:8080";
  let authToken: string;
  // Ensure legacy sections get proper values from fixtures
  test.beforeEach(async ({ adminToken, apiBase }) => {
    authToken = adminToken;
    baseURL = apiBase;
  });
  // We will use adminRequest (pre-authenticated) and apiBase from fixtures for refactored tests

  test.describe("Usage Analytics", () => {
    test("should get usage analytics with default parameters", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(`${apiBase}/v1/analytics/usage`);

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("total_requests");
      expect(data).toHaveProperty("unique_users");
      expect(data).toHaveProperty("requests_by_endpoint");
      expect(data).toHaveProperty("requests_by_method");
      expect(data).toHaveProperty("time_period");
      expect(data).toHaveProperty("generated_at");

      expect(typeof data.total_requests).toBe("number");
      expect(typeof data.unique_users).toBe("number");
      expect(Array.isArray(data.requests_by_endpoint)).toBeTruthy();
      expect(Array.isArray(data.requests_by_method)).toBeTruthy();
    });

    test("should get usage analytics with time filter", async ({
      adminRequest,
      apiBase,
    }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/usage?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.time_period.start).toBe(startDate.toISOString());
      expect(data.time_period.end).toBe(endDate.toISOString());
      expect(data).toHaveProperty("total_requests");
      expect(data).toHaveProperty("unique_users");
    });

    test("should reject invalid date range", async ({
      adminRequest,
      apiBase,
    }) => {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000); // End before start

      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/usage?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/date.*range|invalid.*date/i);
    });

    test("should handle malformed date parameters", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/usage?start_date=invalid-date&end_date=also-invalid`
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/date.*format|invalid.*date/i);
    });

    test("should filter by specific endpoint", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/usage?endpoint=/v1/workflows`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("endpoint_filter");
      expect(data.endpoint_filter).toBe("/v1/workflows");
      expect(data).toHaveProperty("total_requests");
    });

    test("should group by time period", async ({ adminRequest, apiBase }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/usage?group_by=hour`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("time_series");
      expect(Array.isArray(data.time_series)).toBeTruthy();

      if (data.time_series.length > 0) {
        expect(data.time_series[0]).toHaveProperty("timestamp");
        expect(data.time_series[0]).toHaveProperty("requests");
        expect(data.time_series[0]).toHaveProperty("unique_users");
      }
    });
  });

  test.describe("Performance Metrics", () => {
    test("should get performance metrics", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/performance`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("response_times");
      expect(data).toHaveProperty("throughput");
      expect(data).toHaveProperty("error_rates");
      expect(data).toHaveProperty("system_resources");

      // Validate response times structure
      expect(data.response_times).toHaveProperty("avg");
      expect(data.response_times).toHaveProperty("p50");
      expect(data.response_times).toHaveProperty("p95");
      expect(data.response_times).toHaveProperty("p99");
      expect(data.response_times).toHaveProperty("max");

      // Validate throughput structure
      expect(data.throughput).toHaveProperty("requests_per_second");
      expect(data.throughput).toHaveProperty("requests_per_minute");

      // Validate error rates
      expect(data.error_rates).toHaveProperty("total");
      expect(data.error_rates).toHaveProperty("by_status_code");

      // Validate system resources
      expect(data.system_resources).toHaveProperty("cpu_usage");
      expect(data.system_resources).toHaveProperty("memory_usage");
      expect(data.system_resources).toHaveProperty("active_connections");
    });

    test("should get performance metrics by endpoint", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/performance?endpoint=/v1/ai/complete`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("endpoint_filter");
      expect(data.endpoint_filter).toBe("/v1/ai/complete");
      expect(data).toHaveProperty("response_times");
      expect(data).toHaveProperty("throughput");
    });

    test("should get performance trends over time", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/performance?include_trends=true&period=24h`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("trends");
      expect(data.trends).toHaveProperty("response_time_trend");
      expect(data.trends).toHaveProperty("throughput_trend");
      expect(data.trends).toHaveProperty("error_rate_trend");

      expect(Array.isArray(data.trends.response_time_trend)).toBeTruthy();
      expect(Array.isArray(data.trends.throughput_trend)).toBeTruthy();
      expect(Array.isArray(data.trends.error_rate_trend)).toBeTruthy();
    });

    test("should validate performance thresholds", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/performance?check_thresholds=true`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("threshold_checks");
      expect(data.threshold_checks).toHaveProperty("response_time_status");
      expect(data.threshold_checks).toHaveProperty("error_rate_status");
      expect(data.threshold_checks).toHaveProperty("throughput_status");
      expect(data.threshold_checks).toHaveProperty("overall_health");

      expect(["healthy", "warning", "critical"]).toContain(
        data.threshold_checks.overall_health
      );
    });

    test("should handle missing endpoint in performance query", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/performance?endpoint=/non/existent/endpoint`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Should return zero/empty metrics for non-existent endpoint
      expect(data.endpoint_filter).toBe("/non/existent/endpoint");
      expect(data.response_times.avg).toBe(0);
      expect(data.throughput.requests_per_second).toBe(0);
    });
  });

  test.describe("Error Analytics", () => {
    test("should get error analytics", async ({ adminRequest, apiBase }) => {
      const response = await adminRequest.get(`${apiBase}/v1/analytics/errors`);

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("total_errors");
      expect(data).toHaveProperty("error_rate");
      expect(data).toHaveProperty("errors_by_status_code");
      expect(data).toHaveProperty("errors_by_endpoint");
      expect(data).toHaveProperty("recent_errors");
      expect(data).toHaveProperty("time_period");

      expect(typeof data.total_errors).toBe("number");
      expect(typeof data.error_rate).toBe("number");
      expect(Array.isArray(data.errors_by_status_code)).toBeTruthy();
      expect(Array.isArray(data.errors_by_endpoint)).toBeTruthy();
      expect(Array.isArray(data.recent_errors)).toBeTruthy();
    });

    test("should filter errors by status code", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/errors?status_code=500`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status_code_filter");
      expect(data.status_code_filter).toBe(500);
      expect(data).toHaveProperty("total_errors");

      // All errors should be of the filtered status code
      if (data.recent_errors.length > 0) {
        data.recent_errors.forEach((error: any) => {
          expect(error.status_code).toBe(500);
        });
      }
    });

    test("should filter errors by endpoint", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/errors?endpoint=/v1/workflows`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("endpoint_filter");
      expect(data.endpoint_filter).toBe("/v1/workflows");
      expect(data).toHaveProperty("total_errors");
    });

    test("should get error trends over time", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/errors?include_trends=true&group_by=hour`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("error_trends");
      expect(Array.isArray(data.error_trends)).toBeTruthy();

      if (data.error_trends.length > 0) {
        expect(data.error_trends[0]).toHaveProperty("timestamp");
        expect(data.error_trends[0]).toHaveProperty("error_count");
        expect(data.error_trends[0]).toHaveProperty("error_rate");
      }
    });

    test("should limit recent errors count", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/errors?limit=5`
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.recent_errors.length).toBeLessThanOrEqual(5);
      expect(data).toHaveProperty("limit");
      expect(data.limit).toBe(5);
    });

    test("should handle invalid limit parameter", async ({
      adminRequest,
      apiBase,
    }) => {
      const response = await adminRequest.get(
        `${apiBase}/v1/analytics/errors?limit=invalid`
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/limit.*invalid|invalid.*limit/i);
    });
  });

  test.describe("Custom Event Tracking", () => {
    test("should track custom event", async ({ request }) => {
      const eventData = {
        event_type: "user_action",
        event_name: "workflow_created",
        user_id: "test-user-123",
        properties: {
          workflow_type: "approval",
          steps_count: 3,
          priority: "high",
        },
        metadata: {
          source: "api-test",
          session_id: "test-session-456",
        },
      };

      const response = await request.post(`${baseURL}/v1/analytics/events`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: eventData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("event_id");
      expect(data).toHaveProperty("status");
      expect(data.status).toBe("recorded");
      expect(data).toHaveProperty("timestamp");
      expect(data.event_type).toBe(eventData.event_type);
      expect(data.event_name).toBe(eventData.event_name);
    });

    test("should reject event with missing required fields", async ({
      request,
    }) => {
      const invalidEvent = {
        event_name: "test_event",
        // Missing event_type
        properties: {
          test: "value",
        },
      };

      const response = await request.post(`${baseURL}/v1/analytics/events`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidEvent,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("event_type");
    });

    test("should reject event with invalid event_type", async ({ request }) => {
      const invalidEvent = {
        event_type: "invalid-type-with-special-chars!",
        event_name: "test_event",
        user_id: "test-user",
      };

      const response = await request.post(`${baseURL}/v1/analytics/events`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidEvent,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/event_type.*invalid|invalid.*event_type/i);
    });

    test("should handle batch event tracking", async ({ request }) => {
      const batchEvents = {
        events: [
          {
            event_type: "user_action",
            event_name: "login",
            user_id: "user1",
            timestamp: new Date().toISOString(),
          },
          {
            event_type: "user_action",
            event_name: "workflow_viewed",
            user_id: "user1",
            properties: { workflow_id: "wf-123" },
          },
          {
            event_type: "system_event",
            event_name: "api_call",
            properties: { endpoint: "/v1/workflows", method: "GET" },
          },
        ],
      };

      const response = await request.post(
        `${baseURL}/v1/analytics/events/batch`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: batchEvents,
        }
      );

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("batch_id");
      expect(data).toHaveProperty("events_received");
      expect(data.events_received).toBe(3);
      expect(data).toHaveProperty("status");
      expect(data.status).toBe("processing");
    });

    test("should validate event properties size limits", async ({
      request,
    }) => {
      const largeEvent = {
        event_type: "test_event",
        event_name: "large_properties_test",
        user_id: "test-user",
        properties: {
          large_data: "x".repeat(10000), // Very large property
        },
      };

      const response = await request.post(`${baseURL}/v1/analytics/events`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: largeEvent,
      });

      // Should either accept or reject with size limit error
      expect([201, 400, 413]).toContain(response.status());

      if (response.status() !== 201) {
        const error = await response.json();
        expect(error.error).toMatch(/size.*limit|too.*large|payload.*large/i);
      }
    });

    test("should handle event with custom timestamp", async ({ request }) => {
      const customTimestamp = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago

      const eventData = {
        event_type: "user_action",
        event_name: "backdated_event",
        user_id: "test-user",
        timestamp: customTimestamp,
        properties: {
          note: "This event happened in the past",
        },
      };

      const response = await request.post(`${baseURL}/v1/analytics/events`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: eventData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data.timestamp).toBe(customTimestamp);
      expect(data).toHaveProperty("event_id");
    });
  });

  test.describe("Analytics Security & Authorization", () => {
    test("should deny access without authentication", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/analytics/usage`);

      expect(response.status()).toBe(401);
    });

    test("should deny access with invalid token", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/analytics/usage`, {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("should handle rate limiting for analytics endpoints", async ({
      request,
    }) => {
      // Make many rapid requests to test rate limiting
      const promises = Array.from({ length: 20 }, () =>
        request.get(`${baseURL}/v1/analytics/usage`, {
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

  test.describe("Analytics Performance & Edge Cases", () => {
    test("should handle very large date ranges", async ({ request }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 year ago

      const response = await request.get(
        `${baseURL}/v1/analytics/usage?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Should either handle gracefully or reject with appropriate error
      expect([200, 400, 422]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty("total_requests");
      } else {
        const error = await response.json();
        expect(error.error).toMatch(/range.*large|too.*long|limit.*exceeded/i);
      }
    });

    test("should respond quickly to analytics requests", async ({
      request,
    }) => {
      const startTime = Date.now();

      const response = await request.get(`${baseURL}/v1/analytics/usage`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
    });

    test("should handle concurrent analytics requests", async ({ request }) => {
      const promises = [
        request.get(`${baseURL}/v1/analytics/usage`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        request.get(`${baseURL}/v1/analytics/performance`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
        request.get(`${baseURL}/v1/analytics/errors`, {
          headers: { Authorization: `Bearer ${authToken}` },
        }),
      ];

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status()); // Success or rate limited
      });
    });

    test("should handle future dates gracefully", async ({ request }) => {
      const startDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000); // Day after tomorrow

      const response = await request.get(
        `${baseURL}/v1/analytics/usage?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect([200, 400]).toContain(response.status());

      if (response.status() === 200) {
        const data = await response.json();
        expect(data.total_requests).toBe(0); // Should have no data for future dates
      }
    });
  });
});
