package tools

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterUserTools 注册User相关的MCP工具
func RegisterUserTools(srv *server.MCPServer, userService *application.UserService, authService *application.AuthService) error {
	logger.Info("Registering User tools...")

	// 1. 获取当前用户信息
	srv.AddTool(mcp.NewTool("get_current_user",
		mcp.WithDescription("获取当前登录用户的详细信息"),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		userID := MustGetUserID(ctx)

		user, err := userService.GetUser(ctx, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "get_current_user"), logger.String("user_id", userID))
		return ToToolResult(user, nil)
	})

	// 2. 更新用户资料
	srv.AddTool(mcp.NewTool("update_user_profile",
		mcp.WithDescription("更新当前用户的个人资料"),
		mcp.WithString("name",
			mcp.Description("用户名（可选）"),
		),
		mcp.WithString("email",
			mcp.Description("电子邮箱（可选）"),
		),
		mcp.WithString("avatar",
			mcp.Description("头像URL（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		userID := MustGetUserID(ctx)

		reqDTO := dto.UpdateUserRequest{}
		if name, ok := GetStringArg(args, "name"); ok && name != "" {
			reqDTO.Name = &name
		}
		if email, ok := GetStringArg(args, "email"); ok && email != "" {
			reqDTO.Email = &email
		}
		if avatar, ok := GetStringArg(args, "avatar"); ok && avatar != "" {
			reqDTO.Avatar = &avatar
		}

		user, err := userService.UpdateUser(ctx, userID, reqDTO)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "update_user_profile"), logger.String("user_id", userID))
		return ToToolResultWithMessage(user, "用户资料更新成功", nil)
	})

	// 3. 修改密码
	srv.AddTool(mcp.NewTool("change_password",
		mcp.WithDescription("修改当前用户的密码"),
		mcp.WithString("old_password",
			mcp.Required(),
			mcp.Description("当前密码"),
		),
		mcp.WithString("new_password",
			mcp.Required(),
			mcp.Description("新密码"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		userID := MustGetUserID(ctx)
		oldPassword, _ := GetStringArg(args, "old_password")
		newPassword, _ := GetStringArg(args, "new_password")

		err := userService.ChangePassword(ctx, userID, oldPassword, newPassword)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "change_password"), logger.String("user_id", userID))
		return ToToolResultWithMessage(map[string]interface{}{
			"success": true,
		}, "密码修改成功", nil)
	})

	logger.Info("User tools registered successfully (3 tools)")
	return nil
}
