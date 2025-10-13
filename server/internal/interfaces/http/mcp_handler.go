package http

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	mcpgo "github.com/mark3labs/mcp-go/mcp"

	"github.com/easyspace-ai/luckdb/server/internal/mcp"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// MCPHandler MCP HTTP处理器
type MCPHandler struct {
	mcpServer  *mcp.Server
	sseClients *SSEClientManager
}

// NewMCPHandler 创建MCP处理器
func NewMCPHandler(mcpServer *mcp.Server) *MCPHandler {
	return &MCPHandler{
		mcpServer:  mcpServer,
		sseClients: NewSSEClientManager(),
	}
}

// MCPRequest MCP JSON-RPC请求
type MCPRequest struct {
	JSONRPC string      `json:"jsonrpc"`
	Method  string      `json:"method"`
	Params  interface{} `json:"params,omitempty"`
	ID      interface{} `json:"id"`
}

// MCPResponse MCP JSON-RPC响应
type MCPResponse struct {
	JSONRPC string      `json:"jsonrpc"`
	Result  interface{} `json:"result,omitempty"`
	Error   *MCPError   `json:"error,omitempty"`
	ID      interface{} `json:"id"`
}

// MCPError MCP错误
type MCPError struct {
	Code    int         `json:"code"`
	Message string      `json:"message"`
	Data    interface{} `json:"data,omitempty"`
}

// HandleHTTPRequest 处理HTTP POST请求
func (h *MCPHandler) HandleHTTPRequest(c *gin.Context) {
	var req MCPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, MCPResponse{
			JSONRPC: "2.0",
			Error: &MCPError{
				Code:    -32700,
				Message: "Parse error",
				Data:    err.Error(),
			},
			ID: nil,
		})
		return
	}

	logger.Info("MCP HTTP Request",
		logger.String("method", req.Method),
		logger.Any("params", req.Params),
		logger.Any("id", req.ID),
	)

	// 对于需要认证的方法，进行认证检查
	ctx := c.Request.Context()
	if h.requiresAuth(req.Method) {
		// 提取 Token
		token := h.extractToken(c)

		// 认证
		userID, err := h.mcpServer.Authenticate(ctx, token)
		if err != nil {
			logger.Warn("Authentication failed",
				logger.String("method", req.Method),
				logger.ErrorField(err),
			)
			c.JSON(http.StatusUnauthorized, MCPResponse{
				JSONRPC: "2.0",
				Error: &MCPError{
					Code:    -32001,
					Message: "Unauthorized",
					Data:    "Authentication required",
				},
				ID: req.ID,
			})
			return
		}

		// 将用户ID添加到上下文
		ctx = mcp.WithUserID(ctx, userID)
		logger.Debug("Request authenticated",
			logger.String("user_id", userID),
			logger.String("method", req.Method),
		)
	}

	// 处理请求
	response := h.handleMCPRequest(ctx, &req)
	c.JSON(http.StatusOK, response)
}

// HandleSSE 处理SSE连接
func (h *MCPHandler) HandleSSE(c *gin.Context) {
	// 设置SSE响应头
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")
	c.Header("Access-Control-Allow-Origin", "*")

	// 创建客户端
	clientID := uuid.New().String()
	_ = h.sseClients.AddClient(clientID, c.Writer)

	logger.Info("SSE client connected", logger.String("client_id", clientID))

	// 发送连接成功消息
	h.sendSSEEvent(c.Writer, "connected", map[string]interface{}{
		"client_id": clientID,
		"message":   "SSE connection established",
	})

	// 保持连接
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	// 监听客户端断开
	notify := c.Request.Context().Done()

	for {
		select {
		case <-notify:
			logger.Info("SSE client disconnected", logger.String("client_id", clientID))
			h.sseClients.RemoveClient(clientID)
			return
		case <-ticker.C:
			// 发送心跳
			h.sendSSEEvent(c.Writer, "ping", map[string]string{"status": "alive"})
		}
	}
}

// HandleSSEMessage 处理SSE消息请求
func (h *MCPHandler) HandleSSEMessage(c *gin.Context) {
	var req MCPRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	logger.Info("MCP SSE Message",
		logger.String("method", req.Method),
		logger.Any("id", req.ID),
	)

	// 处理请求
	response := h.handleMCPRequest(c.Request.Context(), &req)

	// 广播响应到所有SSE客户端
	h.sseClients.BroadcastMessage(response)

	c.JSON(http.StatusOK, gin.H{"status": "sent"})
}

