package routes

import (
	"errors"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weltschmerz/QA-Playground/api-gateway/utils"
)

type WorkflowStep struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Type      string   `json:"type"`
	DependsOn []string `json:"depends_on,omitempty"`
}

type Workflow struct {
	ID               string                 `json:"id"`
	Name             string                 `json:"name"`
	Description      string                 `json:"description,omitempty"`
	Steps            []WorkflowStep         `json:"steps"`
	Metadata         map[string]interface{} `json:"metadata,omitempty"`
	Status           string                 `json:"status"`
	CreatedAt        string                 `json:"created_at"`
	UpdatedAt        string                 `json:"updated_at"`
	ExecutionHistory []map[string]any       `json:"execution_history"`
	CurrentStep      string                 `json:"current_step"`
}

type workflowExecution struct {
	ExecutionID string           `json:"execution_id"`
	WorkflowID  string           `json:"workflow_id"`
	Status      string           `json:"status"`
	CurrentStep string           `json:"current_step"`
	StartedAt   string           `json:"started_at"`
	TriggeredBy string           `json:"triggered_by,omitempty"`
	History     []map[string]any `json:"history,omitempty"`
}

// In-memory stores (kept here to keep main.go light; replace with DB in real app)
var (
	wfStore   = map[string]Workflow{}
	execStore = map[string]workflowExecution{}
)

// Guards for concurrent access
var (
	wfMu   = new(sync.RWMutex)
	execMu = new(sync.RWMutex)
)

// ListWorkflows returns paginated workflows
// @Summary List workflows
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param name query string false "Filter by name contains"
// @Param status query string false "Filter by status"
// @Param sort_by query string false "Sort field: created_at|name"
// @Param order query string false "asc|desc"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Success 200 {object} map[string]interface{}
// @Router /v1/workflows [get]
func ListWorkflows(c *gin.Context) {
	// Optional filters and sorting
	nameFilter := strings.TrimSpace(c.Query("name"))
	statusFilter := strings.TrimSpace(c.Query("status"))
	sortBy := c.DefaultQuery("sort_by", "created_at")
	order := strings.ToLower(c.DefaultQuery("order", "desc"))

	wfMu.RLock()
	items := make([]Workflow, 0, len(wfStore))
	for _, wf := range wfStore {
		if nameFilter != "" && !strings.Contains(strings.ToLower(wf.Name), strings.ToLower(nameFilter)) {
			continue
		}
		if statusFilter != "" && !strings.EqualFold(wf.Status, statusFilter) {
			continue
		}
		items = append(items, wf)
	}
	wfMu.RUnlock()
	sort.Slice(items, func(i, j int) bool {
		if sortBy == "name" {
			if order == "asc" {
				return items[i].Name < items[j].Name
			}
			return items[i].Name > items[j].Name
		}
		if order == "asc" {
			return items[i].CreatedAt < items[j].CreatedAt
		}
		return items[i].CreatedAt > items[j].CreatedAt
	})

	// Pagination parameters
	page := 1
	limit := 10
	if v := c.Query("page"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			page = n
		}
	}
	if v := c.Query("limit"); v != "" {
		if n, err := strconv.Atoi(v); err == nil && n > 0 {
			limit = n
		}
	}
	total := len(items)
	start := (page - 1) * limit
	if start > total {
		start = total
	}
	end := start + limit
	if end > total {
		end = total
	}
	pageItems := items[start:end]
	c.JSON(http.StatusOK, gin.H{"workflows": pageItems, "total": total, "page": page, "limit": limit})
}

// CreateWorkflow creates a workflow
// @Summary Create workflow
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Success 201 {object} Workflow
// @Failure 400 {object} map[string]string
// @Router /v1/workflows [post]
func CreateWorkflow(c *gin.Context) {
	var wf Workflow
	if err := c.BindJSON(&wf); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid workflow payload"})
		return
	}
	if strings.TrimSpace(wf.Name) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
		return
	}
	if len(wf.Steps) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "steps must not be empty"})
		return
	}
	if err := validateSteps(wf.Steps); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	now := time.Now().UTC().Format(time.RFC3339)
	if wf.ID == "" {
		wf.ID = "wf-" + utils.GenID()[:12]
	}
	wf.Status = "draft"
	wf.CreatedAt = now
	wf.UpdatedAt = now
	wfMu.Lock()
	wfStore[wf.ID] = wf
	wfMu.Unlock()
	c.JSON(http.StatusCreated, wf)
}

