package middleware

import (
	"context"
)

// contextKey 上下文键类型
type contextKey string

const (
	// userIDKey 用户ID键
	userIDKey contextKey = "mcp_user_id"
)

// getUserID 从上下文获取用户ID
func getUserID(ctx context.Context) (string, bool) {
	userID, ok := ctx.Value(userIDKey).(string)
	return userID, ok
}

