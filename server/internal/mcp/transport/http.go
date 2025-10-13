package transport

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/easyspace-ai/luckdb/server/internal/mcp"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RunHTTPServer 运行HTTP模式的MCP Server
func RunHTTPServer(ctx context.Context, mcpServer *mcp.Server, config *mcp.Config, version string) error {
	// 设置Gin模式
	gin.SetMode(gin.ReleaseMode)

	router := gin.New()
	router.Use(gin.Recovery())

	// CORS 中间件
	if len(config.HTTP.CORSOrigins) > 0 {
		router.Use(corsMiddleware(config.HTTP.CORSOrigins))
	}

	// 日志中间件
	router.Use(func(c *gin.Context) {
		start := time.Now()
		path := c.Request.URL.Path

		c.Next()

		logger.Info("HTTP Request",
			logger.String("method", c.Request.Method),
			logger.String("path", path),
			logger.Int("status", c.Writer.Status()),
			logger.String("duration", time.Since(start).String()),
		)
	})

	// 健康检查
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "easydb-mcp",
			"version": version,
		})
	})

	// MCP 端点
	setupMCPRoutes(router, mcpServer)

	// 创建 HTTP 服务器
	addr := fmt.Sprintf("%s:%d", config.HTTP.Host, config.HTTP.Port)
	srv := &http.Server{
		Addr:           addr,
		Handler:        router,
		ReadTimeout:    30 * time.Second,
		WriteTimeout:   30 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	// 启动服务器
	go func() {
		logger.Info("MCP HTTP Server listening",
			logger.String("address", addr),
		)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("HTTP server error", logger.ErrorField(err))
		}
	}()

	// 等待上下文取消
	<-ctx.Done()

	// 优雅关闭
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("Server shutdown error", logger.ErrorField(err))
		return err
	}

	logger.Info("HTTP server stopped gracefully")
	return nil
}

// setupMCPRoutes 设置MCP路由
func setupMCPRoutes(router *gin.Engine, mcpServer *mcp.Server) {
	// MCP 路由组
	mcpGroup := router.Group("/mcp")
	{
		// TODO: 实现 HTTP/SSE transport
		// 目前 mcp-go 主要支持 stdio transport
		// HTTP/SSE transport 需要根据MCP协议手动实现

		// 健康检查端点
		mcpGroup.GET("/ping", func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{
				"status": "ok",
				"server": "EasyDB MCP Server",
			})
		})

		// Placeholder: 实际的MCP endpoint需要根据协议实现
		logger.Info("MCP routes registered (HTTP/SSE transport TODO)")
	}
}

// corsMiddleware CORS中间件
func corsMiddleware(origins []string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 检查origin是否在允许列表中
		origin := c.Request.Header.Get("Origin")
		allowed := false

		for _, allowedOrigin := range origins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}

		if allowed {
			if origin != "" {
				c.Writer.Header().Set("Access-Control-Allow-Origin", origin)
			} else {
				c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
			}
			c.Writer.Header().Set("Access-Control-Allow-Credentials", "true")
			c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
			c.Writer.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS, GET, PUT, DELETE, PATCH")
		}

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
