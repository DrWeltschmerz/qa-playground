package routes

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weltschmerz/QA-Playground/api-gateway/utils"
)

// AiListModels returns available AI models and basic capabilities
// @Summary List AI models
// @Description Returns available AI models and capabilities
// @Tags ai
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Success 200 {object} routes.AiModelsResponse
// @Router /v1/ai/models [get]
func AiListModels(c *gin.Context) {
	models := []map[string]interface{}{
		{"name": "adapter-a", "type": "text-completion", "status": "active", "version": "1.0.0", "max_tokens": 4096},
		{"name": "adapter-b", "type": "text-completion", "status": "active", "version": "1.2.0", "max_tokens": 8192},
	}
	c.JSON(http.StatusOK, gin.H{"models": models})
}

// AiModelStatus returns health/status for a specific model
// @Summary Get AI model status
// @Description Returns health and status for a specific AI model
// @Tags ai
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param model path string true "Model name"
// @Success 200 {object} routes.AiModelStatusResponse
// @Failure 404 {object} map[string]interface{}
// @Router /v1/ai/models/{model}/status [get]
func AiModelStatus(c *gin.Context) {
	model := c.Param("model")
	status := gin.H{
		"status": "online",
		"uptime": "99.99%",
	}
	health := gin.H{
		"errors":       3,
		"avg_latency":  "150ms",
		"memory_usage": "512MB",
	}
	c.JSON(http.StatusOK, gin.H{
		"model":  model,
		"status": status,
		"health": health,
	})
}

// AiConfigureModel updates configuration settings for a specific model
// @Summary Configure AI model
// @Description Updates configuration settings for a specific AI model
// @Tags ai
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param model path string true "Model name"
// @Param request body map[string]interface{} true "Configuration settings"
// @Success 200 {object} routes.AiGenericMessageResponse
// @Failure 400 {object} map[string]interface{}
// @Failure 404 {object} map[string]interface{}
// @Router /v1/ai/models/{model}/configure [post]
func AiConfigureModel(c *gin.Context) {
	model := c.Param("model")
	if model != "adapter-a" && model != "adapter-b" {
		c.JSON(http.StatusNotFound, gin.H{"error": "model not found"})
		return
	}
	var config map[string]interface{}
	if err := c.BindJSON(&config); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid configuration"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "model configured successfully", "model": model})
}

// AiMetrics returns metrics for all AI models
// @Summary AI metrics
// @Description Returns overall metrics for AI models
// @Tags ai
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Success 200 {object} routes.AiMetricsResponse
// @Router /v1/ai/metrics [get]
func AiMetrics(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"metrics": gin.H{
			"total_requests":      5420,
			"successful_requests": 5380,
			"failed_requests":     40,
			"avg_response_time":   "145ms",
			"models": gin.H{
				"adapter-a": gin.H{"requests": 2710, "avg_latency": "130ms"},
				"adapter-b": gin.H{"requests": 2710, "avg_latency": "160ms"},
			},
		},
	})
}

// AiBatchComplete accepts batch requests and returns a job ID
// @Summary Batch AI completion
// @Description Accepts a batch completion request and returns a job id
// @Tags ai
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param request body routes.AiBatchRequest true "Batch request"
// @Success 202 {object} routes.AiBatchAccepted
// @Failure 400 {object} map[string]interface{}
// @Router /v1/ai/batch [post]
func AiBatchComplete(c *gin.Context) {
	var req struct {
		Requests    []map[string]string `json:"requests"`
		Model       string              `json:"model"`
		CallbackURL string              `json:"callback_url"`
	}
	if err := c.BindJSON(&req); err != nil || len(req.Requests) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid batch request"})
		return
	}
	jobID := utils.GenID()
	c.JSON(http.StatusAccepted, gin.H{
		"job_id":               jobID,
		"status":               "queued",
		"estimated_completion": "2-5 minutes",
	})
}

// AiJobStatus returns job status and results
// @Summary AI job status
// @Description Returns the status and results for a batch completion job
// @Tags ai
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param jobId path string true "Job ID"
// @Success 200 {object} routes.AiJobStatusResponse
// @Router /v1/ai/jobs/{jobId} [get]
func AiJobStatus(c *gin.Context) {
	jobID := c.Param("jobId")
	c.JSON(http.StatusOK, gin.H{
		"job_id":       jobID,
		"status":       "completed",
		"created_at":   time.Now().Add(-3 * time.Minute).UTC().Format(time.RFC3339),
		"completed_at": time.Now().UTC().Format(time.RFC3339),
		"results": []gin.H{
			{"index": 0, "completion": "Sample completion for first prompt", "status": "success"},
			{"index": 1, "completion": "Sample completion for second prompt", "status": "success"},
		},
	})
}
