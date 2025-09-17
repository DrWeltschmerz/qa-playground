package routes

// Typed schemas used for Swagger documentation

// ---- Admin Schemas ----

type AdminApplicationConfig struct {
	Name        string `json:"name" example:"QA Playwright Gateway"`
	Version     string `json:"version" example:"0.1.0"`
	Environment string `json:"environment" example:"test"`
}

type AdminDatabaseConfig struct {
	Type             string `json:"type" example:"sqlite"`
	MaxConnections   int    `json:"max_connections" example:"25"`
	ConnectionString string `json:"connection_string" example:"file::memory:?cache=shared"`
}

type AdminSecurityRateLimiting struct {
	Enabled           bool `json:"enabled" example:"true"`
	RateLimitRequests int  `json:"rate_limit_requests" example:"200"`
	RateLimitWindow   int  `json:"rate_limit_window" example:"60"`
}

type AdminSecurityConfig struct {
	JWTExpiry    int                       `json:"jwt_expiry" example:"3600"`
	CORSEnabled  bool                      `json:"cors_enabled" example:"true"`
	RateLimiting AdminSecurityRateLimiting `json:"rate_limiting"`
	// Flattened fields some tests read at top-level
	FlatRateLimitRequests int `json:"rate_limit_requests,omitempty" example:"200"`
	FlatRateLimitWindow   int `json:"rate_limit_window,omitempty" example:"60"`
}

type AdminPerformanceTimeoutSettings struct {
	RequestTimeout int `json:"request_timeout" example:"15000"`
}

type AdminPerformanceCacheSettings struct {
	CacheTTL int `json:"cache_ttl" example:"600"`
}

type AdminPerformanceConfig struct {
	MaxConnections int                             `json:"max_connections" example:"100"`
	Timeout        AdminPerformanceTimeoutSettings `json:"timeout_settings"`
	Cache          AdminPerformanceCacheSettings   `json:"cache_settings"`
}

type AdminLoggingConfig struct {
	Level string `json:"level" example:"info"`
}

type AdminFeaturesConfig struct {
	AnalyticsEnabled     bool `json:"analytics_enabled" example:"true"`
	NotificationsEnabled bool `json:"notifications_enabled" example:"true"`
	AuditLogging         bool `json:"audit_logging" example:"true"`
}

type AdminSystemConfig struct {
	Application AdminApplicationConfig `json:"application"`
	Database    AdminDatabaseConfig    `json:"database"`
	Security    AdminSecurityConfig    `json:"security"`
	Performance AdminPerformanceConfig `json:"performance"`
	Logging     AdminLoggingConfig     `json:"logging"`
	Features    AdminFeaturesConfig    `json:"features"`
}

type AdminConfigPatchPerformance struct {
	MaxConnections int `json:"max_connections,omitempty" example:"200"`
	RequestTimeout int `json:"request_timeout,omitempty" example:"20000"`
	CacheTTL       int `json:"cache_ttl,omitempty" example:"1200"`
}

type AdminConfigPatchSecurity struct {
	RateLimitRequests int `json:"rate_limit_requests,omitempty" example:"300"`
	RateLimitWindow   int `json:"rate_limit_window,omitempty" example:"60"`
}

type AdminConfigPatchFeatures struct {
	AnalyticsEnabled     *bool `json:"analytics_enabled,omitempty"`
	NotificationsEnabled *bool `json:"notifications_enabled,omitempty"`
	AuditLogging         *bool `json:"audit_logging,omitempty"`
}

type AdminConfigPatch struct {
	Performance *AdminConfigPatchPerformance `json:"performance,omitempty"`
	Security    *AdminConfigPatchSecurity    `json:"security,omitempty"`
	Features    *AdminConfigPatchFeatures    `json:"features,omitempty"`
}

type AdminUpdateResponse struct {
	UpdatedSettings map[string]interface{} `json:"updated_settings"`
	AppliedAt       string                 `json:"applied_at" example:"2025-09-17T12:00:00Z"`
	RestartRequired bool                   `json:"restart_required" example:"false"`
}

type AdminMaintenanceRequest struct {
	Enabled           bool     `json:"enabled" example:"true"`
	Message           string   `json:"message" example:"Upgrading database"`
	EstimatedDuration int      `json:"estimated_duration" example:"120"`
	AllowedIPs        []string `json:"allowed_ips" example:"127.0.0.1"`
	MaintenanceType   string   `json:"maintenance_type" example:"scheduled"`
	ContactInfo       string   `json:"contact_info" example:"ops@example.com"`
	CompletionMessage string   `json:"completion_message" example:"Upgrade done"`
}

type AdminSystemStatusServices struct {
	Status string `json:"status" example:"healthy"`
}

type AdminSystemStatusDatabase struct {
	Status       string `json:"status" example:"healthy"`
	Connections  int    `json:"connections" example:"3"`
	ResponseTime int    `json:"response_time" example:"12"`
}

type AdminSystemStatusResources struct {
	CPUUsage    float64        `json:"cpu_usage" example:"0.35"`
	MemoryUsage float64        `json:"memory_usage" example:"0.55"`
	DiskUsage   float64        `json:"disk_usage" example:"0.40"`
	NetworkIO   AdminNetworkIO `json:"network_io"`
}

