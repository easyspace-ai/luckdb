package middleware

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/mark3labs/mcp-go/mcp"

	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// TokenBucket Token桶限流器
type TokenBucket struct {
	capacity int64     // 桶容量
	tokens   int64     // 当前令牌数
	rate     int64     // 令牌生成速率（每秒）
	lastTime time.Time // 上次添加令牌时间
	mu       sync.Mutex
}

// NewTokenBucket 创建Token桶
func NewTokenBucket(capacity, rate int64) *TokenBucket {
	return &TokenBucket{
		capacity: capacity,
		tokens:   capacity,
		rate:     rate,
		lastTime: time.Now(),
	}
}

// Allow 判断是否允许请求
func (tb *TokenBucket) Allow() bool {
	tb.mu.Lock()
	defer tb.mu.Unlock()

	now := time.Now()
	elapsed := now.Sub(tb.lastTime).Seconds()

	// 添加新令牌
	tb.tokens += int64(elapsed * float64(tb.rate))
	if tb.tokens > tb.capacity {
		tb.tokens = tb.capacity
	}
	tb.lastTime = now

	// 尝试获取令牌
	if tb.tokens > 0 {
		tb.tokens--
		return true
	}

	return false
}

// RateLimiter 限流器
type RateLimiter struct {
	buckets map[string]*TokenBucket
	mu      sync.RWMutex

	// 配置
	requestsPerMinute int
	burstSize         int
	cleanupInterval   time.Duration

	// 清理
	stopCleanup chan struct{}
}

// NewRateLimiter 创建限流器
func NewRateLimiter(requestsPerMinute, burstSize int, cleanupInterval time.Duration) *RateLimiter {
	rl := &RateLimiter{
		buckets:           make(map[string]*TokenBucket),
		requestsPerMinute: requestsPerMinute,
		burstSize:         burstSize,
		cleanupInterval:   cleanupInterval,
		stopCleanup:       make(chan struct{}),
	}

	// 启动定期清理
	go rl.periodicCleanup()

	return rl
}

// Allow 判断用户是否允许请求
func (rl *RateLimiter) Allow(userID string) bool {
	rl.mu.RLock()
	bucket, exists := rl.buckets[userID]
	rl.mu.RUnlock()

	if !exists {
		rl.mu.Lock()
		// 双重检查
		if bucket, exists = rl.buckets[userID]; !exists {
			// 转换为每秒速率
			rate := int64(rl.requestsPerMinute) / 60
			if rate < 1 {
				rate = 1
			}
			bucket = NewTokenBucket(int64(rl.burstSize), rate)
			rl.buckets[userID] = bucket
		}
		rl.mu.Unlock()
	}

	return bucket.Allow()
}

// periodicCleanup 定期清理不活跃的桶
func (rl *RateLimiter) periodicCleanup() {
	ticker := time.NewTicker(rl.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			rl.cleanup()
		case <-rl.stopCleanup:
			return
		}
	}
}

// cleanup 清理不活跃的用户桶
func (rl *RateLimiter) cleanup() {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	for userID, bucket := range rl.buckets {
		// 清理5分钟未使用的桶
		if now.Sub(bucket.lastTime) > 5*time.Minute {
			delete(rl.buckets, userID)
		}
	}

	logger.Debug("Rate limiter cleanup completed",
		logger.Int("remaining_buckets", len(rl.buckets)),
	)
}

// Stop 停止限流器
func (rl *RateLimiter) Stop() {
	close(rl.stopCleanup)
}

// Stats 返回统计信息
func (rl *RateLimiter) Stats() map[string]interface{} {
	rl.mu.RLock()
	defer rl.mu.RUnlock()

	return map[string]interface{}{
		"active_users": len(rl.buckets),
		"config": map[string]interface{}{
			"requests_per_minute": rl.requestsPerMinute,
			"burst_size":          rl.burstSize,
		},
	}
}

// RateLimitMiddleware 创建限流中间件
func RateLimitMiddleware(limiter *RateLimiter) Middleware {
	return MiddlewareFunc(func(ctx context.Context, req mcp.CallToolRequest, next ToolHandler) (*mcp.CallToolResult, error) {
		// 从上下文获取用户ID
		userID, ok := getUserID(ctx)
		if !ok || userID == "" {
			// 没有用户ID时使用默认限流
			userID = "anonymous"
		}

		// 检查限流
		if !limiter.Allow(userID) {
			logger.Warn("Rate limit exceeded",
				logger.String("user_id", userID),
				logger.String("tool", req.Params.Name),
			)

			return mcp.NewToolResultError(
				fmt.Sprintf("Rate limit exceeded. Maximum %d requests per minute allowed.",
					limiter.requestsPerMinute),
			), nil
		}

		return next(ctx, req)
	})
}