// GetWorkflow returns a single workflow
// @Summary Get workflow by ID
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param workflowId path string true "Workflow ID"
// @Success 200 {object} Workflow
// @Failure 404 {object} map[string]string
// @Router /v1/workflows/{workflowId} [get]
func GetWorkflow(c *gin.Context) {
	id := c.Param("workflowId")
	wfMu.RLock()
	wf, ok := wfStore[id]
	wfMu.RUnlock()
	if ok {
		c.JSON(http.StatusOK, wf)
		return
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
}

// UpdateWorkflow updates a workflow
// @Summary Update workflow
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param workflowId path string true "Workflow ID"
// @Success 200 {object} Workflow
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /v1/workflows/{workflowId} [put]
func UpdateWorkflow(c *gin.Context) {
	id := c.Param("workflowId")
	wfMu.RLock()
	old, ok := wfStore[id]
	wfMu.RUnlock()
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}
	// Use pointer fields to detect presence
	var patch struct {
		Name        *string         `json:"name"`
		Description *string         `json:"description"`
		Steps       *[]WorkflowStep `json:"steps"`
		Metadata    map[string]any  `json:"metadata"`
	}
	if err := c.BindJSON(&patch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if patch.Name != nil {
		if strings.TrimSpace(*patch.Name) == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
			return
		}
		old.Name = *patch.Name
	}
	if patch.Description != nil {
		old.Description = *patch.Description
	}
	if patch.Steps != nil {
		if len(*patch.Steps) == 0 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "steps must not be empty"})
			return
		}
		if err := validateSteps(*patch.Steps); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		old.Steps = *patch.Steps
	}
	if patch.Metadata != nil {
		// Replace or merge metadata (simple replace for now)
		old.Metadata = patch.Metadata
	}
	old.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	wfMu.Lock()
	wfStore[id] = old
	wfMu.Unlock()
	c.JSON(http.StatusOK, old)
}

// ExecuteWorkflow triggers a workflow execution
// @Summary Execute workflow
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param workflowId path string true "Workflow ID"
// @Success 202 {object} map[string]interface{}
// @Failure 404 {object} map[string]string
// @Router /v1/workflows/{workflowId}/execute [post]
func ExecuteWorkflow(c *gin.Context) {
	id := c.Param("workflowId")
	wfMu.RLock()
	wf, ok := wfStore[id]
	wfMu.RUnlock()
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "workflow not found"})
		return
	}
	var payload struct {
		TriggeredBy string                 `json:"triggered_by"`
		Context     map[string]interface{} `json:"context"`
		Parameters  map[string]interface{} `json:"parameters"`
	}
	_ = c.BindJSON(&payload)
	ex := workflowExecution{
		ExecutionID: "exec-" + time.Now().UTC().Format("20060102T150405Z"),
		WorkflowID:  id,
		Status:      "started",
		CurrentStep: firstStep(wf),
		StartedAt:   time.Now().UTC().Format(time.RFC3339),
		TriggeredBy: payload.TriggeredBy,
	}
	execMu.Lock()
	execStore[id] = ex
	execMu.Unlock()
	c.JSON(http.StatusAccepted, gin.H{
		"execution_id": ex.ExecutionID,
		"workflow_id":  ex.WorkflowID,
		"status":       ex.Status,
		"current_step": ex.CurrentStep,
		"triggered_by": ex.TriggeredBy,
		"started_at":   ex.StartedAt,
	})
}

