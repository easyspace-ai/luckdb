package registry

import (
	"context"
	"fmt"
	"sync"

	"github.com/mark3labs/mcp-go/mcp"
	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// ToolHandler 工具处理函数类型
type ToolHandler func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error)

// ToolDefinition 工具定义
type ToolDefinition struct {
	Name        string
	Description string
	Handler     ToolHandler
	Options     []mcp.ToolOption
}

// ToolRegistry 工具注册器
type ToolRegistry struct {
	tools     map[string]*ToolDefinition
	mu        sync.RWMutex
	mcpServer *server.MCPServer
}

// NewToolRegistry 创建工具注册器
func NewToolRegistry(mcpServer *server.MCPServer) *ToolRegistry {
	return &ToolRegistry{
		tools:     make(map[string]*ToolDefinition),
		mcpServer: mcpServer,
	}
}

// Register 注册工具
func (r *ToolRegistry) Register(tool *ToolDefinition) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	if tool.Name == "" {
		return fmt.Errorf("tool name cannot be empty")
	}

	if _, exists := r.tools[tool.Name]; exists {
		return fmt.Errorf("tool %s already registered", tool.Name)
	}

	// 构建工具选项
	options := []mcp.ToolOption{
		mcp.WithDescription(tool.Description),
	}
	options = append(options, tool.Options...)

	// 类型转换：将我们的 ToolHandler 包装成 mcp-go 的 ToolHandlerFunc
	handler := func(ctx context.Context, req mcp.CallToolRequest) (*mcp.CallToolResult, error) {
		return tool.Handler(ctx, req)
	}

	// 注册到MCP服务器
	r.mcpServer.AddTool(
		mcp.NewTool(tool.Name, options...),
		handler,
	)

	r.tools[tool.Name] = tool
	logger.Info("Tool registered", logger.String("name", tool.Name))

	return nil
}

// RegisterBatch 批量注册工具
func (r *ToolRegistry) RegisterBatch(tools []*ToolDefinition) error {
	for _, tool := range tools {
		if err := r.Register(tool); err != nil {
			return fmt.Errorf("failed to register tool %s: %w", tool.Name, err)
		}
	}
	return nil
}

// GetTool 获取工具定义
func (r *ToolRegistry) GetTool(name string) (*ToolDefinition, bool) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	tool, exists := r.tools[name]
	return tool, exists
}

// ListTools 列出所有已注册的工具
func (r *ToolRegistry) ListTools() []string {
	r.mu.RLock()
	defer r.mu.RUnlock()

	names := make([]string, 0, len(r.tools))
	for name := range r.tools {
		names = append(names, name)
	}
	return names
}

// Count 返回已注册工具数量
func (r *ToolRegistry) Count() int {
	r.mu.RLock()
	defer r.mu.RUnlock()
	return len(r.tools)
}

// ToolBuilder 工具构建器
type ToolBuilder struct {
	def *ToolDefinition
}

// NewToolBuilder 创建工具构建器
func NewToolBuilder(name string) *ToolBuilder {
	return &ToolBuilder{
		def: &ToolDefinition{
			Name:    name,
			Options: make([]mcp.ToolOption, 0),
		},
	}
}

// WithDescription 设置描述
func (b *ToolBuilder) WithDescription(desc string) *ToolBuilder {
	b.def.Description = desc
	return b
}

// WithStringArg 添加字符串参数
func (b *ToolBuilder) WithStringArg(name string, opts ...mcp.PropertyOption) *ToolBuilder {
	b.def.Options = append(b.def.Options, mcp.WithString(name, opts...))
	return b
}

// WithNumberArg 添加数字参数
func (b *ToolBuilder) WithNumberArg(name string, opts ...mcp.PropertyOption) *ToolBuilder {
	b.def.Options = append(b.def.Options, mcp.WithNumber(name, opts...))
	return b
}

// WithBooleanArg 添加布尔参数
func (b *ToolBuilder) WithBooleanArg(name string, opts ...mcp.PropertyOption) *ToolBuilder {
	b.def.Options = append(b.def.Options, mcp.WithBoolean(name, opts...))
	return b
}

// WithObjectArg 添加对象参数
func (b *ToolBuilder) WithObjectArg(name string, opts ...mcp.PropertyOption) *ToolBuilder {
	b.def.Options = append(b.def.Options, mcp.WithObject(name, opts...))
	return b
}

// WithArrayArg 添加数组参数
func (b *ToolBuilder) WithArrayArg(name string, opts ...mcp.PropertyOption) *ToolBuilder {
	b.def.Options = append(b.def.Options, mcp.WithArray(name, opts...))
	return b
}

// WithHandler 设置处理器
func (b *ToolBuilder) WithHandler(handler ToolHandler) *ToolBuilder {
	b.def.Handler = handler
	return b
}

// Build 构建工具定义
func (b *ToolBuilder) Build() *ToolDefinition {
	return b.def
}
