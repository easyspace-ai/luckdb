package config

import (
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config 应用配置结构
type Config struct {
	Server    ServerConfig    `mapstructure:"server"`
	Database  DatabaseConfig  `mapstructure:"database"`
	Redis     RedisConfig     `mapstructure:"redis"`
	JWT       JWTConfig       `mapstructure:"jwt"`
	Storage   StorageConfig   `mapstructure:"storage"`
	Logger    LoggerConfig    `mapstructure:"logger"`
	SQLLogger SQLLoggerConfig `mapstructure:"sql_logger"`
	Queue     QueueConfig     `mapstructure:"queue"`
	WebSocket WebSocketConfig `mapstructure:"websocket"`
	AI        AIConfig        `mapstructure:"ai"`
	MCP       MCPConfig       `mapstructure:"mcp"`
}

// ServerConfig 服务器配置
type ServerConfig struct {
	Host                string        `mapstructure:"host"`
	Port                int           `mapstructure:"port"`
	Mode                string        `mapstructure:"mode"` // debug, release, test
	ReadTimeout         time.Duration `mapstructure:"read_timeout"`
	WriteTimeout        time.Duration `mapstructure:"write_timeout"`
	IdleTimeout         time.Duration `mapstructure:"idle_timeout"`
	MaxHeaderBytes      int           `mapstructure:"max_header_bytes"`
	ShutdownTimeout     time.Duration `mapstructure:"shutdown_timeout"`
	EnableCORS          bool          `mapstructure:"enable_cors"`
	EnableSwagger       bool          `mapstructure:"enable_swagger"`
	PermissionsDisabled bool          `mapstructure:"permissions_disabled"` // 禁用权限检查（仅用于开发）
}

// DatabaseConfig 数据库配置
type DatabaseConfig struct {
	Host            string        `mapstructure:"host"`
	Port            int           `mapstructure:"port"`
	User            string        `mapstructure:"user"`
	Password        string        `mapstructure:"password"`
	Name            string        `mapstructure:"name"`
	SSLMode         string        `mapstructure:"ssl_mode"`
	MaxIdleConns    int           `mapstructure:"max_idle_conns"`
	MaxOpenConns    int           `mapstructure:"max_open_conns"`
	ConnMaxLifetime time.Duration `mapstructure:"conn_max_lifetime"`
	LogLevel        string        `mapstructure:"log_level"`
}

// RedisConfig Redis配置
type RedisConfig struct {
	Host        string        `mapstructure:"host"`
	Port        int           `mapstructure:"port"`
	Password    string        `mapstructure:"password"`
	DB          int           `mapstructure:"db"`
	PoolSize    int           `mapstructure:"pool_size"`
	DialTimeout time.Duration `mapstructure:"dial_timeout"`
}

// JWTConfig JWT配置
type JWTConfig struct {
	Secret          string        `mapstructure:"secret"`
	AccessTokenTTL  time.Duration `mapstructure:"access_token_ttl"`
	RefreshTokenTTL time.Duration `mapstructure:"refresh_token_ttl"`
	Issuer          string        `mapstructure:"issuer"`
	EnableRefresh   bool          `mapstructure:"enable_refresh"`
}

// StorageConfig 存储配置
type StorageConfig struct {
	Type       string      `mapstructure:"type"` // local, s3, minio
	Local      LocalConfig `mapstructure:"local"`
	S3         S3Config    `mapstructure:"s3"`
	CDNDomain  string      `mapstructure:"cdn_domain"`
	UploadPath string      `mapstructure:"upload_path"` // 兼容性字段
}

type LocalConfig struct {
	UploadPath string `mapstructure:"upload_path"`
	URLPrefix  string `mapstructure:"url_prefix"`
}

type S3Config struct {
	Region    string `mapstructure:"region"`
	Bucket    string `mapstructure:"bucket"`
	AccessKey string `mapstructure:"access_key"`
	SecretKey string `mapstructure:"secret_key"`
	Endpoint  string `mapstructure:"endpoint"`
	UseSSL    bool   `mapstructure:"use_ssl"`
}

// LoggerConfig 日志配置
type LoggerConfig struct {
	Level      string `mapstructure:"level"`
	Format     string `mapstructure:"format"` // json, console
	OutputPath string `mapstructure:"output_path"`
}

// SQLLoggerConfig SQL日志配置
type SQLLoggerConfig struct {
	Enabled    bool   `mapstructure:"enabled"`
	OutputPath string `mapstructure:"output_path"`
	MaxSize    int    `mapstructure:"max_size"`    // 单个文件最大大小(MB)
	MaxBackups int    `mapstructure:"max_backups"` // 保留的旧日志文件数量
	MaxAge     int    `mapstructure:"max_age"`     // 保留的最大天数
	Compress   bool   `mapstructure:"compress"`    // 是否压缩
}

// QueueConfig 队列配置
type QueueConfig struct {
	RedisAddr     string `mapstructure:"redis_addr"`
	RedisPassword string `mapstructure:"redis_password"`
	RedisDB       int    `mapstructure:"redis_db"`
	MaxRetries    int    `mapstructure:"max_retries"`
	QueueCritical string `mapstructure:"queue_critical"`
	QueueDefault  string `mapstructure:"queue_default"`
	QueueLow      string `mapstructure:"queue_low"`
}

// WebSocketConfig WebSocket配置
type WebSocketConfig struct {
	EnableRedisPubSub bool          `mapstructure:"enable_redis_pubsub"`
	RedisPrefix       string        `mapstructure:"redis_prefix"`
	HeartbeatInterval time.Duration `mapstructure:"heartbeat_interval"`
	ConnectionTimeout time.Duration `mapstructure:"connection_timeout"`
	MaxConnections    int           `mapstructure:"max_connections"`
	EnablePresence    bool          `mapstructure:"enable_presence"`
}

// Load 加载配置
func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// 设置环境变量前缀
	viper.SetEnvPrefix("LUCKDB")
	viper.AutomaticEnv()

	// 设置环境变量键替换规则，避免系统环境变量干扰
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))

	// 设置默认值
	setDefaults()

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("failed to read config file: %w", err)
		}
		// 配置文件不存在时使用默认值和环境变量
	}

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("failed to unmarshal config: %w", err)
	}

	return &config, nil
}

