package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// @Summary Health check
// @Description Returns the health status of the API
// @Tags health
// @Produce json
// @Success 200 {object} map[string]string
// @Router /healthz [get]
func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"status": "ok"})
}
