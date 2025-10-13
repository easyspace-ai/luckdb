package tools

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterTableTools 注册Table相关的MCP工具
func RegisterTableTools(srv *server.MCPServer, tableService *application.TableService) error {
	logger.Info("Registering Table tools...")

	// 1. 列出表格
	srv.AddTool(mcp.NewTool("list_tables",
		mcp.WithDescription("列出指定Base下的所有表格"),
		mcp.WithString("base_id",
			mcp.Required(),
			mcp.Description("Base ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		baseID, _ := GetStringArg(args, "base_id")

		tables, err := tableService.ListTables(ctx, baseID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "list_tables"), logger.String("base_id", baseID))
		return ToToolResult(map[string]interface{}{
			"tables": tables,
			"total":  len(tables),
		}, nil)
	})

	// 2. 获取表格详情
	srv.AddTool(mcp.NewTool("get_table",
		mcp.WithDescription("获取指定表格的详细信息"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")

		table, err := tableService.GetTable(ctx, tableID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "get_table"), logger.String("table_id", tableID))
		return ToToolResult(table, nil)
	})

	// 3. 创建表格
	srv.AddTool(mcp.NewTool("create_table",
		mcp.WithDescription("在Base中创建新表格"),
		mcp.WithString("base_id",
			mcp.Required(),
			mcp.Description("Base ID"),
		),
		mcp.WithString("name",
			mcp.Required(),
			mcp.Description("表格名称"),
		),
		mcp.WithString("description",
			mcp.Description("表格描述（可选）"),
		),
		mcp.WithString("icon",
			mcp.Description("表格图标（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		baseID, _ := GetStringArg(args, "base_id")
		name, _ := GetStringArg(args, "name")
		description, _ := GetStringArg(args, "description")
		icon, _ := GetStringArg(args, "icon")

		userID := MustGetUserID(ctx)

		reqDTO := dto.CreateTableRequest{
			BaseID:      baseID,
			Name:        name,
			Description: description,
		}
		// Note: Icon field not supported in current DTO
		_ = icon

		table, err := tableService.CreateTable(ctx, reqDTO, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "create_table"), logger.String("name", name))
		return ToToolResultWithMessage(table, "表格创建成功", nil)
	})

	// 4. 更新表格
	srv.AddTool(mcp.NewTool("update_table",
		mcp.WithDescription("更新表格信息"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
		mcp.WithString("name",
			mcp.Description("新的表格名称（可选）"),
		),
		mcp.WithString("description",
			mcp.Description("新的表格描述（可选）"),
		),
		mcp.WithString("icon",
			mcp.Description("新的表格图标（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")

		reqDTO := dto.UpdateTableRequest{}
		if name, ok := GetStringArg(args, "name"); ok && name != "" {
			reqDTO.Name = &name
		}
		if desc, ok := GetStringArg(args, "description"); ok && desc != "" {
			reqDTO.Description = &desc
		}
		// Note: Icon field not supported in current DTO
		if icon, ok := GetStringArg(args, "icon"); ok {
			_ = icon
		}

		table, err := tableService.UpdateTable(ctx, tableID, reqDTO)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "update_table"), logger.String("table_id", tableID))
		return ToToolResultWithMessage(table, "表格更新成功", nil)
	})

	// 5. 删除表格
	srv.AddTool(mcp.NewTool("delete_table",
		mcp.WithDescription("删除指定表格"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")

		err := tableService.DeleteTable(ctx, tableID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "delete_table"), logger.String("table_id", tableID))
		return ToToolResultWithMessage(map[string]interface{}{
			"deleted": true,
		}, "表格删除成功", nil)
	})

	// 6. 复制表格
	srv.AddTool(mcp.NewTool("duplicate_table",
		mcp.WithDescription("复制表格（包含结构和数据）"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("要复制的表格 ID"),
		),
		mcp.WithString("name",
			mcp.Description("新表格名称（可选，默认为原名称+副本）"),
		),
		mcp.WithBoolean("with_data",
			mcp.Description("是否包含数据（可选，默认true）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")
		name, _ := GetStringArg(args, "name")
		withData, _ := GetBoolArg(args, "with_data")

		// TODO: 实现表格复制功能
		_ = tableID
		_ = name
		_ = withData

		logger.Info("MCP tool executed", logger.String("tool", "duplicate_table"), logger.String("table_id", tableID))
		return ToToolResultWithMessage(map[string]interface{}{
			"todo": true,
		}, "表格复制功能开发中", nil)
	})

	logger.Info("Table tools registered successfully (6 tools)")
	return nil
}