// requiresAuth 判断方法是否需要认证
func (h *MCPHandler) requiresAuth(method string) bool {
	// 需要认证的方法列表
	authRequired := map[string]bool{
		"tools/call":     true,
		"resources/read": true,
		"prompts/get":    true,
	}
	return authRequired[method]
}

// extractToken 从请求中提取 Token
func (h *MCPHandler) extractToken(c *gin.Context) string {
	// 1. 从 Authorization header 提取
	authHeader := c.GetHeader("Authorization")
	if authHeader != "" {
		// 支持 "Bearer <token>" 格式
		if len(authHeader) > 7 && authHeader[:7] == "Bearer " {
			return authHeader[7:]
		}
		// 也支持直接的 token
		return authHeader
	}

	// 2. 从 X-MCP-Token header 提取
	mcpToken := c.GetHeader("X-MCP-Token")
	if mcpToken != "" {
		return mcpToken
	}

	// 3. 从 Query 参数提取（用于 SSE）
	token := c.Query("token")
	if token != "" {
		return token
	}

	return ""
}

// handleMCPRequest 处理MCP请求
func (h *MCPHandler) handleMCPRequest(ctx context.Context, req *MCPRequest) *MCPResponse {
	switch req.Method {
	case "initialize":
		return h.handleInitialize(req)
	case "tools/list":
		return h.handleToolsList(req)
	case "tools/call":
		return h.handleToolsCall(ctx, req)
	case "resources/list":
		return h.handleResourcesList(req)
	case "resources/read":
		return h.handleResourcesRead(ctx, req)
	case "prompts/list":
		return h.handlePromptsList(req)
	case "prompts/get":
		return h.handlePromptsGet(ctx, req)
	default:
		return &MCPResponse{
			JSONRPC: "2.0",
			Error: &MCPError{
				Code:    -32601,
				Message: "Method not found",
				Data:    req.Method,
			},
			ID: req.ID,
		}
	}
}

// handleInitialize 处理initialize请求
func (h *MCPHandler) handleInitialize(req *MCPRequest) *MCPResponse {
	return &MCPResponse{
		JSONRPC: "2.0",
		Result: map[string]interface{}{
			"protocolVersion": "2024-11-05",
			"capabilities": map[string]interface{}{
				"tools":     map[string]bool{"listChanged": true},
				"resources": map[string]bool{"subscribe": true, "listChanged": true},
				"prompts":   map[string]bool{"listChanged": true},
			},
			"serverInfo": map[string]string{
				"name":    "EasyDB MCP Server",
				"version": "2.0.0",
			},
		},
		ID: req.ID,
	}
}

// handleToolsList 处理tools/list请求
func (h *MCPHandler) handleToolsList(req *MCPRequest) *MCPResponse {
	// 从底层 MCP Server 获取实际的工具列表
	toolsMap := h.mcpServer.MCPServer().ListTools()

	// 转换为 MCP 协议格式
	tools := make([]map[string]interface{}, 0, len(toolsMap))
	for _, serverTool := range toolsMap {
		toolData := map[string]interface{}{
			"name":        serverTool.Tool.Name,
			"description": serverTool.Tool.Description,
			"inputSchema": serverTool.Tool.InputSchema,
		}
		tools = append(tools, toolData)
	}

	logger.Info("Listing tools", logger.Int("count", len(tools)))

	return &MCPResponse{
		JSONRPC: "2.0",
		Result: map[string]interface{}{
			"tools": tools,
		},
		ID: req.ID,
	}
}

