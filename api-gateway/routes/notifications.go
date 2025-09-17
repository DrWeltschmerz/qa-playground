package routes

import (
	"net/http"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/weltschmerz/QA-Playground/api-gateway/utils"
)

type Notification struct {
	ID        string         `json:"id"`
	Title     string         `json:"title"`
	Message   string         `json:"message"`
	Type      string         `json:"type"`
	Recipient string         `json:"recipient"`
	Priority  string         `json:"priority"`
	Status    string         `json:"status"`
	CreatedAt string         `json:"created_at"`
	UpdatedAt string         `json:"updated_at"`
	ReadBy    *string        `json:"read_by"`
	ReadAt    *string        `json:"read_at"`
	Metadata  map[string]any `json:"metadata,omitempty"`
}

var (
	// Namespace notifications per auth to avoid cross-test interference
	notifDataNS = map[string]map[string]Notification{}
)

func nsKey(c *gin.Context) string {
	if s := strings.TrimSpace(c.GetHeader("Authorization")); s != "" {
		return s
	}
	if s := strings.TrimSpace(c.GetHeader("x-api-key")); s != "" {
		return "apikey:" + s
	}
	return "anon"
}

func getNotifStore(c *gin.Context) map[string]Notification {
	key := nsKey(c)
	if store, ok := notifDataNS[key]; ok {
		return store
	}
	store := map[string]Notification{}
	notifDataNS[key] = store
	return store
}

func newNotificationID() string { return "notif-" + utils.GenID()[:12] }

func isValidEmail(s string) bool {
	re := regexp.MustCompile(`^[^\s@]+@[^\s@]+\.[^\s@]+$`)
	return re.MatchString(s)
}

func defaultOrAllowed(v string, allowed []string, def string) string {
	v = strings.ToLower(strings.TrimSpace(v))
	for _, a := range allowed {
		if v == a {
			return v
		}
	}
	return def
}

// ListNotifications lists notifications with filters
// @Summary List notifications
// @Description Returns notifications with filters, pagination, and sorting
// @Tags notifications
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param recipient query string false "Filter by recipient"
// @Param status query string false "Filter by status"
// @Param type query string false "Filter by type"
// @Param priority query string false "Filter by priority"
// @Param search query string false "Search text"
// @Param start_date query string false "RFC3339 start date"
// @Param end_date query string false "RFC3339 end date"
// @Param page query int false "Page number"
// @Param limit query int false "Items per page"
// @Param sort query string false "Sort field"
// @Param order query string false "asc|desc"
// @Success 200 {object} map[string]interface{}
// @Router /v1/notifications [get]
func ListNotifications(c *gin.Context) {
	// Filters and sorting
	recipient := strings.TrimSpace(c.Query("recipient"))
	statusFilter := strings.TrimSpace(c.Query("status"))
	typeFilter := strings.TrimSpace(c.Query("type"))
	priorityFilter := strings.TrimSpace(c.Query("priority"))
	search := strings.ToLower(strings.TrimSpace(c.Query("search")))
	startDate := strings.TrimSpace(c.Query("start_date"))
	endDate := strings.TrimSpace(c.Query("end_date"))

	pageStr := strings.TrimSpace(c.DefaultQuery("page", "1"))
	limitStr := strings.TrimSpace(c.DefaultQuery("limit", "20"))
	sortBy := c.DefaultQuery("sort", "created_at")
	order := strings.ToLower(c.DefaultQuery("order", "desc"))

	page, _ := strconv.Atoi(pageStr)
	if page <= 0 {
		page = 1
	}
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 {
		limit = 20
	}

	var startT, endT time.Time
	var startOk, endOk bool
	if startDate != "" {
		if t, err := time.Parse(time.RFC3339, startDate); err == nil {
			startT, startOk = t, true
		}
	}
	if endDate != "" {
		if t, err := time.Parse(time.RFC3339, endDate); err == nil {
			endT, endOk = t, true
		}
	}

	store := getNotifStore(c)
	items := make([]Notification, 0, len(store))
	for _, n := range store {
		if recipient != "" && !strings.EqualFold(n.Recipient, recipient) {
			continue
		}
		if statusFilter != "" && !strings.EqualFold(n.Status, statusFilter) {
			continue
		}
		if typeFilter != "" && !strings.EqualFold(n.Type, typeFilter) {
			continue
		}
		if priorityFilter != "" && !strings.EqualFold(n.Priority, priorityFilter) {
			continue
		}
		if search != "" && !(strings.Contains(strings.ToLower(n.Title), search) || strings.Contains(strings.ToLower(n.Message), search)) {
			continue
		}
		if startOk || endOk {
			// created_at is RFC3339
			if t, err := time.Parse(time.RFC3339, n.CreatedAt); err == nil {
				if startOk && t.Before(startT) {
					continue
				}
				if endOk && t.After(endT) {
					continue
				}
			}
		}
		items = append(items, n)
	}
	sort.Slice(items, func(i, j int) bool {
		if sortBy == "priority" {
			pr := map[string]int{"low": 1, "medium": 2, "normal": 2, "high": 3, "critical": 4}
			if order == "asc" {
				return pr[strings.ToLower(items[i].Priority)] < pr[strings.ToLower(items[j].Priority)]
			}
			return pr[strings.ToLower(items[i].Priority)] > pr[strings.ToLower(items[j].Priority)]
		}
		if order == "asc" {
			return items[i].CreatedAt < items[j].CreatedAt
		}
		return items[i].CreatedAt > items[j].CreatedAt
	})

	total := len(items)
	startIdx := (page - 1) * limit
	if startIdx > total {
		startIdx = total
	}
	endIdx := startIdx + limit
	if endIdx > total {
		endIdx = total
	}
	paged := items[startIdx:endIdx]

	resp := gin.H{
		"notifications": paged,
		"total":         total,
		"page":          page,
		"limit":         limit,
		"sort":          sortBy,
		"order":         order,
	}
	if recipient != "" {
		resp["recipient_filter"] = recipient
	}
	if statusFilter != "" {
		resp["status_filter"] = statusFilter
	}
	if typeFilter != "" {
		resp["type_filter"] = typeFilter
	}
	if priorityFilter != "" {
		resp["priority_filter"] = priorityFilter
	}
	if search != "" {
		resp["search_query"] = search
	}
	if startOk || endOk {
		resp["date_range"] = gin.H{"start": startDate, "end": endDate}
	}
	c.JSON(http.StatusOK, resp)
}

