package main

import (
	"context"
	"os"

	"github.com/DrWeltschmerz/jwt-auth/pkg/authjwt"
	ginadapter "github.com/DrWeltschmerz/users-adapter-gin/ginadapter"
	gormadapter "github.com/DrWeltschmerz/users-adapter-gorm/gorm"
	users "github.com/DrWeltschmerz/users-core"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	swaggerFiles "github.com/swaggo/files"
	ginSwagger "github.com/swaggo/gin-swagger"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"

	"github.com/weltschmerz/QA-Playground/api-gateway/adapters"
	gwmiddleware "github.com/weltschmerz/QA-Playground/api-gateway/middleware"
	"github.com/weltschmerz/QA-Playground/api-gateway/routes"

	_ "github.com/weltschmerz/QA-Playground/api-gateway/docs"
)

// @title QA Showcase Gateway API
// @version 0.1.0
// @description API Gateway for QA Showcase with AI completion and user management
// @BasePath /
// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @securityDefinitions.apikey ApiKeyAuth
// @in header
// @name x-api-key

func main() {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(gwmiddleware.RequestID())
	r.Use(gwmiddleware.AccessLog())
	// Enforce stricter request validation aligned with test expectations
	r.Use(gwmiddleware.StrictAuthValidation())

	// Serve Swagger UI and specs (works in Docker and local dev)
	specsPath := findSpecsDir()
	r.Static("/specs", specsPath)

	// Convenience redirect for missing trailing slash (register before static)
	r.GET("/ui", func(c *gin.Context) { c.Redirect(301, "/ui/") })
	// Serve minimal static UI
	r.Static("/ui", "./static/ui")
	r.GET("/", func(c *gin.Context) {
		c.Redirect(302, "/ui")
	})

	// Serve multiple Swagger UIs
	r.GET("/swagger/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/docs", routes.DocsIndex)
	r.GET("/docs/gateway/*any", ginSwagger.WrapHandler(swaggerFiles.Handler))
	r.GET("/docs/users/*any", routes.UsersSwaggerHandler)
	r.GET("/docs/unified", routes.UnifiedSwaggerHandler)

	// Convenience redirect for missing trailing slash (register before static)
	r.GET("/demo", func(c *gin.Context) { c.Redirect(301, "/demo/") })
	// Serve Demo UI
	r.Static("/demo", "./static/demo")
	// Health and metrics
	r.GET("/healthz", routes.HealthCheck)
	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// DB (SQLite shared in-memory by default for dev/test)
	// Use a shared cache so multiple connections see the same schema/data.
	dsn := getenv("DB_DSN", "file::memory:?cache=shared")
	db, err := gorm.Open(sqlite.Open(dsn), &gorm.Config{})
	if err != nil {
		panic(err)
	}
	_ = db.AutoMigrate(&gormadapter.GormUser{}, &gormadapter.GormRole{})

	// Users service wiring
	userRepo := gormadapter.NewGormUserRepository(db)
	roleRepo := gormadapter.NewGormRoleRepository(db)
	hasher := authjwt.NewBcryptHasher()
	// Ensure JWT secret is set for tokenizer; default for local dev/tests
	if os.Getenv("JWT_SECRET") == "" {
		_ = os.Setenv("JWT_SECRET", getenv("JWT_SECRET", "dev-jwt-secret"))
	}
	tokenizer := authjwt.NewJWTTokenizer()
	svc := users.NewService(userRepo, roleRepo, hasher, tokenizer)

	// Initialize default admin user for testing compatibility
	initializeDefaultAdmin(svc)

	// Mount users routes via gin adapter
	ginadapter.RegisterRoutes(r, svc, tokenizer)

	// Protected AI route (JWT or service API key)
	ai := r.Group("/v1/ai")
	ai.Use(gwmiddleware.JwtOrAPIKeyMiddleware(tokenizer, getenv("SERVICE_API_KEY", "service-secret")))
	ai.POST("/complete", routes.AiComplete)
	ai.GET("/models", routes.AiListModels)
	ai.GET("/models/:model/status", routes.AiModelStatus)
	ai.POST("/models/:model/configure", routes.AiConfigureModel)
	ai.GET("/metrics", routes.AiMetrics)
	ai.POST("/batch", routes.AiBatchComplete)
	ai.GET("/jobs/:jobId", routes.AiJobStatus)

	// Adapter A proxy endpoints
	adapterAURL := getenv("ADAPTER_A_URL", "http://localhost:8081")
	adapterA := r.Group("/v1/adapter-a")
	adapterA.Use(adapters.AdapterProxyAuth(tokenizer, getenv("SERVICE_API_KEY", "service-secret"), "/v1/adapter-a/health"))
	adapterA.Any("/*path", adapters.ProxyToAdapter(adapterAURL))

	// Adapter B proxy endpoints
	adapterBURL := getenv("ADAPTER_B_URL", "http://localhost:8082")
	adapterB := r.Group("/v1/adapter-b")
	adapterB.Use(adapters.AdapterProxyAuth(tokenizer, getenv("SERVICE_API_KEY", "service-secret"), "/v1/adapter-b/health"))
	adapterB.Any("/*path", adapters.ProxyToAdapter(adapterBURL))

	// Analytics and monitoring endpoints
	analytics := r.Group("/v1/analytics")
	analytics.Use(gwmiddleware.JwtOrAPIKeyMiddleware(tokenizer, getenv("SERVICE_API_KEY", "service-secret")))
	analytics.GET("/usage", routes.GetUsageAnalytics)
	analytics.GET("/performance", routes.GetPerformanceMetrics)
	analytics.GET("/errors", routes.GetErrorAnalytics)
	analytics.POST("/events", routes.TrackEvent)
	analytics.POST("/events/batch", routes.TrackEventBatch)

	// User workflow endpoints
	workflows := r.Group("/v1/workflows")
	workflows.Use(gwmiddleware.JwtOrAPIKeyMiddleware(tokenizer, getenv("SERVICE_API_KEY", "service-secret")))
	workflows.GET("/", routes.ListWorkflows)
	workflows.POST("/", routes.CreateWorkflow)
	workflows.GET("/:workflowId", routes.GetWorkflow)
	workflows.PUT("/:workflowId", routes.UpdateWorkflow)
	workflows.POST("/:workflowId/execute", routes.ExecuteWorkflow)
	workflows.GET("/:workflowId/status", routes.GetWorkflowStatus)
	workflows.POST("/:workflowId/approve", routes.ApproveWorkflow)
	workflows.POST("/:workflowId/reject", routes.RejectWorkflow)

	// Notification system
	notifications := r.Group("/v1/notifications")
	notifications.Use(gwmiddleware.JwtOrAPIKeyMiddleware(tokenizer, getenv("SERVICE_API_KEY", "service-secret")))
	notifications.GET("/", routes.ListNotifications)
	notifications.POST("/", routes.CreateNotification)
	notifications.GET("/:notificationId", routes.GetNotificationByID)
	notifications.PUT("/:notificationId", routes.UpdateNotification)
	notifications.PUT("/:notificationId/read", routes.MarkNotificationRead)
	notifications.PUT("/:notificationId/unread", routes.MarkNotificationUnread)
	notifications.DELETE("/:notificationId", routes.DeleteNotification)
	notifications.POST("/broadcast", routes.BroadcastNotification)

	// Audit logs
	audit := r.Group("/v1/audit")
	audit.Use(gwmiddleware.JwtOrAPIKeyMiddleware(tokenizer, getenv("SERVICE_API_KEY", "service-secret")))
	audit.GET("/logs", routes.GetAuditLogs)
	audit.GET("/logs/:logId", routes.GetAuditLog)
	audit.POST("/logs", routes.CreateAuditLog)

	// System administration
	admin := r.Group("/v1/admin")
	admin.Use(gwmiddleware.JwtOrAPIKeyMiddleware(tokenizer, getenv("SERVICE_API_KEY", "service-secret")))
	admin.GET("/system/status", routes.GetSystemStatus)
	admin.POST("/system/maintenance", routes.SetMaintenanceMode)
	admin.GET("/system/config", routes.GetSystemConfig)
	admin.PUT("/system/config", routes.UpdateSystemConfig)
	admin.POST("/system/backup", routes.CreateBackup)
	admin.GET("/system/backups", routes.ListBackups)
	admin.GET("/system/backup/:backupId", routes.GetBackupStatus)

	port := getenv("PORT", "8080")
	_ = r.Run(":" + port)
}

