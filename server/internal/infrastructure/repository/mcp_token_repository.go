package repository

import (
	"context"
	"time"

	"github.com/lib/pq"
	"gorm.io/gorm"

	"github.com/easyspace-ai/luckdb/server/internal/domain/mcp/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/mcp/repository"
	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/database/models"
	pkgerrors "github.com/easyspace-ai/luckdb/server/pkg/errors"
)

// mcpTokenRepository MCP Token仓储实现
type mcpTokenRepository struct {
	db *gorm.DB
}

// NewMCPTokenRepository 创建MCP Token仓储
func NewMCPTokenRepository(db *gorm.DB) repository.MCPTokenRepository {
	return &mcpTokenRepository{db: db}
}

// Create 创建Token
func (r *mcpTokenRepository) Create(ctx context.Context, token *entity.MCPToken) error {
	model := r.toModel(token)
	if err := r.db.WithContext(ctx).Create(model).Error; err != nil {
		return pkgerrors.ErrDatabaseOperation.WithDetails(err.Error())
	}
	return nil
}

// FindByID 根据ID查找Token
func (r *mcpTokenRepository) FindByID(ctx context.Context, id string) (*entity.MCPToken, error) {
	var model models.MCPToken
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&model).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, pkgerrors.ErrDatabaseQuery.WithDetails(err.Error())
	}
	return r.toEntity(&model), nil
}

// FindByToken 根据Token明文查找（用于验证）
func (r *mcpTokenRepository) FindByToken(ctx context.Context, token string) (*entity.MCPToken, error) {
	var model models.MCPToken
	// 简化：直接用token值查找（生产环境应该用哈希）
	if err := r.db.WithContext(ctx).Where("token_hash = ?", token).First(&model).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, pkgerrors.ErrDatabaseQuery.WithDetails(err.Error())
	}
	return r.toEntity(&model), nil
}

// FindByTokenHash 根据Token哈希查找
func (r *mcpTokenRepository) FindByTokenHash(ctx context.Context, tokenHash string) (*entity.MCPToken, error) {
	var model models.MCPToken
	if err := r.db.WithContext(ctx).Where("token_hash = ?", tokenHash).First(&model).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, pkgerrors.ErrDatabaseQuery.WithDetails(err.Error())
	}
	return r.toEntity(&model), nil
}

// FindByUserID 查找用户的所有Token
func (r *mcpTokenRepository) FindByUserID(ctx context.Context, userID string) ([]*entity.MCPToken, error) {
	var modelList []models.MCPToken
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Order("created_at DESC").Find(&modelList).Error; err != nil {
		return nil, pkgerrors.ErrDatabaseQuery.WithDetails(err.Error())
	}

	tokens := make([]*entity.MCPToken, len(modelList))
	for i, model := range modelList {
		tokens[i] = r.toEntity(&model)
	}
	return tokens, nil
}

// Update 更新Token
func (r *mcpTokenRepository) Update(ctx context.Context, token *entity.MCPToken) error {
	model := r.toModel(token)
	if err := r.db.WithContext(ctx).Save(model).Error; err != nil {
		return pkgerrors.ErrDatabaseOperation.WithDetails(err.Error())
	}
	return nil
}

// Delete 删除Token
func (r *mcpTokenRepository) Delete(ctx context.Context, id string) error {
	if err := r.db.WithContext(ctx).Where("id = ?", id).Delete(&models.MCPToken{}).Error; err != nil {
		return pkgerrors.ErrDatabaseOperation.WithDetails(err.Error())
	}
	return nil
}

// UpdateLastUsed 更新最后使用时间
func (r *mcpTokenRepository) UpdateLastUsed(ctx context.Context, id string) error {
	now := time.Now()
	if err := r.db.WithContext(ctx).Model(&models.MCPToken{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"last_used_at": now,
			"updated_at":   now,
		}).Error; err != nil {
		return pkgerrors.ErrDatabaseOperation.WithDetails(err.Error())
	}
	return nil
}

// toModel 实体转模型
func (r *mcpTokenRepository) toModel(token *entity.MCPToken) *models.MCPToken {
	// 使用token值或hash（创建时有token值，加载时用hash）
	tokenHash := token.TokenHash()
	if tokenHash == "" {
		tokenHash = token.Token() // 创建时使用明文token
	}

	return &models.MCPToken{
		ID:          token.ID(),
		UserID:      token.UserID(),
		TokenHash:   tokenHash,
		Name:        token.Name(),
		Description: token.Description(),
		IsActive:    token.IsActive(),
		Scopes:      pq.StringArray(token.Scopes()),
		ExpiresAt:   token.ExpiresAt(),
		LastUsedAt:  token.LastUsedAt(),
		CreatedAt:   token.CreatedAt(),
		UpdatedAt:   token.UpdatedAt(),
	}
}

// toEntity 模型转实体
func (r *mcpTokenRepository) toEntity(model *models.MCPToken) *entity.MCPToken {
	return entity.NewMCPToken(
		model.ID,
		model.UserID,
		model.TokenHash,
		model.Name,
		model.Description,
		model.IsActive,
		[]string(model.Scopes),
		model.ExpiresAt,
		model.LastUsedAt,
		model.CreatedAt,
	)
}
