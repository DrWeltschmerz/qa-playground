package main

import (
	"fmt"
	"math/rand"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"

	_ "github.com/weltschmerz/QA-Playground/services/adapter-a/docs"
)

// @title AI Adapter A API
// @version 1.2.0
// @description AI completion service adapter A with model management and monitoring
// @BasePath /

type completeRequest struct {
	Prompt      string  `json:"prompt" example:"Hello world"`
	Model       string  `json:"model" example:"adapter-a"`
	Temperature float32 `json:"temperature,omitempty" example:"0.7"`
	MaxTokens   int     `json:"max_tokens,omitempty" example:"100"`
	TopP        float32 `json:"top_p,omitempty" example:"0.9"`
}

type completeResponse struct {
	Model      string    `json:"model" example:"adapter-a"`
	Completion string    `json:"completion" example:"A: Hello world response"`
	Usage      UsageInfo `json:"usage"`
	RequestID  string    `json:"request_id" example:"req-123"`
	CreatedAt  string    `json:"created_at" example:"2025-09-16T10:30:00Z"`
}

type UsageInfo struct {
	PromptTokens     int `json:"prompt_tokens" example:"10"`
	CompletionTokens int `json:"completion_tokens" example:"25"`
	TotalTokens      int `json:"total_tokens" example:"35"`
}

type ModelInfo struct {
	Name         string                 `json:"name" example:"adapter-a"`
	Version      string                 `json:"version" example:"1.2.0"`
	Type         string                 `json:"type" example:"text-completion"`
	MaxTokens    int                    `json:"max_tokens" example:"4096"`
	Status       string                 `json:"status" example:"active"`
	Capabilities []string               `json:"capabilities"`
	Config       map[string]interface{} `json:"config"`
	Supported    []string               `json:"supported_features"`
}

type HealthStatus struct {
	Status       string                 `json:"status" example:"healthy"`
	Uptime       string                 `json:"uptime" example:"2h 15m 30s"`
	RequestCount int                    `json:"request_count" example:"1250"`
	ErrorCount   int                    `json:"error_count" example:"3"`
	AvgLatency   string                 `json:"avg_latency" example:"150ms"`
	MemoryUsage  string                 `json:"memory_usage" example:"512MB"`
	CPUUsage     string                 `json:"cpu_usage" example:"25%"`
	LastError    string                 `json:"last_error,omitempty"`
	Details      map[string]interface{} `json:"details"`
}

var (
	startTime          = time.Now()
	requestCount       = 0
	errorCount         = 0
	enableRandomErrors = strings.TrimSpace(os.Getenv("ENABLE_RANDOM_ERRORS")) == "1"
	modelConfig        = map[string]interface{}{
		"temperature": 0.7,
		"max_tokens":  4096,
		"top_p":       0.9,
		"model_type":  "transformer",
	}
	batchStoreMu sync.Mutex
	batchStore   = map[string]bool{}
)

func main() {
	r := gin.Default()

	// Add CORS middleware
	r.Use(func(c *gin.Context) {
		c.Header("Access-Control-Allow-Origin", "*")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Request counting middleware
	r.Use(func(c *gin.Context) {
		requestCount++
		c.Next()
		if c.Writer.Status() >= 400 {
			errorCount++
		}
	})

	// Swagger endpoint
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))

	// Core completion endpoint (requires auth)
	r.POST("/complete", func(c *gin.Context) {
		if strings.TrimSpace(c.GetHeader("Authorization")) == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}
		complete(c)
	})

	// Model management endpoints
	r.GET("/model", getModelInfo)
	r.PUT("/model/config", updateModelConfig)
	r.POST("/model/reload", reloadModel)
	r.GET("/model/capabilities", getModelCapabilities)

	// Health and monitoring endpoints
	r.GET("/health", healthCheck)
	r.GET("/metrics", getMetrics)
	r.GET("/status", getDetailedStatus)

	// Batch processing endpoints
	r.POST("/batch", batchComplete)
	r.GET("/batch/:batchId", getBatchStatus)
	r.DELETE("/batch/:batchId", cancelBatch)

	// Queue management endpoints
	r.GET("/queue", getQueueStatus)
	r.POST("/queue/clear", clearQueue)
	r.GET("/queue/stats", getQueueStats)

	// Performance testing endpoints
	r.POST("/benchmark", runBenchmark)
	r.GET("/benchmark/:benchmarkId", getBenchmarkResults)

	// Configuration endpoints
	r.GET("/config", getConfiguration)
	r.PUT("/config", updateConfiguration)
	r.POST("/config/reset", resetConfiguration)

	_ = r.Run(":8081")
}

