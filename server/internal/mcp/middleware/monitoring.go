package middleware

import (
	"context"
	"time"

	"github.com/mark3labs/mcp-go/mcp"

	"github.com/easyspace-ai/luckdb/server/internal/mcp/metrics"
)

// MonitoringMiddleware 监控中间件
type MonitoringMiddleware struct {
	collector *metrics.Collector
}

// NewMonitoringMiddleware 创建监控中间件
func NewMonitoringMiddleware(collector *metrics.Collector) Middleware {
	return &MonitoringMiddleware{
		collector: collector,
	}
}

// Handle 实现Middleware接口
func (m *MonitoringMiddleware) Handle(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
	start := time.Now()
	
	// 获取用户ID
	userID, _ := getUserID(ctx)
	
	// 调用下一个处理器
	result, err := next(ctx, req)
	
	// 计算耗时
	duration := time.Since(start)
	
	// 判断是否成功
	success := err == nil && (result != nil && !result.IsError)
	
	// 记录指标
	m.collector.RecordToolCall(req.Params.Name, userID, duration, success)
	
	return result, err
}

