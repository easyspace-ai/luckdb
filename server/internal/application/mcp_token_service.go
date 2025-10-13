package application

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/internal/domain/mcp/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/mcp/repository"
	pkgerrors "github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"

	"github.com/google/uuid"
)

// MCPTokenService MCP Token服务
type MCPTokenService struct {
	tokenRepo repository.MCPTokenRepository
}

// NewMCPTokenService 创建MCP Token服务
func NewMCPTokenService(tokenRepo repository.MCPTokenRepository) *MCPTokenService {
	return &MCPTokenService{
		tokenRepo: tokenRepo,
	}
}

// CreateToken 创建MCP Token
func (s *MCPTokenService) CreateToken(ctx context.Context, userID string, req dto.CreateMCPTokenRequest) (*dto.MCPTokenResponse, error) {
	logger.Info("Creating MCP token",
		logger.String("user_id", userID),
		logger.String("name", req.Name),
	)

	// 生成随机token（32字节 = 64字符）
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		logger.Error("Failed to generate random token", logger.ErrorField(err))
		return nil, pkgerrors.ErrInternalServer.WithDetails("生成Token失败")
	}
	tokenValue := "mcp_" + hex.EncodeToString(tokenBytes)

	// 生成UUID作为ID
	id := uuid.New().String()

	// 处理过期时间
	var expiresAt *time.Time
	if !req.ExpiresAt.IsZero() {
		expiresAt = &req.ExpiresAt
	}

	// 创建实体（使用工厂方法）
	mcpToken := entity.NewMCPTokenForCreate(
		id,
		userID,
		tokenValue,
		req.Name,
		req.Description,
		true, // isActive
		req.Scopes,
		expiresAt,
	)

	// 保存到数据库
	if err := s.tokenRepo.Create(ctx, mcpToken); err != nil {
		logger.Error("Failed to create MCP token", logger.ErrorField(err))
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails("创建Token失败")
	}

	logger.Info("MCP token created successfully",
		logger.String("token_id", mcpToken.ID()),
		logger.String("user_id", userID),
	)

	return s.toDTO(mcpToken, true), nil
}

// ListTokens 列出用户的所有Token
func (s *MCPTokenService) ListTokens(ctx context.Context, userID string) (*dto.MCPTokenListResponse, error) {
	tokens, err := s.tokenRepo.FindByUserID(ctx, userID)
	if err != nil {
		logger.Error("Failed to list MCP tokens", logger.ErrorField(err))
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails("获取Token列表失败")
	}

	dtoTokens := make([]dto.MCPTokenResponse, len(tokens))
	for i, token := range tokens {
		dtoTokens[i] = *s.toDTO(token, false) // 不返回token值
	}

	return &dto.MCPTokenListResponse{
		Tokens: dtoTokens,
		Total:  len(tokens),
	}, nil
}

// GetToken 获取Token详情
func (s *MCPTokenService) GetToken(ctx context.Context, userID, tokenID string) (*dto.MCPTokenResponse, error) {
	token, err := s.tokenRepo.FindByID(ctx, tokenID)
	if err != nil {
		logger.Error("Failed to get MCP token", logger.ErrorField(err))
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails("获取Token失败")
	}

	if token == nil {
		return nil, pkgerrors.ErrNotFound.WithDetails("Token不存在")
	}

	// 验证所有权
	if token.UserID() != userID {
		return nil, pkgerrors.ErrForbidden.WithDetails("无权访问此Token")
	}

	return s.toDTO(token, false), nil // 不返回token值
}

// UpdateToken 更新Token
func (s *MCPTokenService) UpdateToken(ctx context.Context, userID, tokenID string, req dto.UpdateMCPTokenRequest) (*dto.MCPTokenResponse, error) {
	token, err := s.tokenRepo.FindByID(ctx, tokenID)
	if err != nil {
		logger.Error("Failed to get MCP token", logger.ErrorField(err))
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails("获取Token失败")
	}

	if token == nil {
		return nil, pkgerrors.ErrNotFound.WithDetails("Token不存在")
	}

	// 验证所有权
	if token.UserID() != userID {
		return nil, pkgerrors.ErrForbidden.WithDetails("无权访问此Token")
	}

	// 更新字段（使用setter方法）
	if req.Name != "" {
		token.SetName(req.Name)
	}
	if req.Description != "" {
		token.SetDescription(req.Description)
	}
	if req.IsActive != nil {
		token.SetActive(*req.IsActive)
	}

	if err := s.tokenRepo.Update(ctx, token); err != nil {
		logger.Error("Failed to update MCP token", logger.ErrorField(err))
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails("更新Token失败")
	}

	logger.Info("MCP token updated successfully",
		logger.String("token_id", tokenID),
		logger.String("user_id", userID),
	)

	return s.toDTO(token, false), nil
}

// DeleteToken 删除Token
func (s *MCPTokenService) DeleteToken(ctx context.Context, userID, tokenID string) error {
	token, err := s.tokenRepo.FindByID(ctx, tokenID)
	if err != nil {
		logger.Error("Failed to get MCP token", logger.ErrorField(err))
		return pkgerrors.ErrDatabaseOperation.WithDetails("获取Token失败")
	}

	if token == nil {
		return pkgerrors.ErrNotFound.WithDetails("Token不存在")
	}

	// 验证所有权
	if token.UserID() != userID {
		return pkgerrors.ErrForbidden.WithDetails("无权访问此Token")
	}

	if err := s.tokenRepo.Delete(ctx, tokenID); err != nil {
		logger.Error("Failed to delete MCP token", logger.ErrorField(err))
		return pkgerrors.ErrDatabaseOperation.WithDetails("删除Token失败")
	}

	logger.Info("MCP token deleted successfully",
		logger.String("token_id", tokenID),
		logger.String("user_id", userID),
	)

	return nil
}

// ValidateToken 验证Token是否有效
func (s *MCPTokenService) ValidateToken(ctx context.Context, tokenValue string) (*entity.MCPToken, error) {
	token, err := s.tokenRepo.FindByToken(ctx, tokenValue)
	if err != nil {
		logger.Error("Failed to validate MCP token", logger.ErrorField(err))
		return nil, pkgerrors.ErrInternalServer.WithDetails("Token验证失败")
	}

	if token == nil {
		return nil, pkgerrors.ErrInvalidToken
	}

	// 检查是否激活
	if !token.IsActive() {
		return nil, pkgerrors.ErrInvalidToken.WithDetails("Token已被禁用")
	}

	// 检查是否过期
	if token.IsExpired() {
		return nil, pkgerrors.ErrTokenExpired
	}

	// 更新最后使用时间
	token.UpdateLastUsed()
	if err := s.tokenRepo.Update(ctx, token); err != nil {
		logger.Warn("Failed to update last used time", logger.ErrorField(err))
		// 不影响主流程
	}

	return token, nil
}

// toDTO 转换为DTO
func (s *MCPTokenService) toDTO(token *entity.MCPToken, includeToken bool) *dto.MCPTokenResponse {
	resp := &dto.MCPTokenResponse{
		ID:          token.ID(),
		UserID:      token.UserID(),
		Name:        token.Name(),
		Description: token.Description(),
		CreatedAt:   token.CreatedAt(),
		ExpiresAt:   token.ExpiresAt(),
		LastUsedAt:  token.LastUsedAt(),
		IsActive:    token.IsActive(),
		Scopes:      token.Scopes(),
	}

	// 只在创建时返回token值
	if includeToken {
		resp.Token = token.Token()
	}

	return resp
}