// @Summary Generate text completion
// @Description Generate AI text completion using adapter A
// @Tags completion
// @Accept json
// @Produce json
// @Param request body completeRequest true "Completion request"
// @Success 200 {object} completeResponse
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /complete [post]
func complete(c *gin.Context) {
	var req completeRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Prompt == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Guard very long prompts
	if len(req.Prompt) > 5000 {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "prompt too long"})
		return
	}

	// Simulate processing time based on prompt length (capped)
	processingJitter := 0
	if enableRandomErrors {
		processingJitter = rand.Intn(200)
	}
	processingTime := time.Duration(50+min(len(req.Prompt)*2, 1000)+processingJitter) * time.Millisecond
	time.Sleep(processingTime)

	// Optional random errors only when explicitly enabled via env var
	if enableRandomErrors {
		if rand.Intn(100) < 5 { // 5% rate limit
			c.JSON(http.StatusTooManyRequests, gin.H{"error": "rate limit exceeded"})
			return
		}
		if rand.Intn(100) < 1 { // 1% service unavailable
			c.JSON(http.StatusServiceUnavailable, gin.H{"error": "service unavailable"})
			return
		}
	}

	// Generate completion with variable length
	completionLength := 20 + rand.Intn(100)
	completion := fmt.Sprintf("A: %s [Generated response with %d chars]", req.Prompt, completionLength)

	requestID := fmt.Sprintf("req-%d-%d", time.Now().Unix(), rand.Intn(10000))

	response := completeResponse{
		Model:      "adapter-a",
		Completion: completion,
		Usage: UsageInfo{
			PromptTokens:     len(req.Prompt) / 4,
			CompletionTokens: len(completion) / 4,
			TotalTokens:      (len(req.Prompt) + len(completion)) / 4,
		},
		RequestID: requestID,
		CreatedAt: time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, response)
}

// @Summary Get model information
// @Description Get detailed information about the AI model
// @Tags model
// @Produce json
// @Success 200 {object} ModelInfo
// @Router /model [get]
func getModelInfo(c *gin.Context) {
	model := ModelInfo{
		Name:      "adapter-a",
		Version:   "1.2.0",
		Type:      "text-completion",
		MaxTokens: 4096,
		Status:    "active",
		Capabilities: []string{
			"text-completion",
			"conversation",
			"code-generation",
			"translation",
			"summarization",
		},
		Config:    modelConfig,
		Supported: []string{"streaming", "batch", "benchmark", "multi-language"},
	}
	c.JSON(http.StatusOK, model)
}

// @Summary Update model configuration
// @Description Update model configuration parameters
// @Tags model
// @Accept json
// @Produce json
// @Param config body object{temperature=number,max_tokens=number,top_p=number} true "Configuration updates"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /model/config [put]
func updateModelConfig(c *gin.Context) {
	var updates map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid configuration"})
		return
	}
	// Merge updates
	for k, v := range updates {
		modelConfig[k] = v
	}
	c.JSON(http.StatusOK, gin.H{
		"updated_config": modelConfig,
		"applied_at":     time.Now().Format(time.RFC3339),
	})
}

