package mcp

import (
	"context"
	"fmt"

	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/container"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/cache"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/metrics"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/middleware"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/prompts"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/registry"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/resources"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/tools"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// Server MCP服务器封装
type Server struct {
	mcpServer     *server.MCPServer
	config        *Config
	authenticator *Authenticator
	container     *container.Container
	transport     string // "stdio" or "http"

	// 新增组件
	toolRegistry     *registry.ToolRegistry
	cache            cache.Cache
	metricsCollector *metrics.Collector
	rateLimiter      *middleware.RateLimiter
	middlewareChain  *middleware.Chain
}

// NewServer 创建MCP服务器
func NewServer(cont *container.Container, config *Config, transport string) (*Server, error) {
	// 创建MCP Server实例
	mcpServer := server.NewMCPServer(
		"EasyDB MCP Server",
		"2.0.0",
		server.WithToolCapabilities(config.Features.EnableTools),
		server.WithResourceCapabilities(config.Features.EnableResources, true), // subscribe = true
		server.WithPromptCapabilities(config.Features.EnablePrompts),
	)

	// 创建认证器
	authenticator := NewAuthenticator(
		cont.TokenService(),
		cont.MCPTokenRepo(),
		cont.UserRepo(),
		config,
	)

	// 创建工具注册器
	toolRegistry := registry.NewToolRegistry(mcpServer)

	// 创建缓存（如果启用）
	var cacheInstance cache.Cache
	if config.Cache.Enabled {
		cacheInstance = cache.NewMemoryCache(config.Cache.CleanupInterval)
		logger.Info("Cache enabled",
			logger.Duration("default_ttl", config.Cache.DefaultTTL),
			logger.Duration("cleanup_interval", config.Cache.CleanupInterval),
		)
	}

	// 创建指标收集器（如果启用）
	var metricsCollector *metrics.Collector
	if config.Monitoring.Enabled && config.Monitoring.EnableMetrics {
		metricsCollector = metrics.NewCollector()
		logger.Info("Metrics collection enabled")
	}

	// 创建限流器（如果启用）
	var rateLimiter *middleware.RateLimiter
	if config.RateLimit.Enabled {
		rateLimiter = middleware.NewRateLimiter(
			config.RateLimit.RequestsPerMinute,
			config.RateLimit.BurstSize,
			config.RateLimit.CleanupInterval,
		)
		logger.Info("Rate limiting enabled",
			logger.Int("requests_per_minute", config.RateLimit.RequestsPerMinute),
			logger.Int("burst_size", config.RateLimit.BurstSize),
		)
	}

	// 构建中间件链
	middlewares := []middleware.Middleware{}

	// 恢复中间件（最外层，捕获panic）
	middlewares = append(middlewares, middleware.RecoveryMiddleware())

	// 日志中间件
	if config.Logging.Enabled && config.Logging.LogToolCalls {
		middlewares = append(middlewares, middleware.LoggingMiddleware())
	}

	// 验证中间件
	middlewares = append(middlewares, middleware.ValidationMiddleware())

	// 限流中间件
	if rateLimiter != nil {
		middlewares = append(middlewares, middleware.RateLimitMiddleware(rateLimiter))
	}

	// 监控中间件
	if metricsCollector != nil {
		middlewares = append(middlewares, middleware.NewMonitoringMiddleware(metricsCollector))
	}

	// 性能计时中间件
	if config.Monitoring.Enabled {
		middlewares = append(middlewares, middleware.NewTimingMiddleware(config.Monitoring.SlowQueryThreshold))
	}

	// 缓存中间件
	if cacheInstance != nil {
		cacheMiddleware := middleware.NewCacheMiddleware(middleware.CacheConfig{
			Cache:          cacheInstance,
			DefaultTTL:     config.Cache.DefaultTTL,
			CacheableTools: config.Cache.CacheableTools,
		})
		middlewares = append(middlewares, cacheMiddleware)
	}

	middlewareChain := middleware.NewChain(middlewares...)

	s := &Server{
		mcpServer:        mcpServer,
		config:           config,
		authenticator:    authenticator,
		container:        cont,
		transport:        transport,
		toolRegistry:     toolRegistry,
		cache:            cacheInstance,
		metricsCollector: metricsCollector,
		rateLimiter:      rateLimiter,
		middlewareChain:  middlewareChain,
	}

	// 注册工具、资源和提示
	if err := s.registerTools(); err != nil {
		return nil, fmt.Errorf("failed to register tools: %w", err)
	}

	if config.Features.EnableResources {
		if err := s.registerResources(); err != nil {
			return nil, fmt.Errorf("failed to register resources: %w", err)
		}
	}

	if config.Features.EnablePrompts {
		if err := s.registerPrompts(); err != nil {
			return nil, fmt.Errorf("failed to register prompts: %w", err)
		}
	}

	logger.Info("MCP Server initialized successfully",
		logger.String("version", "2.0.0"),
		logger.String("transport", transport),
		logger.Int("registered_tools", toolRegistry.Count()),
		logger.Bool("cache_enabled", config.Cache.Enabled),
		logger.Bool("metrics_enabled", config.Monitoring.EnableMetrics),
		logger.Bool("rate_limit_enabled", config.RateLimit.Enabled),
	)

	return s, nil
}

// MCPServer 获取底层MCP服务器实例
func (s *Server) MCPServer() *server.MCPServer {
	return s.mcpServer
}

// Authenticate 认证请求
func (s *Server) Authenticate(ctx context.Context, token string) (string, error) {
	// 添加传输方式到上下文
	ctx = WithTransport(ctx, s.transport)
	return s.authenticator.Authenticate(ctx, token)
}

// registerTools 注册所有工具
func (s *Server) registerTools() error {
	logger.Info("Registering MCP tools...")

	// 注册Space工具 - 暂时注释，聚焦到表操作
	// if err := s.registerSpaceTools(); err != nil {
	// 	return fmt.Errorf("failed to register space tools: %w", err)
	// }

	// 注册Base工具 - 暂时注释，聚焦到表操作
	// if err := s.registerBaseTools(); err != nil {
	// 	return fmt.Errorf("failed to register base tools: %w", err)
	// }

	// 注册Table工具 ✅ 保留
	if err := s.registerTableTools(); err != nil {
		return fmt.Errorf("failed to register table tools: %w", err)
	}

	// 注册Field工具 ✅ 保留
	if err := s.registerFieldTools(); err != nil {
		return fmt.Errorf("failed to register field tools: %w", err)
	}

	// 注册Record工具 ✅ 保留
	if err := s.registerRecordTools(); err != nil {
		return fmt.Errorf("failed to register record tools: %w", err)
	}

	// 注册View工具 ✅ 保留
	if err := s.registerViewTools(); err != nil {
		return fmt.Errorf("failed to register view tools: %w", err)
	}

	// 注册User工具 ✅ 保留（用于认证和用户管理）
	if err := s.registerUserTools(); err != nil {
		return fmt.Errorf("failed to register user tools: %w", err)
	}

	logger.Info("MCP tools registered successfully (focused on table operations)")

	// 调试：尝试验证工具注册
	logger.Info("=== 验证工具注册 ===")
	// 注意：mcp-go 可能不提供直接的工具列表方法
	// 我们需要通过实际调用 tools/list 来验证

	return nil
}

// registerResources 注册资源
func (s *Server) registerResources() error {
	return resources.RegisterResources(
		s.mcpServer,
		s.container.SpaceService(),
		s.container.BaseService(),
		s.container.TableService(),
		s.container.RecordService(),
		s.container.ViewService(),
		s.container.FieldService(),
	)
}

// registerPrompts 注册提示
func (s *Server) registerPrompts() error {
	return prompts.RegisterPrompts(s.mcpServer)
}

// WithAuthContext 创建带认证的上下文
func (s *Server) WithAuthContext(ctx context.Context, token string) (context.Context, error) {
	userID, err := s.Authenticate(ctx, token)
	if err != nil {
		return nil, err
	}

	// 添加用户ID到上下文
	ctx = WithUserID(ctx, userID)
	ctx = WithToken(ctx, token)
	ctx = WithTransport(ctx, s.transport)

	return ctx, nil
}

// Tool注册的辅助方法
func (s *Server) registerSpaceTools() error {
	// 导入tools包并调用注册函数
	// 注意：实际导入在文件顶部
	return tools.RegisterSpaceTools(s.mcpServer, s.container.SpaceService())
}

func (s *Server) registerBaseTools() error {
	return tools.RegisterBaseTools(s.mcpServer, s.container.BaseService())
}

func (s *Server) registerTableTools() error {
	return tools.RegisterTableTools(s.mcpServer, s.container.TableService())
}

func (s *Server) registerFieldTools() error {
	return tools.RegisterFieldTools(s.mcpServer, s.container.FieldService())
}

func (s *Server) registerRecordTools() error {
	return tools.RegisterRecordTools(s.mcpServer, s.container.RecordService())
}

func (s *Server) registerViewTools() error {
	return tools.RegisterViewTools(s.mcpServer, s.container.ViewService())
}

func (s *Server) registerUserTools() error {
	return tools.RegisterUserTools(s.mcpServer, s.container.UserService(), s.container.AuthService())
}

// GetMetrics 获取指标收集器
func (s *Server) GetMetrics() *metrics.Collector {
	return s.metricsCollector
}

// GetCache 获取缓存
func (s *Server) GetCache() cache.Cache {
	return s.cache
}

// GetRateLimiter 获取限流器
func (s *Server) GetRateLimiter() *middleware.RateLimiter {
	return s.rateLimiter
}

// GetToolRegistry 获取工具注册器
func (s *Server) GetToolRegistry() *registry.ToolRegistry {
	return s.toolRegistry
}

// Stats 获取服务器统计信息
func (s *Server) Stats() map[string]interface{} {
	stats := map[string]interface{}{
		"version":   "2.0.0",
		"transport": s.transport,
	}

	// 添加工具统计
	if s.toolRegistry != nil {
		stats["tools"] = map[string]interface{}{
			"total":      s.toolRegistry.Count(),
			"registered": s.toolRegistry.ListTools(),
		}
	}

	// 添加缓存统计
	if s.cache != nil {
		stats["cache"] = s.cache.Stats()
	}

	// 添加限流统计
	if s.rateLimiter != nil {
		stats["rate_limit"] = s.rateLimiter.Stats()
	}

	// 添加指标统计
	if s.metricsCollector != nil {
		stats["metrics"] = s.metricsCollector.GetSummary()
		stats["top_tools"] = s.metricsCollector.GetTopTools(10)
		stats["top_users"] = s.metricsCollector.GetTopUsers(10)
		stats["slowest_tools"] = s.metricsCollector.GetSlowestTools(10)
		stats["avg_response_time"] = s.metricsCollector.GetAverageResponseTime().String()
	}

	return stats
}

// Shutdown 关闭服务器
func (s *Server) Shutdown(ctx context.Context) error {
	logger.Info("Shutting down MCP server...")

	// 停止缓存清理
	if memCache, ok := s.cache.(*cache.MemoryCache); ok {
		memCache.Stop()
	}

	// 停止限流器清理
	if s.rateLimiter != nil {
		s.rateLimiter.Stop()
	}

	logger.Info("MCP server shutdown completed")
	return nil
}

// Note: HandleToolCall 将在tool handlers中通过AddTool自动处理
// mcp-go会自动路由工具调用到对应的handler
