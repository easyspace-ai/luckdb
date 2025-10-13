package entity

import (
	"time"
)

// MCPToken MCP API Token实体
type MCPToken struct {
	id          string
	userID      string
	token       string // Token明文（仅创建时使用）
	tokenHash   string // Token哈希（存储）
	name        string
	description string // Token描述
	isActive    bool   // 是否激活
	scopes      []string
	expiresAt   *time.Time
	lastUsedAt  *time.Time
	createdAt   time.Time
	updatedAt   time.Time
}

// NewMCPToken 创建新的MCP Token（用于从数据库加载）
func NewMCPToken(id, userID, tokenHash, name, description string, isActive bool, scopes []string, expiresAt, lastUsedAt *time.Time, createdAt time.Time) *MCPToken {
	return &MCPToken{
		id:          id,
		userID:      userID,
		tokenHash:   tokenHash,
		name:        name,
		description: description,
		isActive:    isActive,
		scopes:      scopes,
		expiresAt:   expiresAt,
		lastUsedAt:  lastUsedAt,
		createdAt:   createdAt,
		updatedAt:   time.Now(),
	}
}

// NewMCPTokenForCreate 创建新的MCP Token（用于创建时）
func NewMCPTokenForCreate(id, userID, token, name, description string, isActive bool, scopes []string, expiresAt *time.Time) *MCPToken {
	now := time.Now()
	return &MCPToken{
		id:          id,
		userID:      userID,
		token:       token,
		name:        name,
		description: description,
		isActive:    isActive,
		scopes:      scopes,
		expiresAt:   expiresAt,
		createdAt:   now,
		updatedAt:   now,
	}
}

// ID 获取Token ID
func (t *MCPToken) ID() string {
	return t.id
}

// UserID 获取用户ID
func (t *MCPToken) UserID() string {
	return t.userID
}

// Token 获取Token明文（仅创建时有效）
func (t *MCPToken) Token() string {
	return t.token
}

// TokenHash 获取Token哈希
func (t *MCPToken) TokenHash() string {
	return t.tokenHash
}

// Name 获取Token名称
func (t *MCPToken) Name() string {
	return t.name
}

// Description 获取Token描述
func (t *MCPToken) Description() string {
	return t.description
}

// IsActive 获取是否激活
func (t *MCPToken) IsActive() bool {
	return t.isActive
}

// SetName 设置Token名称
func (t *MCPToken) SetName(name string) {
	t.name = name
	t.updatedAt = time.Now()
}

// SetDescription 设置Token描述
func (t *MCPToken) SetDescription(description string) {
	t.description = description
	t.updatedAt = time.Now()
}

// SetActive 设置是否激活
func (t *MCPToken) SetActive(isActive bool) {
	t.isActive = isActive
	t.updatedAt = time.Now()
}

// Scopes 获取权限范围
func (t *MCPToken) Scopes() []string {
	return t.scopes
}

// ExpiresAt 获取过期时间
func (t *MCPToken) ExpiresAt() *time.Time {
	return t.expiresAt
}

// LastUsedAt 获取最后使用时间
func (t *MCPToken) LastUsedAt() *time.Time {
	return t.lastUsedAt
}

// CreatedAt 获取创建时间
func (t *MCPToken) CreatedAt() time.Time {
	return t.createdAt
}

// UpdatedAt 获取更新时间
func (t *MCPToken) UpdatedAt() time.Time {
	return t.updatedAt
}

// IsExpired 检查Token是否过期
func (t *MCPToken) IsExpired() bool {
	if t.expiresAt == nil {
		return false
	}
	return time.Now().After(*t.expiresAt)
}

// UpdateLastUsed 更新最后使用时间
func (t *MCPToken) UpdateLastUsed() {
	now := time.Now()
	t.lastUsedAt = &now
	t.updatedAt = now
}

// HasScope 检查是否有指定权限
func (t *MCPToken) HasScope(scope string) bool {
	// 通配符权限
	for _, s := range t.scopes {
		if s == "*" || s == scope {
			return true
		}
	}
	return false
}

// Revoke 撤销Token（设置过期时间为当前时间）
func (t *MCPToken) Revoke() {
	now := time.Now()
	t.expiresAt = &now
	t.updatedAt = now
}