// @Summary Reload model
// @Description Reload the AI model with current configuration
// @Tags model
// @Produce json
// @Success 200 {object} map[string]string
// @Router /model/reload [post]
func reloadModel(c *gin.Context) {
	c.JSON(http.StatusAccepted, gin.H{
		"status":         "reloading",
		"reload_id":      fmt.Sprintf("reload-%d", time.Now().Unix()),
		"estimated_time": "2s",
	})
}

// @Summary Get model capabilities
// @Description Get detailed capabilities and features of the model
// @Tags model
// @Produce json
// @Success 200 {object} object{capabilities=object}
// @Router /model/capabilities [get]
func getModelCapabilities(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"text_generation":     true,
		"max_context_length":  8192,
		"supported_languages": []string{"en", "es", "fr", "de", "it"},
		"special_tokens":      []string{"<BOS>", "<EOS>", "<PAD>"},
	})
}

// @Summary Health check
// @Description Get basic health status of the service
// @Tags monitoring
// @Produce json
// @Success 200 {object} map[string]string
// @Router /health [get]
func healthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":    "healthy",
		"service":   "adapter-a",
		"timestamp": time.Now().Format(time.RFC3339),
		"uptime":    formatDuration(time.Since(startTime)),
	})
}

// @Summary Get metrics
// @Description Get comprehensive performance metrics
// @Tags monitoring
// @Produce json
// @Success 200 {object} object{metrics=object}
// @Router /metrics [get]
func getMetrics(c *gin.Context) {
	uptime := time.Since(startTime)
	c.JSON(http.StatusOK, gin.H{
		"requests_per_second":   float64(requestCount) / uptime.Seconds(),
		"average_response_time": 150 + rand.Intn(50),
		"active_connections":    rand.Intn(50),
		"memory_usage":          256 + rand.Intn(256),
		"cpu_usage":             15 + rand.Intn(30),
		"queue_length":          rand.Intn(10),
	})
}

// @Summary Get detailed status
// @Description Get comprehensive status information including health details
// @Tags monitoring
// @Produce json
// @Success 200 {object} HealthStatus
// @Router /status [get]
func getDetailedStatus(c *gin.Context) {
	uptime := time.Since(startTime)
	c.JSON(http.StatusOK, gin.H{
		"service_status":      gin.H{"running": true, "uptime": formatDuration(uptime)},
		"model_status":        gin.H{"loaded": true, "version": "1.2.0"},
		"system_resources":    gin.H{"cpu_usage": 25, "memory_usage": 512, "disk_usage": 28},
		"performance_metrics": gin.H{"average_latency": 150, "p95_latency": 300, "throughput": 1200, "error_rate": 0.01},
		"last_request_time":   time.Now().Format(time.RFC3339),
	})
}

