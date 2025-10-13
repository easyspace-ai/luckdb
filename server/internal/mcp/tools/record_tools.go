package tools

import (
	"context"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RegisterRecordTools 注册Record相关的MCP工具
func RegisterRecordTools(srv *server.MCPServer, recordService *application.RecordService) error {
	logger.Info("Registering Record tools...")

	// 1. 列出记录
	srv.AddTool(mcp.NewTool("list_records",
		mcp.WithDescription("列出指定表格的所有记录"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
		mcp.WithNumber("limit",
			mcp.Description("每页数量（默认20）"),
		),
		mcp.WithNumber("offset",
			mcp.Description("偏移量（默认0）"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")
		limit, _ := GetIntArg(args, "limit")
		if limit <= 0 {
			limit = 20
		}
		offset, _ := GetIntArg(args, "offset")
		if offset < 0 {
			offset = 0
		}

		records, err := recordService.ListRecords(ctx, tableID, limit, offset)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "list_records"), logger.String("table_id", tableID))
		return ToToolResult(map[string]interface{}{
			"records": records,
			"total":   len(records),
		}, nil)
	})

	// 2. 获取记录详情
	srv.AddTool(mcp.NewTool("get_record",
		mcp.WithDescription("获取指定记录的详细信息"),
		mcp.WithString("record_id",
			mcp.Required(),
			mcp.Description("记录 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		recordID, _ := GetStringArg(args, "record_id")

		record, err := recordService.GetRecord(ctx, recordID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "get_record"), logger.String("record_id", recordID))
		return ToToolResult(record, nil)
	})

	// 3. 创建记录
	srv.AddTool(mcp.NewTool("create_record",
		mcp.WithDescription("在表格中创建新记录"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
		mcp.WithObject("data",
			mcp.Required(),
			mcp.Description("记录数据，格式：{\"field_id\": value}"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")
		data, _ := GetMapArg(args, "data")

		userID := MustGetUserID(ctx)

		reqDTO := dto.CreateRecordRequest{
			TableID: tableID,
			Data:    data,
		}

		record, err := recordService.CreateRecord(ctx, reqDTO, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "create_record"), logger.String("table_id", tableID))
		return ToToolResultWithMessage(record, "记录创建成功", nil)
	})

	// 4. 更新记录
	srv.AddTool(mcp.NewTool("update_record",
		mcp.WithDescription("更新记录的字段数据"),
		mcp.WithString("record_id",
			mcp.Required(),
			mcp.Description("记录 ID"),
		),
		mcp.WithObject("data",
			mcp.Required(),
			mcp.Description("要更新的数据"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		recordID, _ := GetStringArg(args, "record_id")
		data, _ := GetMapArg(args, "data")

		userID := MustGetUserID(ctx)

		reqDTO := dto.UpdateRecordRequest{
			Data: data,
		}

		record, err := recordService.UpdateRecord(ctx, recordID, reqDTO, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "update_record"), logger.String("record_id", recordID))
		return ToToolResultWithMessage(record, "记录更新成功", nil)
	})

	// 5. 删除记录
	srv.AddTool(mcp.NewTool("delete_record",
		mcp.WithDescription("删除指定记录"),
		mcp.WithString("record_id",
			mcp.Required(),
			mcp.Description("记录 ID"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		recordID, _ := GetStringArg(args, "record_id")

		err := recordService.DeleteRecord(ctx, recordID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "delete_record"), logger.String("record_id", recordID))
		return ToToolResultWithMessage(map[string]interface{}{
			"deleted": true,
		}, "记录删除成功", nil)
	})

	// 6. 批量创建记录
	srv.AddTool(mcp.NewTool("batch_create_records",
		mcp.WithDescription("批量创建多条记录"),
		mcp.WithString("table_id",
			mcp.Required(),
			mcp.Description("表格 ID"),
		),
		mcp.WithArray("records",
			mcp.Required(),
			mcp.Description("记录数组，每个元素包含fields字段数据"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		tableID, _ := GetStringArg(args, "table_id")
		recordsRaw, _ := GetArrayArg(args, "records")

		userID := MustGetUserID(ctx)

		// 转换为 []dto.RecordCreateItem
		records := make([]dto.RecordCreateItem, 0, len(recordsRaw))
		for _, r := range recordsRaw {
			if fieldsMap, ok := r.(map[string]interface{}); ok {
				if fields, ok := GetMapArg(fieldsMap, "fields"); ok {
					records = append(records, dto.RecordCreateItem{
						Fields: fields,
					})
				}
			}
		}

		reqDTO := dto.BatchCreateRecordRequest{
			Records: records,
		}

		response, err := recordService.BatchCreateRecords(ctx, tableID, reqDTO, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "batch_create_records"), logger.Int("count", response.SuccessCount))
		return ToToolResultWithMessage(response, "批量创建成功", nil)
	})

	// 7. 批量更新记录
	srv.AddTool(mcp.NewTool("batch_update_records",
		mcp.WithDescription("批量更新多条记录"),
		mcp.WithArray("records",
			mcp.Required(),
			mcp.Description("更新数组，每个元素包含 id 和 fields"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		recordsRaw, _ := GetArrayArg(args, "records")

		userID := MustGetUserID(ctx)

		// 转换为 []dto.RecordUpdateItem
		records := make([]dto.RecordUpdateItem, 0, len(recordsRaw))
		for _, r := range recordsRaw {
			if recordMap, ok := r.(map[string]interface{}); ok {
				id, _ := GetStringArg(recordMap, "id")
				fields, _ := GetMapArg(recordMap, "fields")
				records = append(records, dto.RecordUpdateItem{
					ID:     id,
					Fields: fields,
				})
			}
		}

		reqDTO := dto.BatchUpdateRecordRequest{
			Records: records,
		}

		response, err := recordService.BatchUpdateRecords(ctx, reqDTO, userID)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "batch_update_records"), logger.Int("count", response.SuccessCount))
		return ToToolResultWithMessage(response, "批量更新成功", nil)
	})

	// 8. 批量删除记录
	srv.AddTool(mcp.NewTool("batch_delete_records",
		mcp.WithDescription("批量删除多条记录"),
		mcp.WithArray("record_ids",
			mcp.Required(),
			mcp.Description("记录ID数组"),
		),
	), func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		args, _ := req.Params.Arguments.(map[string]interface{})
		recordIDsRaw, _ := GetArrayArg(args, "record_ids")

		// 转换为 []string
		recordIDs := make([]string, 0, len(recordIDsRaw))
		for _, id := range recordIDsRaw {
			if str, ok := id.(string); ok {
				recordIDs = append(recordIDs, str)
			}
		}

		reqDTO := dto.BatchDeleteRecordRequest{
			RecordIDs: recordIDs,
		}

		response, err := recordService.BatchDeleteRecords(ctx, reqDTO)
		if err != nil {
			return ToToolResult(nil, err)
		}

		logger.Info("MCP tool executed", logger.String("tool", "batch_delete_records"), logger.Int("count", response.SuccessCount))
		return ToToolResultWithMessage(response, "批量删除成功", nil)
	})

	logger.Info("Record tools registered successfully (8 tools)")
	return nil
}
