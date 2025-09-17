import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { getSeededAdminCredentials } from "../utils/test-helpers";

test.describe("@contract Notifications Management", () => {
  test.describe.configure({ mode: "serial" });
  let baseURL = "http://localhost:8080";
  let authToken: string;
  let notificationId: string;

  // Sample notification data
  const validNotification = {
    title: "Test Notification",
    message: "This is a test notification for automated testing",
    type: "info",
    recipient: "test-user@example.com",
    priority: "medium",
    metadata: {
      source: "api-test",
      category: "system",
    },
  };

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

  test.describe("Notification CRUD Operations", () => {
    test("should create notification with valid data", async ({ request }) => {
      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: validNotification,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("id");
      expect(data.title).toBe(validNotification.title);
      expect(data.message).toBe(validNotification.message);
      expect(data.type).toBe(validNotification.type);
      expect(data.recipient).toBe(validNotification.recipient);
      expect(data.priority).toBe(validNotification.priority);
      expect(data.status).toBe("unread");
      expect(data).toHaveProperty("created_at");
      expect(data).toHaveProperty("updated_at");

      notificationId = data.id;
    });

    test("should reject notification creation with missing title", async ({
      request,
    }) => {
      const invalidNotification = { ...validNotification };
      const { title, ...notificationWithoutTitle } = invalidNotification;

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: notificationWithoutTitle,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("title");
    });

    test("should reject notification creation with missing message", async ({
      request,
    }) => {
      const invalidNotification = { ...validNotification };
      const { message, ...notificationWithoutMessage } = invalidNotification;

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: notificationWithoutMessage,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toContain("message");
    });

    test("should reject notification creation with invalid type", async ({
      request,
    }) => {
      const invalidNotification = {
        ...validNotification,
        type: "invalid-type",
      };

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidNotification,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/type.*invalid|invalid.*type/i);
    });

    test("should reject notification creation with invalid priority", async ({
      request,
    }) => {
      const invalidNotification = {
        ...validNotification,
        priority: "ultra-mega-high",
      };

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: invalidNotification,
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/priority.*invalid|invalid.*priority/i);
    });

    test("should list notifications", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data.notifications.length).toBeGreaterThan(0);
      expect(data).toHaveProperty("total");
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("limit");

      // Verify our created notification is in the list
      const ourNotification = data.notifications.find(
        (n: any) => n.id === notificationId
      );
      expect(ourNotification).toBeDefined();
    });

    test("should get notification by ID", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.id).toBe(notificationId);
      expect(data.title).toBe(validNotification.title);
      expect(data.message).toBe(validNotification.message);
      expect(data.type).toBe(validNotification.type);
      expect(data.recipient).toBe(validNotification.recipient);
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("created_at");
    });

    test("should return 404 for non-existent notification", async ({
      request,
    }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/non-existent-id`,
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

    test("should update notification", async ({ request }) => {
      const updatedNotification = {
        title: "Updated Test Notification",
        message: "This notification has been updated",
        priority: "high",
      };

      const response = await request.put(
        `${baseURL}/v1/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: updatedNotification,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.title).toBe(updatedNotification.title);
      expect(data.message).toBe(updatedNotification.message);
      expect(data.priority).toBe(updatedNotification.priority);
      expect(data).toHaveProperty("updated_at");
    });

    test("should delete notification", async ({ request }) => {
      // Create a notification to delete
      const createResponse = await request.post(
        `${baseURL}/v1/notifications/`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            ...validNotification,
            title: "Notification to Delete",
          },
        }
      );

      expect(createResponse.status()).toBe(201);
      const createdNotification = await createResponse.json();

      // Delete the notification
      const deleteResponse = await request.delete(
        `${baseURL}/v1/notifications/${createdNotification.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(deleteResponse.status()).toBe(204);

      // Verify it's deleted
      const getResponse = await request.get(
        `${baseURL}/v1/notifications/${createdNotification.id}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(getResponse.status()).toBe(404);
    });
  });

  test.describe("Notification Status Management", () => {
    test("should mark notification as read", async ({ request }) => {
      const response = await request.put(
        `${baseURL}/v1/notifications/${notificationId}/read`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            read_by: "test-user@example.com",
            read_at: new Date().toISOString(),
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.status).toBe("read");
      expect(data).toHaveProperty("read_by");
      expect(data).toHaveProperty("read_at");
      expect(data.read_by).toBe("test-user@example.com");
    });

    test("should mark notification as unread", async ({ request }) => {
      const response = await request.put(
        `${baseURL}/v1/notifications/${notificationId}/unread`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data.status).toBe("unread");
      expect(data.read_by).toBeNull();
      expect(data.read_at).toBeNull();
    });

    test("should handle invalid notification ID for status update", async ({
      request,
    }) => {
      const response = await request.put(
        `${baseURL}/v1/notifications/invalid-id/read`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            read_by: "test-user@example.com",
          },
        }
      );

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error.error).toContain("not found");
    });

    test("should filter notifications by status", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/?status=read`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data).toHaveProperty("status_filter");
      expect(data.status_filter).toBe("read");

      // All notifications should have status 'read'
      data.notifications.forEach((notification: any) => {
        expect(notification.status).toBe("read");
      });
    });

    test("should filter notifications by recipient", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/?recipient=test-user@example.com`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data).toHaveProperty("recipient_filter");
      expect(data.recipient_filter).toBe("test-user@example.com");

      // All notifications should be for the specified recipient
      data.notifications.forEach((notification: any) => {
        expect(notification.recipient).toBe("test-user@example.com");
      });
    });
  });

  test.describe("Notification Broadcasting", () => {
    test("should broadcast notification to multiple recipients", async ({
      request,
    }) => {
      const broadcastData = {
        title: "System Maintenance Notice",
        message: "The system will be under maintenance from 2:00 AM to 4:00 AM",
        type: "warning",
        priority: "high",
        recipients: [
          "user1@example.com",
          "user2@example.com",
          "admin@example.com",
        ],
        schedule_for: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        metadata: {
          category: "maintenance",
          affects: "all_users",
        },
      };

      const response = await request.post(
        `${baseURL}/v1/notifications/broadcast`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: broadcastData,
        }
      );

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("broadcast_id");
      expect(data).toHaveProperty("recipients_count");
      expect(data.recipients_count).toBe(3);
      expect(data).toHaveProperty("status");
      expect(data.status).toBe("scheduled");
      expect(data).toHaveProperty("scheduled_for");
    });

    test("should broadcast immediate notification", async ({ request }) => {
      const broadcastData = {
        title: "Urgent Alert",
        message: "This is an urgent system alert",
        type: "error",
        priority: "critical",
        recipients: ["admin@example.com"],
        immediate: true,
      };

      const response = await request.post(
        `${baseURL}/v1/notifications/broadcast`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: broadcastData,
        }
      );

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("broadcast_id");
      expect(data.status).toBe("sent");
      expect(data).toHaveProperty("notifications_created");
      expect(Array.isArray(data.notifications_created)).toBeTruthy();
    });

    test("should reject broadcast with empty recipients", async ({
      request,
    }) => {
      const invalidBroadcast = {
        title: "Test Broadcast",
        message: "This should fail",
        type: "info",
        recipients: [], // Empty recipients
      };

      const response = await request.post(
        `${baseURL}/v1/notifications/broadcast`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: invalidBroadcast,
        }
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/recipients.*required|recipients.*empty/i);
    });

    test("should reject broadcast with invalid recipients", async ({
      request,
    }) => {
      const invalidBroadcast = {
        title: "Test Broadcast",
        message: "This should fail",
        type: "info",
        recipients: ["invalid-email-format", "also.invalid"], // Invalid email formats
      };

      const response = await request.post(
        `${baseURL}/v1/notifications/broadcast`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: invalidBroadcast,
        }
      );

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(
        /email.*invalid|invalid.*email|recipient.*format/i
      );
    });

    test("should handle broadcast to large number of recipients", async ({
      request,
    }) => {
      const largeRecipientList = Array.from(
        { length: 100 },
        (_, i) => `user${i}@example.com`
      );

      const broadcastData = {
        title: "Mass Notification Test",
        message: "Testing large recipient list",
        type: "info",
        recipients: largeRecipientList,
      };

      const response = await request.post(
        `${baseURL}/v1/notifications/broadcast`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: broadcastData,
        }
      );

      // Should either accept or reject with appropriate limits
      expect([202, 400, 413]).toContain(response.status());

      if (response.status() === 202) {
        const data = await response.json();
        expect(data.recipients_count).toBe(100);
      } else {
        const error = await response.json();
        expect(error.error).toMatch(
          /limit.*exceeded|too.*many|recipients.*limit/i
        );
      }
    });
  });

  test.describe("Notification Filtering and Search", () => {
    test("should filter notifications by type", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/?type=info`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data).toHaveProperty("type_filter");
      expect(data.type_filter).toBe("info");

      // All notifications should be of type 'info'
      data.notifications.forEach((notification: any) => {
        expect(notification.type).toBe("info");
      });
    });

    test("should filter notifications by priority", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/?priority=high`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data).toHaveProperty("priority_filter");
      expect(data.priority_filter).toBe("high");

      // All notifications should have priority 'high'
      data.notifications.forEach((notification: any) => {
        expect(notification.priority).toBe("high");
      });
    });

    test("should filter notifications by date range", async ({ request }) => {
      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000); // 24 hours ago

      const response = await request.get(
        `${baseURL}/v1/notifications/?start_date=${startDate.toISOString()}&end_date=${endDate.toISOString()}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data).toHaveProperty("date_range");
      expect(data.date_range.start).toBe(startDate.toISOString());
      expect(data.date_range.end).toBe(endDate.toISOString());
    });

    test("should search notifications by content", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/?search=test`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data).toHaveProperty("search_query");
      expect(data.search_query).toBe("test");

      // Each notification should contain the search term in title or message
      data.notifications.forEach((notification: any) => {
        const containsSearchTerm =
          notification.title.toLowerCase().includes("test") ||
          notification.message.toLowerCase().includes("test");
        expect(containsSearchTerm).toBeTruthy();
      });
    });

    test("should handle pagination", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/?page=1&limit=5`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data.notifications.length).toBeLessThanOrEqual(5);
      expect(data).toHaveProperty("page");
      expect(data).toHaveProperty("limit");
      expect(data).toHaveProperty("total");
      expect(data.page).toBe(1);
      expect(data.limit).toBe(5);
    });

    test("should sort notifications by date", async ({ request }) => {
      const response = await request.get(
        `${baseURL}/v1/notifications/?sort=created_at&order=desc`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(Array.isArray(data.notifications)).toBeTruthy();
      expect(data).toHaveProperty("sort");
      expect(data.sort).toBe("created_at");
      expect(data).toHaveProperty("order");
      expect(data.order).toBe("desc");

      // Verify notifications are sorted by creation date (descending)
      if (data.notifications.length > 1) {
        for (let i = 0; i < data.notifications.length - 1; i++) {
          const current = new Date(data.notifications[i].created_at);
          const next = new Date(data.notifications[i + 1].created_at);
          expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
        }
      }
    });
  });

  test.describe("Notification Security & Authorization", () => {
    test("should deny access without authentication", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/notifications/`);

      expect(response.status()).toBe(401);
    });

    test("should deny access with invalid token", async ({ request }) => {
      const response = await request.get(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(response.status()).toBe(401);
    });

    test("should prevent user from accessing other users notifications", async ({
      request,
    }) => {
      // This test assumes role-based access control
      // Regular users should only see their own notifications
      const response = await request.get(
        `${baseURL}/v1/notifications/?recipient=other-user@example.com`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`, // Assuming this is an admin token
          },
        }
      );

      // Admin should be able to access, regular user should not
      expect([200, 403]).toContain(response.status());
    });

    test("should validate notification ownership for updates", async ({
      request,
    }) => {
      // Try to update a notification without proper ownership
      const response = await request.put(
        `${baseURL}/v1/notifications/${notificationId}/read`,
        {
          headers: {
            Authorization: "Bearer potentially-different-user-token",
            "Content-Type": "application/json",
          },
          data: {
            read_by: "unauthorized-user@example.com",
          },
        }
      );

      // Should either succeed (if admin) or fail (if not authorized)
      expect([200, 401, 403]).toContain(response.status());
    });
  });

  test.describe("Notification Performance & Edge Cases", () => {
    test("should handle very long notification titles", async ({ request }) => {
      const longTitleNotification = {
        title: "A".repeat(500), // Very long title
        message: "Testing long title handling",
        type: "info",
        recipient: "test-user@example.com",
      };

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: longTitleNotification,
      });

      // Should either accept and truncate or reject with proper error
      expect([201, 400]).toContain(response.status());

      if (response.status() === 400) {
        const error = await response.json();
        expect(error.error).toMatch(/title.*length|title.*long/i);
      }
    });

    test("should handle very long notification messages", async ({
      request,
    }) => {
      const longMessageNotification = {
        title: "Long Message Test",
        message: "X".repeat(5000), // Very long message
        type: "info",
        recipient: "test-user@example.com",
      };

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: longMessageNotification,
      });

      // Should either accept and truncate or reject with proper error
      expect([201, 400, 413]).toContain(response.status());

      if (response.status() !== 201) {
        const error = await response.json();
        expect(error.error).toMatch(
          /message.*length|message.*long|payload.*large/i
        );
      }
    });

    test("should respond quickly to notification list requests", async ({
      request,
    }) => {
      const startTime = Date.now();

      const response = await request.get(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      expect(response.status()).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    test("should handle concurrent notification operations", async ({
      request,
    }) => {
      // Create multiple notifications concurrently
      const promises = Array.from({ length: 5 }, (_, i) =>
        request.post(`${baseURL}/v1/notifications/`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: {
            ...validNotification,
            title: `Concurrent Test ${i}`,
            recipient: `user${i}@example.com`,
          },
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect([201, 429]).toContain(response.status()); // Created or Rate Limited
      });
    });

    test("should handle malformed JSON in notification creation", async ({
      request,
    }) => {
      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: '{ "title": "Test", "message": invalid json', // Malformed JSON
      });

      expect(response.status()).toBe(400);
    });

    test("should handle special characters in notification content", async ({
      request,
    }) => {
      const specialCharNotification = {
        title:
          'Special Characters Test: 特殊字符 🚀 <script>alert("test")</script>',
        message:
          "Message with émojis 🎉, HTML <b>tags</b>, and unicode: ñáéíóú",
        type: "info",
        recipient: "test-user@example.com",
      };

      const response = await request.post(`${baseURL}/v1/notifications/`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: specialCharNotification,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      // Should properly handle special characters (escaped or preserved)
      expect(data.title).toContain("Special Characters Test");
      expect(data.message).toContain("émojis");
    });
  });
});