// handleToolsCall 处理tools/call请求
func (h *MCPHandler) handleToolsCall(ctx context.Context, req *MCPRequest) *MCPResponse {
	params, ok := req.Params.(map[string]interface{})
	if !ok {
		return &MCPResponse{
			JSONRPC: "2.0",
			Error: &MCPError{
				Code:    -32602,
				Message: "Invalid params",
			},
			ID: req.ID,
		}
	}

	toolName, _ := params["name"].(string)
	arguments, _ := params["arguments"].(map[string]interface{})

	logger.Info("MCP Tool Call",
		logger.String("tool", toolName),
		logger.Any("arguments", arguments),
	)

	// 获取工具
	serverTool := h.mcpServer.MCPServer().GetTool(toolName)
	if serverTool == nil {
		return &MCPResponse{
			JSONRPC: "2.0",
			Error: &MCPError{
				Code:    -32602,
				Message: "Tool not found",
				Data:    toolName,
			},
			ID: req.ID,
		}
	}

	// 调用工具
	toolReq := mcpgo.CallToolRequest{
		Params: mcpgo.CallToolParams{
			Name:      toolName,
			Arguments: arguments,
		},
	}

	result, err := serverTool.Handler(ctx, toolReq)
	if err != nil {
		logger.Error("Tool call failed",
			logger.String("tool", toolName),
			logger.ErrorField(err),
		)
		return &MCPResponse{
			JSONRPC: "2.0",
			Error: &MCPError{
				Code:    -32603,
				Message: "Tool execution failed",
				Data:    err.Error(),
			},
			ID: req.ID,
		}
	}

	// 转换结果为响应格式
	resultData := map[string]interface{}{
		"content": result.Content,
	}
	if result.IsError {
		resultData["isError"] = true
	}

	return &MCPResponse{
		JSONRPC: "2.0",
		Result:  resultData,
		ID:      req.ID,
	}
}

// handleResourcesList 处理resources/list请求
func (h *MCPHandler) handleResourcesList(req *MCPRequest) *MCPResponse {
	return &MCPResponse{
		JSONRPC: "2.0",
		Result: map[string]interface{}{
			"resources": []interface{}{},
		},
		ID: req.ID,
	}
}

// handleResourcesRead 处理resources/read请求
func (h *MCPHandler) handleResourcesRead(ctx context.Context, req *MCPRequest) *MCPResponse {
	return &MCPResponse{
		JSONRPC: "2.0",
		Error: &MCPError{
			Code:    -32601,
			Message: "Not implemented",
		},
		ID: req.ID,
	}
}

// handlePromptsList 处理prompts/list请求
func (h *MCPHandler) handlePromptsList(req *MCPRequest) *MCPResponse {
	return &MCPResponse{
		JSONRPC: "2.0",
		Result: map[string]interface{}{
			"prompts": []interface{}{},
		},
		ID: req.ID,
	}
}

// handlePromptsGet 处理prompts/get请求
func (h *MCPHandler) handlePromptsGet(ctx context.Context, req *MCPRequest) *MCPResponse {
	return &MCPResponse{
		JSONRPC: "2.0",
		Error: &MCPError{
			Code:    -32601,
			Message: "Not implemented",
		},
		ID: req.ID,
	}
}

// sendSSEEvent 发送SSE事件
func (h *MCPHandler) sendSSEEvent(w gin.ResponseWriter, event string, data interface{}) {
	dataBytes, _ := json.Marshal(data)
	fmt.Fprintf(w, "event: %s\ndata: %s\n\n", event, string(dataBytes))
	w.(http.Flusher).Flush()
}

// SSEClient SSE客户端
type SSEClient struct {
	ID     string
	Writer gin.ResponseWriter
}

// SSEClientManager SSE客户端管理器
type SSEClientManager struct {
	clients map[string]*SSEClient
	mu      sync.RWMutex
}

// NewSSEClientManager 创建SSE客户端管理器
func NewSSEClientManager() *SSEClientManager {
	return &SSEClientManager{
		clients: make(map[string]*SSEClient),
	}
}

// AddClient 添加客户端
func (m *SSEClientManager) AddClient(id string, writer gin.ResponseWriter) *SSEClient {
	m.mu.Lock()
	defer m.mu.Unlock()

	client := &SSEClient{
		ID:     id,
		Writer: writer,
	}
	m.clients[id] = client
	return client
}

// RemoveClient 移除客户端
func (m *SSEClientManager) RemoveClient(id string) {
	m.mu.Lock()
	defer m.mu.Unlock()
	delete(m.clients, id)
}

// BroadcastMessage 广播消息
func (m *SSEClientManager) BroadcastMessage(message interface{}) {
	m.mu.RLock()
	defer m.mu.RUnlock()

	dataBytes, _ := json.Marshal(message)
	eventData := fmt.Sprintf("event: message\ndata: %s\n\n", string(dataBytes))

	for _, client := range m.clients {
		io.WriteString(client.Writer, eventData)
		client.Writer.(http.Flusher).Flush()
	}
}
