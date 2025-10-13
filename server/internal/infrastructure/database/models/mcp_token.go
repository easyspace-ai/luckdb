package models

import (
	"time"

	"github.com/lib/pq"
)

// MCPToken MCP Token数据库模型
type MCPToken struct {
	ID          string         `gorm:"column:id;primaryKey;type:varchar(32)" json:"id"`
	UserID      string         `gorm:"column:user_id;type:varchar(32);not null" json:"user_id"`
	TokenHash   string         `gorm:"column:token_hash;type:varchar(128);not null;uniqueIndex" json:"token_hash"`
	Name        string         `gorm:"column:name;type:varchar(100);not null" json:"name"`
	Description string         `gorm:"column:description;type:text" json:"description"`
	IsActive    bool           `gorm:"column:is_active;type:boolean;not null;default:true" json:"is_active"`
	Scopes      pq.StringArray `gorm:"column:scopes;type:text[]" json:"scopes"`
	ExpiresAt   *time.Time     `gorm:"column:expires_at;type:timestamp" json:"expires_at"`
	LastUsedAt  *time.Time     `gorm:"column:last_used_at;type:timestamp" json:"last_used_at"`
	CreatedAt   time.Time      `gorm:"column:created_at;type:timestamp;not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	UpdatedAt   time.Time      `gorm:"column:updated_at;type:timestamp;not null;default:CURRENT_TIMESTAMP" json:"updated_at"`
}

// TableName 指定表名
func (MCPToken) TableName() string {
	return "mcp_tokens"
}
