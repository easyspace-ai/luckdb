package tools

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	pkgerrors "github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterSpaceTools 注册Space相关的MCP工具
func RegisterSpaceTools(srv *server.MCPServer, spaceService *application.SpaceService) error {
	logger.Info("Registering Space tools...")

	// 1. list_spaces - 列出所有空间
	logger.Info("Adding tool: list_spaces")
	srv.AddTool(
		mcp.NewTool(
			"list_spaces",
			mcp.WithDescription("列出所有空间"),
			mcp.WithString("filter", mcp.Description("过滤条件（可选）")),
			mcp.WithNumber("page", mcp.Description("页码，从1开始（默认1）")),
			mcp.WithNumber("limit", mcp.Description("每页数量（默认20）")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			// TODO: 实现分页和过滤
			// 目前简化实现：调用现有的ListSpaces
			spaces, err := spaceService.ListSpaces(ctx, userID)
			if err != nil {
				logger.Error("Failed to list spaces", logger.ErrorField(err), logger.String("user_id", userID))
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "list_spaces"),
				logger.String("user_id", userID),
				logger.Int("count", len(spaces)),
			)

			return ToToolResultWithMessage(spaces, "获取空间列表成功", nil)
		},
	)

	// 2. get_space - 获取空间详情
	logger.Info("Adding tool: get_space")
	srv.AddTool(
		mcp.NewTool(
			"get_space",
			mcp.WithDescription("获取指定空间的详细信息"),
			mcp.WithString("space_id", mcp.Description("空间ID"), mcp.Required()),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			spaceID, ok := GetStringArg(args, "space_id")
			if !ok || spaceID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("space_id is required"))
			}

			space, err := spaceService.GetSpace(ctx, spaceID)
			if err != nil {
				logger.Error("Failed to get space",
					logger.ErrorField(err),
					logger.String("user_id", userID),
					logger.String("space_id", spaceID),
				)
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "get_space"),
				logger.String("user_id", userID),
				logger.String("space_id", spaceID),
			)

			return ToToolResultWithMessage(space, "获取空间详情成功", nil)
		},
	)

	// 3. create_space - 创建新空间
	logger.Info("Adding tool: create_space")
	srv.AddTool(
		mcp.NewTool(
			"create_space",
			mcp.WithDescription("创建新空间"),
			mcp.WithString("name", mcp.Description("空间名称"), mcp.Required()),
			mcp.WithString("description", mcp.Description("空间描述（可选）")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			name, ok := GetStringArg(args, "name")
			if !ok || name == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("name is required"))
			}

			description, _ := GetStringArg(args, "description")

			createReq := dto.CreateSpaceRequest{
				Name:        name,
				Description: description,
			}

			space, err := spaceService.CreateSpace(ctx, createReq, userID)
			if err != nil {
				logger.Error("Failed to create space",
					logger.ErrorField(err),
					logger.String("user_id", userID),
					logger.String("name", name),
				)
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "create_space"),
				logger.String("user_id", userID),
				logger.String("space_id", space.ID),
			)

			return ToToolResultWithMessage(space, "创建空间成功", nil)
		},
	)

	// 4. update_space - 更新空间
	logger.Info("Adding tool: update_space")
	srv.AddTool(
		mcp.NewTool(
			"update_space",
			mcp.WithDescription("更新空间信息"),
			mcp.WithString("space_id", mcp.Description("空间ID"), mcp.Required()),
			mcp.WithString("name", mcp.Description("新的空间名称（可选）")),
			mcp.WithString("description", mcp.Description("新的空间描述（可选）")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			spaceID, ok := GetStringArg(args, "space_id")
			if !ok || spaceID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("space_id is required"))
			}

			name, _ := GetStringArg(args, "name")
			description, _ := GetStringArg(args, "description")

			updateReq := dto.UpdateSpaceRequest{
				Name:        &name,
				Description: &description,
			}

			space, err := spaceService.UpdateSpace(ctx, spaceID, updateReq)
			if err != nil {
				logger.Error("Failed to update space",
					logger.ErrorField(err),
					logger.String("user_id", userID),
					logger.String("space_id", spaceID),
				)
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "update_space"),
				logger.String("user_id", userID),
				logger.String("space_id", spaceID),
			)

			return ToToolResultWithMessage(space, "更新空间成功", nil)
		},
	)

	// 5. delete_space - 删除空间
	logger.Info("Adding tool: delete_space")
	srv.AddTool(
		mcp.NewTool(
			"delete_space",
			mcp.WithDescription("删除指定空间"),
			mcp.WithString("space_id", mcp.Description("空间ID"), mcp.Required()),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			spaceID, ok := GetStringArg(args, "space_id")
			if !ok || spaceID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("space_id is required"))
			}

			deleteErr := spaceService.DeleteSpace(ctx, spaceID)
			if deleteErr != nil {
				logger.Error("Failed to delete space",
					logger.ErrorField(deleteErr),
					logger.String("user_id", userID),
					logger.String("space_id", spaceID),
				)
				return ToToolResult(nil, deleteErr)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "delete_space"),
				logger.String("user_id", userID),
				logger.String("space_id", spaceID),
			)

			return ToToolResultWithMessage(nil, "删除空间成功", nil)
		},
	)

	logger.Info("Space tools registered successfully (5 tools)")
	return nil
}
