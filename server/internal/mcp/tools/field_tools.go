package tools

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterFieldTools 注册Field相关的MCP工具
func RegisterFieldTools(srv *server.MCPServer, fieldService *application.FieldService) error {
	logger.Info("Registering Field tools...")

	// 1. 列出字段
	srv.AddTool(mcp.NewTool("list_fields",
		mcp.WithDescription("列出指定表格的所有字段"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")

		fields, err := fieldService.ListFields(ctx, tableID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "list_fields"), logger.String("table_id", tableID))
		return ToToolResult(map[string]interface{}{
			"fields": fields,
			"total":  len(fields),
		}, nil)
	})

	// 2. 获取字段详情
	srv.AddTool(mcp.NewTool("get_field",
		mcp.WithDescription("获取指定字段的详细信息"),
		mcp.WithString("field_id",
			mcp.Required(),
			mcp.Description("字段 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		fieldID, _ := GetStringArg(args, "field_id")

		field, err := fieldService.GetField(ctx, fieldID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "get_field"), logger.String("field_id", fieldID))
		return ToToolResult(field, nil)
	})

	// 3. 创建字段
	srv.AddTool(mcp.NewTool("create_field",
		mcp.WithDescription("在表格中创建新字段"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
		mcp.WithString("name",
			mcp.Required(),
			mcp.Description("字段名称"),
		),
		mcp.WithString("type",
			mcp.Required(),
			mcp.Description("字段类型：text, number, select, date, email, checkbox, url, phone, lookup, formula, rollup 等"),
		),
		mcp.WithString("description",
			mcp.Description("字段描述（可选）"),
		),
		mcp.WithObject("options",
			mcp.Description("字段配置（可选），如 select 的选项、formula 的公式等"),
		),
		mcp.WithBoolean("required",
			mcp.Description("是否必填（可选）"),
		),
		mcp.WithBoolean("unique",
			mcp.Description("是否唯一（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")
		name, _ := GetStringArg(args, "name")
		fieldType, _ := GetStringArg(args, "type")
		description, _ := GetStringArg(args, "description")
		options, _ := GetMapArg(args, "options")

		userID := MustGetUserID(ctx)

		reqDTO := dto.CreateFieldRequest{
			TableID:  tableID,
			Name:     name,
			Type:     fieldType,
			Options:  options,
			Required: false, // default
			Unique:   false, // default
		}
		// Note: Description field not supported in current DTO
		_ = description

		if required, ok := GetBoolArg(args, "required"); ok {
			reqDTO.Required = required
		}
		if unique, ok := GetBoolArg(args, "unique"); ok {
			reqDTO.Unique = unique
		}

		field, err := fieldService.CreateField(ctx, reqDTO, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "create_field"), logger.String("name", name))
		return ToToolResultWithMessage(field, "字段创建成功", nil)
	})

	// 4. 更新字段
	srv.AddTool(mcp.NewTool("update_field",
		mcp.WithDescription("更新字段信息"),
		mcp.WithString("field_id",
			mcp.Required(),
			mcp.Description("字段 ID"),
		),
		mcp.WithString("name",
			mcp.Description("新的字段名称（可选）"),
		),
		mcp.WithString("type",
			mcp.Description("新的字段类型（可选）"),
		),
		mcp.WithString("description",
			mcp.Description("新的字段描述（可选）"),
		),
		mcp.WithObject("options",
			mcp.Description("新的字段配置（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		fieldID, _ := GetStringArg(args, "field_id")

		reqDTO := dto.UpdateFieldRequest{}
		if name, ok := GetStringArg(args, "name"); ok && name != "" {
			reqDTO.Name = &name
		}
		// Note: Type and Description fields not supported in UpdateFieldRequest
		if fieldType, ok := GetStringArg(args, "type"); ok {
			_ = fieldType // type conversion would need special handling
		}
		if desc, ok := GetStringArg(args, "description"); ok {
			_ = desc
		}
		if options, ok := GetMapArg(args, "options"); ok {
			reqDTO.Options = options
		}

		field, err := fieldService.UpdateField(ctx, fieldID, reqDTO)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "update_field"), logger.String("field_id", fieldID))
		return ToToolResultWithMessage(field, "字段更新成功", nil)
	})

	// 5. 删除字段
	srv.AddTool(mcp.NewTool("delete_field",
		mcp.WithDescription("删除指定字段"),
		mcp.WithString("field_id",
			mcp.Required(),
			mcp.Description("字段 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		fieldID, _ := GetStringArg(args, "field_id")

		err := fieldService.DeleteField(ctx, fieldID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "delete_field"), logger.String("field_id", fieldID))
		return ToToolResultWithMessage(map[string]interface{}{
			"deleted": true,
		}, "字段删除成功", nil)
	})

	// 6. 转换字段类型
	srv.AddTool(mcp.NewTool("convert_field_type",
		mcp.WithDescription("转换字段类型（如将文本转为数字）"),
		mcp.WithString("field_id",
			mcp.Required(),
			mcp.Description("字段 ID"),
		),
		mcp.WithString("new_type",
			mcp.Required(),
			mcp.Description("目标字段类型"),
		),
		mcp.WithObject("conversion_options",
			mcp.Description("转换选项（可选）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		fieldID, _ := GetStringArg(args, "field_id")
		newType, _ := GetStringArg(args, "new_type")
		conversionOptions, _ := GetMapArg(args, "conversion_options")

		// TODO: 实现字段类型转换功能
		_ = fieldID
		_ = newType
		_ = conversionOptions

		logger.Info("MCP tool executed", logger.String("tool", "convert_field_type"), logger.String("field_id", fieldID))
		return ToToolResultWithMessage(map[string]interface{}{
			"todo": true,
		}, "字段类型转换功能开发中", nil)
	})

	logger.Info("Field tools registered successfully (6 tools)")
	return nil
}
