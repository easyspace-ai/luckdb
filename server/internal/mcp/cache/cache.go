package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"
)

// Entry 缓存条目
type Entry struct {
	Value      interface{}
	Expiration time.Time
}

// IsExpired 判断是否过期
func (e *Entry) IsExpired() bool {
	return !e.Expiration.IsZero() && time.Now().After(e.Expiration)
}

// Cache 缓存接口
type Cache interface {
	Get(ctx context.Context, key string) (interface{}, bool)
	Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error
	Delete(ctx context.Context, key string) error
	Clear(ctx context.Context) error
	Stats() map[string]interface{}
}

// MemoryCache 内存缓存实现
type MemoryCache struct {
	data            map[string]*Entry
	mu              sync.RWMutex
	cleanupInterval time.Duration
	stopCleanup     chan struct{}

	// 统计
	hits   uint64
	misses uint64
}

// NewMemoryCache 创建内存缓存
func NewMemoryCache(cleanupInterval time.Duration) *MemoryCache {
	cache := &MemoryCache{
		data:            make(map[string]*Entry),
		cleanupInterval: cleanupInterval,
		stopCleanup:     make(chan struct{}),
	}

	// 启动定期清理
	go cache.periodicCleanup()

	return cache
}

// Get 获取缓存
func (c *MemoryCache) Get(ctx context.Context, key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, exists := c.data[key]
	if !exists {
		c.misses++
		return nil, false
	}

	if entry.IsExpired() {
		c.misses++
		return nil, false
	}

	c.hits++
	return entry.Value, true
}

// Set 设置缓存
func (c *MemoryCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	var expiration time.Time
	if ttl > 0 {
		expiration = time.Now().Add(ttl)
	}

	c.data[key] = &Entry{
		Value:      value,
		Expiration: expiration,
	}

	return nil
}

// Delete 删除缓存
func (c *MemoryCache) Delete(ctx context.Context, key string) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.data, key)
	return nil
}

// Clear 清空缓存
func (c *MemoryCache) Clear(ctx context.Context) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.data = make(map[string]*Entry)
	c.hits = 0
	c.misses = 0
	return nil
}

// Stats 返回统计信息
func (c *MemoryCache) Stats() map[string]interface{} {
	c.mu.RLock()
	defer c.mu.RUnlock()

	total := c.hits + c.misses
	var hitRate float64
	if total > 0 {
		hitRate = float64(c.hits) / float64(total) * 100
	}

	return map[string]interface{}{
		"entries":  len(c.data),
		"hits":     c.hits,
		"misses":   c.misses,
		"hit_rate": hitRate,
	}
}

// periodicCleanup 定期清理过期缓存
func (c *MemoryCache) periodicCleanup() {
	ticker := time.NewTicker(c.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.cleanup()
		case <-c.stopCleanup:
			return
		}
	}
}

// cleanup 清理过期缓存
func (c *MemoryCache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	count := 0

	for key, entry := range c.data {
		if !entry.Expiration.IsZero() && now.After(entry.Expiration) {
			delete(c.data, key)
			count++
		}
	}

	if count > 0 {
		// logger可选：记录清理日志
	}
}

// Stop 停止缓存
func (c *MemoryCache) Stop() {
	close(c.stopCleanup)
}

// CacheKey 缓存键生成器
type CacheKey struct {
	Prefix string
}

// NewCacheKey 创建缓存键生成器
func NewCacheKey(prefix string) *CacheKey {
	return &CacheKey{Prefix: prefix}
}

// ForTool 生成工具调用的缓存键
func (ck *CacheKey) ForTool(toolName string, args map[string]interface{}) (string, error) {
	// 将参数序列化为JSON
	argsJSON, err := json.Marshal(args)
	if err != nil {
		return "", fmt.Errorf("failed to marshal args: %w", err)
	}

	return fmt.Sprintf("%s:tool:%s:%s", ck.Prefix, toolName, string(argsJSON)), nil
}

// ForUser 生成用户相关的缓存键
func (ck *CacheKey) ForUser(userID, resource string) string {
	return fmt.Sprintf("%s:user:%s:%s", ck.Prefix, userID, resource)
}

// ForResource 生成资源的缓存键
func (ck *CacheKey) ForResource(resourceType, resourceID string) string {
	return fmt.Sprintf("%s:resource:%s:%s", ck.Prefix, resourceType, resourceID)
}

// CacheableResult 可缓存的结果
type CacheableResult struct {
	Data      interface{}
	Timestamp time.Time
	TTL       time.Duration
}

// IsValid 判断结果是否仍然有效
func (cr *CacheableResult) IsValid() bool {
	if cr.TTL == 0 {
		return true
	}
	return time.Since(cr.Timestamp) < cr.TTL
}

