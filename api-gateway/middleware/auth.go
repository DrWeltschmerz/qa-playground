package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"net/http"
	"regexp"

	users "github.com/DrWeltschmerz/users-core"
	"github.com/gin-gonic/gin"
)

// StrictAuthValidation validates payloads for auth endpoints (/register, /login)
// before they reach handlers. It returns 400 for malformed/invalid requests.
func StrictAuthValidation() gin.HandlerFunc {
	emailRe := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	usernameRe := regexp.MustCompile(`^[A-Za-z0-9_.\-]{3,64}$`)

	type registerInput struct {
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
	}
	type loginInput struct {
		Email    string `json:"email"`
		Username string `json:"username"`
		Password string `json:"password"`
	}

	return func(c *gin.Context) {
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}
		if c.Request.Method == http.MethodPost && (path == "/register" || path == "/login") {
			bodyBytes, _ := io.ReadAll(c.Request.Body)
			c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

			if path == "/register" {
				var in registerInput
				if err := json.Unmarshal(bodyBytes, &in); err != nil {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
					return
				}
				if !emailRe.MatchString(in.Email) {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid email"})
					return
				}
				if !usernameRe.MatchString(in.Username) {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid username"})
					return
				}
				if len(in.Password) < 8 {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "weak password"})
					return
				}
			} else { // /login
				var in loginInput
				if err := json.Unmarshal(bodyBytes, &in); err != nil {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
					return
				}
				// allow either email or username
				if (in.Email == "" && in.Username == "") || in.Password == "" {
					c.AbortWithStatusJSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
					return
				}
			}
		}
		c.Next()
	}
}

// JwtOrAPIKeyMiddleware allows either a valid Bearer token (using tokenizer)
// or a matching x-api-key header for service-to-service access.
func JwtOrAPIKeyMiddleware(tokenizer users.Tokenizer, serviceKey string) gin.HandlerFunc {
	return func(c *gin.Context) {
		auth := c.GetHeader("Authorization")
		if auth != "" {
			if len(auth) > 7 && auth[:7] == "Bearer " {
				token := auth[7:]
				if userID, err := tokenizer.ValidateToken(token); err == nil && userID != "" {
					c.Set("userID", userID)
					c.Next()
					return
				}
				c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
				return
			}
			// Malformed Authorization header
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization"})
			return
		}
		if serviceKey != "" && c.GetHeader("x-api-key") == serviceKey {
			c.Next()
			return
		}
		c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
	}
}
