package routes

import (
	"encoding/json"
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weltschmerz/QA-Playground/api-gateway/utils"
)

type AuditLog struct {
	ID           string `json:"id"`
	Timestamp    string `json:"timestamp"`
	UserID       string `json:"user_id"`
	Action       string `json:"action"`
	ResourceType string `json:"resource_type"`
	ResourceID   string `json:"resource_id"`
	// Ensure these keys are always present in JSON responses
	Details   map[string]any `json:"details"`
	IPAddress string         `json:"ip_address"`
	UserAgent string         `json:"user_agent"`
	// Optional additional fields used by integration tests
	EventType string         `json:"event_type,omitempty"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

var auditLogs = []AuditLog{}

func sanitizeDetails(in map[string]any) map[string]any {
	if in == nil {
		return nil
	}
	out := map[string]any{}
	for k, v := range in {
		key := strings.ToLower(k)
		if key == "old_password" || key == "new_password" {
			out[k] = "***redacted***"
			continue
		}
		out[k] = v
	}
	return out
}

// GetAuditLogs lists audit logs with filters
// @Summary List audit logs
// @Tags audit
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param user_id query string false "Filter by user ID"
// @Param action query string false "Filter by action"
// @Param resource_type query string false "Filter by resource type"
// @Param start_date query string false "RFC3339 start"
// @Param end_date query string false "RFC3339 end"
// @Param sort query string false "Sort field (timestamp)"
// @Param order query string false "asc|desc"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Router /v1/audit/logs [get]
func GetAuditLogs(c *gin.Context) {
	// Query params
	userID := strings.TrimSpace(c.Query("user_id"))
	action := strings.TrimSpace(c.Query("action"))
	resourceType := strings.TrimSpace(c.Query("resource_type"))
	startStr := strings.TrimSpace(c.Query("start_date"))
	endStr := strings.TrimSpace(c.Query("end_date"))
	sortBy := strings.TrimSpace(c.DefaultQuery("sort", "timestamp"))
	order := strings.ToLower(c.DefaultQuery("order", "desc"))
	pageStr := strings.TrimSpace(c.DefaultQuery("page", "1"))
	limitStr := strings.TrimSpace(c.DefaultQuery("limit", "50"))

	var startT, endT time.Time
	var err error
	if startStr != "" {
		startT, err = time.Parse(time.RFC3339, startStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format"})
			return
		}
	}
	if endStr != "" {
		endT, err = time.Parse(time.RFC3339, endStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid date format"})
			return
		}
	}

	page, _ := strconv.Atoi(pageStr)
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 50
	}
	if limit > 1000 {
		limit = 1000
	}

	// Filter
	filtered := make([]AuditLog, 0, len(auditLogs))
	for _, l := range auditLogs {
		if userID != "" && l.UserID != userID {
			continue
		}
		if action != "" && l.Action != action {
			continue
		}
		if resourceType != "" && l.ResourceType != resourceType {
			continue
		}
		if !startT.IsZero() || !endT.IsZero() {
			if ts, err := time.Parse(time.RFC3339, l.Timestamp); err == nil {
				if !startT.IsZero() && ts.Before(startT) {
					continue
				}
				if !endT.IsZero() && ts.After(endT) {
					continue
				}
			}
		}
		filtered = append(filtered, l)
	}

	// Sort
	sort.Slice(filtered, func(i, j int) bool {
		if sortBy == "timestamp" {
			ti, _ := time.Parse(time.RFC3339, filtered[i].Timestamp)
			tj, _ := time.Parse(time.RFC3339, filtered[j].Timestamp)
			if order == "asc" {
				return ti.Before(tj)
			}
			return ti.After(tj)
		}
		// default to timestamp
		ti, _ := time.Parse(time.RFC3339, filtered[i].Timestamp)
		tj, _ := time.Parse(time.RFC3339, filtered[j].Timestamp)
		if order == "asc" {
			return ti.Before(tj)
		}
		return ti.After(tj)
	})

	total := len(filtered)
	startIdx := (page - 1) * limit
	if startIdx > total {
		startIdx = total
	}
	endIdx := startIdx + limit
	if endIdx > total {
		endIdx = total
	}
	paged := filtered[startIdx:endIdx]

	resp := gin.H{
		"logs":  paged,
		"total": total,
		"page":  page,
		"limit": limit,
		"sort":  sortBy,
		"order": order,
		"filters": gin.H{
			"user_id":       userID,
			"action":        action,
			"resource_type": resourceType,
			"start_date":    startStr,
			"end_date":      endStr,
		},
	}
	c.JSON(http.StatusOK, resp)
}

// GetAuditLog returns a specific audit log
// @Summary Get audit log by ID
// @Tags audit
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param logId path string true "Audit Log ID"
// @Success 200 {object} AuditLog
// @Failure 404 {object} map[string]string
// @Router /v1/audit/logs/{logId} [get]
func GetAuditLog(c *gin.Context) {
	id := c.Param("logId")
	for _, l := range auditLogs {
		if l.ID == id {
			c.JSON(http.StatusOK, l)
			return
		}
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "audit log not found"})
}

// CreateAuditLog creates an audit log entry
// @Summary Create audit log
// @Tags audit
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Success 201 {object} AuditLog
// @Failure 400 {object} map[string]string
// @Router /v1/audit/logs [post]
func CreateAuditLog(c *gin.Context) {
	var payload struct {
		UserID       string         `json:"user_id"`
		Action       string         `json:"action"`
		EventType    string         `json:"event_type"`
		Resource     string         `json:"resource"`
		ResourceType string         `json:"resource_type"`
		ResourceID   string         `json:"resource_id"`
		Details      map[string]any `json:"details"`
		IPAddress    string         `json:"ip_address"`
		UserAgent    string         `json:"user_agent"`
		Metadata     map[string]any `json:"metadata"`
		Timestamp    string         `json:"timestamp"`
	}
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}

	// Validate required
	if strings.TrimSpace(payload.UserID) == "" || strings.TrimSpace(payload.Action) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required field"})
		return
	}
	// Accept either resource_type or resource (alias); resource_id is optional for some events
	if strings.TrimSpace(payload.ResourceType) == "" && strings.TrimSpace(payload.Resource) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "missing required field: resource_type or resource"})
		return
	}
	// Validate action type (alphanum, underscore, dash, colon)
	// Allow unicode letters and numbers in action, plus underscore, hyphen, colon
	if ok, _ := regexp.MatchString(`^[\p{L}\p{N}_\-:]+$`, payload.Action); !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "action is invalid"})
		return
	}
	// Size limit for details
	if payload.Details != nil {
		if b, err := json.Marshal(payload.Details); err == nil {
			if len(b) > 6000 {
				c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "payload too large"})
				return
			}
		}
	}

	// Timestamp
	ts := payload.Timestamp
	if strings.TrimSpace(ts) == "" {
		// Include sub-second precision to satisfy tests comparing millisecond boundaries
		ts = time.Now().UTC().Format(time.RFC3339Nano)
	} else {
		// Accept RFC3339 or RFC3339Nano
		if _, err := time.Parse(time.RFC3339Nano, ts); err != nil {
			if _, err2 := time.Parse(time.RFC3339, ts); err2 != nil {
				// If invalid custom ts, normalize to now
				ts = time.Now().UTC().Format(time.RFC3339Nano)
			}
		}
	}

	// Default IP/User-Agent from request if not provided
	ip := strings.TrimSpace(payload.IPAddress)
	if ip == "" {
		ip = c.ClientIP()
	}
	ua := strings.TrimSpace(payload.UserAgent)
	if ua == "" {
		ua = c.GetHeader("User-Agent")
	}

	// Map alias fields
	rType := payload.ResourceType
	if rType == "" {
		rType = payload.Resource
	}

	entry := AuditLog{
		ID:           "audit-" + utils.GenID()[:8],
		Timestamp:    ts,
		UserID:       payload.UserID,
		Action:       payload.Action,
		ResourceType: rType,
		ResourceID:   payload.ResourceID,
		Details:      sanitizeDetails(payload.Details),
		IPAddress:    ip,
		UserAgent:    ua,
		Metadata:     payload.Metadata,
		EventType:    payload.EventType,
	}
	auditLogs = append(auditLogs, entry)
	c.JSON(http.StatusCreated, entry)
}
