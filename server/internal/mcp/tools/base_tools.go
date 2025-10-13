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

// RegisterBaseTools 注册Base相关的MCP工具
func RegisterBaseTools(srv *server.MCPServer, baseService *application.BaseService) error {
	logger.Info("Registering Base tools...")

	// 1. list_bases - 列出空间的所有Bases
	srv.AddTool(
		mcp.NewTool(
			"list_bases",
			mcp.WithDescription("列出指定空间的所有Bases"),
			mcp.WithString("space_id", mcp.Description("空间ID"), mcp.Required()),
			mcp.WithNumber("page", mcp.Description("页码，从1开始（默认1）")),
			mcp.WithNumber("limit", mcp.Description("每页数量（默认20）")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			spaceID, ok := GetStringArg(args, "space_id")
			if !ok || spaceID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("space_id is required"))
			}

			// Base 列表不分页
			bases, err := baseService.ListBases(ctx, spaceID)
			if err != nil {
				logger.Error("Failed to list bases",
					logger.ErrorField(err),
					logger.String("user_id", userID),
					logger.String("space_id", spaceID),
				)
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "list_bases"),
				logger.String("user_id", userID),
				logger.String("space_id", spaceID),
				logger.Int("count", len(bases)),
			)

			return ToToolResultWithMessage(bases, "获取Base列表成功", nil)
		},
	)

	// 2. get_base - 获取Base详情
	srv.AddTool(
		mcp.NewTool(
			"get_base",
			mcp.WithDescription("获取指定Base的详细信息"),
			mcp.WithString("base_id", mcp.Description("Base ID"), mcp.Required()),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			baseID, ok := GetStringArg(args, "base_id")
			if !ok || baseID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("base_id is required"))
			}

			base, err := baseService.GetBase(ctx, baseID)
			if err != nil {
				logger.Error("Failed to get base",
					logger.ErrorField(err),
					logger.String("user_id", userID),
					logger.String("base_id", baseID),
				)
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "get_base"),
				logger.String("user_id", userID),
				logger.String("base_id", baseID),
			)

			return ToToolResultWithMessage(base, "获取Base详情成功", nil)
		},
	)

	// 3. create_base - 创建新Base
	srv.AddTool(
		mcp.NewTool(
			"create_base",
			mcp.WithDescription("在指定空间中创建新Base"),
			mcp.WithString("space_id", mcp.Description("空间ID"), mcp.Required()),
			mcp.WithString("name", mcp.Description("Base名称"), mcp.Required()),
			mcp.WithString("description", mcp.Description("Base描述（可选）")),
			mcp.WithString("icon", mcp.Description("Base图标（可选）")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			spaceID, ok := GetStringArg(args, "space_id")
			if !ok || spaceID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("space_id is required"))
			}

			name, ok := GetStringArg(args, "name")
			if !ok || name == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("name is required"))
			}

			_, _ = GetStringArg(args, "description") // TODO: Add description support
			icon, _ := GetStringArg(args, "icon")

			createReq := dto.CreateBaseRequest{
				SpaceID: spaceID,
				Name:    name,
				Icon:    icon,
			}

			base, err := baseService.CreateBase(ctx, createReq, userID)
			if err != nil {
				logger.Error("Failed to create base",
					logger.ErrorField(err),
					logger.String("user_id", userID),
					logger.String("space_id", spaceID),
					logger.String("name", name),
				)
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "create_base"),
				logger.String("user_id", userID),
				logger.String("base_id", base.ID),
			)

			return ToToolResultWithMessage(base, "创建Base成功", nil)
		},
	)

	// 4. update_base - 更新Base
	srv.AddTool(
		mcp.NewTool(
			"update_base",
			mcp.WithDescription("更新Base信息"),
			mcp.WithString("base_id", mcp.Description("Base ID"), mcp.Required()),
			mcp.WithString("name", mcp.Description("新的Base名称（可选）")),
			mcp.WithString("description", mcp.Description("新的Base描述（可选）")),
			mcp.WithString("icon", mcp.Description("新的Base图标（可选）")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			baseID, ok := GetStringArg(args, "base_id")
			if !ok || baseID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("base_id is required"))
			}

			name, _ := GetStringArg(args, "name")
			_, _ = GetStringArg(args, "description") // TODO: Add description support
			icon, _ := GetStringArg(args, "icon")

			updateReq := dto.UpdateBaseRequest{
				Name: name,
				Icon: icon,
			}

			base, err := baseService.UpdateBase(ctx, baseID, updateReq)
			if err != nil {
				logger.Error("Failed to update base",
					logger.ErrorField(err),
					logger.String("user_id", userID),
					logger.String("base_id", baseID),
				)
				return ToToolResult(nil, err)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "update_base"),
				logger.String("user_id", userID),
				logger.String("base_id", baseID),
			)

			return ToToolResultWithMessage(base, "更新Base成功", nil)
		},
	)

	// 5. delete_base - 删除Base
	srv.AddTool(
		mcp.NewTool(
			"delete_base",
			mcp.WithDescription("删除指定Base"),
			mcp.WithString("base_id", mcp.Description("Base ID"), mcp.Required()),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			baseID, ok := GetStringArg(args, "base_id")
			if !ok || baseID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("base_id is required"))
			}

			deleteErr := baseService.DeleteBase(ctx, baseID)
			if deleteErr != nil {
				logger.Error("Failed to delete base",
					logger.ErrorField(deleteErr),
					logger.String("user_id", userID),
					logger.String("base_id", baseID),
				)
				return ToToolResult(nil, deleteErr)
			}

			logger.Info("MCP tool executed",
				logger.String("tool", "delete_base"),
				logger.String("user_id", userID),
				logger.String("base_id", baseID),
			)

			return ToToolResultWithMessage(nil, "删除Base成功", nil)
		},
	)

	// 6. duplicate_base - 复制Base
	srv.AddTool(
		mcp.NewTool(
			"duplicate_base",
			mcp.WithDescription("复制指定Base"),
			mcp.WithString("base_id", mcp.Description("要复制的Base ID"), mcp.Required()),
			mcp.WithString("new_name", mcp.Description("新Base的名称（可选，默认为原名称+副本）")),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			baseID, ok := GetStringArg(args, "base_id")
			if !ok || baseID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("base_id is required"))
			}

			_, _ = GetStringArg(args, "new_name")

			// TODO: Implement DuplicateBase
			// duplicateReq := dto.DuplicateBaseRequest{
			// 	Name: newName,
			// }
			// newBase, err := baseService.DuplicateBase(ctx, baseID, duplicateReq)

			logger.Info("MCP tool called (not implemented)",
				logger.String("tool", "duplicate_base"),
				logger.String("user_id", userID),
				logger.String("base_id", baseID),
			)

			return ToToolResult(nil, pkgerrors.ErrNotImplemented.WithDetails("duplicate_base not implemented yet"))
		},
	)

	// 7. get_base_collaborators - 获取Base协作者
	srv.AddTool(
		mcp.NewTool(
			"get_base_collaborators",
			mcp.WithDescription("获取Base的所有协作者"),
			mcp.WithString("base_id", mcp.Description("Base ID"), mcp.Required()),
		),
		func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
			userID := MustGetUserID(ctx)

			args, _ := req.Params.Arguments.(map[string]interface{})
			baseID, ok := GetStringArg(args, "base_id")
			if !ok || baseID == "" {
				return ToToolResult(nil, pkgerrors.ErrBadRequest.WithDetails("base_id is required"))
			}

			// TODO: Implement GetBaseCollaborators
			// collaborators, err := baseService.GetBaseCollaborators(ctx, baseID)

			logger.Info("MCP tool called (not implemented)",
				logger.String("tool", "get_base_collaborators"),
				logger.String("user_id", userID),
				logger.String("base_id", baseID),
			)

			return ToToolResult(nil, pkgerrors.ErrNotImplemented.WithDetails("get_base_collaborators not implemented yet"))
		},
	)

	logger.Info("Base tools registered successfully (7 tools)")
	return nil
}
