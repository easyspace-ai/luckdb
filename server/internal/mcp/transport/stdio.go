package transport

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"

	"go.uber.org/zap"

	"github.com/easyspace-ai/luckdb/server/internal/mcp"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RunStdioServer 运行stdio模式的MCP Server
func RunStdioServer(ctx context.Context, mcpServer *mcp.Server) error {
	logger.Info("MCP Server listening on stdio")

	// 获取底层的 mcp-go server
	server := mcpServer.MCPServer()

	// 创建 stdin 读取器
	scanner := bufio.NewScanner(os.Stdin)

	// 增加缓冲区大小以处理大请求
	const maxCapacity = 1024 * 1024 // 1MB
	buf := make([]byte, maxCapacity)
	scanner.Buffer(buf, maxCapacity)

	logger.Info("✅ Stdio transport initialized, ready to process messages")

	// 创建消息处理通道
	messageChan := make(chan string, 10)
	errorChan := make(chan error, 1)

	// 启动 stdin 读取协程
	go func() {
		for scanner.Scan() {
			line := scanner.Text()
			if line != "" {
				messageChan <- line
			}
		}
		if err := scanner.Err(); err != nil {
			errorChan <- err
		}
		close(messageChan)
	}()

	// 主消息循环
	for {
		select {
		case <-ctx.Done():
			logger.Info("Stdio server stopping...")
			return nil

		case err := <-errorChan:
			logger.Error("Stdin read error", zap.Error(err))
			return err

		case line, ok := <-messageChan:
			if !ok {
				logger.Info("Stdin closed, shutting down")
				return nil
			}

			// 处理 JSON-RPC 请求
			if err := handleStdioMessage(server, line); err != nil {
				logger.Error("Failed to handle message", zap.Error(err))
				// 继续处理下一个消息，不终止服务器
			}
		}
	}
}

// handleStdioMessage 处理单个 stdio 消息
func handleStdioMessage(server interface{}, message string) error {
	// 解析 JSON-RPC 请求
	var request map[string]interface{}
	if err := json.Unmarshal([]byte(message), &request); err != nil {
		return sendError(-32700, "Parse error", nil, nil)
	}

	// 记录请求
	method, _ := request["method"].(string)
	id := request["id"]

	logger.Debug("Received JSON-RPC request",
		logger.String("method", method),
		logger.Any("id", id),
	)

	// 根据方法类型处理
	switch method {
	case "initialize":
		return handleInitialize(request)
	case "tools/list":
		return handleToolsList(server, request)
	case "tools/call":
		return handleToolCall(server, request)
	case "resources/list":
		return handleResourcesList(request)
	case "prompts/list":
		return handlePromptsList(request)
	default:
		return sendError(-32601, "Method not found", method, id)
	}
}

// handleInitialize 处理初始化请求
func handleInitialize(request map[string]interface{}) error {
	id := request["id"]

	response := map[string]interface{}{
		"jsonrpc": "2.0",
		"result": map[string]interface{}{
			"protocolVersion": "2024-11-05",
			"capabilities": map[string]interface{}{
				"tools": map[string]bool{
					"listChanged": true,
				},
				"resources": map[string]bool{
					"subscribe":   true,
					"listChanged": true,
				},
				"prompts": map[string]bool{
					"listChanged": true,
				},
			},
			"serverInfo": map[string]interface{}{
				"name":    "EasyDB MCP Server",
				"version": "2.0.0",
			},
		},
		"id": id,
	}

	return sendResponse(response)
}

// handleToolsList 处理工具列表请求
func handleToolsList(server interface{}, request map[string]interface{}) error {
	id := request["id"]

	// 由于 mcp-go 库的限制，我们需要直接返回工具列表
	// 这里返回一个简化版本，实际工具列表由 HTTP 端点提供
	tools := []map[string]interface{}{
		{
			"name":        "list_spaces",
			"description": "列出所有空间",
			"inputSchema": map[string]interface{}{
				"type":       "object",
				"properties": map[string]interface{}{},
			},
		},
		// 提示：完整的工具列表通过 HTTP 端点访问
	}

	response := map[string]interface{}{
		"jsonrpc": "2.0",
		"result": map[string]interface{}{
			"tools": tools,
		},
		"id": id,
	}

	return sendResponse(response)
}

// handleToolCall 处理工具调用
func handleToolCall(server interface{}, request map[string]interface{}) error {
	id := request["id"]
	params, _ := request["params"].(map[string]interface{})
	toolName, _ := params["name"].(string)

	logger.Info("Tool call received",
		logger.String("tool", toolName),
	)

	// 返回提示信息
	response := map[string]interface{}{
		"jsonrpc": "2.0",
		"result": map[string]interface{}{
			"content": []map[string]interface{}{
				{
					"type": "text",
					"text": fmt.Sprintf("Tool %s is available via HTTP endpoint: http://localhost:8080/mcp", toolName),
				},
			},
		},
		"id": id,
	}

	return sendResponse(response)
}

// handleResourcesList 处理资源列表请求
func handleResourcesList(request map[string]interface{}) error {
	id := request["id"]

	response := map[string]interface{}{
		"jsonrpc": "2.0",
		"result": map[string]interface{}{
			"resources": []map[string]interface{}{},
		},
		"id": id,
	}

	return sendResponse(response)
}

// handlePromptsList 处理提示列表请求
func handlePromptsList(request map[string]interface{}) error {
	id := request["id"]

	response := map[string]interface{}{
		"jsonrpc": "2.0",
		"result": map[string]interface{}{
			"prompts": []map[string]interface{}{},
		},
		"id": id,
	}

	return sendResponse(response)
}

// sendResponse 发送响应到 stdout
func sendResponse(response map[string]interface{}) error {
	data, err := json.Marshal(response)
	if err != nil {
		return err
	}

	fmt.Println(string(data))
	return nil
}

// sendError 发送错误响应
func sendError(code int, message string, data interface{}, id interface{}) error {
	response := map[string]interface{}{
		"jsonrpc": "2.0",
		"error": map[string]interface{}{
			"code":    code,
			"message": message,
			"data":    data,
		},
		"id": id,
	}

	return sendResponse(response)
}

// getAuthTokenFromEnv 从环境变量获取认证Token
func getAuthTokenFromEnv() string {
	// 支持多种环境变量名称
	envVars := []string{
		"EASYDB_TOKEN",
		"EASYDB_MCP_TOKEN",
		"MCP_TOKEN",
		"TOKEN",
	}

	for _, envVar := range envVars {
		if token := os.Getenv(envVar); token != "" {
			logger.Debug("Found auth token in environment",
				logger.String("env_var", envVar),
			)
			return token
		}
	}

	return ""
}
