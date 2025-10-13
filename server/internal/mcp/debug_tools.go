package mcp

import (
	"github.com/easyspace-ai/luckdb/server/pkg/logger"

	"github.com/mark3labs/mcp-go/server"
)

// DebugListTools 调试工具列表（用于开发调试）
func DebugListTools(srv *server.MCPServer) {
	// 使用反射或其他方式获取已注册的工具列表
	// 注意：这需要 mcp-go 库提供相应的方法

	logger.Info("=== 调试：工具注册状态 ===")
	logger.Info("尝试获取工具列表...")

	// 如果 mcp-go 没有提供直接的方法，我们需要通过其他方式调试
	// 1. 检查工具是否成功添加
	// 2. 检查工具名称是否冲突
	// 3. 检查注册顺序

	logger.Info("=== 调试完成 ===")
}
