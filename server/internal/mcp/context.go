package mcp

import (
	"context"
)

// contextKey 上下文键类型
type contextKey string

const (
	// userIDKey 用户ID键
	userIDKey contextKey = "mcp_user_id"

	// transportKey 传输方式键
	transportKey contextKey = "mcp_transport"

	// tokenKey Token键
	tokenKey contextKey = "mcp_token"
)

// WithUserID 将用户ID添加到上下文
func WithUserID(ctx context.Context, userID string) context.Context {
	return context.WithValue(ctx, userIDKey, userID)
}

// GetUserID 从上下文获取用户ID
func GetUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

// WithTransport 将传输方式添加到上下文
func WithTransport(ctx context.Context, transport string) context.Context {
	return context.WithValue(ctx, transportKey, transport)
}

// GetTransport 从上下文获取传输方式
func GetTransport(ctx context.Context) (string, bool) {
	transport, ok := ctx.Value(transportKey).(string)
	return transport, ok
}

// WithToken 将Token添加到上下文
func WithToken(ctx context.Context, token string) context.Context {
	return context.WithValue(ctx, tokenKey, token)
}

// GetToken 从上下文获取Token
func GetToken(ctx context.Context) (string, bool) {
	token, ok := ctx.Value(tokenKey).(string)
	return token, ok
}

// MustGetUserID 从上下文获取用户ID（如果不存在则panic）
// 用于MCP工具handler中，假定已经过认证
// 如果用户ID不存在，返回空字符串而不是panic
// 调用者应该检查返回值
func MustGetUserID(ctx context.Context) string {
	userID, ok := GetUserID(ctx)
	if !ok || userID == "" {
		// 这不应该发生，因为已经过认证中间件
		// 返回空字符串而不是panic，让调用者处理
		return ""
	}
	return userID
}
