package middleware

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"os"
	"time"

	"github.com/gin-gonic/gin"
)

// RequestID sets/propagates x-request-id and stores it in context
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		rid := c.GetHeader("x-request-id")
		if rid == "" {
			rid = genRequestID()
		}
		c.Writer.Header().Set("x-request-id", rid)
		c.Set("request_id", rid)
		c.Next()
	}
}

func genRequestID() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return hex.EncodeToString([]byte(time.Now().Format(time.RFC3339Nano)))
	}
	return hex.EncodeToString(b)
}

// AccessLog logs basic request info as JSON to stdout
func AccessLog() gin.HandlerFunc {
	type entry struct {
		Time      string        `json:"time"`
		Method    string        `json:"method"`
		Path      string        `json:"path"`
		Status    int           `json:"status"`
		Duration  time.Duration `json:"duration_ms"`
		RequestID string        `json:"request_id"`
	}
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		rid, _ := c.Get("request_id")
		e := entry{
			Time:      time.Now().Format(time.RFC3339),
			Method:    c.Request.Method,
			Path:      c.Request.URL.Path,
			Status:    c.Writer.Status(),
			Duration:  time.Since(start) / time.Millisecond,
			RequestID: toString(rid),
		}
		b, _ := json.Marshal(e)
		_, _ = os.Stdout.Write(append(b, '\n'))
	}
}

func toString(v any) string {
	if s, ok := v.(string); ok {
		return s
	}
	return ""
}
