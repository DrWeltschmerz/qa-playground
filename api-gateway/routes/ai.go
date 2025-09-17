package routes

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weltschmerz/QA-Playground/api-gateway/adapters"
)

// @Summary AI text completion
// @Description Generate text completion using specified AI model
// @Tags ai
// @Accept json
// @Produce json
// @Security BearerAuth
// @Security ApiKeyAuth
// @Param request body object{prompt=string,model=string} true "Completion request"
// @Success 200 {object} object{model=string,completion=string,usage=object,traceId=string}
// @Failure 400 {object} map[string]string
// @Failure 401 {object} map[string]string
// @Failure 502 {object} map[string]string
// @Router /v1/ai/complete [post]
func AiComplete(c *gin.Context) {
	type req struct{ Prompt, Model string }
	var body req
	if err := c.BindJSON(&body); err != nil || body.Prompt == "" || body.Model == "" {
		c.JSON(400, gin.H{"error": "invalid payload"})
		return
	}
	adapterURL, err := adapters.ResolveAdapterURL(body.Model)
	if err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}
	failHeader := c.GetHeader("x-test-fail")
	completion, err := adapters.CallAdapter(c, adapterURL, body.Prompt, body.Model, failHeader)
	if err != nil {
		c.JSON(502, gin.H{"error": err.Error(), "model": body.Model, "completion": ""})
		return
	}
	c.JSON(200, gin.H{
		"model":      body.Model,
		"completion": completion,
		"usage":      gin.H{"prompt_tokens": len(body.Prompt) / 4, "completion_tokens": len(completion) / 4, "total_tokens": len(body.Prompt)/4 + len(completion)/4},
		"traceId":    time.Now().UnixNano(),
	})
}
