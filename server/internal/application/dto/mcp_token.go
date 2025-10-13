package dto

import "time"

// CreateMCPTokenRequest 创建MCP Token请求
type CreateMCPTokenRequest struct {
	Name        string    `json:"name" binding:"required"`                                    // Token名称
	Description string    `json:"description"`                                                // Token描述
	ExpiresAt   time.Time `json:"expires_at" binding:"omitempty"`                             // 过期时间（可选，为空则永不过期）
	Scopes      []string  `json:"scopes" binding:"omitempty,dive,oneof=read write admin all"` // 权限范围
}

// UpdateMCPTokenRequest 更新MCP Token请求
type UpdateMCPTokenRequest struct {
	Name        string `json:"name" binding:"omitempty"`      // Token名称
	Description string `json:"description"`                   // Token描述
	IsActive    *bool  `json:"is_active" binding:"omitempty"` // 是否激活
}

// MCPTokenResponse MCP Token响应
type MCPTokenResponse struct {
	ID          string     `json:"id"`                     // Token ID
	UserID      string     `json:"user_id"`                // 所属用户ID
	Name        string     `json:"name"`                   // Token名称
	Description string     `json:"description"`            // Token描述
	Token       string     `json:"token,omitempty"`        // Token值（仅创建时返回一次）
	CreatedAt   time.Time  `json:"created_at"`             // 创建时间
	ExpiresAt   *time.Time `json:"expires_at,omitempty"`   // 过期时间
	LastUsedAt  *time.Time `json:"last_used_at,omitempty"` // 最后使用时间
	IsActive    bool       `json:"is_active"`              // 是否激活
	Scopes      []string   `json:"scopes"`                 // 权限范围
}

// MCPTokenListResponse MCP Token列表响应
type MCPTokenListResponse struct {
	Tokens []MCPTokenResponse `json:"tokens"`
	Total  int                `json:"total"`
}