// @Summary Batch completion
// @Description Submit multiple prompts for batch processing
// @Tags batch
// @Accept json
// @Produce json
// @Param request body object{prompts=array,model=string,options=object} true "Batch request"
// @Success 202 {object} object{batch_id=string,status=string}
// @Failure 400 {object} map[string]string
// @Router /batch [post]
func batchComplete(c *gin.Context) {
	var req struct {
		Requests []struct {
			ID, Prompt string
			MaxTokens  int `json:"max_tokens"`
		} `json:"requests"`
		Priority    string `json:"priority"`
		CallbackURL string `json:"callback_url"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch request"})
		return
	}
	if len(req.Requests) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "requests array cannot be empty"})
		return
	}
	batchID := fmt.Sprintf("batch-%d-%d", time.Now().Unix(), rand.Intn(10000))
	batchStoreMu.Lock()
	batchStore[batchID] = true
	batchStoreMu.Unlock()
	c.JSON(http.StatusAccepted, gin.H{
		"batch_id":             batchID,
		"status":               "queued",
		"total_requests":       len(req.Requests),
		"estimated_completion": "3-8 minutes",
	})
}

// @Summary Get batch status
// @Description Get status and results of a batch processing job
// @Tags batch
// @Param batchId path string true "Batch ID"
// @Produce json
// @Success 200 {object} object{batch_id=string,status=string,results=array}
// @Failure 404 {object} map[string]string
// @Router /batch/{batchId} [get]
func getBatchStatus(c *gin.Context) {
	batchID := c.Param("batchId")
	batchStoreMu.Lock()
	exists := batchStore[batchID]
	batchStoreMu.Unlock()
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "batch not found"})
		return
	}
	statuses := []string{"queued", "processing", "completed"}
	status := statuses[rand.Intn(len(statuses))]
	response := gin.H{
		"batch_id":   batchID,
		"status":     status,
		"created_at": time.Now().Add(-time.Minute * 1).Format(time.RFC3339),
		"progress":   gin.H{"completed": 1 + rand.Intn(3), "total": 1, "percentage": 100},
	}
	if status == "completed" {
		response["results"] = []gin.H{{"index": 0, "completion": "Batch result", "status": "success"}}
		response["completed_at"] = time.Now().Format(time.RFC3339)
	}
	c.JSON(http.StatusOK, response)
}

// @Summary Cancel batch
// @Description Cancel a running batch processing job
// @Tags batch
// @Param batchId path string true "Batch ID"
// @Produce json
// @Success 200 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /batch/{batchId} [delete]
func cancelBatch(c *gin.Context) {
	batchID := c.Param("batchId")
	batchStoreMu.Lock()
	_, exists := batchStore[batchID]
	if exists {
		delete(batchStore, batchID)
	}
	batchStoreMu.Unlock()
	if !exists {
		c.JSON(http.StatusNotFound, gin.H{"error": "batch not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"batch_id": batchID, "status": "cancelled"})
}

// @Summary Get queue status
// @Description Get current processing queue status
// @Tags queue
// @Produce json
// @Success 200 {object} object{queue=object}
// @Router /queue [get]
func getQueueStatus(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"queue_length":      rand.Intn(20),
		"processing_time":   "45s",
		"average_wait_time": "2m 30s",
		"active_workers":    rand.Intn(10),
		"queue_status":      "stable",
	})
}

// @Summary Clear queue
// @Description Clear all pending jobs from the processing queue
// @Tags queue
// @Produce json
// @Success 200 {object} map[string]string
// @Router /queue/clear [post]
func clearQueue(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status":        "cleared",
		"cleared_items": rand.Intn(10) + 1,
	})
}

// @Summary Get queue statistics
// @Description Get detailed queue processing statistics
// @Tags queue
// @Produce json
// @Success 200 {object} object{stats=object}
// @Router /queue/stats [get]
func getQueueStats(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"total_processed":         15420,
		"total_failed":            36,
		"average_processing_time": "45s",
		"peak_queue_length":       25,
		"throughput_per_hour":     []int{45, 52, 38, 67, 89, 76, 54, 43, 61, 78, 55, 49},
	})
}

// @Summary Run benchmark
// @Description Start a performance benchmark test
// @Tags performance
// @Accept json
// @Produce json
// @Param benchmark body object{test_type=string,duration=number,concurrent_requests=number} true "Benchmark configuration"
// @Success 202 {object} object{benchmark_id=string,status=string}
// @Failure 400 {object} map[string]string
// @Router /benchmark [post]
func runBenchmark(c *gin.Context) {
	var req struct {
		TestType           string `json:"test_type"`
		Duration           int    `json:"duration"`
		ConcurrentRequests int    `json:"concurrent_requests"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid benchmark configuration"})
		return
	}
	validType := req.TestType == "latency" || req.TestType == "throughput" || req.TestType == "accuracy"
	if !validType || req.Duration <= 0 || req.ConcurrentRequests <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid benchmark configuration"})
		return
	}
	benchmarkID := fmt.Sprintf("bench-%d-%d", time.Now().Unix(), rand.Intn(1000))
	c.JSON(http.StatusAccepted, gin.H{
		"benchmark_id":       benchmarkID,
		"status":             "running",
		"estimated_duration": fmt.Sprintf("%ds", req.Duration),
	})
}