// setDefaults 设置默认配置值
func setDefaults() {
	// Server defaults
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.port", 3000)
	viper.SetDefault("server.mode", "debug")
	viper.SetDefault("server.read_timeout", "30s")
	viper.SetDefault("server.write_timeout", "30s")
	viper.SetDefault("server.idle_timeout", "120s")
	viper.SetDefault("server.max_header_bytes", 1<<20) // 1MB
	viper.SetDefault("server.shutdown_timeout", "10s")
	viper.SetDefault("server.enable_cors", true)
	viper.SetDefault("server.enable_swagger", true)
	viper.SetDefault("server.permissions_disabled", false)

	// Database defaults
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.password", "")
	viper.SetDefault("database.name", "easytable")
	viper.SetDefault("database.ssl_mode", "disable")
	viper.SetDefault("database.max_idle_conns", 25)
	viper.SetDefault("database.max_open_conns", 200)
	viper.SetDefault("database.conn_max_lifetime", "1h")
	viper.SetDefault("database.log_level", "info")

	// Redis defaults
	viper.SetDefault("redis.host", "localhost")
	viper.SetDefault("redis.port", 6379)
	viper.SetDefault("redis.password", "")
	viper.SetDefault("redis.db", 0)
	viper.SetDefault("redis.pool_size", 10)
	viper.SetDefault("redis.dial_timeout", "5s")

	// JWT defaults
	viper.SetDefault("jwt.secret", "your-secret-key")
	viper.SetDefault("jwt.access_token_ttl", "24h")
	viper.SetDefault("jwt.refresh_token_ttl", "168h") // 7 days
	viper.SetDefault("jwt.issuer", "luckdb-api")
	viper.SetDefault("jwt.enable_refresh", true)

	// Storage defaults
	viper.SetDefault("storage.type", "local")
	viper.SetDefault("storage.local.upload_path", "./uploads")
	viper.SetDefault("storage.local.url_prefix", "/uploads")

	// Logger defaults
	viper.SetDefault("logger.level", "info")
	viper.SetDefault("logger.format", "json")
	viper.SetDefault("logger.output_path", "stdout")

	// SQL Logger defaults
	viper.SetDefault("sql_logger.enabled", true)
	viper.SetDefault("sql_logger.output_path", "logs/sql.log")
	viper.SetDefault("sql_logger.max_size", 100)
	viper.SetDefault("sql_logger.max_backups", 5)
	viper.SetDefault("sql_logger.max_age", 30)
	viper.SetDefault("sql_logger.compress", false)

	// Queue defaults
	viper.SetDefault("queue.redis_addr", "localhost:6379")
	viper.SetDefault("queue.redis_password", "")
	viper.SetDefault("queue.redis_db", 1)
	viper.SetDefault("queue.max_retries", 3)
	viper.SetDefault("queue.queue_critical", "critical")
	viper.SetDefault("queue.queue_default", "default")
	viper.SetDefault("queue.queue_low", "low")

	// WebSocket defaults
	viper.SetDefault("websocket.enable_redis_pubsub", true)
	viper.SetDefault("websocket.redis_prefix", "luckdb:ws")
	viper.SetDefault("websocket.heartbeat_interval", "30s")
	viper.SetDefault("websocket.connection_timeout", "60s")
	viper.SetDefault("websocket.max_connections", 1000)
	viper.SetDefault("websocket.enable_presence", true)

	// MCP defaults
	viper.SetDefault("mcp.default_user_id", "")
	viper.SetDefault("mcp.http.enabled", true)
	viper.SetDefault("mcp.http.port", 3001)
	viper.SetDefault("mcp.http.host", "0.0.0.0")
	viper.SetDefault("mcp.http.cors_origins", []string{"*"})
	viper.SetDefault("mcp.features.enable_tools", true)
	viper.SetDefault("mcp.features.enable_resources", true)
	viper.SetDefault("mcp.features.enable_prompts", true)
	viper.SetDefault("mcp.rate_limit.enabled", true)
	viper.SetDefault("mcp.rate_limit.requests_per_minute", 100)
	viper.SetDefault("mcp.logging.enabled", true)
	viper.SetDefault("mcp.logging.log_tool_calls", true)
}

