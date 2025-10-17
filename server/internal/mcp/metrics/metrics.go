package metrics

import (
	"sync"
	"sync/atomic"
	"time"
)

// ToolMetrics 工具调用指标
type ToolMetrics struct {
	Name          string
	TotalCalls    int64
	SuccessCalls  int64
	FailedCalls   int64
	TotalDuration time.Duration
	MinDuration   time.Duration
	MaxDuration   time.Duration
	LastCallTime  time.Time
}

// UserMetrics 用户使用指标
type UserMetrics struct {
	UserID        string
	TotalCalls    int64
	FailedCalls   int64
	LastCallTime  time.Time
	ToolUsage     map[string]int64 // 每个工具的调用次数
}

// Collector 指标收集器
type Collector struct {
	toolMetrics map[string]*ToolMetrics
	userMetrics map[string]*UserMetrics
	mu          sync.RWMutex

	// 全局统计
	totalRequests atomic.Int64
	totalErrors   atomic.Int64
	startTime     time.Time
}

// NewCollector 创建指标收集器
func NewCollector() *Collector {
	return &Collector{
		toolMetrics: make(map[string]*ToolMetrics),
		userMetrics: make(map[string]*UserMetrics),
		startTime:   time.Now(),
	}
}

// RecordToolCall 记录工具调用
func (c *Collector) RecordToolCall(toolName, userID string, duration time.Duration, success bool) {
	c.totalRequests.Add(1)
	if !success {
		c.totalErrors.Add(1)
	}

	// 更新工具指标
	c.updateToolMetrics(toolName, duration, success)

	// 更新用户指标
	c.updateUserMetrics(userID, toolName, success)
}

// updateToolMetrics 更新工具指标
func (c *Collector) updateToolMetrics(toolName string, duration time.Duration, success bool) {
	c.mu.Lock()
	defer c.mu.Unlock()

	metrics, exists := c.toolMetrics[toolName]
	if !exists {
		metrics = &ToolMetrics{
			Name:        toolName,
			MinDuration: duration,
			MaxDuration: duration,
		}
		c.toolMetrics[toolName] = metrics
	}

	metrics.TotalCalls++
	if success {
		metrics.SuccessCalls++
	} else {
		metrics.FailedCalls++
	}

	metrics.TotalDuration += duration
	if duration < metrics.MinDuration {
		metrics.MinDuration = duration
	}
	if duration > metrics.MaxDuration {
		metrics.MaxDuration = duration
	}
	metrics.LastCallTime = time.Now()
}

// updateUserMetrics 更新用户指标
func (c *Collector) updateUserMetrics(userID, toolName string, success bool) {
	if userID == "" {
		userID = "anonymous"
	}

	c.mu.Lock()
	defer c.mu.Unlock()

	metrics, exists := c.userMetrics[userID]
	if !exists {
		metrics = &UserMetrics{
			UserID:    userID,
			ToolUsage: make(map[string]int64),
		}
		c.userMetrics[userID] = metrics
	}

	metrics.TotalCalls++
	if !success {
		metrics.FailedCalls++
	}
	metrics.LastCallTime = time.Now()
	metrics.ToolUsage[toolName]++
}

// GetToolMetrics 获取工具指标
func (c *Collector) GetToolMetrics(toolName string) (*ToolMetrics, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	metrics, exists := c.toolMetrics[toolName]
	if !exists {
		return nil, false
	}

	// 返回副本
	copy := *metrics
	return &copy, true
}

// GetAllToolMetrics 获取所有工具指标
func (c *Collector) GetAllToolMetrics() map[string]*ToolMetrics {
	c.mu.RLock()
	defer c.mu.RUnlock()

	result := make(map[string]*ToolMetrics, len(c.toolMetrics))
	for name, metrics := range c.toolMetrics {
		copy := *metrics
		result[name] = &copy
	}
	return result
}

// GetUserMetrics 获取用户指标
func (c *Collector) GetUserMetrics(userID string) (*UserMetrics, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	metrics, exists := c.userMetrics[userID]
	if !exists {
		return nil, false
	}

	// 返回副本
	copy := *metrics
	copy.ToolUsage = make(map[string]int64)
	for k, v := range metrics.ToolUsage {
		copy.ToolUsage[k] = v
	}
	return &copy, true
}

