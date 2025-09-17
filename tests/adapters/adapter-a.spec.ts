import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { getSeededAdminCredentials } from "../utils/test-helpers";

test.describe("AI Adapter A - Enhanced Features", () => {
  let baseURL = "http://localhost:8080";
  let adapterAURL = "http://localhost:8081";
  let authToken: string;

  test.beforeAll(async ({ request, apiBase }) => {
    baseURL = apiBase;
    // Login to get authentication token
    const loginResponse = await request.post(`${baseURL}/login`, {
      data: {
        ...getSeededAdminCredentials(),
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.token;
  });

  test.describe("Core AI Functionality", () => {
    test("should complete text with basic prompt", async ({ request }) => {
      const response = await request.post(`${adapterAURL}/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          prompt: "What is artificial intelligence?",
          max_tokens: 100,
          temperature: 0.7,
        },
      });

      expect([200, 429]).toContain(response.status());
      const data = await response.json();

      expect(data).toHaveProperty("completion");
      expect(data).toHaveProperty("usage");
      expect(data.usage).toHaveProperty("prompt_tokens");
      expect(data.usage).toHaveProperty("completion_tokens");
      expect(data.usage).toHaveProperty("total_tokens");
      expect(typeof data.completion).toBe("string");
      expect(data.completion.length).toBeGreaterThan(0);
    });

    test("should get model information", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/model`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("capabilities");
      expect(data).toHaveProperty("max_tokens");
      expect(data).toHaveProperty("supported_features");
      expect(Array.isArray(data.capabilities)).toBeTruthy();
    });

    test("should update model configuration", async ({ request }) => {
      const configUpdate = {
        temperature: 0.8,
        max_tokens: 150,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1,
      };

      const response = await request.put(`${adapterAURL}/model/config`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: configUpdate,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("updated_config");
      expect(data.updated_config.temperature).toBe(configUpdate.temperature);
      expect(data.updated_config.max_tokens).toBe(configUpdate.max_tokens);
      expect(data).toHaveProperty("applied_at");
    });

    test("should reload model", async ({ request }) => {
      const response = await request.post(`${adapterAURL}/model/reload`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data.status).toBe("reloading");
      expect(data).toHaveProperty("reload_id");
      expect(data).toHaveProperty("estimated_time");
    });

    test("should get model capabilities", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/model/capabilities`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("text_generation");
      expect(data).toHaveProperty("max_context_length");
      expect(data).toHaveProperty("supported_languages");
      expect(data).toHaveProperty("special_tokens");
      expect(Array.isArray(data.supported_languages)).toBeTruthy();
    });
  });

  test.describe("Health and Monitoring", () => {
    test("should return basic health status", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/health`);

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("uptime");
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    });

    test("should return performance metrics", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/metrics`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("requests_per_second");
      expect(data).toHaveProperty("average_response_time");
      expect(data).toHaveProperty("active_connections");
      expect(data).toHaveProperty("memory_usage");
      expect(data).toHaveProperty("cpu_usage");
      expect(data).toHaveProperty("queue_length");
      expect(typeof data.requests_per_second).toBe("number");
    });

    test("should return detailed status", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/status`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("service_status");
      expect(data).toHaveProperty("model_status");
      expect(data).toHaveProperty("system_resources");
      expect(data).toHaveProperty("performance_metrics");
      expect(data).toHaveProperty("last_request_time");
      expect(data.service_status).toHaveProperty("running");
      expect(typeof data.service_status.running).toBe("boolean");
    });
  });

  test.describe("Batch Processing", () => {
    test("should submit batch job", async ({ request }) => {
      const batchData = {
        requests: [
          {
            id: "req-1",
            prompt: "Explain machine learning",
            max_tokens: 50,
          },
          {
            id: "req-2",
            prompt: "What is deep learning?",
            max_tokens: 50,
          },
          {
            id: "req-3",
            prompt: "Define neural networks",
            max_tokens: 50,
          },
        ],
        priority: "normal",
        callback_url: "https://example.com/webhook",
      };

      const response = await request.post(`${adapterAURL}/batch`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: batchData,
      });

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("batch_id");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("total_requests");
      expect(data).toHaveProperty("estimated_completion");
      expect(data.status).toBe("queued");
      expect(data.total_requests).toBe(3);
    });

    test("should get batch job status", async ({ request }) => {
      // First create a batch job
      const batchData = {
        requests: [
          {
            id: "status-test",
            prompt: "Test prompt for status check",
            max_tokens: 10,
          },
        ],
      };

      const createResponse = await request.post(`${adapterAURL}/batch`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: batchData,
      });

      expect(createResponse.status()).toBe(202);
      const createData = await createResponse.json();
      const batchId = createData.batch_id;

      // Then check its status
      const statusResponse = await request.get(
        `${adapterAURL}/batch/${batchId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(statusResponse.status()).toBe(200);
      const statusData = await statusResponse.json();

      expect(statusData).toHaveProperty("batch_id");
      expect(statusData).toHaveProperty("status");
      expect(statusData).toHaveProperty("progress");
      expect(statusData).toHaveProperty("created_at");
      expect(statusData.batch_id).toBe(batchId);
      expect(["queued", "processing", "completed", "failed"]).toContain(
        statusData.status
      );
    });

    test("should cancel batch job", async ({ request }) => {
      // Create a batch job to cancel
      const batchData = {
        requests: [
          {
            id: "cancel-test",
            prompt: "This will be cancelled",
            max_tokens: 100,
          },
        ],
      };

      const createResponse = await request.post(`${adapterAURL}/batch`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: batchData,
      });

      expect(createResponse.status()).toBe(202);
      const createData = await createResponse.json();
      const batchId = createData.batch_id;

      // Cancel the batch job
      const cancelResponse = await request.delete(
        `${adapterAURL}/batch/${batchId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(cancelResponse.status()).toBe(200);
      const cancelData = await cancelResponse.json();

      expect(cancelData).toHaveProperty("batch_id");
      expect(cancelData).toHaveProperty("status");
      expect(cancelData.status).toBe("cancelled");
    });

    test("should reject empty batch request", async ({ request }) => {
      const response = await request.post(`${adapterAURL}/batch`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          requests: [], // Empty requests array
        },
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/requests.*empty|empty.*requests/i);
    });
  });

  test.describe("Queue Management", () => {
    test("should get queue status", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/queue`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("queue_length");
      expect(data).toHaveProperty("processing_time");
      expect(data).toHaveProperty("average_wait_time");
      expect(data).toHaveProperty("active_workers");
      expect(data).toHaveProperty("queue_status");
      expect(typeof data.queue_length).toBe("number");
      expect(typeof data.active_workers).toBe("number");
    });

    test("should clear queue", async ({ request }) => {
      const response = await request.post(`${adapterAURL}/queue/clear`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("cleared_items");
      expect(data.status).toBe("cleared");
      expect(typeof data.cleared_items).toBe("number");
    });

    test("should get queue statistics", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/queue/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("total_processed");
      expect(data).toHaveProperty("total_failed");
      expect(data).toHaveProperty("average_processing_time");
      expect(data).toHaveProperty("peak_queue_length");
      expect(data).toHaveProperty("throughput_per_hour");
      expect(typeof data.total_processed).toBe("number");
    });
  });

  test.describe("Performance Testing", () => {
    test("should run performance benchmark", async ({ request }) => {
      const benchmarkConfig = {
        test_type: "latency",
        duration: 30, // 30 seconds
        concurrent_requests: 5,
        prompt: "Benchmark test prompt",
        max_tokens: 50,
      };

      const response = await request.post(`${adapterAURL}/benchmark`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: benchmarkConfig,
      });

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("benchmark_id");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("estimated_duration");
      expect(data.status).toBe("running");
    });

    test("should get benchmark results", async ({ request }) => {
      // Start a benchmark
      const benchmarkConfig = {
        test_type: "throughput",
        duration: 10,
        concurrent_requests: 2,
        prompt: "Quick benchmark",
        max_tokens: 20,
      };

      const startResponse = await request.post(`${adapterAURL}/benchmark`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: benchmarkConfig,
      });

      expect(startResponse.status()).toBe(202);
      const startData = await startResponse.json();
      const benchmarkId = startData.benchmark_id;

      // Wait a bit for benchmark to process
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Get results
      const resultsResponse = await request.get(
        `${adapterAURL}/benchmark/${benchmarkId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(resultsResponse.status()).toBe(200);
      const resultsData = await resultsResponse.json();

      expect(resultsData).toHaveProperty("benchmark_id");
      expect(resultsData).toHaveProperty("status");
      expect(resultsData).toHaveProperty("results");
      expect(["running", "completed", "failed"]).toContain(resultsData.status);

      if (resultsData.status === "completed") {
        expect(resultsData.results).toHaveProperty("average_latency");
        expect(resultsData.results).toHaveProperty("throughput");
        expect(resultsData.results).toHaveProperty("total_requests");
        expect(resultsData.results).toHaveProperty("success_rate");
      }
    });

    test("should reject invalid benchmark configuration", async ({
      request,
    }) => {
      const invalidConfig = {
        test_type: "invalid_type",
        duration: -1, // Invalid duration
        concurrent_requests: 0, // Invalid concurrency
      };

      const response = await request.post(`${adapterAURL}/benchmark`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: invalidConfig,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/invalid.*config|config.*invalid/i);
    });
  });

  test.describe("Configuration Management", () => {
    test("should get current configuration", async ({ request }) => {
      const response = await request.get(`${adapterAURL}/config`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("model_config");
      expect(data).toHaveProperty("server_config");
      expect(data).toHaveProperty("performance_config");
      expect(data.model_config).toHaveProperty("temperature");
      expect(data.model_config).toHaveProperty("max_tokens");
      expect(data.server_config).toHaveProperty("max_concurrent_requests");
    });

    test("should update configuration", async ({ request }) => {
      const configUpdate = {
        model_config: {
          temperature: 0.5,
          max_tokens: 200,
          top_p: 0.8,
        },
        performance_config: {
          max_concurrent_requests: 20,
          request_timeout: 120,
        },
      };

      const response = await request.put(`${adapterAURL}/config`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: configUpdate,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("updated_config");
      expect(data).toHaveProperty("changes_applied");
      expect(data.updated_config.model_config.temperature).toBe(0.5);
      expect(data.updated_config.model_config.max_tokens).toBe(200);
    });

    test("should reset configuration to defaults", async ({ request }) => {
      const response = await request.post(`${adapterAURL}/config/reset`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("reset_config");
      expect(data.status).toBe("reset_complete");
      expect(data.reset_config).toHaveProperty("model_config");
      expect(data.reset_config).toHaveProperty("server_config");
    });

    test("should reject invalid configuration", async ({ request }) => {
      const invalidConfig = {
        model_config: {
          temperature: 2.5, // Invalid temperature (should be 0-2)
          max_tokens: -100, // Invalid max_tokens
        },
      };

      const response = await request.put(`${adapterAURL}/config`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: invalidConfig,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(
        /invalid.*config|config.*invalid|temperature|max_tokens/i
      );
    });
  });

  test.describe("Error Handling and Edge Cases", () => {
    test("should handle unauthorized requests", async ({ request }) => {
      const response = await request.post(`${adapterAURL}/complete`, {
        headers: {
          "Content-Type": "application/json",
          // No authorization header
        },
        data: {
          prompt: "Test prompt",
          max_tokens: 50,
        },
      });

      expect(response.status()).toBe(401);
    });

    test("should handle malformed JSON", async ({ request }) => {
      const response = await request.post(`${adapterAURL}/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: '{"prompt": "test", "max_tokens": invalid}', // Malformed JSON
      });

      expect(response.status()).toBe(400);
    });

    test("should handle very long prompts", async ({ request }) => {
      const longPrompt = "A".repeat(10000); // Very long prompt

      const response = await request.post(`${adapterAURL}/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          prompt: longPrompt,
          max_tokens: 50,
        },
      });

      // Should either handle gracefully or reject with appropriate error
      expect([200, 400, 413]).toContain(response.status());

      if (response.status() !== 200) {
        const error = await response.json();
        expect(error.error).toMatch(
          /prompt.*long|long.*prompt|limit.*exceeded/i
        );
      }
    });

    test("should handle concurrent requests", async ({ request }) => {
      const promises = Array.from({ length: 5 }, () =>
        request.post(`${adapterAURL}/complete`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            prompt: "Concurrent test prompt",
            max_tokens: 30,
          },
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 429, 503]).toContain(response.status()); // Success, Rate Limited, or Service Unavailable
      });
    });

    test("should handle non-existent batch job", async ({ request }) => {
      const response = await request.get(
        `${adapterAURL}/batch/non-existent-id`,
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

    test("should handle adapter service downtime gracefully", async ({
      request,
    }) => {
      // This test simulates what happens when trying to reach an unreachable adapter
      const unreachableURL = "http://localhost:9999"; // Non-existent port

      try {
        const response = await request.get(`${unreachableURL}/health`, {
          timeout: 2000, // Short timeout
        });
        // If we get here, the request unexpectedly succeeded
        expect([503, 502]).toContain(response.status());
      } catch (error) {
        // Network error is expected when service is down
        expect(error).toBeDefined();
      }
    });
  });
});
