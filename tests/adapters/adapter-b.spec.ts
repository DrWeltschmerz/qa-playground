import { expect } from "@playwright/test";
import { test } from "../fixtures/api-fixtures";
import { getSeededAdminCredentials } from "../utils/test-helpers";

test.describe("AI Adapter B - Advanced Features", () => {
  let baseURL = "http://localhost:8080";
  let adapterBURL = "http://localhost:8082";
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

  test.describe("Advanced AI Processing", () => {
    test("should complete advanced text generation", async ({ request }) => {
      const response = await request.post(`${adapterBURL}/complete`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          prompt: "Explain quantum computing in simple terms",
          max_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
          frequency_penalty: 0.1,
          presence_penalty: 0.1,
          stop_sequences: ["END", "STOP"],
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("completion");
      expect(data).toHaveProperty("usage");
      expect(data).toHaveProperty("model");
      expect(data).toHaveProperty("finish_reason");
      expect(typeof data.completion).toBe("string");
      expect(data.completion.length).toBeGreaterThan(0);
    });

    test("should handle chat completions", async ({ request }) => {
      const chatData = {
        messages: [
          {
            role: "system",
            content: "You are a helpful AI assistant.",
          },
          {
            role: "user",
            content: "What is the capital of France?",
          },
        ],
        max_tokens: 100,
        temperature: 0.5,
      };

      const response = await request.post(`${adapterBURL}/chat/completions`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: chatData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("choices");
      expect(Array.isArray(data.choices)).toBeTruthy();
      expect(data.choices.length).toBeGreaterThan(0);
      expect(data.choices[0]).toHaveProperty("message");
      expect(data.choices[0].message).toHaveProperty("role");
      expect(data.choices[0].message).toHaveProperty("content");
      expect(data.choices[0].message.role).toBe("assistant");
    });

    test("should handle streaming completions", async ({ request }) => {
      const response = await request.post(`${adapterBURL}/completions/stream`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          prompt: "Tell me about artificial intelligence",
          max_tokens: 100,
          stream: true,
        },
      });

      expect(response.status()).toBe(200);
      expect(response.headers()["content-type"]).toContain("text/stream");

      // For streaming, we expect server-sent events format
      const responseText = await response.text();
      expect(responseText).toContain("data:");
    });
  });

  test.describe("Specialized Analysis", () => {
    test("should analyze sentiment", async ({ request }) => {
      const analysisData = {
        text: "I absolutely love this new AI technology! It's amazing and revolutionary.",
        options: {
          include_confidence: true,
          include_emotions: true,
        },
      };

      const response = await request.post(`${adapterBURL}/analyze/sentiment`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: analysisData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("sentiment");
      expect(data).toHaveProperty("confidence");
      expect(data).toHaveProperty("score");
      expect(["positive", "negative", "neutral"]).toContain(data.sentiment);
      expect(typeof data.confidence).toBe("number");
      expect(data.confidence).toBeGreaterThanOrEqual(0);
      expect(data.confidence).toBeLessThanOrEqual(1);
    });

    test("should extract named entities", async ({ request }) => {
      const analysisData = {
        text: "Apple Inc. was founded by Steve Jobs in Cupertino, California in 1976.",
        entity_types: ["PERSON", "ORGANIZATION", "LOCATION", "DATE"],
      };

      const response = await request.post(`${adapterBURL}/analyze/entities`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: analysisData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("entities");
      expect(Array.isArray(data.entities)).toBeTruthy();
      expect(data.entities.length).toBeGreaterThan(0);

      data.entities.forEach((entity: any) => {
        expect(entity).toHaveProperty("text");
        expect(entity).toHaveProperty("type");
        expect(entity).toHaveProperty("confidence");
        expect(entity).toHaveProperty("start_position");
        expect(entity).toHaveProperty("end_position");
      });
    });

    test("should translate text", async ({ request }) => {
      const translationData = {
        text: "Hello, how are you today?",
        source_language: "en",
        target_language: "es",
        options: {
          preserve_formatting: true,
          include_confidence: true,
        },
      };

      const response = await request.post(`${adapterBURL}/translate`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: translationData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("translated_text");
      expect(data).toHaveProperty("source_language");
      expect(data).toHaveProperty("target_language");
      expect(data).toHaveProperty("confidence");
      expect(typeof data.translated_text).toBe("string");
      expect(data.translated_text.length).toBeGreaterThan(0);
      expect(data.source_language).toBe("en");
      expect(data.target_language).toBe("es");
    });

    test("should summarize text", async ({ request }) => {
      const summaryData = {
        text: `
          Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to natural intelligence displayed by animals including humans.
          Leading AI textbooks define the field as the study of intelligent agents: any system that perceives its environment and takes actions that maximize its chance of achieving its goals.
          Some popular accounts use the term artificial intelligence to describe machines that mimic cognitive functions that humans associate with the human mind, such as learning and problem solving.
          AI research has been highly successful in developing effective techniques for solving a wide range of problems, from game playing to medical diagnosis.
        `,
        max_length: 100,
        summary_type: "extractive",
      };

      const response = await request.post(`${adapterBURL}/summarize`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: summaryData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("summary");
      expect(data).toHaveProperty("summary_type");
      expect(data).toHaveProperty("compression_ratio");
      expect(typeof data.summary).toBe("string");
      expect(data.summary.length).toBeLessThan(summaryData.text.length);
      expect(data.summary_type).toBe("extractive");
    });

    test("should classify text", async ({ request }) => {
      const classificationData = {
        text: "This movie is absolutely terrible. The plot makes no sense and the acting is awful.",
        categories: [
          "positive_review",
          "negative_review",
          "neutral_review",
          "spam",
          "not_spam",
        ],
        multi_label: false,
      };

      const response = await request.post(`${adapterBURL}/classify`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: classificationData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("predictions");
      expect(Array.isArray(data.predictions)).toBeTruthy();
      expect(data.predictions.length).toBeGreaterThan(0);

      data.predictions.forEach((prediction: any) => {
        expect(prediction).toHaveProperty("category");
        expect(prediction).toHaveProperty("confidence");
        expect(typeof prediction.confidence).toBe("number");
      });
    });
  });

  test.describe("Model Management", () => {
    test("should list available models", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/models/available`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("models");
      expect(Array.isArray(data.models)).toBeTruthy();
      expect(data.models.length).toBeGreaterThan(0);

      data.models.forEach((model: any) => {
        expect(model).toHaveProperty("id");
        expect(model).toHaveProperty("name");
        expect(model).toHaveProperty("capabilities");
        expect(model).toHaveProperty("max_tokens");
        expect(model).toHaveProperty("status");
      });
    });

    test("should switch active model", async ({ request }) => {
      // First get available models
      const modelsResponse = await request.get(
        `${adapterBURL}/models/available`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      const modelsData = await modelsResponse.json();
      const availableModel = modelsData.models[0];

      // Switch to that model
      const switchResponse = await request.post(
        `${adapterBURL}/models/switch`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            model_id: availableModel.id,
            load_immediately: true,
          },
        }
      );

      expect(switchResponse.status()).toBe(200);
      const switchData = await switchResponse.json();

      expect(switchData).toHaveProperty("previous_model");
      expect(switchData).toHaveProperty("new_model");
      expect(switchData).toHaveProperty("switch_time");
      expect(switchData.new_model.id).toBe(availableModel.id);
    });

    test("should compare models", async ({ request }) => {
      const comparisonData = {
        models: ["model-a", "model-b"],
        test_prompts: [
          "What is artificial intelligence?",
          "Explain machine learning briefly.",
        ],
        metrics: ["latency", "quality", "consistency"],
      };

      const response = await request.get(`${adapterBURL}/models/comparison`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        data: comparisonData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("comparison_results");
      expect(data).toHaveProperty("models_compared");
      expect(data).toHaveProperty("test_completed_at");
      expect(Array.isArray(data.models_compared)).toBeTruthy();
    });

    test("should start model fine-tuning", async ({ request }) => {
      const finetuneData = {
        base_model: "base-model-v1",
        training_data: "training-dataset-id",
        hyperparameters: {
          learning_rate: 0.0001,
          batch_size: 16,
          epochs: 3,
        },
        validation_split: 0.1,
      };

      const response = await request.post(`${adapterBURL}/models/fine-tune`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: finetuneData,
      });

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("fine_tune_id");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("estimated_completion");
      expect(data.status).toBe("queued");
    });
  });

  test.describe("Load Balancing & Scaling", () => {
    test("should get load balancer status", async ({ request }) => {
      const response = await request.get(
        `${adapterBURL}/load-balancer/status`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("active_nodes");
      expect(data).toHaveProperty("total_capacity");
      expect(data).toHaveProperty("current_load");
      expect(data).toHaveProperty("load_distribution");
      expect(data).toHaveProperty("health_status");
      expect(Array.isArray(data.active_nodes)).toBeTruthy();
    });

    test("should rebalance load", async ({ request }) => {
      const response = await request.post(
        `${adapterBURL}/load-balancer/rebalance`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("rebalance_id");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("estimated_duration");
      expect(data.status).toBe("rebalancing");
    });

    test("should get scaling metrics", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/scaling/metrics`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("cpu_utilization");
      expect(data).toHaveProperty("memory_utilization");
      expect(data).toHaveProperty("request_queue_length");
      expect(data).toHaveProperty("response_time_p95");
      expect(data).toHaveProperty("throughput");
      expect(data).toHaveProperty("scaling_recommendations");
    });

    test("should enable auto-scaling", async ({ request }) => {
      const scalingConfig = {
        min_instances: 2,
        max_instances: 10,
        target_cpu_utilization: 70,
        target_memory_utilization: 80,
        scale_up_threshold: 85,
        scale_down_threshold: 30,
        cooldown_period: 300,
      };

      const response = await request.post(`${adapterBURL}/scaling/auto-scale`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: scalingConfig,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("auto_scaling_enabled");
      expect(data).toHaveProperty("configuration");
      expect(data).toHaveProperty("current_instance_count");
      expect(data.auto_scaling_enabled).toBe(true);
    });
  });

  test.describe("Streaming & Real-time", () => {
    test("should list streaming sessions", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/stream/sessions`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("active_sessions");
      expect(data).toHaveProperty("total_sessions");
      expect(data).toHaveProperty("session_capacity");
      expect(Array.isArray(data.active_sessions)).toBeTruthy();
    });

    test("should create streaming session", async ({ request }) => {
      const sessionData = {
        session_type: "completion",
        configuration: {
          max_tokens: 500,
          temperature: 0.7,
          stream_interval: 100,
        },
        metadata: {
          user_id: "test-user",
          client_type: "web",
        },
      };

      const response = await request.post(`${adapterBURL}/stream/session`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: sessionData,
      });

      expect(response.status()).toBe(201);
      const data = await response.json();

      expect(data).toHaveProperty("session_id");
      expect(data).toHaveProperty("websocket_url");
      expect(data).toHaveProperty("session_token");
      expect(data).toHaveProperty("expires_at");
      expect(typeof data.session_id).toBe("string");
    });

    test("should close streaming session", async ({ request }) => {
      // First create a session
      const createResponse = await request.post(
        `${adapterBURL}/stream/session`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: {
            session_type: "completion",
            configuration: { max_tokens: 100 },
          },
        }
      );

      const createData = await createResponse.json();
      const sessionId = createData.session_id;

      // Then close it
      const closeResponse = await request.delete(
        `${adapterBURL}/stream/session/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(closeResponse.status()).toBe(200);
      const closeData = await closeResponse.json();

      expect(closeData).toHaveProperty("session_id");
      expect(closeData).toHaveProperty("status");
      expect(closeData.status).toBe("closed");
    });
  });

  test.describe("Content Safety", () => {
    test("should filter content", async ({ request }) => {
      const filterData = {
        content: "This is some test content to be filtered for safety.",
        filter_types: ["profanity", "hate_speech", "violence", "adult_content"],
        severity_threshold: "medium",
      };

      const response = await request.post(`${adapterBURL}/content/filter`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: filterData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("filtered_content");
      expect(data).toHaveProperty("safety_scores");
      expect(data).toHaveProperty("violations_detected");
      expect(data).toHaveProperty("action_taken");
      expect(typeof data.filtered_content).toBe("string");
      expect(Array.isArray(data.violations_detected)).toBeTruthy();
    });

    test("should moderate content", async ({ request }) => {
      const moderationData = {
        content: "Sample content for moderation testing",
        moderation_level: "strict",
        categories: ["spam", "harassment", "misinformation"],
        return_details: true,
      };

      const response = await request.post(`${adapterBURL}/content/moderate`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: moderationData,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("moderation_result");
      expect(data).toHaveProperty("confidence_scores");
      expect(data).toHaveProperty("recommendations");
      expect(data).toHaveProperty("policy_violations");
      expect(["approved", "rejected", "requires_review"]).toContain(
        data.moderation_result
      );
    });

    test("should get safety policies", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/safety/policies`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("policies");
      expect(data).toHaveProperty("version");
      expect(data).toHaveProperty("last_updated");
      expect(Array.isArray(data.policies)).toBeTruthy();

      data.policies.forEach((policy: any) => {
        expect(policy).toHaveProperty("name");
        expect(policy).toHaveProperty("severity");
        expect(policy).toHaveProperty("action");
        expect(policy).toHaveProperty("enabled");
      });
    });

    test("should update safety policies", async ({ request }) => {
      const policyUpdate = {
        policies: [
          {
            name: "profanity_filter",
            severity: "high",
            action: "block",
            enabled: true,
          },
          {
            name: "hate_speech_detection",
            severity: "critical",
            action: "block",
            enabled: true,
          },
        ],
        version: "2.1",
      };

      const response = await request.put(`${adapterBURL}/safety/policies`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: policyUpdate,
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("updated_policies");
      expect(data).toHaveProperty("changes_applied");
      expect(data).toHaveProperty("effective_from");
      expect(Array.isArray(data.updated_policies)).toBeTruthy();
    });
  });

  test.describe("Performance & Monitoring", () => {
    test("should return health check", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/health`);

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("timestamp");
      expect(data).toHaveProperty("uptime");
      expect(data).toHaveProperty("version");
      expect(["healthy", "degraded", "unhealthy"]).toContain(data.status);
    });

    test("should return detailed metrics", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/metrics/detailed`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("performance_metrics");
      expect(data).toHaveProperty("resource_utilization");
      expect(data).toHaveProperty("request_statistics");
      expect(data).toHaveProperty("model_metrics");
      expect(data.performance_metrics).toHaveProperty("average_latency");
      expect(data.resource_utilization).toHaveProperty("cpu_usage");
      expect(data.resource_utilization).toHaveProperty("memory_usage");
    });

    test("should run performance benchmark", async ({ request }) => {
      const benchmarkConfig = {
        test_duration: 30,
        concurrent_requests: 3,
        test_types: ["latency", "throughput", "accuracy"],
        sample_prompts: ["Test prompt 1", "Test prompt 2"],
      };

      const response = await request.get(
        `${adapterBURL}/performance/benchmark`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          data: benchmarkConfig,
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("benchmark_results");
      expect(data).toHaveProperty("test_summary");
      expect(data).toHaveProperty("recommendations");
      expect(data.benchmark_results).toHaveProperty("average_latency");
      expect(data.benchmark_results).toHaveProperty("requests_per_second");
    });

    test("should get monitoring alerts", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/monitoring/alerts`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("active_alerts");
      expect(data).toHaveProperty("alert_history");
      expect(data).toHaveProperty("alert_rules");
      expect(Array.isArray(data.active_alerts)).toBeTruthy();
      expect(Array.isArray(data.alert_history)).toBeTruthy();
    });
  });

  test.describe("Cache & Optimization", () => {
    test("should get cache statistics", async ({ request }) => {
      const response = await request.get(`${adapterBURL}/cache/stats`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("cache_size");
      expect(data).toHaveProperty("hit_rate");
      expect(data).toHaveProperty("miss_rate");
      expect(data).toHaveProperty("total_requests");
      expect(data).toHaveProperty("cache_efficiency");
      expect(typeof data.hit_rate).toBe("number");
      expect(data.hit_rate).toBeGreaterThanOrEqual(0);
      expect(data.hit_rate).toBeLessThanOrEqual(1);
    });

    test("should clear cache", async ({ request }) => {
      const response = await request.post(`${adapterBURL}/cache/clear`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          cache_type: "all",
          confirm: true,
        },
      });

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("cleared_entries");
      expect(data).toHaveProperty("cache_size_before");
      expect(data).toHaveProperty("cache_size_after");
      expect(data.status).toBe("cleared");
    });

    test("should warm up cache", async ({ request }) => {
      const warmupConfig = {
        cache_types: ["model_cache", "response_cache"],
        priority_prompts: [
          "What is artificial intelligence?",
          "Explain machine learning",
        ],
        warmup_percentage: 80,
      };

      const response = await request.post(`${adapterBURL}/cache/warm-up`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: warmupConfig,
      });

      expect(response.status()).toBe(202);
      const data = await response.json();

      expect(data).toHaveProperty("warmup_id");
      expect(data).toHaveProperty("status");
      expect(data).toHaveProperty("estimated_completion");
      expect(data.status).toBe("warming_up");
    });

    test("should get optimization suggestions", async ({ request }) => {
      const response = await request.get(
        `${adapterBURL}/optimization/suggestions`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      expect(response.status()).toBe(200);
      const data = await response.json();

      expect(data).toHaveProperty("suggestions");
      expect(data).toHaveProperty("current_performance");
      expect(data).toHaveProperty("potential_improvements");
      expect(Array.isArray(data.suggestions)).toBeTruthy();

      data.suggestions.forEach((suggestion: any) => {
        expect(suggestion).toHaveProperty("category");
        expect(suggestion).toHaveProperty("description");
        expect(suggestion).toHaveProperty("impact");
        expect(suggestion).toHaveProperty("difficulty");
      });
    });
  });

  test.describe("Error Handling and Edge Cases", () => {
    test("should handle invalid model switching", async ({ request }) => {
      const response = await request.post(`${adapterBURL}/models/switch`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          model_id: "non-existent-model",
        },
      });

      expect(response.status()).toBe(404);
      const error = await response.json();
      expect(error.error).toMatch(/model.*not.*found|not.*found.*model/i);
    });

    test("should handle unsupported language translation", async ({
      request,
    }) => {
      const response = await request.post(`${adapterBURL}/translate`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          text: "Hello world",
          source_language: "xx", // Invalid language code
          target_language: "yy", // Invalid language code
        },
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(
        /language.*unsupported|unsupported.*language/i
      );
    });

    test("should handle empty streaming session creation", async ({
      request,
    }) => {
      const response = await request.post(`${adapterBURL}/stream/session`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {}, // Empty configuration
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(
        /session_type.*required|required.*session_type/i
      );
    });

    test("should handle concurrent fine-tuning requests", async ({
      request,
    }) => {
      const finetuneData = {
        base_model: "test-model",
        training_data: "test-dataset",
        hyperparameters: {
          learning_rate: 0.001,
          batch_size: 8,
          epochs: 2,
        },
      };

      // Submit multiple fine-tuning requests
      const promises = Array.from({ length: 3 }, () =>
        request.post(`${adapterBURL}/models/fine-tune`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          data: finetuneData,
        })
      );

      const responses = await Promise.all(promises);

      // Should handle gracefully - either queue them or reject with limits
      responses.forEach((response) => {
        expect([202, 429, 503]).toContain(response.status());
      });
    });

    test("should handle malformed sentiment analysis request", async ({
      request,
    }) => {
      const response = await request.post(`${adapterBURL}/analyze/sentiment`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        data: {
          // Missing required text field
          options: {
            include_confidence: true,
          },
        },
      });

      expect(response.status()).toBe(400);
      const error = await response.json();
      expect(error.error).toMatch(/text.*required|required.*text/i);
    });

    test("should handle service downtime", async ({ request }) => {
      // Test graceful degradation when some services are unavailable
      const unreachableURL = "http://localhost:9999";

      try {
        const response = await request.get(`${unreachableURL}/health`, {
          timeout: 2000,
        });
        expect([503, 502]).toContain(response.status());
      } catch (error) {
        // Network error expected when service is down
        expect(error).toBeDefined();
      }
    });
  });
});
