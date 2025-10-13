package repository

import (
	"context"

	"github.com/easyspace-ai/luckdb/server/internal/domain/mcp/entity"
)

// MCPTokenRepository MCP Token仓储接口
type MCPTokenRepository interface {
	// Create 创建Token
	Create(ctx context.Context, token *entity.MCPToken) error

	// FindByID 根据ID查找Token
	FindByID(ctx context.Context, id string) (*entity.MCPToken, error)

	// FindByToken 根据Token明文查找
	FindByToken(ctx context.Context, token string) (*entity.MCPToken, error)

	// FindByTokenHash 根据Token哈希查找
	FindByTokenHash(ctx context.Context, tokenHash string) (*entity.MCPToken, error)

	// FindByUserID 查找用户的所有Token
	FindByUserID(ctx context.Context, userID string) ([]*entity.MCPToken, error)

	// Update 更新Token
	Update(ctx context.Context, token *entity.MCPToken) error

	// Delete 删除Token
	Delete(ctx context.Context, id string) error

	// UpdateLastUsed 更新最后使用时间
	UpdateLastUsed(ctx context.Context, id string) error
}
