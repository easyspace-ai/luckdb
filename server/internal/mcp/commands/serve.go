package commands

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/spf13/cobra"

	"github.com/easyspace-ai/luckdb/server/internal/config"
	"github.com/easyspace-ai/luckdb/server/internal/container"
	"github.com/easyspace-ai/luckdb/server/internal/mcp"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/transport"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

var (
	// Transport 传输方式：stdio 或 http
	Transport string

	// ConfigPath 配置文件路径
	ConfigPath string

	// Version 版本号
	Version = "1.0.0"
)

// NewServeCmd 创建serve命令
func NewServeCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "serve",
		Short: "启动 MCP Server",
		Long: `启动 EasyDB MCP Server。

支持两种传输方式：
  - stdio: 用于 Claude Desktop 等本地应用（默认）
  - http: 用于远程访问（HTTP/SSE）

示例：
  # stdio 模式（Claude Desktop）
  easydb-mcp serve --transport=stdio

  # HTTP 模式（远程访问）
  easydb-mcp serve --transport=http --config=config.yaml
`,
		RunE: runServe,
	}

	cmd.Flags().StringVarP(&Transport, "transport", "t", "stdio", "传输方式：stdio 或 http")

	return cmd
}

// runServe 运行 MCP Server
func runServe(cmd *cobra.Command, args []string) error {
	// 初始化日志
	if err := initLogger(); err != nil {
		return fmt.Errorf("初始化日志失败: %w", err)
	}

	logger.Info("Starting EasyDB MCP Server",
		logger.String("version", Version),
		logger.String("transport", Transport),
		logger.String("config", ConfigPath),
	)

	// 加载配置
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("加载配置失败: %w", err)
	}

	// 创建依赖注入容器
	cont := container.NewContainer(cfg)

	// 初始化容器
	if err := cont.Initialize(); err != nil {
		return fmt.Errorf("初始化容器失败: %w", err)
	}
	defer cont.Close()

	// 创建 MCP 配置
	mcpConfig := &mcp.Config{
		DefaultUserID: cfg.MCP.DefaultUserID,
		HTTP: mcp.HTTPConfig{
			Enabled:     cfg.MCP.HTTP.Enabled,
			Port:        cfg.MCP.HTTP.Port,
			Host:        cfg.MCP.HTTP.Host,
			CORSOrigins: cfg.MCP.HTTP.CORSOrigins,
		},
		Features: mcp.FeaturesConfig{
			EnableTools:     cfg.MCP.Features.EnableTools,
			EnableResources: cfg.MCP.Features.EnableResources,
			EnablePrompts:   cfg.MCP.Features.EnablePrompts,
		},
		RateLimit: mcp.RateLimitConfig{
			Enabled:           cfg.MCP.RateLimit.Enabled,
			RequestsPerMinute: cfg.MCP.RateLimit.RequestsPerMinute,
		},
		Logging: mcp.LoggingConfig{
			Enabled:      cfg.MCP.Logging.Enabled,
			LogToolCalls: cfg.MCP.Logging.LogToolCalls,
		},
	}

	// 创建 MCP Server
	mcpServer, err := mcp.NewServer(cont, mcpConfig, Transport)
	if err != nil {
		return fmt.Errorf("创建 MCP Server 失败: %w", err)
	}

	logger.Info("MCP Server created successfully",
		logger.String("transport", Transport),
	)

	// 根据传输方式启动服务器
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// 监听信号
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	// 启动服务器
	errChan := make(chan error, 1)

	switch Transport {
	case "stdio":
		go func() {
			logger.Info("Starting MCP Server in stdio mode")
			errChan <- transport.RunStdioServer(ctx, mcpServer)
		}()
	case "http":
		go func() {
			logger.Info("Starting MCP Server in HTTP mode",
				logger.Int("port", mcpConfig.HTTP.Port),
			)
			errChan <- transport.RunHTTPServer(ctx, mcpServer, mcpConfig, Version)
		}()
	default:
		return fmt.Errorf("不支持的传输方式: %s", Transport)
	}

	// 等待信号或错误
	select {
	case err := <-errChan:
		if err != nil {
			logger.Error("MCP Server error", logger.ErrorField(err))
			return err
		}
	case sig := <-sigChan:
		logger.Info("Received signal, shutting down",
			logger.String("signal", sig.String()),
		)
		cancel()
	}

	logger.Info("MCP Server stopped")
	return nil
}