func getenv(k, d string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return d
}

// findSpecsDir tries a few common locations so Swagger UI can find specs
// whether running inside the container, from api-gateway/, or repo root.
func findSpecsDir() string {
	candidates := []string{
		"/static/specs",            // container path
		"./static/specs",           // running from api-gateway/
		"api-gateway/static/specs", // running from repo root
	}
	for _, p := range candidates {
		if st, err := os.Stat(p); err == nil && st.IsDir() {
			return p
		}
	}
	// last resort: return default and let it 404; UI will show helpful note
	return "./static/specs"
}

// initializeDefaultAdmin creates a default admin user for testing compatibility
func initializeDefaultAdmin(svc *users.Service) {
	ctx := context.Background()

	adminInput := users.UserRegisterInput{
		Email:    "admin@example.com",
		Username: "admin",
		Password: "adminpass",
	}

	// Try to register admin user
	adminUser, err := svc.Register(ctx, adminInput)
	if err != nil {
		// Admin might already exist, that's fine for testing
		return
	}

	// Try to get existing admin role (should be pre-created)
	roles, err := svc.ListRoles(ctx)
	if err != nil {
		return
	}

	var adminRoleID string
	for _, role := range roles {
		if role.Name == "admin" {
			adminRoleID = role.ID
			break
		}
	}

	if adminRoleID == "" {
		// Create admin role if it doesn't exist
		adminRole := users.Role{
			Name: "admin",
		}

		createdRole, err := svc.CreateRole(ctx, adminRole)
		if err != nil {
			return
		}
		adminRoleID = createdRole.ID
	}

	// Assign admin role to the user
	_, _ = svc.AssignRoleToUser(ctx, adminUser.ID, adminRoleID)
}