// GetWorkflowStatus returns execution status
// @Summary Get workflow status
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param workflowId path string true "Workflow ID"
// @Success 200 {object} map[string]interface{}
// @Failure 404 {object} map[string]string
// @Router /v1/workflows/{workflowId}/status [get]
func GetWorkflowStatus(c *gin.Context) {
	id := c.Param("workflowId")
	execMu.RLock()
	ex, ok := execStore[id]
	execMu.RUnlock()
	if ok {
		// Detect timeout scenario if special step is present
		wfMu.RLock()
		wf, ok := wfStore[id]
		wfMu.RUnlock()
		if ok {
			hasTimeout := false
			for _, s := range wf.Steps {
				if s.ID == "timeout_step" {
					hasTimeout = true
					break
				}
			}
			if hasTimeout {
				if t, err := time.Parse(time.RFC3339, ex.StartedAt); err == nil {
					if time.Since(t) > 1500*time.Millisecond {
						ex.Status = "timeout"
						execMu.Lock()
						execStore[id] = ex
						execMu.Unlock()
					}
				}
			}
		}
		// Build a richer status payload
		c.JSON(http.StatusOK, gin.H{
			"workflow_id":          id,
			"status":               ex.Status,
			"current_step":         ex.CurrentStep,
			"progress":             "0%",
			"execution_history":    ex.History,
			"next_actions":         []string{"continue", "pause"},
			"total_steps":          func() int { wfMu.RLock(); defer wfMu.RUnlock(); return len(wfStore[id].Steps) }(),
			"started_at":           ex.StartedAt,
			"estimated_completion": time.Now().Add(5 * time.Minute).Format(time.RFC3339),
		})
		return
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "no execution found"})
}

// ApproveWorkflow approves a workflow step
// @Summary Approve workflow step
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param workflowId path string true "Workflow ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /v1/workflows/{workflowId}/approve [post]
func ApproveWorkflow(c *gin.Context) {
	id := c.Param("workflowId")
	var payload struct {
		Approver  string `json:"approver"`
		Decision  string `json:"decision"`
		Comments  string `json:"comments"`
		Timestamp string `json:"timestamp"`
	}
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid approval data"})
		return
	}
	if strings.TrimSpace(payload.Approver) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "approver is required"})
		return
	}
	if strings.ToLower(payload.Decision) != "approved" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision invalid"})
		return
	}
	if _, ok := execStore[id]; !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "no execution found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"workflow_id":    id,
		"approver":       payload.Approver,
		"decision":       "approved",
		"comments":       payload.Comments,
		"next_step":      "proceed",
		"updated_status": "in_progress",
	})
}

// RejectWorkflow rejects a workflow step
// @Summary Reject workflow step
// @Tags workflows
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param workflowId path string true "Workflow ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /v1/workflows/{workflowId}/reject [post]
func RejectWorkflow(c *gin.Context) {
	id := c.Param("workflowId")
	var payload struct {
		Approver string `json:"approver"`
		Decision string `json:"decision"`
		Comments string `json:"comments"`
		Reason   string `json:"reason"`
	}
	if err := c.BindJSON(&payload); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid rejection data"})
		return
	}
	if strings.ToLower(payload.Decision) != "rejected" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "decision invalid"})
		return
	}
	if _, ok := execStore[id]; !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "no execution found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"workflow_id":     id,
		"approver":        payload.Approver,
		"decision":        "rejected",
		"comments":        payload.Comments,
		"reason":          payload.Reason,
		"workflow_status": "waiting_correction",
	})
}

func firstStep(wf Workflow) string {
	if len(wf.Steps) == 0 {
		return ""
	}
	// Pick the first step without dependencies if possible
	for _, s := range wf.Steps {
		if len(s.DependsOn) == 0 {
			return s.ID
		}
	}
	return wf.Steps[0].ID
}

// validateSteps checks for required fields and simple circular dependencies
func validateSteps(steps []WorkflowStep) error {
	if len(steps) == 0 {
		return errors.New("steps must not be empty")
	}
	ids := map[string]bool{}
	graph := map[string][]string{}
	for _, s := range steps {
		if strings.TrimSpace(s.ID) == "" || strings.TrimSpace(s.Name) == "" || strings.TrimSpace(s.Type) == "" {
			return errors.New("step missing required fields")
		}
		if ids[s.ID] {
			return errors.New("duplicate step id")
		}
		ids[s.ID] = true
		graph[s.ID] = append(graph[s.ID], s.DependsOn...)
	}
	// simple cycle detect
	visited := map[string]int{}
	var dfs func(string) bool
	dfs = func(u string) bool {
		if visited[u] == 1 {
			return true
		}
		if visited[u] == 2 {
			return false
		}
		visited[u] = 1
		for _, v := range graph[u] {
			if dfs(v) {
				return true
			}
		}
		visited[u] = 2
		return false
	}
	for id := range graph {
		if dfs(id) {
			return errors.New("circular dependency detected")
		}
	}
	return nil
}
