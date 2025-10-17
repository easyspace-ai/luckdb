package middleware

import (
	"context"
	"encoding/json"
	"time"

	"github.com/mark3labs/mcp-go/mcp"

	"github.com/easyspace-ai/luckdb/server/internal/mcp/cache"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// CacheMiddleware 缓存中间件
type CacheMiddleware struct {
	cache      cache.Cache
	keyGen     *cache.CacheKey
	defaultTTL time.Duration
	// 哪些工具可以被缓存
	cacheableTools map[string]time.Duration
}

// CacheConfig 缓存配置
type CacheConfig struct {
	Cache          cache.Cache
	DefaultTTL     time.Duration
	CacheableTools map[string]time.Duration // 工具名 -> TTL
}

// NewCacheMiddleware 创建缓存中间件
func NewCacheMiddleware(config CacheConfig) Middleware {
	return &CacheMiddleware{
		cache:          config.Cache,
		keyGen:         cache.NewCacheKey("mcp"),
		defaultTTL:     config.DefaultTTL,
		cacheableTools: config.CacheableTools,
	}
}

// Handle 实现Middleware接口
func (m *CacheMiddleware) Handle(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
	// 检查是否可以缓存
	ttl, cacheable := m.cacheableTools[req.Params.Name]
	if !cacheable {
		// 不缓存，直接调用
		return next(ctx, req)
	}

	if ttl == 0 {
		ttl = m.defaultTTL
	}

	// 生成缓存键
	args, _ := req.Params.Arguments.(map[string]interface{})
	cacheKey, err := m.keyGen.ForTool(req.Params.Name, args)
	if err != nil {
		logger.Warn("Failed to generate cache key",
			logger.String("tool", req.Params.Name),
			logger.ErrorField(err),
		)
		return next(ctx, req)
	}

	// 尝试从缓存获取
	if cached, found := m.cache.Get(ctx, cacheKey); found {
		if result, ok := cached.(*mcp.CallToolResult); ok {
			logger.Debug("Cache hit",
				logger.String("tool", req.Params.Name),
				logger.String("key", cacheKey),
			)
			return result, nil
		}
	}

	// 缓存未命中，调用实际处理器
	logger.Debug("Cache miss",
		logger.String("tool", req.Params.Name),
		logger.String("key", cacheKey),
	)

	result, err := next(ctx, req)
	if err != nil {
		return result, err
	}

	// 只缓存成功的结果
	if result != nil && !result.IsError {
		if err := m.cache.Set(ctx, cacheKey, result, ttl); err != nil {
			logger.Warn("Failed to cache result",
				logger.String("tool", req.Params.Name),
				logger.ErrorField(err),
			)
		} else {
			logger.Debug("Result cached",
				logger.String("tool", req.Params.Name),
				logger.String("key", cacheKey),
				logger.Duration("ttl", ttl),
			)
		}
	}

	return result, err
}

// InvalidateCache 失效缓存的辅助函数
func InvalidateCache(ctx context.Context, c cache.Cache, pattern string) error {
	// 注意：这需要缓存支持模式匹配删除
	// 简单的内存缓存可能不支持，可以考虑扩展
	return c.Delete(ctx, pattern)
}

// CacheStats 获取缓存统计
func (m *CacheMiddleware) CacheStats() map[string]interface{} {
	return m.cache.Stats()
}

// CachedToolResult 缓存的工具结果（用于序列化）
type CachedToolResult struct {
	Content   []mcp.Content
	IsError   bool
	Timestamp time.Time
}

// ToCallToolResult 转换为 CallToolResult
func (ctr *CachedToolResult) ToCallToolResult() *mcp.CallToolResult {
	result := &mcp.CallToolResult{
		Content: ctr.Content,
		IsError: ctr.IsError,
	}
	return result
}

// FromCallToolResult 从 CallToolResult 创建
func FromCallToolResult(result *mcp.CallToolResult) *CachedToolResult {
	return &CachedToolResult{
		Content:   result.Content,
		IsError:   result.IsError,
		Timestamp: time.Now(),
	}
}

// MarshalJSON 实现 JSON 序列化
func (ctr *CachedToolResult) MarshalJSON() ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"content":   ctr.Content,
		"is_error":  ctr.IsError,
		"timestamp": ctr.Timestamp,
	})
}

// UnmarshalJSON 实现 JSON 反序列化
func (ctr *CachedToolResult) UnmarshalJSON(data []byte) error {
	var obj map[string]interface{}
	if err := json.Unmarshal(data, &obj); err != nil {
		return err
	}

	// 注意：这里需要更复杂的类型转换，因为 mcp.Content 是一个接口
	// 为了简化，我们直接解析到结构体的字段
	if isError, ok := obj["is_error"].(bool); ok {
		ctr.IsError = isError
	}
	if timestamp, ok := obj["timestamp"].(string); ok {
		if t, err := time.Parse(time.RFC3339, timestamp); err == nil {
			ctr.Timestamp = t
		}
	}

	return nil
}
