package tools

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterViewTools 注册View相关的MCP工具
func RegisterViewTools(srv *server.MCPServer, viewService *application.ViewService) error {
	logger.Info("Registering View tools...")

	// 1. 列出视图
	srv.AddTool(mcp.NewTool("list_views",
		mcp.WithDescription("列出指定表格的所有视图"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")

		views, err := viewService.ListViewsByTable(ctx, tableID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "list_views"), logger.String("table_id", tableID))
		return ToToolResult(map[string]interface{}{
			"views": views,
			"total": len(views),
		}, nil)
	})

	// 2. 获取视图详情
	srv.AddTool(mcp.NewTool("get_view",
		mcp.WithDescription("获取指定视图的详细信息"),
		mcp.WithString("view_id",
			mcp.Required(),
			mcp.Description("视图 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		viewID, _ := GetStringArg(args, "view_id")

		view, err := viewService.GetView(ctx, viewID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "get_view"), logger.String("view_id", viewID))
		return ToToolResult(view, nil)
	})

	// 3. 创建视图
	srv.AddTool(mcp.NewTool("create_view",
		mcp.WithDescription("在表格中创建新视图"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
		mcp.WithString("name",
			mcp.Required(),
			mcp.Description("视图名称"),
		),
		mcp.WithString("type",
			mcp.Description("视图类型：grid, form, kanban, gallery, calendar（默认grid）"),
		),
		mcp.WithString("description",
			mcp.Description("视图描述（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")
		name, _ := GetStringArg(args, "name")
		viewType, _ := GetStringArg(args, "type")
		description, _ := GetStringArg(args, "description")

		userID := MustGetUserID(ctx)

		if viewType == "" {
			viewType = "grid"
		}

		reqDTO := dto.CreateViewRequest{
			TableID:     tableID,
			Name:        name,
			Type:        viewType,
			Description: description,
		}

		view, err := viewService.CreateView(ctx, reqDTO, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "create_view"), logger.String("name", name))
		return ToToolResultWithMessage(view, "视图创建成功", nil)
	})

	// 4. 更新视图
	srv.AddTool(mcp.NewTool("update_view",
		mcp.WithDescription("更新视图信息"),
		mcp.WithString("view_id",
			mcp.Required(),
			mcp.Description("视图 ID"),
		),
		mcp.WithString("name",
			mcp.Description("新的视图名称（可选）"),
		),
		mcp.WithString("description",
			mcp.Description("新的视图描述（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		viewID, _ := GetStringArg(args, "view_id")

		reqDTO := dto.UpdateViewRequest{}
		if name, ok := GetStringArg(args, "name"); ok && name != "" {
			reqDTO.Name = &name
		}
		if desc, ok := GetStringArg(args, "description"); ok && desc != "" {
			reqDTO.Description = &desc
		}

		view, err := viewService.UpdateView(ctx, viewID, reqDTO)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "update_view"), logger.String("view_id", viewID))
		return ToToolResultWithMessage(view, "视图更新成功", nil)
	})

	// 5. 删除视图
	srv.AddTool(mcp.NewTool("delete_view",
		mcp.WithDescription("删除指定视图"),
		mcp.WithString("view_id",
			mcp.Required(),
			mcp.Description("视图 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		viewID, _ := GetStringArg(args, "view_id")

		err := viewService.DeleteView(ctx, viewID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "delete_view"), logger.String("view_id", viewID))
		return ToToolResultWithMessage(map[string]interface{}{
			"deleted": true,
		}, "视图删除成功", nil)
	})

	// 6. 更新视图过滤器
	srv.AddTool(mcp.NewTool("update_view_filter",
		mcp.WithDescription("更新视图的过滤条件"),
		mcp.WithString("view_id",
			mcp.Required(),
			mcp.Description("视图 ID"),
		),
		mcp.WithObject("filter",
			mcp.Required(),
			mcp.Description("过滤配置对象"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		viewID, _ := GetStringArg(args, "view_id")
		filter, _ := GetMapArg(args, "filter")

		err := viewService.UpdateViewFilter(ctx, viewID, filter)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "update_view_filter"), logger.String("view_id", viewID))
		return ToToolResultWithMessage(map[string]interface{}{
			"updated": true,
		}, "视图过滤器更新成功", nil)
	})

	// 7. 更新视图排序
	srv.AddTool(mcp.NewTool("update_view_sort",
		mcp.WithDescription("更新视图的排序规则"),
		mcp.WithString("view_id",
			mcp.Required(),
			mcp.Description("视图 ID"),
		),
		mcp.WithObject("sort",
			mcp.Required(),
			mcp.Description("排序配置对象"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		viewID, _ := GetStringArg(args, "view_id")
		sortRaw, _ := GetMapArg(args, "sort")

		// 转换为 []map[string]interface{}
		var sortData []map[string]interface{}
		if sortRaw != nil {
			// 如果 sort 是单个对象，包装成数组
			sortData = []map[string]interface{}{sortRaw}
		}

		err := viewService.UpdateViewSort(ctx, viewID, sortData)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "update_view_sort"), logger.String("view_id", viewID))
		return ToToolResultWithMessage(map[string]interface{}{
			"updated": true,
		}, "视图排序更新成功", nil)
	})

	// 8. 复制视图
	srv.AddTool(mcp.NewTool("duplicate_view",
		mcp.WithDescription("复制视图（包含配置）"),
		mcp.WithString("view_id",
			mcp.Required(),
			mcp.Description("要复制的视图 ID"),
		),
		mcp.WithString("name",
			mcp.Description("新视图名称（可选，默认为原名称+副本）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		viewID, _ := GetStringArg(args, "view_id")
		name, _ := GetStringArg(args, "name")

		userID := MustGetUserID(ctx)

		view, err := viewService.DuplicateView(ctx, viewID, name, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "duplicate_view"), logger.String("view_id", viewID))
		return ToToolResultWithMessage(view, "视图复制成功", nil)
	})

	logger.Info("View tools registered successfully (8 tools)")
	return nil
}
