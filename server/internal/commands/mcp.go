package commands

import (
	"github.com/spf13/cobra"

	mcpCommands "github.com/easyspace-ai/luckdb/server/internal/mcp/commands"
)

// NewMCPCmd 创建MCP命令
func NewMCPCmd(configPath *string, version string) *cobra.Command {
	cmd := &cobra.Command{
		Use:   "mcp",
		Short: "MCP (Model Context Protocol) 服务器",
		Long: `启动和管理 MCP (Model Context Protocol) 服务器

MCP 服务器为 AI 应用（如 Claude Desktop）提供对 LuckDB 的访问能力。
支持两种传输方式：
  - stdio: 用于本地 AI 应用（Claude Desktop）
  - http: 用于远程访问（HTTP/SSE）

支持两种认证方式：
  - JWT Token: 使用现有的用户认证
  - MCP Token: 专用的 MCP API Token`,
		Example: `  # stdio 模式（Claude Desktop）
  luckdb mcp serve --transport=stdio
  
  # HTTP 模式（远程访问）
  luckdb mcp serve --transport=http
  
  # 创建 MCP Token
  luckdb mcp token create --user-id <user_id> --name "Claude Desktop"
  
  # 列出 MCP Tokens
  luckdb mcp token list --user-id <user_id>
  
  # 撤销 MCP Token
  luckdb mcp token revoke <token_id>`,
	}

	// 设置版本
	mcpCommands.Version = version
	mcpCommands.ConfigPath = *configPath

	// 添加子命令（使用 internal/mcp/commands 中已实现的命令）
	cmd.AddCommand(mcpCommands.NewServeCmd())
	cmd.AddCommand(mcpCommands.NewTokenCmd())

	return cmd
}