// GetTopUsers 获取调用次数最多的用户
func (c *Collector) GetTopUsers(limit int) []*UserMetrics {
	c.mu.RLock()
	defer c.mu.RUnlock()

	users := make([]*UserMetrics, 0, len(c.userMetrics))
	for _, metrics := range c.userMetrics {
		copy := *metrics
		copy.ToolUsage = make(map[string]int64)
		for k, v := range metrics.ToolUsage {
			copy.ToolUsage[k] = v
		}
		users = append(users, &copy)
	}

	// 简单排序（冒泡排序，适用于小数据集）
	for i := 0; i < len(users)-1; i++ {
		for j := 0; j < len(users)-i-1; j++ {
			if users[j].TotalCalls < users[j+1].TotalCalls {
				users[j], users[j+1] = users[j+1], users[j]
			}
		}
	}

	if limit > 0 && limit < len(users) {
		users = users[:limit]
	}

	return users
}

// GetTopTools 获取调用次数最多的工具
func (c *Collector) GetTopTools(limit int) []*ToolMetrics {
	c.mu.RLock()
	defer c.mu.RUnlock()

	tools := make([]*ToolMetrics, 0, len(c.toolMetrics))
	for _, metrics := range c.toolMetrics {
		copy := *metrics
		tools = append(tools, &copy)
	}

	// 简单排序
	for i := 0; i < len(tools)-1; i++ {
		for j := 0; j < len(tools)-i-1; j++ {
			if tools[j].TotalCalls < tools[j+1].TotalCalls {
				tools[j], tools[j+1] = tools[j+1], tools[j]
			}
		}
	}

	if limit > 0 && limit < len(tools) {
		tools = tools[:limit]
	}

	return tools
}

// GetSummary 获取汇总统计
func (c *Collector) GetSummary() map[string]interface{} {
	c.mu.RLock()
	totalTools := len(c.toolMetrics)
	totalUsers := len(c.userMetrics)
	c.mu.RUnlock()

	uptime := time.Since(c.startTime)
	totalReqs := c.totalRequests.Load()
	totalErrs := c.totalErrors.Load()

	var errorRate float64
	if totalReqs > 0 {
		errorRate = float64(totalErrs) / float64(totalReqs) * 100
	}

	return map[string]interface{}{
		"total_requests": totalReqs,
		"total_errors":   totalErrs,
		"error_rate":     errorRate,
		"total_tools":    totalTools,
		"total_users":    totalUsers,
		"uptime":         uptime.String(),
		"uptime_seconds": uptime.Seconds(),
		"start_time":     c.startTime,
	}
}

// Reset 重置所有指标
func (c *Collector) Reset() {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.toolMetrics = make(map[string]*ToolMetrics)
	c.userMetrics = make(map[string]*UserMetrics)
	c.totalRequests.Store(0)
	c.totalErrors.Store(0)
	c.startTime = time.Now()
}

// GetAverageResponseTime 获取平均响应时间
func (c *Collector) GetAverageResponseTime() time.Duration {
	c.mu.RLock()
	defer c.mu.RUnlock()

	var totalDuration time.Duration
	var totalCalls int64

	for _, metrics := range c.toolMetrics {
		totalDuration += metrics.TotalDuration
		totalCalls += metrics.TotalCalls
	}

	if totalCalls == 0 {
		return 0
	}

	return totalDuration / time.Duration(totalCalls)
}

// GetSlowestTools 获取响应最慢的工具
func (c *Collector) GetSlowestTools(limit int) []*ToolMetrics {
	c.mu.RLock()
	defer c.mu.RUnlock()

	tools := make([]*ToolMetrics, 0, len(c.toolMetrics))
	for _, metrics := range c.toolMetrics {
		copy := *metrics
		tools = append(tools, &copy)
	}

	// 按平均响应时间排序
	for i := 0; i < len(tools)-1; i++ {
		for j := 0; j < len(tools)-i-1; j++ {
			avgI := tools[j].TotalDuration / time.Duration(tools[j].TotalCalls)
			avgJ := tools[j+1].TotalDuration / time.Duration(tools[j+1].TotalCalls)
			if avgI < avgJ {
				tools[j], tools[j+1] = tools[j+1], tools[j]
			}
		}
	}

	if limit > 0 && limit < len(tools) {
		tools = tools[:limit]
	}

	return tools
}

