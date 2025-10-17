package middleware

import (
	"context"
	"time"

	"github.com/mark3labs/mcp-go/mcp"

	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// ToolHandler 工具处理函数类型
type ToolHandler func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error)

// Middleware 中间件接口
type Middleware interface {
	// Handle 处理请求，并调用下一个处理器
	Handle(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error)
}

// MiddlewareFunc 中间件函数类型
type MiddlewareFunc func(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error)

// Handle 实现Middleware接口
func (f MiddlewareFunc) Handle(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
	return f(ctx, req, next)
}

// Chain 中间件链
type Chain struct {
	middlewares []Middleware
}

// NewChain 创建中间件链
func NewChain(middlewares ...Middleware) *Chain {
	return &Chain{
		middlewares: middlewares,
	}
}

// Then 应用中间件链到处理器
func (c *Chain) Then(handler ToolHandler) ToolHandler {
	// 从后向前构建链
	for i := len(c.middlewares) - 1; i >= 0; i-- {
		middleware := c.middlewares[i]
		next := handler
		handler = func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			return middleware.Handle(ctx, req, next)
		}
	}
	return handler
}

// Append 添加中间件到链
func (c *Chain) Append(middlewares ...Middleware) *Chain {
	newMiddlewares := make([]Middleware, len(c.middlewares)+len(middlewares))
	copy(newMiddlewares, c.middlewares)
	copy(newMiddlewares[len(c.middlewares):], middlewares)
	return &Chain{middlewares: newMiddlewares}
}

// LoggingMiddleware 日志中间件
func LoggingMiddleware() Middleware {
	return MiddlewareFunc(func(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
		start := time.Now()

		logger.Info("MCP tool call started",
			logger.String("tool", req.Params.Name),
		)

		result, err := next(ctx, req)

		duration := time.Since(start)
		if err != nil {
			logger.Error("MCP tool call failed",
				logger.String("tool", req.Params.Name),
				logger.Duration("duration", duration),
				logger.ErrorField(err),
			)
		} else {
			logger.Info("MCP tool call completed",
				logger.String("tool", req.Params.Name),
				logger.Duration("duration", duration),
			)
		}

		return result, err
	})
}

// RecoveryMiddleware 恢复中间件，捕获panic
func RecoveryMiddleware() Middleware {
	return MiddlewareFunc(func(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
		defer func() {
			if r := recover(); r != nil {
				logger.Error("Panic recovered in MCP tool call",
					logger.String("tool", req.Params.Name),
					logger.Any("panic", r),
				)
			}
		}()

		return next(ctx, req)
	})
}

// TimingMiddleware 性能计时中间件
type TimingMiddleware struct {
	slowThreshold time.Duration
}

// NewTimingMiddleware 创建性能计时中间件
func NewTimingMiddleware(slowThreshold time.Duration) Middleware {
	return &TimingMiddleware{
		slowThreshold: slowThreshold,
	}
}

// Handle 实现Middleware接口
func (m *TimingMiddleware) Handle(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
	start := time.Now()
	result, err := next(ctx, req)
	duration := time.Since(start)

	if duration > m.slowThreshold {
		logger.Warn("Slow MCP tool call detected",
			logger.String("tool", req.Params.Name),
			logger.Duration("duration", duration),
			logger.Duration("threshold", m.slowThreshold),
		)
	}

	return result, err
}

// ValidationMiddleware 参数验证中间件
func ValidationMiddleware() Middleware {
	return MiddlewareFunc(func(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
		// 可以在这里添加通用的参数验证逻辑
		// 例如：检查参数是否为nil，基本类型验证等

		if req.Params.Name == "" {
			return mcp.NewToolResultError("Tool name is required"), nil
		}

		return next(ctx, req)
	})
}

// metricsContextKey 指标上下文键类型
type metricsContextKey string

const (
	// MetricsKey 指标键
	MetricsKey metricsContextKey = "mcp_metrics"
)

// Metrics 请求指标
type Metrics struct {
	StartTime time.Time
	ToolName  string
	UserID    string
}

// MetricsMiddleware 指标收集中间件
func MetricsMiddleware() Middleware {
	return MiddlewareFunc(func(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
		metrics := &Metrics{
			StartTime: time.Now(),
			ToolName:  req.Params.Name,
		}

		// 将指标添加到上下文
		ctx = context.WithValue(ctx, MetricsKey, metrics)

		return next(ctx, req)
	})
}

// GetMetrics 从上下文获取指标
func GetMetrics(ctx context.Context) (*Metrics, bool) {
	metrics, ok := ctx.Value(MetricsKey).(*Metrics)
	return metrics, ok
}