// CreateNotification creates a notification
// @Summary Create notification
// @Tags notifications
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Success 201 {object} Notification
// @Failure 400 {object} map[string]string
// @Router /v1/notifications [post]
func CreateNotification(c *gin.Context) {
	var n Notification
	if err := c.BindJSON(&n); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if strings.TrimSpace(n.Title) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title is required"})
		return
	}
	if len(n.Title) > 300 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "title length too long"})
		return
	}
	if strings.TrimSpace(n.Message) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message is required"})
		return
	}
	if len(n.Message) > 4000 {
		c.JSON(http.StatusRequestEntityTooLarge, gin.H{"error": "message length too long"})
		return
	}
	if n.Recipient != "" && !isValidEmail(n.Recipient) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid recipient"})
		return
	}
	n.ID = newNotificationID()
	// Validate type/priority with sensible defaults
	allowedTypes := []string{"info", "warning", "alert", "error"}
	if strings.TrimSpace(n.Type) == "" {
		n.Type = "info"
	} else if defaultOrAllowed(n.Type, allowedTypes, "") == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "type is invalid"})
		return
	} else {
		n.Type = defaultOrAllowed(n.Type, allowedTypes, "info")
	}

	allowedPriorities := []string{"low", "medium", "normal", "high", "critical"}
	if strings.TrimSpace(n.Priority) == "" {
		n.Priority = "normal"
	} else if defaultOrAllowed(n.Priority, allowedPriorities, "") == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "priority is invalid"})
		return
	} else {
		n.Priority = defaultOrAllowed(n.Priority, allowedPriorities, "normal")
	}
	n.Status = "unread"
	now := time.Now().UTC().Format(time.RFC3339)
	n.CreatedAt = now
	n.UpdatedAt = now
	store := getNotifStore(c)
	store[n.ID] = n
	c.JSON(http.StatusCreated, n)
}

// GetNotificationByID returns a single notification
// @Summary Get notification by ID
// @Tags notifications
// @Security BearerAuth
// @Security ApiKeyAuth
// @Produce json
// @Param notificationId path string true "Notification ID"
// @Success 200 {object} Notification
// @Failure 404 {object} map[string]string
// @Router /v1/notifications/{notificationId} [get]
func GetNotificationByID(c *gin.Context) {
	id := c.Param("notificationId")
	store := getNotifStore(c)
	if n, ok := store[id]; ok {
		c.JSON(http.StatusOK, n)
		return
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
}

// UpdateNotification updates a notification
// @Summary Update notification
// @Tags notifications
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param notificationId path string true "Notification ID"
// @Success 200 {object} Notification
// @Failure 400 {object} map[string]string
// @Failure 404 {object} map[string]string
// @Router /v1/notifications/{notificationId} [put]
func UpdateNotification(c *gin.Context) {
	id := c.Param("notificationId")
	store := getNotifStore(c)
	old, ok := store[id]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}
	var patch Notification
	if err := c.BindJSON(&patch); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if strings.TrimSpace(patch.Title) != "" {
		old.Title = patch.Title
	}
	if strings.TrimSpace(patch.Message) != "" {
		old.Message = patch.Message
	}
	if strings.TrimSpace(patch.Type) != "" {
		old.Type = defaultOrAllowed(patch.Type, []string{"info", "warning", "alert", "error"}, old.Type)
	}
	if strings.TrimSpace(patch.Priority) != "" {
		old.Priority = defaultOrAllowed(patch.Priority, []string{"low", "medium", "normal", "high", "critical"}, old.Priority)
	}
	if patch.Metadata != nil {
		if old.Metadata == nil {
			old.Metadata = map[string]any{}
		}
		for k, v := range patch.Metadata {
			old.Metadata[k] = v
		}
	}
	old.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	store[id] = old
	c.JSON(http.StatusOK, old)
}

