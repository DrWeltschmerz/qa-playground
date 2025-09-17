import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { getSeededAdminCredentials } from "../utils/test-helpers";

test.describe.serial("Workflow Management", () => {
  let baseURL = "http://localhost:8080";
  let authToken: string;
  let workflowId: string;

  // Sample workflow data
  const validWorkflow = {
    name: "Test Workflow",
    description: "A test workflow for automated testing",
    steps: [
      {
        id: "step1",
        name: "Initial Review",
        type: "manual",
        assignee: "reviewer1@example.com",
        requirements: ["Document review completed"],
      },
      {
        id: "step2",
        name: "Technical Validation",
        type: "automated",
        script: "validate_technical.sh",
        timeout: 300,
      },
      {
        id: "step3",
        name: "Final Approval",
        type: "approval",
        approvers: ["manager@example.com"],
        requires_all: true,
      },
    ],
    metadata: {
      priority: "medium",
      category: "standard",
      estimated_duration: 1800,
    },
  };

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

  test.describe("Workflow CRUD Operations", () => {
    test("should create workflow with valid data", async ({ request }) => {
      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: validWorkflow,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data.name).toBe(validWorkflow.name);
      expect(data.description).toBe(validWorkflow.description);
      expect(data.steps).toHaveLength(validWorkflow.steps.length);
      expect(data.status).toBe("draft");
      expect(data).toHaveProperty("created_at");
      expect(data).toHaveProperty("updated_at");

      workflowId = data.id;
    });

    test("should reject workflow creation with missing name", async ({
      request,
    }) => {
      const invalidWorkflow = { ...validWorkflow };
      // Remove name property
      const { name, ...workflowWithoutName } = invalidWorkflow;

      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: workflowWithoutName,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("name");
    });

    test("should reject workflow creation with empty steps array", async ({
      request,
    }) => {
      const invalidWorkflow = {
        ...validWorkflow,
        steps: [],
      };

      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidWorkflow,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("steps");
    });

    test("should reject workflow creation with invalid step structure", async ({
      request,
    }) => {
      const invalidWorkflow = {
        ...validWorkflow,
        steps: [
          {
            id: "step1",
            // Missing required fields like 'name' and 'type'
          },
        ],
      };

      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidWorkflow,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("step");
    });

    test("should list workflows", async ({ request }) => {
      const headers = { Authorization: `Bearer ${authToken}` } as any;
      // Fetch first page to get total
      const pageSize = 50;
      let found = false;
      for (let attempt = 1; attempt <= 5 && !found; attempt++) {
        const first = await request.get(
          `${baseURL}/v1/workflows/?page=1&limit=${pageSize}`,
          { headers }
        );
        expect(first.status()).toBe(200);
        const firstData = await first.json();
        expect(Array.isArray(firstData.workflows)).toBeTruthy();
        const total: number = firstData.total ?? firstData.workflows.length;
        const pages = Math.max(1, Math.ceil(total / pageSize));
        const all: any[] = [...firstData.workflows];
        for (let p = 2; p <= pages; p++) {
          const res = await request.get(
            `${baseURL}/v1/workflows/?page=${p}&limit=${pageSize}`,
            { headers }
          );
          expect(res.status()).toBe(200);
          const pageData = await res.json();
          if (Array.isArray(pageData.workflows))
            all.push(...pageData.workflows);
        }
        found = all.some((w: any) => w.id === workflowId);
        if (!found) await new Promise((r) => setTimeout(r, 100));
      }
      expect(found).toBeTruthy();
    });

    test("should get workflow details by ID", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/workflows/${workflowId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(workflowId);
      expect(data.name).toBe(validWorkflow.name);
      expect(data.steps).toHaveLength(validWorkflow.steps.length);
      expect(data).toHaveProperty("execution_history");
      expect(data).toHaveProperty("current_step");
    });

    test("should return 404 for non-existent workflow", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/workflows/non-existent-id`,
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

    test("should update workflow", async ({ request }) => {
      const updatedWorkflow = {
        name: "Updated Test Workflow",
        description: "An updated test workflow",
        metadata: {
          ...validWorkflow.metadata,
          priority: "high",
        },
      };

      const response = await request.put(
        `${baseURL}/v1/workflows/${workflowId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: updatedWorkflow,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.name).toBe(updatedWorkflow.name);
      expect(data.description).toBe(updatedWorkflow.description);
      expect(data.metadata.priority).toBe("high");
      expect(data.updated_at).toBeDefined();
    });

    test("should reject update with invalid data", async ({ request }) => {
      const invalidUpdate = {
        name: "", // Empty name should be rejected
        steps: null, // Invalid steps
      };

      const response = await request.put(
        `${baseURL}/v1/workflows/${workflowId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: invalidUpdate,
        }
      );

      expect(response.status()).toBe(400);
    });
  });

  test.describe("Workflow Execution", () => {
    test("should execute workflow", async ({ request }) => {
      const executionData = {
        triggered_by: "test-user@example.com",
        context: {
          document_id: "doc-123",
          source: "api-test",
        },
        parameters: {
          priority: "high",
          deadline: "2025-09-20T10:00:00Z",
        },
      };

      const response = await request.post(
        `${baseURL}/v1/workflows/${workflowId}/execute`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: executionData,
        }
      );

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("execution_id");
      expect(data.status).toBe("started");
      expect(data.current_step).toBe("step1");
      expect(data.triggered_by).toBe(executionData.triggered_by);
      expect(data).toHaveProperty("started_at");
    });

    test("should reject execution of non-existent workflow", async ({
      request,
    }) => {
      const response = await request.post(
        `${baseURL}/v1/workflows/non-existent/execute`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            triggered_by: "test@example.com",
          },
        }
      );

      expect(response.status()).toBe(404);
    });

    test("should get workflow execution status", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/workflows/${workflowId}/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("current_step");
      expect(data).toHaveProperty("progress");
      expect(data).toHaveProperty("execution_history");
      expect(data).toHaveProperty("next_actions");

      expect([
        "draft",
        "started",
        "in_progress",
        "waiting_approval",
        "completed",
        "failed",
      ]).toContain(data.status);
    });

    test("should handle workflow execution timeout scenarios", async ({
      request,
    }) => {
      // Create a workflow with a very short timeout for testing
      const timeoutWorkflow = {
        name: "Timeout Test Workflow",
        description: "Tests timeout handling",
        steps: [
          {
            id: "timeout_step",
            name: "Timeout Step",
            type: "automated",
            script: "long_running_task.sh",
            timeout: 1, // 1 second timeout
          },
        ],
      };

      const createResponse = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: timeoutWorkflow,
      });

      expect(createResponse.status()).toBe(201);
      const createdWorkflow = await createResponse.json();

      // Execute the workflow
      const executeResponse = await request.post(
        `${baseURL}/v1/workflows/${createdWorkflow.id}/execute`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            triggered_by: "timeout-test@example.com",
          },
        }
      );

      expect(executeResponse.status()).toBe(202);

      // Wait a bit and check status - should timeout
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const statusResponse = await request.get(
        `${baseURL}/v1/workflows/${createdWorkflow.id}/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(statusResponse.status()).toBe(200);
      const statusData = await statusResponse.json();
      expect(["failed", "timeout"]).toContain(statusData.status);
    });
  });

  test.describe("Workflow Approval Process", () => {
    test("should approve workflow step", async ({ request }) => {
      const approvalData = {
        approver: "manager@example.com",
        decision: "approved",
        comments: "Looks good, proceeding with next step",
        timestamp: new Date().toISOString(),
      };

      const response = await request.post(
        `${baseURL}/v1/workflows/${workflowId}/approve`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: approvalData,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.decision).toBe("approved");
      expect(data.approver).toBe(approvalData.approver);
      expect(data.comments).toBe(approvalData.comments);
      expect(data).toHaveProperty("next_step");
      expect(data).toHaveProperty("updated_status");
    });

    test("should reject workflow step", async ({ request }) => {
      const rejectionData = {
        approver: "manager@example.com",
        decision: "rejected",
        comments: "Needs revision before proceeding",
        reason: "incomplete_documentation",
      };

      const response = await request.post(
        `${baseURL}/v1/workflows/${workflowId}/reject`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: rejectionData,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.decision).toBe("rejected");
      expect(data.approver).toBe(rejectionData.approver);
      expect(data.reason).toBe(rejectionData.reason);
      expect(data).toHaveProperty("workflow_status");
    });

    test("should reject approval with missing approver", async ({
      request,
    }) => {
      const invalidApproval = {
        decision: "approved",
        comments: "Missing approver field",
      };

      const response = await request.post(
        `${baseURL}/v1/workflows/${workflowId}/approve`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: invalidApproval,
        }
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("approver");
    });

    test("should reject approval with invalid decision", async ({
      request,
    }) => {
      const invalidApproval = {
        approver: "manager@example.com",
        decision: "maybe", // Invalid decision
        comments: "Invalid decision value",
      };

      const response = await request.post(
        `${baseURL}/v1/workflows/${workflowId}/approve`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: invalidApproval,
        }
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("decision");
    });

    test("should handle unauthorized approval attempts", async ({
      request,
    }) => {
      // Try to approve without proper authentication
      const response = await request.post(
        `${baseURL}/v1/workflows/${workflowId}/approve`,
        {
          headers: {
            Authorization: "Bearer invalid-token",
            "Content-Type": "application/json",
          },
          data: {
            approver: "unauthorized@example.com",
            decision: "approved",
          },
        }
      );

      expect(response.status()).toBe(401);
    });

    test("should handle approval of non-existent workflow", async ({
      request,
    }) => {
      const response = await request.post(
        `${baseURL}/v1/workflows/non-existent/approve`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            approver: "manager@example.com",
            decision: "approved",
          },
        }
      );

      expect(response.status()).toBe(404);
    });
  });

  test.describe("Workflow Edge Cases and Error Scenarios", () => {
    test("should handle very long workflow names", async ({ request }) => {
      const longNameWorkflow = {
        name: "A".repeat(500), // Very long name
        description: "Testing long names",
        steps: [
          {
            id: "step1",
            name: "Test Step",
            type: "manual",
          },
        ],
      };

      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: longNameWorkflow,
      });

      // Should either accept and truncate or reject with proper error
      expect([201, 400]).toContain(response.status());

      if (response.status() === 400) {
        const error = await response.json();
        expect(error.error).toContain("name");
      }
    });

    test("should handle circular step dependencies", async ({ request }) => {
      const circularWorkflow = {
        name: "Circular Dependency Test",
        description: "Testing circular dependencies",
        steps: [
          {
            id: "step1",
            name: "Step 1",
            type: "manual",
            depends_on: ["step2"],
          },
          {
            id: "step2",
            name: "Step 2",
            type: "manual",
            depends_on: ["step1"], // Creates circular dependency
          },
        ],
      };

      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: circularWorkflow,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("circular");
    });

    test("should handle concurrent workflow executions", async ({
      request,
    }) => {
      // Execute the same workflow multiple times concurrently
      const executionPromises = Array.from({ length: 3 }, (_, i) =>
        request.post(`${baseURL}/v1/workflows/${workflowId}/execute`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            triggered_by: `concurrent-user-${i}@example.com`,
            context: { test_run: i },
          },
        })
      );

      const responses = await Promise.all(executionPromises);

      // All should either succeed or fail gracefully
      responses.forEach((response, index) => {
        expect([202, 409, 429]).toContain(response.status()); // Accepted, Conflict, or Rate Limited
      });
    });

    test("should handle malformed JSON in workflow creation", async ({
      request,
    }) => {
      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: '{ "name": "Test", "steps": [ invalid json', // Malformed JSON
      });

      expect(response.status()).toBe(400);
    });

    test("should handle extremely large workflow definitions", async ({
      request,
    }) => {
      const largeWorkflow = {
        name: "Large Workflow Test",
        description: "Testing large workflow handling",
        steps: Array.from({ length: 100 }, (_, i) => ({
          id: `step${i}`,
          name: `Step ${i}`,
          type: "manual",
          description: "X".repeat(1000), // Large description
        })),
      };

      const response = await request.post(`${baseURL}/v1/workflows/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: largeWorkflow,
      });

      // Should either accept or reject with appropriate error
      expect([201, 400, 413]).toContain(response.status()); // Created, Bad Request, or Payload Too Large
    });
  });

  test.describe("Workflow Performance", () => {
    test("should handle workflow list pagination", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/workflows/?page=1&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("workflows");
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("limit");
      expect(data.workflows.length).toBeLessThanOrEqual(10);
    });

    test("should respond quickly to status checks", async ({ request }) => {
      const startTime = Date.now();

      const response = await request.get(
        `${baseURL}/v1/workflows/${workflowId}/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    test("should handle rapid sequential requests", async ({ request }) => {
      const promises = Array.from({ length: 10 }, () =>
        request.get(`${baseURL}/v1/workflows/${workflowId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([200, 429]).toContain(response.status()); // Success or Rate Limited
      });
    });
  });
});