type AdminNetworkIO struct {
	RX int64 `json:"rx" example:"12345"`
	TX int64 `json:"tx" example:"9876"`
}

type AdminSystemStatusResponse struct {
	OverallStatus   string                               `json:"overall_status" example:"healthy"`
	Services        map[string]AdminSystemStatusServices `json:"services"`
	Database        AdminSystemStatusDatabase            `json:"database"`
	ExternalDeps    []string                             `json:"external_dependencies"`
	SystemResources AdminSystemStatusResources           `json:"system_resources"`
	Uptime          string                               `json:"uptime" example:"72h"`
	Version         string                               `json:"version" example:"0.1.0"`
	Timestamp       string                               `json:"timestamp" example:"2025-09-17T12:00:00Z"`
	GatewayStatus   map[string]interface{}               `json:"gateway_status"`
	AdapterStatuses map[string]map[string]interface{}    `json:"adapter_statuses"`
}

type BackupEntry struct {
	BackupID            string `json:"backup_id" example:"backup-1a2b3c4d"`
	Status              string `json:"status" example:"in_progress"`
	StartedAt           string `json:"started_at" example:"2025-09-17T12:00:00Z"`
	CreatedAt           string `json:"created_at" example:"2025-09-17T12:00:00Z"`
	EstimatedCompletion string `json:"estimated_completion" example:"2025-09-17T12:02:00Z"`
	BackupType          string `json:"backup_type" example:"full"`
	Compression         bool   `json:"compression" example:"true"`
	Progress            int    `json:"progress" example:"42"`
	FileSize            int    `json:"file_size" example:"1048576"`
	CompletedAt         string `json:"completed_at,omitempty" example:"2025-09-17T12:03:00Z"`
	DownloadURL         string `json:"download_url,omitempty" example:"/downloads/backup-1a2b3c4d.tar.gz"`
}

type BackupListResponse struct {
	Backups      []BackupEntry `json:"backups"`
	Total        int           `json:"total" example:"1"`
	StorageUsage int64         `json:"storage_usage" example:"1048576"`
}

type AdminCreateBackupRequest struct {
	BackupType           string `json:"backup_type" example:"full"`
	IncludeDatabase      bool   `json:"include_database" example:"true"`
	IncludeFiles         bool   `json:"include_files" example:"false"`
	IncludeConfiguration bool   `json:"include_configuration" example:"true"`
	Description          string `json:"description" example:"nightly"`
	Compression          bool   `json:"compression" example:"true"`
}

// ---- AI Schemas ----

type AiModel struct {
	Name      string `json:"name" example:"adapter-a"`
	Type      string `json:"type" example:"text-completion"`
	Status    string `json:"status" example:"active"`
	Version   string `json:"version" example:"1.0.0"`
	MaxTokens int    `json:"max_tokens" example:"4096"`
}

type AiModelsResponse struct {
	Models []AiModel `json:"models"`
}

type AiModelStatusInfo struct {
	Status string `json:"status" example:"online"`
	Uptime string `json:"uptime" example:"99.99%"`
}

type AiModelHealth struct {
	Errors      int    `json:"errors" example:"3"`
	AvgLatency  string `json:"avg_latency" example:"150ms"`
	MemoryUsage string `json:"memory_usage" example:"512MB"`
}

type AiModelStatusResponse struct {
	Model  string            `json:"model" example:"adapter-a"`
	Status AiModelStatusInfo `json:"status"`
	Health AiModelHealth     `json:"health"`
}

type AiGenericMessageResponse struct {
	Message string `json:"message" example:"model configured successfully"`
	Model   string `json:"model" example:"adapter-a"`
}

type AiMetricsModel struct {
	Requests   int    `json:"requests" example:"2710"`
	AvgLatency string `json:"avg_latency" example:"130ms"`
}

type AiMetricsResponse struct {
	Metrics struct {
		TotalRequests      int                       `json:"total_requests" example:"5420"`
		SuccessfulRequests int                       `json:"successful_requests" example:"5380"`
		FailedRequests     int                       `json:"failed_requests" example:"40"`
		AvgResponseTime    string                    `json:"avg_response_time" example:"145ms"`
		Models             map[string]AiMetricsModel `json:"models"`
	} `json:"metrics"`
}

type AiBatchRequest struct {
	Requests    []map[string]string `json:"requests"`
	Model       string              `json:"model" example:"adapter-a"`
	CallbackURL string              `json:"callback_url,omitempty" example:"https://example.com/callback"`
}

type AiBatchAccepted struct {
	JobID               string `json:"job_id" example:"job_abc123"`
	Status              string `json:"status" example:"queued"`
	EstimatedCompletion string `json:"estimated_completion" example:"2-5 minutes"`
}

type AiJobResult struct {
	Index      int    `json:"index" example:"0"`
	Completion string `json:"completion" example:"Sample completion for first prompt"`
	Status     string `json:"status" example:"success"`
}

type AiJobStatusResponse struct {
	JobID       string        `json:"job_id" example:"job_abc123"`
	Status      string        `json:"status" example:"completed"`
	CreatedAt   string        `json:"created_at" example:"2025-09-17T12:00:00Z"`
	CompletedAt string        `json:"completed_at" example:"2025-09-17T12:03:00Z"`
	Results     []AiJobResult `json:"results"`
}