// @Summary Get benchmark results
// @Description Get results of a performance benchmark test
// @Tags performance
// @Param benchmarkId path string true "Benchmark ID"
// @Produce json
// @Success 200 {object} object{benchmark_id=string,results=object}
// @Failure 404 {object} map[string]string
// @Router /benchmark/{benchmarkId} [get]
func getBenchmarkResults(c *gin.Context) {
	benchmarkID := c.Param("benchmarkId")

	results := gin.H{
		"benchmark_id": benchmarkID,
		"status":       "completed",
		"duration":     "60s",
		"results": gin.H{
			"total_requests":   3600,
			"success_rate":     0.99,
			"requests_per_sec": 60,
			"average_latency":  167,
			"p50_latency":      145,
			"p95_latency":      289,
			"p99_latency":      456,
			"throughput":       12.5,
		},
		"completed_at": time.Now().Format(time.RFC3339),
	}

	c.JSON(http.StatusOK, results)
}

// @Summary Get configuration
// @Description Get current service configuration
// @Tags configuration
// @Produce json
// @Success 200 {object} object{config=object}
// @Router /config [get]
func getConfiguration(c *gin.Context) {
	modelCfg := modelConfig
	serverCfg := gin.H{"max_concurrent_requests": 100, "request_timeout": 120}
	performanceCfg := gin.H{"cache_enabled": true, "cache_size_mb": 256, "prefetch_enabled": false}
	c.JSON(http.StatusOK, gin.H{
		"model_config":       modelCfg,
		"server_config":      serverCfg,
		"performance_config": performanceCfg,
	})
}

// @Summary Update configuration
// @Description Update service configuration settings
// @Tags configuration
// @Accept json
// @Produce json
// @Param config body object{section=string,settings=object} true "Configuration updates"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Router /config [put]
func updateConfiguration(c *gin.Context) {
	var req struct {
		ModelConfig       map[string]interface{} `json:"model_config"`
		PerformanceConfig map[string]interface{} `json:"performance_config"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid configuration"})
		return
	}
	// Validate ranges if provided
	if v, ok := req.ModelConfig["temperature"].(float64); ok {
		if v < 0 || v > 2 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid configuration: temperature"})
			return
		}
	}
	if v, ok := req.ModelConfig["max_tokens"].(float64); ok {
		if v <= 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid configuration: max_tokens"})
			return
		}
	}
	// Apply updates
	for k, v := range req.ModelConfig {
		modelConfig[k] = v
	}
	updated := gin.H{
		"model_config":       modelConfig,
		"performance_config": req.PerformanceConfig,
	}
	c.JSON(http.StatusOK, gin.H{
		"updated_config":  updated,
		"changes_applied": true,
	})
}

// @Summary Reset configuration
// @Description Reset configuration to default values
// @Tags configuration
// @Produce json
// @Success 200 {object} map[string]string
// @Router /config/reset [post]
func resetConfiguration(c *gin.Context) {
	modelConfig = map[string]interface{}{
		"temperature": 0.7,
		"max_tokens":  4096,
		"top_p":       0.9,
		"model_type":  "transformer",
	}
	serverCfg := gin.H{"max_concurrent_requests": 100, "request_timeout": 120}
	c.JSON(http.StatusOK, gin.H{
		"status":       "reset_complete",
		"reset_config": gin.H{"model_config": modelConfig, "server_config": serverCfg},
	})
}

// Helper function to format duration
func formatDuration(d time.Duration) string {
	hours := int(d.Hours())
	minutes := int(d.Minutes()) % 60
	seconds := int(d.Seconds()) % 60

	if hours > 0 {
		return fmt.Sprintf("%dh %dm %ds", hours, minutes, seconds)
	} else if minutes > 0 {
		return fmt.Sprintf("%dm %ds", minutes, seconds)
	}
	return fmt.Sprintf("%ds", seconds)
}
