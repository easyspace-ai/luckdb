package mcp

import (
	"time"
)

// Config MCP配置
type Config struct {
	// 默认用户ID（stdio模式使用）
	DefaultUserID string `mapstructure:"default_user_id"`

	// HTTP传输配置
	HTTP HTTPConfig `mapstructure:"http"`

	// 功能开关
	Features FeaturesConfig `mapstructure:"features"`

	// 速率限制
	RateLimit RateLimitConfig `mapstructure:"rate_limit"`

	// 日志配置
	Logging LoggingConfig `mapstructure:"logging"`

	// 缓存配置
	Cache CacheConfig `mapstructure:"cache"`

	// 监控配置
	Monitoring MonitoringConfig `mapstructure:"monitoring"`

	// 性能配置
	Performance PerformanceConfig `mapstructure:"performance"`
}

// HTTPConfig HTTP传输配置
type HTTPConfig struct {
	Enabled     bool     `mapstructure:"enabled"`
	Port        int      `mapstructure:"port"`
	Host        string   `mapstructure:"host"`
	CORSOrigins []string `mapstructure:"cors_origins"`
}

// FeaturesConfig 功能开关
type FeaturesConfig struct {
	EnableTools     bool `mapstructure:"enable_tools"`
	EnableResources bool `mapstructure:"enable_resources"`
	EnablePrompts   bool `mapstructure:"enable_prompts"`
}

// RateLimitConfig 速率限制配置
type RateLimitConfig struct {
	Enabled           bool          `mapstructure:"enabled"`
	RequestsPerMinute int           `mapstructure:"requests_per_minute"`
	BurstSize         int           `mapstructure:"burst_size"`
	CleanupInterval   time.Duration `mapstructure:"cleanup_interval"`
}

// LoggingConfig 日志配置
type LoggingConfig struct {
	Enabled      bool `mapstructure:"enabled"`
	LogToolCalls bool `mapstructure:"log_tool_calls"`
}

// CacheConfig 缓存配置
type CacheConfig struct {
	Enabled         bool          `mapstructure:"enabled"`
	DefaultTTL      time.Duration `mapstructure:"default_ttl"`
	CleanupInterval time.Duration `mapstructure:"cleanup_interval"`
	// 可缓存的工具列表及其TTL
	CacheableTools map[string]time.Duration `mapstructure:"cacheable_tools"`
}

// MonitoringConfig 监控配置
type MonitoringConfig struct {
	Enabled            bool          `mapstructure:"enabled"`
	EnableMetrics      bool          `mapstructure:"enable_metrics"`
	SlowQueryThreshold time.Duration `mapstructure:"slow_query_threshold"`
}

// PerformanceConfig 性能配置
type PerformanceConfig struct {
	// 并发限制
	MaxConcurrentCalls int `mapstructure:"max_concurrent_calls"`
	// 超时设置
	CallTimeout time.Duration `mapstructure:"call_timeout"`
}

// DefaultConfig 返回默认配置
func DefaultConfig() *Config {
	return &Config{
		DefaultUserID: "",
		HTTP: HTTPConfig{
			Enabled:     true,
			Port:        3001,
			Host:        "0.0.0.0",
			CORSOrigins: []string{"*"},
		},
		Features: FeaturesConfig{
			EnableTools:     true,
			EnableResources: true,
			EnablePrompts:   true,
		},
		RateLimit: RateLimitConfig{
			Enabled:           true,
			RequestsPerMinute: 100,
			BurstSize:         10,
			CleanupInterval:   time.Minute,
		},
		Logging: LoggingConfig{
			Enabled:      true,
			LogToolCalls: true,
		},
		Cache: CacheConfig{
			Enabled:         true,
			DefaultTTL:      5 * time.Minute,
			CleanupInterval: 10 * time.Minute,
			CacheableTools: map[string]time.Duration{
				"list_spaces": 2 * time.Minute,
				"get_space":   5 * time.Minute,
				"list_bases":  2 * time.Minute,
				"get_base":    5 * time.Minute,
				"list_tables": 2 * time.Minute,
				"get_table":   5 * time.Minute,
				"list_fields": 2 * time.Minute,
				"get_field":   5 * time.Minute,
				"list_views":  2 * time.Minute,
				"get_view":    5 * time.Minute,
			},
		},
		Monitoring: MonitoringConfig{
			Enabled:            true,
			EnableMetrics:      true,
			SlowQueryThreshold: 1 * time.Second,
		},
		Performance: PerformanceConfig{
			MaxConcurrentCalls: 100,
			CallTimeout:        30 * time.Second,
		},
	}
}
