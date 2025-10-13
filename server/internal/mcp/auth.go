package mcp

import (
	"context"
	"crypto/sha256"
	"encoding/hex"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/domain/mcp/repository"
	userRepo "github.com/easyspace-ai/luckdb/server/internal/domain/user/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/user/valueobject"
	pkgerrors "github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// Authenticator MCP认证器
type Authenticator struct {
	tokenService  *application.TokenService
	mcpTokenRepo  repository.MCPTokenRepository
	userRepo      userRepo.UserRepository
	config        *Config
	defaultUserID string
}

// NewAuthenticator 创建认证器
func NewAuthenticator(
	tokenService *application.TokenService,
	mcpTokenRepo repository.MCPTokenRepository,
	userRepo userRepo.UserRepository,
	config *Config,
) *Authenticator {
	return &Authenticator{
		tokenService:  tokenService,
		mcpTokenRepo:  mcpTokenRepo,
		userRepo:      userRepo,
		config:        config,
		defaultUserID: config.DefaultUserID,
	}
}

// Authenticate 认证Token并返回用户ID
func (a *Authenticator) Authenticate(ctx context.Context, token string) (string, error) {
	// 如果没有提供token
	if token == "" {
		// 在stdio模式下，使用默认用户ID
		if transport, ok := GetTransport(ctx); ok && transport == "stdio" && a.defaultUserID != "" {
			logger.Debug("Using default user ID in stdio mode",
				logger.String("user_id", a.defaultUserID),
			)
			return a.defaultUserID, nil
		}
		return "", pkgerrors.ErrUnauthorized.WithDetails("No token provided")
	}

	// 1. 尝试JWT认证
	if claims, err := a.tokenService.ValidateAccessToken(token); err == nil {
		logger.Debug("Authenticated via JWT",
			logger.String("user_id", claims.UserID),
		)

		// 验证用户是否存在且活跃
		userID := valueobject.NewUserID(claims.UserID)
		user, err := a.userRepo.FindByID(ctx, userID)
		if err != nil {
			return "", pkgerrors.ErrUnauthorized.WithDetails("User not found")
		}
		if user == nil || !user.IsActive() {
			return "", pkgerrors.ErrUnauthorized.WithDetails("User is not active")
		}

		return claims.UserID, nil
	}

	// 2. 尝试MCP Token认证
	tokenHash := hashToken(token)
	mcpToken, err := a.mcpTokenRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil {
		logger.Error("Failed to find MCP token", logger.ErrorField(err))
		return "", pkgerrors.ErrUnauthorized.WithDetails("Invalid token")
	}

	if mcpToken == nil {
		return "", pkgerrors.ErrUnauthorized.WithDetails("Invalid token")
	}

	// 检查Token是否过期
	if mcpToken.IsExpired() {
		return "", pkgerrors.ErrUnauthorized.WithDetails("Token expired")
	}

	logger.Debug("Authenticated via MCP Token",
		logger.String("user_id", mcpToken.UserID()),
		logger.String("token_name", mcpToken.Name()),
	)

	// 更新最后使用时间（异步）
	go func() {
		if err := a.mcpTokenRepo.UpdateLastUsed(context.Background(), mcpToken.ID()); err != nil {
			logger.Error("Failed to update token last used time", logger.ErrorField(err))
		}
	}()

	// 验证用户是否存在且活跃
	userID := valueobject.NewUserID(mcpToken.UserID())
	user, err := a.userRepo.FindByID(ctx, userID)
	if err != nil {
		return "", pkgerrors.ErrUnauthorized.WithDetails("User not found")
	}
	if user == nil || !user.IsActive() {
		return "", pkgerrors.ErrUnauthorized.WithDetails("User is not active")
	}

	return mcpToken.UserID(), nil
}

// ValidateScope 验证Token是否有指定权限
func (a *Authenticator) ValidateScope(ctx context.Context, token, scope string) error {
	// JWT Token有所有权限
	if _, err := a.tokenService.ValidateAccessToken(token); err == nil {
		return nil
	}

	// 检查MCP Token权限
	tokenHash := hashToken(token)
	mcpToken, err := a.mcpTokenRepo.FindByTokenHash(ctx, tokenHash)
	if err != nil || mcpToken == nil {
		return pkgerrors.ErrForbidden.WithDetails("Invalid token")
	}

	if !mcpToken.HasScope(scope) && !mcpToken.HasScope("*") {
		return pkgerrors.ErrForbidden.WithDetails("Insufficient permissions")
	}

	return nil
}

// hashToken 计算Token的SHA256哈希
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}
