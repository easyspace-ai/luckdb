package mcp

import (
	"context"
	"fmt"

	"github.com/mark3labs/mcp-go/server"

	"github.com/easyspace-ai/luckdb/server/internal/container"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/prompts"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/resources"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/tools"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// Server MCP服务器封装
type Server struct {
	mcpServer     *server.MCPServer
	config        *Config
	authenticator *Authenticator
	container     *container.Container
	transport     string // "stdio" or "http"
}

// NewServer 创建MCP服务器
func NewServer(cont *container.Container, config *Config, transport string) (*Server, error) {
	// 创建MCP Server实例
	mcpServer := server.NewMCPServer(
		"EasyDB MCP Server",
		"1.0.0",
		server.WithToolCapabilities(config.Features.EnableTools),
		server.WithResourceCapabilities(config.Features.EnableResources, true), // subscribe = true
		server.WithPromptCapabilities(config.Features.EnablePrompts),
	)

	// 创建认证器
	authenticator := NewAuthenticator(
		cont.TokenService(),
		cont.MCPTokenRepo(),
		cont.UserRepo(),
		config,
	)

	s := &Server{
		mcpServer:     mcpServer,
		config:        config,
		authenticator: authenticator,
		container:     cont,
		transport:     transport,
	}

	// 注册工具、资源和提示
	if err := s.registerTools(); err != nil {
		return nil, fmt.Errorf("failed to register tools: %w", err)
	}

	if config.Features.EnableResources {
		if err := s.registerResources(); err != nil {
			return nil, fmt.Errorf("failed to register resources: %w", err)
		}
	}

	if config.Features.EnablePrompts {
		if err := s.registerPrompts(); err != nil {
			return nil, fmt.Errorf("failed to register prompts: %w", err)
		}
	}

	return s, nil
}

// MCPServer 获取底层MCP服务器实例
func (s *Server) MCPServer() *server.MCPServer {
	return s.mcpServer
}

// Authenticate 认证请求
func (s *Server) Authenticate(ctx context.Context, token string) (string, error) {
	// 添加传输方式到上下文
	ctx = WithTransport(ctx, s.transport)
	return s.authenticator.Authenticate(ctx, token)
}

// registerTools 注册所有工具
func (s *Server) registerTools() error {
	logger.Info("Registering MCP tools...")

	// 注册Space工具
	if err := s.registerSpaceTools(); err != nil {
		return fmt.Errorf("failed to register space tools: %w", err)
	}

	// 注册Base工具
	if err := s.registerBaseTools(); err != nil {
		return fmt.Errorf("failed to register base tools: %w", err)
	}

	// 注册Table工具
	if err := s.registerTableTools(); err != nil {
		return fmt.Errorf("failed to register table tools: %w", err)
	}

	// 注册Field工具
	if err := s.registerFieldTools(); err != nil {
		return fmt.Errorf("failed to register field tools: %w", err)
	}

	// 注册Record工具
	if err := s.registerRecordTools(); err != nil {
		return fmt.Errorf("failed to register record tools: %w", err)
	}

	// 注册View工具
	if err := s.registerViewTools(); err != nil {
		return fmt.Errorf("failed to register view tools: %w", err)
	}

	// 注册User工具
	if err := s.registerUserTools(); err != nil {
		return fmt.Errorf("failed to register user tools: %w", err)
	}

	logger.Info("MCP tools registered successfully")

	// 调试：尝试验证工具注册
	logger.Info("=== 验证工具注册 ===")
	// 注意：mcp-go 可能不提供直接的工具列表方法
	// 我们需要通过实际调用 tools/list 来验证

	return nil
}

// registerResources 注册资源
func (s *Server) registerResources() error {
	return resources.RegisterResources(
		s.mcpServer,
		s.container.SpaceService(),
		s.container.BaseService(),
		s.container.TableService(),
		s.container.RecordService(),
		s.container.ViewService(),
		s.container.FieldService(),
	)
}

// registerPrompts 注册提示
func (s *Server) registerPrompts() error {
	return prompts.RegisterPrompts(s.mcpServer)
}

// WithAuthContext 创建带认证的上下文
func (s *Server) WithAuthContext(ctx context.Context, token string) (context.Context, error) {
	userID, err := s.Authenticate(ctx, token)
	if err != nil {
		return nil, err
	}

	// 添加用户ID到上下文
	ctx = WithUserID(ctx, userID)
	ctx = WithToken(ctx, token)
	ctx = WithTransport(ctx, s.transport)

	return ctx, nil
}

// Tool注册的辅助方法
func (s *Server) registerSpaceTools() error {
	// 导入tools包并调用注册函数
	// 注意：实际导入在文件顶部
	return tools.RegisterSpaceTools(s.mcpServer, s.container.SpaceService())
}

func (s *Server) registerBaseTools() error {
	return tools.RegisterBaseTools(s.mcpServer, s.container.BaseService())
}

func (s *Server) registerTableTools() error {
	return tools.RegisterTableTools(s.mcpServer, s.container.TableService())
}

func (s *Server) registerFieldTools() error {
	return tools.RegisterFieldTools(s.mcpServer, s.container.FieldService())
}

func (s *Server) registerRecordTools() error {
	return tools.RegisterRecordTools(s.mcpServer, s.container.RecordService())
}

func (s *Server) registerViewTools() error {
	return tools.RegisterViewTools(s.mcpServer, s.container.ViewService())
}

func (s *Server) registerUserTools() error {
	return tools.RegisterUserTools(s.mcpServer, s.container.UserService(), s.container.AuthService())
}

// Note: HandleToolCall 将在tool handlers中通过AddTool自动处理
// mcp-go会自动路由工具调用到对应的handler
