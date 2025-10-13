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
	}
}