// GetDSN 获取数据库连接字符串
func (c *DatabaseConfig) GetDSN() string {
	// 使用URL格式，GORM的PostgreSQL驱动对此格式支持更好
	if c.Password != "" {
		return fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=%s",
			c.User, c.Password, c.Host, c.Port, c.Name, c.SSLMode)
	}
	return fmt.Sprintf("postgres://%s@%s:%d/%s?sslmode=%s",
		c.User, c.Host, c.Port, c.Name, c.SSLMode)
}

// GetRedisAddr 获取Redis连接地址
func (c *RedisConfig) GetRedisAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// GetServerAddr 获取服务器监听地址
func (c *ServerConfig) GetServerAddr() string {
	return fmt.Sprintf("%s:%d", c.Host, c.Port)
}

// MCPConfig MCP服务器配置
type MCPConfig struct {
	DefaultUserID string             `mapstructure:"default_user_id"`
	HTTP          MCPHTTPConfig      `mapstructure:"http"`
	Features      MCPFeaturesConfig  `mapstructure:"features"`
	RateLimit     MCPRateLimitConfig `mapstructure:"rate_limit"`
	Logging       MCPLoggingConfig   `mapstructure:"logging"`
}

// MCPHTTPConfig MCP HTTP传输配置
type MCPHTTPConfig struct {
	Enabled     bool     `mapstructure:"enabled"`
	Port        int      `mapstructure:"port"`
	Host        string   `mapstructure:"host"`
	CORSOrigins []string `mapstructure:"cors_origins"`
}

// MCPFeaturesConfig MCP功能开关
type MCPFeaturesConfig struct {
	EnableTools     bool `mapstructure:"enable_tools"`
	EnableResources bool `mapstructure:"enable_resources"`
	EnablePrompts   bool `mapstructure:"enable_prompts"`
}

// MCPRateLimitConfig MCP速率限制配置
type MCPRateLimitConfig struct {
	Enabled           bool `mapstructure:"enabled"`
	RequestsPerMinute int  `mapstructure:"requests_per_minute"`
}

// MCPLoggingConfig MCP日志配置
type MCPLoggingConfig struct {
	Enabled      bool `mapstructure:"enabled"`
	LogToolCalls bool `mapstructure:"log_tool_calls"`
}
