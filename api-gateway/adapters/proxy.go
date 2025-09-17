package adapters

import (
	"bytes"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/DrWeltschmerz/users-core"
	"github.com/gin-gonic/gin"
)

// CallAdapter wraps the adapter call and always returns a valid error if response is not valid JSON
func CallAdapter(c *gin.Context, baseURL, prompt, model, failHeader string) (string, error) {
	client := &http.Client{Timeout: 2 * time.Second}
	payload := map[string]string{"prompt": prompt, "model": model}
	body, _ := json.Marshal(payload)
	var lastErr error
	for attempt := 0; attempt < 3; attempt++ {
		req, _ := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, baseURL+"/complete", bytes.NewReader(body))
		req.Header.Set("content-type", "application/json")
		if auth := c.GetHeader("Authorization"); strings.TrimSpace(auth) != "" {
			req.Header.Set("Authorization", auth)
		} else {
			req.Header.Set("Authorization", "Bearer internal-service")
		}
		if failHeader != "" {
			req.Header.Set("x-test-fail", failHeader)
		}
		resp, err := client.Do(req)
		if err != nil {
			lastErr = err
		} else {
			defer resp.Body.Close()
			if resp.StatusCode >= 200 && resp.StatusCode < 300 {
				rb, _ := io.ReadAll(resp.Body)
				var tmp struct {
					Completion string `json:"completion"`
				}
				if err := json.Unmarshal(rb, &tmp); err != nil {
					lastErr = errors.New("invalid adapter response: " + err.Error())
				} else {
					return tmp.Completion, nil
				}
			} else {
				lastErr = errors.New("adapter status " + resp.Status)
			}
		}
		time.Sleep(time.Duration(100*(attempt+1)) * time.Millisecond)
	}
	return "", lastErr
}

// Adapter proxy authentication middleware
func AdapterProxyAuth(tokenizer users.Tokenizer, serviceKey string, healthPath string) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodGet && c.Request.URL.Path == healthPath {
			c.Next()
			return
		}
		auth := c.GetHeader("Authorization")
		if strings.HasPrefix(auth, "Bearer ") {
			token := strings.TrimPrefix(auth, "Bearer ")
			if userID, err := tokenizer.ValidateToken(token); err == nil && userID != "" {
				c.Set("userID", userID)
				c.Next()
				return
			}
		}
		if serviceKey != "" && c.GetHeader("x-api-key") == serviceKey {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
	}
}

// Resolve adapter URL by model name
func ResolveAdapterURL(model string) (string, error) {
	switch model {
	case "adapter-a":
		if u := os.Getenv("ADAPTER_A_URL"); u != "" {
			return u, nil
		}
		return "http://localhost:8081", nil
	case "adapter-b":
		if u := os.Getenv("ADAPTER_B_URL"); u != "" {
			return u, nil
		}
		return "http://localhost:8082", nil
	default:
		return "", errors.New("unknown model")
	}
}

// Proxy handler to forward requests to adapter
func ProxyToAdapter(targetURL string) gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Param("path")
		if path == "" {
			path = "/"
		}
		path = strings.TrimPrefix(path, "/")
		fullURL := targetURL + "/" + path
		if c.Request.URL.RawQuery != "" {
			fullURL += "?" + c.Request.URL.RawQuery
		}
		client := &http.Client{Timeout: 30 * time.Second}
		var reqBody io.Reader
		if c.Request.Body != nil {
			bodyBytes, _ := io.ReadAll(c.Request.Body)
			reqBody = bytes.NewReader(bodyBytes)
		}
		req, err := http.NewRequestWithContext(c.Request.Context(), c.Request.Method, fullURL, reqBody)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create proxy request"})
			return
		}
		for key, values := range c.Request.Header {
			if !isHopByHopHeader(key) {
				for _, value := range values {
					req.Header.Add(key, value)
				}
			}
		}
		resp, err := client.Do(req)
		if err != nil {
			c.JSON(http.StatusBadGateway, gin.H{"error": "adapter unavailable"})
			return
		}
		defer resp.Body.Close()
		for key, values := range resp.Header {
			if !isHopByHopHeader(key) {
				for _, value := range values {
					c.Header(key, value)
				}
			}
		}
		c.Status(resp.StatusCode)
		_, _ = io.Copy(c.Writer, resp.Body)
	}
}

// Helper to check hop-by-hop headers
func isHopByHopHeader(header string) bool {
	switch strings.ToLower(header) {
	case "connection", "keep-alive", "proxy-authenticate", "proxy-authorization", "te", "trailers", "transfer-encoding", "upgrade":
		return true
	default:
		return false
	}
}
