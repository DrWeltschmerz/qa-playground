import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { getSeededAdminCredentials } from "../utils/test-helpers";

test.describe("Integration Tests - Gateway & Adapters", () => {
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

  test.describe("Gateway Proxy to Adapter A", () => {
    test("should proxy completion request to Adapter A", async ({
      request,
    }) => {
      const response = await request.post(`${baseURL}/v1/adapter-a/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          prompt: "What is machine learning?",
          max_tokens: 100,
          temperature: 0.7,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("completion");
      expect(data).toHaveProperty("usage");
      expect(typeof data.completion).toBe("string");
    });

    test("should proxy model info request to Adapter A", async ({
      request,
    }) => {
      const response = await request.get(`${baseURL}/v1/adapter-a/model`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("name");
      expect(data).toHaveProperty("capabilities");
    });

    test("should proxy batch request to Adapter A", async ({ request }) => {
      const batchData = {
        requests: [
          {
            id: "req-1",
            prompt: "Test prompt 1",
            max_tokens: 50,
          },
          {
            id: "req-2",
            prompt: "Test prompt 2",
            max_tokens: 50,
          },
        ],
      };

      const response = await request.post(`${baseURL}/v1/adapter-a/batch`, {
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
    });

    test("should proxy health check to Adapter A", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/adapter-a/health`);

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
    });

    test("should proxy metrics request to Adapter A", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/adapter-a/metrics`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("requests_per_second");
      expect(data).toHaveProperty("average_response_time");
    });
  });

  test.describe("Gateway Proxy to Adapter B", () => {
    test("should proxy completion request to Adapter B", async ({
      request,
    }) => {
      const response = await request.post(`${baseURL}/v1/adapter-b/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          prompt: "Explain artificial intelligence",
          max_tokens: 150,
          temperature: 0.8,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("completion");
      expect(data).toHaveProperty("usage");
    });

    test("should proxy chat completion request to Adapter B", async ({
      request,
    }) => {
      const chatData = {
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant.",
          },
          {
            role: "user",
            content: "Hello, how are you?",
          },
        ],
        max_tokens: 100,
      };

      const response = await request.post(
        `${baseURL}/v1/adapter-b/chat/completions`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: chatData,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("choices");
      expect(Array.isArray(data.choices)).toBeTruthy();
    });

    test("should proxy sentiment analysis to Adapter B", async ({
      request,
    }) => {
      const response = await request.post(
        `${baseURL}/v1/adapter-b/analyze/sentiment`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            text: "I love this new technology!",
            options: {
              include_confidence: true,
            },
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("sentiment");
      expect(data).toHaveProperty("confidence");
    });

    test("should proxy translation request to Adapter B", async ({
      request,
    }) => {
      const response = await request.post(`${baseURL}/v1/adapter-b/translate`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          text: "Hello world",
          source_language: "en",
          target_language: "es",
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("translated_text");
      expect(data).toHaveProperty("source_language");
      expect(data).toHaveProperty("target_language");
    });

    test("should proxy streaming session creation to Adapter B", async ({
      request,
    }) => {
      const response = await request.post(
        `${baseURL}/v1/adapter-b/stream/session`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            session_type: "completion",
            configuration: {
              max_tokens: 200,
              temperature: 0.7,
            },
          },
        }
      );

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("session_id");
      expect(data).toHaveProperty("websocket_url");
    });
  });

  test.describe("Cross-Service Workflows", () => {
    test("should create workflow with AI completion steps", async ({
      request,
    }) => {
      const workflowData = {
        name: "AI Content Generation Workflow",
        description: "Workflow that uses both adapters for content processing",
        steps: [
          {
            id: "generate_content",
            name: "Generate Initial Content",
            type: "ai_completion",
            adapter: "adapter-a",
            config: {
              prompt: "Write a brief introduction about renewable energy",
              max_tokens: 200,
            },
          },
          {
            id: "analyze_sentiment",
            name: "Analyze Content Sentiment",
            type: "ai_analysis",
            adapter: "adapter-b",
            config: {
              analysis_type: "sentiment",
              input_from_step: "generate_content",
            },
          },
          {
            id: "translate_content",
            name: "Translate to Spanish",
            type: "ai_translation",
            adapter: "adapter-b",
            config: {
              target_language: "es",
              input_from_step: "generate_content",
            },
          },
          {
            id: "final_review",
            name: "Human Review",
            type: "manual",
            assignee: "reviewer@example.com",
          },
        ],
      };

      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: workflowData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data.name).toBe(workflowData.name);
      expect(data.steps).toHaveLength(4);
      expect(data.status).toBe("draft");
    });

    test("should execute multi-adapter workflow", async ({ request }) => {
      // First create the workflow
      const workflowData = {
        name: "Multi-Adapter Test Workflow",
        description: "Tests both adapters in sequence",
        steps: [
          {
            id: "step1",
            name: "Generate with Adapter A",
            type: "ai_completion",
            adapter: "adapter-a",
          },
          {
            id: "step2",
            name: "Analyze with Adapter B",
            type: "ai_analysis",
            adapter: "adapter-b",
          },
        ],
      };

      const createResponse = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: workflowData,
      });

      expect(createResponse.status()).toBe(201);
      const createData = await createResponse.json();
      const workflowId = createData.id;

      // Execute the workflow
      const executeResponse = await request.post(
        `${baseURL}/v1/workflows/${workflowId}/execute`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            triggered_by: "integration-test@example.com",
            context: {
              test_type: "multi-adapter",
            },
          },
        }
      );

      expect(executeResponse.status()).toBe(202);
      const executeData = await executeResponse.json();

      expect(executeData).toHaveProperty("execution_id");
      expect(executeData.status).toBe("started");
    });

    test("should track analytics across all services", async ({ request }) => {
      // Make requests to different services
      await request.post(`${baseURL}/v1/adapter-a/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          prompt: "Analytics test prompt",
          max_tokens: 50,
        },
      });

      await request.post(`${baseURL}/v1/adapter-b/analyze/sentiment`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          text: "This is a test for analytics",
        },
      });

      // Wait a bit for analytics to be processed
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check analytics
      const analyticsResponse = await request.get(
        `${baseURL}/v1/analytics/usage`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(analyticsResponse.status()).toBe(200);
      const analyticsData = await analyticsResponse.json();

      expect(analyticsData).toHaveProperty("total_requests");
      expect(analyticsData.total_requests).toBeGreaterThan(0);
      expect(analyticsData).toHaveProperty("requests_by_endpoint");
    });

    test("should create notifications for workflow events", async ({
      request,
    }) => {
      // Create a notification about workflow completion
      const notificationData = {
        title: "Workflow Completed",
        message: "Multi-adapter workflow has completed successfully",
        type: "info",
        recipient: "admin@example.com",
        priority: "medium",
        metadata: {
          workflow_id: "test-workflow-123",
          adapters_used: ["adapter-a", "adapter-b"],
        },
      };

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: notificationData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data.title).toBe(notificationData.title);
      expect(data.metadata.adapters_used).toEqual(["adapter-a", "adapter-b"]);
    });

    test("should log audit events for cross-service operations", async ({
      request,
    }) => {
      // Create an audit log entry for cross-service operation
      const auditData = {
        event_type: "cross_service_operation",
        resource: "multi_adapter_workflow",
        action: "execute",
        user_id: "integration-test-user",
        metadata: {
          adapters_involved: ["adapter-a", "adapter-b"],
          workflow_id: "cross-service-test",
          execution_time: new Date().toISOString(),
        },
        details: {
          adapter_a_calls: 2,
          adapter_b_calls: 1,
          total_tokens_used: 450,
        },
      };

      const response = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: auditData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data.event_type).toBe("cross_service_operation");
      expect(data.metadata.adapters_involved).toEqual([
        "adapter-a",
        "adapter-b",
      ]);
    });
  });

  test.describe("Error Handling & Failover", () => {
    test("should handle adapter service downtime gracefully", async ({
      request,
    }) => {
      // Try to proxy to a non-existent adapter endpoint
      const response = await request.get(
        `${baseURL}/v1/adapter-a/non-existent-endpoint`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      // Should return appropriate error, not crash
      expect([404, 502, 503]).toContain(response.status());
    });

    test("should handle malformed proxy requests", async ({ request }) => {
      const response = await request.post(`${baseURL}/v1/adapter-b/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: '{"invalid": json malformed}', // Malformed JSON
      });

      expect(response.status()).toBe(400);
    });

    test("should handle unauthorized proxy requests", async ({ request }) => {
      const response = await request.post(`${baseURL}/v1/adapter-a/complete`, {
        headers: {
          "Content-Type": "application/json",
          // No authorization header
        },
        data: {
          prompt: "Test",
          max_tokens: 50,
        },
      });

      expect(response.status()).toBe(401);
    });

    test("should handle adapter timeout scenarios", async ({ request }) => {
      // This simulates a request that might timeout
      try {
        const response = await request.post(
          `${baseURL}/v1/adapter-a/complete`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${authToken}`,
            },
            data: {
              prompt: "Very long processing request that might timeout",
              max_tokens: 2000,
            },
            timeout: 5000, // 5 second timeout
          }
        );

        // Should either succeed or timeout gracefully
        expect([200, 408, 504]).toContain(response.status());
      } catch (error) {
        // Timeout error is acceptable
        expect(error).toBeDefined();
      }
    });

    test("should maintain gateway health despite adapter issues", async ({
      request,
    }) => {
      // Gateway health should remain healthy even if adapters have issues
      const response = await request.get(`${baseURL}/v1/admin/system/status`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("gateway_status");
      expect(data).toHaveProperty("adapter_statuses");
      expect(data.gateway_status).toHaveProperty("healthy");

      // Gateway should be healthy even if some adapters are not
      expect(data.gateway_status.healthy).toBe(true);
    });
  });

  test.describe("Performance & Load Testing", () => {
    test("should handle concurrent requests across adapters", async ({
      request,
    }) => {
      const promises = [
        // Adapter A requests
        request.post(`${baseURL}/v1/adapter-a/complete`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            prompt: "Concurrent test A1",
            max_tokens: 30,
          },
        }),
        request.post(`${baseURL}/v1/adapter-a/complete`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            prompt: "Concurrent test A2",
            max_tokens: 30,
          },
        }),
        // Adapter B requests
        request.post(`${baseURL}/v1/adapter-b/analyze/sentiment`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            text: "Concurrent sentiment test B1",
          },
        }),
        request.post(`${baseURL}/v1/adapter-b/analyze/sentiment`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            text: "Concurrent sentiment test B2",
          },
        }),
      ];

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect([200, 429, 503]).toContain(response.status());
        if (response.status() === 200) {
          console.log(`Request ${index + 1} succeeded`);
        }
      });
    });

    test("should measure end-to-end response times", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.post(`${baseURL}/v1/adapter-b/translate`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          text: "Performance test translation",
          source_language: "en",
          target_language: "fr",
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(10000); // Should complete within 10 seconds

      console.log(`End-to-end response time: ${responseTime}ms`);
    });

    test("should handle mixed workload efficiently", async ({ request }) => {
      // Simulate mixed workload: completions, analysis, workflows, notifications
      const workloadPromises = [
        // AI Completions
        request.post(`${baseURL}/v1/adapter-a/complete`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            prompt: "Mixed workload test 1",
            max_tokens: 50,
          },
        }),
        // Sentiment Analysis
        request.post(`${baseURL}/v1/adapter-b/analyze/sentiment`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            text: "Mixed workload sentiment test",
          },
        }),
        // Workflow creation
        request.post(`${baseURL}/v1/workflows/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            name: "Mixed Workload Test Workflow",
            description: "Performance test workflow",
            steps: [
              {
                id: "step1",
                name: "Test Step",
                type: "manual",
              },
            ],
          },
        }),
        // Notification creation
        request.post(`${baseURL}/v1/notifications/`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            title: "Mixed Workload Test",
            message: "Performance test notification",
            type: "info",
            recipient: "test@example.com",
          },
        }),
      ];

      const responses = await Promise.all(workloadPromises);

      responses.forEach((response, index) => {
        expect([200, 201, 202, 429]).toContain(response.status());
      });

      // At least half should succeed
      const successfulResponses = responses.filter((r) =>
        [200, 201, 202].includes(r.status())
      );
      expect(successfulResponses.length).toBeGreaterThanOrEqual(2);
    });
  });

  test.describe("Data Consistency & Validation", () => {
    test("should maintain data consistency across services", async ({
      request,
    }) => {
      const testId = `integration-test-${Date.now()}`;

      // Create a workflow
      const workflowResponse = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          name: `Data Consistency Test ${testId}`,
          description: "Testing data consistency",
          steps: [
            {
              id: "step1",
              name: "Test Step",
              type: "manual",
            },
          ],
        },
      });

      expect(workflowResponse.status()).toBe(201);
      const workflowData = await workflowResponse.json();

      // Create related notification
      const notificationResponse = await request.post(
        `${baseURL}/v1/notifications/`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            title: "Workflow Created",
            message: `Workflow ${workflowData.id} has been created`,
            type: "info",
            recipient: "test@example.com",
            metadata: {
              workflow_id: workflowData.id,
              test_id: testId,
            },
          },
        }
      );

      expect(notificationResponse.status()).toBe(201);
      const notificationData = await notificationResponse.json();

      // Create related audit log
      const auditResponse = await request.post(`${baseURL}/v1/audit/logs`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          event_type: "workflow_created",
          resource: "workflow",
          action: "create",
          user_id: "integration-test",
          metadata: {
            workflow_id: workflowData.id,
            notification_id: notificationData.id,
            test_id: testId,
          },
        },
      });

      expect(auditResponse.status()).toBe(201);

      // Verify relationships are maintained
      expect(notificationData.metadata.workflow_id).toBe(workflowData.id);

      const auditData = await auditResponse.json();
      expect(auditData.metadata.workflow_id).toBe(workflowData.id);
      expect(auditData.metadata.notification_id).toBe(notificationData.id);
    });

    test("should validate request/response schemas across proxy", async ({
      request,
    }) => {
      // Test that gateway properly validates and forwards requests
      const validRequest = {
        prompt: "Schema validation test",
        max_tokens: 100,
        temperature: 0.7,
      };

      const response = await request.post(`${baseURL}/v1/adapter-a/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: validRequest,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      // Verify response schema
      expect(data).toHaveProperty("completion");
      expect(data).toHaveProperty("usage");
      expect(typeof data.completion).toBe("string");
      expect(typeof data.usage.total_tokens).toBe("number");
    });
  });
});
