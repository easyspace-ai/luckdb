package tools

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/mark3labs/mcp-go/mcp"

	pkgerrors "github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
	"github.com/easyspace-ai/luckdb/server/pkg/response"
)

// ToToolResult 将结果转换为MCP ToolResult
// 遵循项目的统一响应格式
func ToToolResult(data interface{}, err error) (*mcp.CallToolResult, error) {
	if err != nil {
		// 处理错误
		return toToolError(err), nil
	}

	// 成功响应
	apiResp := response.APIResponse{
		Code:    pkgerrors.CodeOK,
		Message: "操作成功",
		Data:    data,
	}

	jsonBytes, err := json.Marshal(apiResp)
	if err != nil {
		logger.Error("Failed to marshal response", logger.ErrorField(err))
		return mcp.NewToolResultError("Internal error: failed to marshal response"), nil
	}

	return mcp.NewToolResultText(string(jsonBytes)), nil
}

// ToToolResultWithMessage 带自定义消息的结果转换
func ToToolResultWithMessage(data interface{}, message string, err error) (*mcp.CallToolResult, error) {
	if err != nil {
		return toToolError(err), nil
	}

	apiResp := response.APIResponse{
		Code:    pkgerrors.CodeOK,
		Message: message,
		Data:    data,
	}

	jsonBytes, err := json.Marshal(apiResp)
	if err != nil {
		logger.Error("Failed to marshal response", logger.ErrorField(err))
		return mcp.NewToolResultError("Internal error: failed to marshal response"), nil
	}

	return mcp.NewToolResultText(string(jsonBytes)), nil
}

// ToPaginatedToolResult 分页结果转换
func ToPaginatedToolResult(list interface{}, pagination response.Pagination, message string, err error) (*mcp.CallToolResult, error) {
	if err != nil {
		return toToolError(err), nil
	}

	apiResp := response.APIResponse{
		Code:    pkgerrors.CodeOK,
		Message: message,
		Data: map[string]interface{}{
			"list":       list,
			"pagination": pagination,
		},
	}

	jsonBytes, err := json.Marshal(apiResp)
	if err != nil {
		logger.Error("Failed to marshal response", logger.ErrorField(err))
		return mcp.NewToolResultError("Internal error: failed to marshal response"), nil
	}

	return mcp.NewToolResultText(string(jsonBytes)), nil
}

// toToolError 将错误转换为MCP ToolResult错误
func toToolError(err error) *mcp.CallToolResult {
	// 检查是否是AppError
	if appErr, ok := pkgerrors.IsAppError(err); ok {
		code := pkgerrors.NumericCodeFromString(appErr.Code, appErr.HTTPStatus)

		apiResp := response.APIResponse{
			Code:    code,
			Message: appErr.Message,
			Data:    nil,
			Error: &response.ErrorPayload{
				Details: appErr.Details,
			},
		}

		jsonBytes, marshalErr := json.Marshal(apiResp)
		if marshalErr != nil {
			logger.Error("Failed to marshal error response", logger.ErrorField(marshalErr))
			return mcp.NewToolResultError(fmt.Sprintf("Error: %s", appErr.Message))
		}

		return mcp.NewToolResultText(string(jsonBytes))
	}

	// 通用错误
	apiResp := response.APIResponse{
		Code:    pkgerrors.CodeInternalError,
		Message: "服务器内部错误",
		Data:    nil,
		Error: &response.ErrorPayload{
			Details: err.Error(),
		},
	}

	jsonBytes, marshalErr := json.Marshal(apiResp)
	if marshalErr != nil {
		logger.Error("Failed to marshal error response", logger.ErrorField(marshalErr))
		return mcp.NewToolResultError(err.Error())
	}

	return mcp.NewToolResultText(string(jsonBytes))
}

// contextKey 上下文键类型
type contextKey string

const (
	// userIDKey 用户ID键（与mcp包保持一致）
	userIDKey contextKey = "mcp_user_id"
)

// MustGetUserID 从上下文获取用户ID
// 假定已经过认证，如果不存在则返回空字符串并记录错误
// 调用者应该检查返回值是否为空
func MustGetUserID(ctx context.Context) string {
	userID, ok := ctx.Value(userIDKey).(string)
	if !ok || userID == "" {
		// 这不应该发生，因为已经过认证中间件
		// 记录错误而不是panic
		return ""
	}
	return userID
}

// GetStringArg 从参数中获取字符串值
func GetStringArg(args map[string]interface{}, key string) (string, bool) {
	val, ok := args[key]
	if !ok {
		return "", false
	}
	str, ok := val.(string)
	return str, ok
}

// GetIntArg 从参数中获取整数值
func GetIntArg(args map[string]interface{}, key string) (int, bool) {
	val, ok := args[key]
	if !ok {
		return 0, false
	}

	// 尝试多种类型转换
	switch v := val.(type) {
	case int:
		return v, true
	case int64:
		return int(v), true
	case float64:
		return int(v), true
	case string:
		// 尝试解析字符串
		var intVal int
		_, err := fmt.Sscanf(v, "%d", &intVal)
		return intVal, err == nil
	default:
		return 0, false
	}
}

// GetBoolArg 从参数中获取布尔值
func GetBoolArg(args map[string]interface{}, key string) (bool, bool) {
	val, ok := args[key]
	if !ok {
		return false, false
	}
	boolVal, ok := val.(bool)
	return boolVal, ok
}

// GetMapArg 从参数中获取map值
func GetMapArg(args map[string]interface{}, key string) (map[string]interface{}, bool) {
	val, ok := args[key]
	if !ok {
		return nil, false
	}
	mapVal, ok := val.(map[string]interface{})
	return mapVal, ok
}

// GetArrayArg 从参数中获取数组值
func GetArrayArg(args map[string]interface{}, key string) ([]interface{}, bool) {
	val, ok := args[key]
	if !ok {
		return nil, false
	}
	arrayVal, ok := val.([]interface{})
	return arrayVal, ok
}
