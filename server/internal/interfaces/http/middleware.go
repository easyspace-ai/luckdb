package http

import (
	"strings"

	"github.com/gin-gonic/gin"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/pkg/authctx"
	"github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/response"
)

// JWTAuthMiddleware JWT认证中间件
func JWTAuthMiddleware(authService *application.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 从 Authorization header 获取 token
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			response.Error(c, errors.ErrUnauthorized.WithDetails("缺少认证信息"))
			c.Abort()
			return
		}

		// 提取 Bearer token
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			response.Error(c, errors.ErrUnauthorized.WithDetails("认证格式错误"))
			c.Abort()
			return
		}

		token := parts[1]

		// 验证 token
		claims, err := authService.ValidateToken(c.Request.Context(), token)
		if err != nil {
			response.Error(c, err)
			c.Abort()
			return
		}

		// 将用户信息设置到 request context 中（供 authctx.UserFrom 使用）
		ctx := authctx.WithUser(c.Request.Context(), claims.UserID)
		c.Request = c.Request.WithContext(ctx)

		// 同时也设置到 gin context 中（供其他需要的地方使用）
		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("is_admin", claims.IsAdmin)

		c.Next()
	}
}