// MarkNotificationRead marks a notification as read
// @Summary Mark notification as read
// @Tags notifications
// @Security BearerAuth
// @Security ApiKeyAuth
// @Accept json
// @Produce json
// @Param notificationId path string true "Notification ID"
// @Success 200 {object} Notification
// @Failure 404 {object} map[string]string
// @Router /v1/notifications/{notificationId}/read [put]
func MarkNotificationRead(c *gin.Context) {
	id := c.Param("notificationId")
	store := getNotifStore(c)
	n, ok := store[id]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}
	var body struct {
		ReadBy string `json:"read_by"`
		ReadAt string `json:"read_at"`
	}
	_ = c.BindJSON(&body)
	who := body.ReadBy
	if strings.TrimSpace(who) == "" {
		who = "system"
	}
	ts := body.ReadAt
	if strings.TrimSpace(ts) == "" {
		ts = time.Now().UTC().Format(time.RFC3339)
	}
	n.Status = "read"
	n.ReadBy = &who
	n.ReadAt = &ts
	n.UpdatedAt = ts
	store[id] = n
	c.JSON(http.StatusOK, n)
}

// MarkNotificationUnread clears read status for a notification
// @Summary Mark notification as unread
// @Description Clears read status for a notification
// @Tags notifications
// @Security BearerAuth
// @Security ApiKeyAuth
// @Param notificationId path string true "Notification ID"
// @Accept json
// @Produce json
// @Success 200 {object} Notification
// @Failure 404 {object} map[string]string
// @Router /v1/notifications/{notificationId}/unread [put]
func MarkNotificationUnread(c *gin.Context) {
	id := c.Param("notificationId")
	store := getNotifStore(c)
	n, ok := store[id]
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
		return
	}
	n.Status = "unread"
	n.ReadBy = nil
	n.ReadAt = nil
	n.UpdatedAt = time.Now().UTC().Format(time.RFC3339)
	store[id] = n
	c.JSON(http.StatusOK, n)
}

func DeleteNotification(c *gin.Context) {
	id := c.Param("notificationId")
	store := getNotifStore(c)
	if _, ok := store[id]; ok {
		delete(store, id)
		c.Status(http.StatusNoContent)
		return
	}
	c.JSON(http.StatusNotFound, gin.H{"error": "notification not found"})
}

func BroadcastNotification(c *gin.Context) {
	var payload struct {
		Title       string         `json:"title"`
		Message     string         `json:"message"`
		Type        string         `json:"type"`
		Priority    string         `json:"priority"`
		Recipients  []string       `json:"recipients"`
		ScheduleFor string         `json:"schedule_for"`
		Immediate   bool           `json:"immediate"`
		Metadata    map[string]any `json:"metadata"`
	}
	if err := c.BindJSON(&payload); err != nil || strings.TrimSpace(payload.Title) == "" || strings.TrimSpace(payload.Message) == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid payload"})
		return
	}
	if len(payload.Recipients) == 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "recipients are required"})
		return
	}
	for _, r := range payload.Recipients {
		if !isValidEmail(r) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "recipient email invalid"})
			return
		}
	}
	id := "broadcast-" + utils.GenID()[:8]
	if payload.Immediate {
		// Create notifications immediately
		created := []string{}
		now := time.Now().UTC().Format(time.RFC3339)
		store := getNotifStore(c)
		for _, r := range payload.Recipients {
			n := Notification{
				ID:        newNotificationID(),
				Title:     payload.Title,
				Message:   payload.Message,
				Type:      defaultOrAllowed(payload.Type, []string{"info", "warning", "alert", "error"}, "info"),
				Recipient: r,
				Priority:  defaultOrAllowed(payload.Priority, []string{"low", "medium", "normal", "high", "critical"}, "normal"),
				Status:    "unread",
				CreatedAt: now,
				UpdatedAt: now,
				Metadata:  payload.Metadata,
			}
			store[n.ID] = n
			created = append(created, n.ID)
		}
		c.JSON(http.StatusCreated, gin.H{"broadcast_id": id, "status": "sent", "notifications_created": created})
		return
	}
	// Scheduled broadcast
	scheduledFor := payload.ScheduleFor
	if strings.TrimSpace(scheduledFor) == "" {
		scheduledFor = time.Now().UTC().Add(1 * time.Hour).Format(time.RFC3339)
	}
	c.JSON(http.StatusAccepted, gin.H{"broadcast_id": id, "recipients_count": len(payload.Recipients), "status": "scheduled", "scheduled_for": scheduledFor})
}
