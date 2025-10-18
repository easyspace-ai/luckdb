package test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/mcp/protocol"
	"github.com/easyspace-ai/luckdb/server/internal/mcp/server"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMCPServer(t *testing.T) {
	// 创建测试配置
	config := &server.Config{
		Host:         "localhost",
		Port:         8081,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  120 * time.Second,
		EnableCORS:   true,
		EnableDebug:  true,
	}

	// 创建 MCP 服务器（用于测试配置）
	_ = server.NewMCPServer(config, nil)

	// 创建测试服务器
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 模拟 MCP 请求处理
		var req protocol.MCPRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// 处理初始化请求
		if req.Method == "initialize" {
			response := &protocol.InitializeResponse{
				ProtocolVersion: protocol.MCPVersion,
				Capabilities: protocol.ServerCapabilities{
					Tools: &protocol.ToolsCapability{
						ListChanged: true,
					},
				},
				ServerInfo: protocol.ServerInfo{
					Name:    "Test MCP Server",
					Version: "1.0.0",
				},
			}

			resp := protocol.NewMCPResponse(req.ID, response)
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		// 处理工具列表请求
		if req.Method == "tools/list" {
			tools := []protocol.Tool{
				{
					Name:        "test_tool",
					Description: "Test tool for unit testing",
					InputSchema: map[string]interface{}{
						"type": "object",
						"properties": map[string]interface{}{
							"message": map[string]interface{}{
								"type": "string",
							},
						},
					},
				},
			}

			resp := protocol.NewMCPResponse(req.ID, map[string]interface{}{
				"tools": tools,
			})
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(resp)
			return
		}

		// 未知方法
		resp := protocol.NewMCPErrorResponse(req.ID, protocol.ErrorCodeMethodNotFound, "Method not found", nil)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer testServer.Close()

	t.Run("Initialize Request", func(t *testing.T) {
		// 创建初始化请求
		initReq := &protocol.InitializeRequest{
			ProtocolVersion: protocol.MCPVersion,
			Capabilities:    protocol.ClientCapabilities{},
			ClientInfo: protocol.ClientInfo{
				Name:    "Test Client",
				Version: "1.0.0",
			},
		}

		req := protocol.NewMCPRequest("initialize", initReq)
		req.ID = "test-1"

		// 发送请求
		reqBody, err := json.Marshal(req)
		require.NoError(t, err)

		resp, err := http.Post(testServer.URL, "application/json", bytes.NewBuffer(reqBody))
		require.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// 解析响应
		var mcpResp protocol.MCPResponse
		err = json.NewDecoder(resp.Body).Decode(&mcpResp)
		require.NoError(t, err)

		assert.Equal(t, "2.0", mcpResp.JSONRPC)
		assert.Equal(t, "test-1", mcpResp.ID)
		assert.Nil(t, mcpResp.Error)

		// 验证响应内容
		result, ok := mcpResp.Result.(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, protocol.MCPVersion, result["protocolVersion"])
	})

	t.Run("Tools List Request", func(t *testing.T) {
		// 创建工具列表请求
		req := protocol.NewMCPRequest("tools/list", nil)
		req.ID = "test-2"

		// 发送请求
		reqBody, err := json.Marshal(req)
		require.NoError(t, err)

		resp, err := http.Post(testServer.URL, "application/json", bytes.NewBuffer(reqBody))
		require.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// 解析响应
		var mcpResp protocol.MCPResponse
		err = json.NewDecoder(resp.Body).Decode(&mcpResp)
		require.NoError(t, err)

		assert.Equal(t, "2.0", mcpResp.JSONRPC)
		assert.Equal(t, "test-2", mcpResp.ID)
		assert.Nil(t, mcpResp.Error)

		// 验证工具列表
		result, ok := mcpResp.Result.(map[string]interface{})
		require.True(t, ok)

		tools, ok := result["tools"].([]interface{})
		require.True(t, ok)
		assert.Len(t, tools, 1)

		tool, ok := tools[0].(map[string]interface{})
		require.True(t, ok)
		assert.Equal(t, "test_tool", tool["name"])
	})

	t.Run("Invalid Method Request", func(t *testing.T) {
		// 创建无效方法请求
		req := protocol.NewMCPRequest("invalid_method", nil)
		req.ID = "test-3"

		// 发送请求
		reqBody, err := json.Marshal(req)
		require.NoError(t, err)

		resp, err := http.Post(testServer.URL, "application/json", bytes.NewBuffer(reqBody))
		require.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		// 解析响应
		var mcpResp protocol.MCPResponse
		err = json.NewDecoder(resp.Body).Decode(&mcpResp)
		require.NoError(t, err)

		assert.Equal(t, "2.0", mcpResp.JSONRPC)
		assert.Equal(t, "test-3", mcpResp.ID)
		assert.NotNil(t, mcpResp.Error)
		assert.Equal(t, protocol.ErrorCodeMethodNotFound, mcpResp.Error.Code)
	})
}

func TestMCPProtocol(t *testing.T) {
	t.Run("MCP Request JSON Serialization", func(t *testing.T) {
		req := protocol.NewMCPRequest("test_method", map[string]interface{}{
			"param1": "value1",
			"param2": 123,
		})
		req.ID = "test-id"

		// 序列化
		jsonData, err := req.ToJSON()
		require.NoError(t, err)

		// 反序列化
		var newReq protocol.MCPRequest
		err = newReq.FromJSON(jsonData)
		require.NoError(t, err)

		assert.Equal(t, req.JSONRPC, newReq.JSONRPC)
		assert.Equal(t, req.ID, newReq.ID)
		assert.Equal(t, req.Method, newReq.Method)
	})

	t.Run("MCP Response JSON Serialization", func(t *testing.T) {
		resp := protocol.NewMCPResponse("test-id", map[string]interface{}{
			"result": "success",
		})

		// 序列化
		jsonData, err := resp.ToJSON()
		require.NoError(t, err)

		// 反序列化
		var newResp protocol.MCPResponse
		err = newResp.FromJSON(jsonData)
		require.NoError(t, err)

		assert.Equal(t, resp.JSONRPC, newResp.JSONRPC)
		assert.Equal(t, resp.ID, newResp.ID)
		assert.Equal(t, resp.Result, newResp.Result)
	})

	t.Run("MCP Error Response", func(t *testing.T) {
		errorResp := protocol.NewMCPErrorResponse("test-id", protocol.ErrorCodeInvalidParams, "Invalid parameters", map[string]string{
			"field": "test_field",
		})

		// 序列化
		jsonData, err := errorResp.ToJSON()
		require.NoError(t, err)

		// 反序列化
		var newResp protocol.MCPResponse
		err = newResp.FromJSON(jsonData)
		require.NoError(t, err)

		assert.Equal(t, errorResp.JSONRPC, newResp.JSONRPC)
		assert.Equal(t, errorResp.ID, newResp.ID)
		assert.NotNil(t, newResp.Error)
		assert.Equal(t, protocol.ErrorCodeInvalidParams, newResp.Error.Code)
		assert.Equal(t, "Invalid parameters", newResp.Error.Message)
	})
}

func TestMCPHandler(t *testing.T) {
	// 创建路由器
	router := protocol.NewRouter()

	// 注册测试处理器
	router.Register("test_method", func(ctx context.Context, params interface{}) (interface{}, error) {
		return map[string]interface{}{
			"message": "test response",
		}, nil
	})

	router.Register("error_method", func(ctx context.Context, params interface{}) (interface{}, error) {
		return nil, protocol.NewMCPError(protocol.ErrorCodeInternalError, "Test error", nil)
	})

	t.Run("Valid Method Call", func(t *testing.T) {
		req := &protocol.MCPRequest{
			JSONRPC: "2.0",
			ID:      "test-1",
			Method:  "test_method",
			Params:  map[string]interface{}{"param": "value"},
		}

		resp, err := router.Handle(context.Background(), req)
		require.NoError(t, err)

		assert.Equal(t, "2.0", resp.JSONRPC)
		assert.Equal(t, "test-1", resp.ID)
		assert.Nil(t, resp.Error)
		assert.NotNil(t, resp.Result)
	})

	t.Run("Invalid Method Call", func(t *testing.T) {
		req := &protocol.MCPRequest{
			JSONRPC: "2.0",
			ID:      "test-2",
			Method:  "invalid_method",
			Params:  nil,
		}

		resp, err := router.Handle(context.Background(), req)
		require.NoError(t, err)

		assert.Equal(t, "2.0", resp.JSONRPC)
		assert.Equal(t, "test-2", resp.ID)
		assert.NotNil(t, resp.Error)
		assert.Equal(t, protocol.ErrorCodeMethodNotFound, resp.Error.Code)
	})

	t.Run("Handler Error", func(t *testing.T) {
		req := &protocol.MCPRequest{
			JSONRPC: "2.0",
			ID:      "test-3",
			Method:  "error_method",
			Params:  nil,
		}

		resp, err := router.Handle(context.Background(), req)
		require.NoError(t, err)

		assert.Equal(t, "2.0", resp.JSONRPC)
		assert.Equal(t, "test-3", resp.ID)
		assert.NotNil(t, resp.Error)
		assert.Equal(t, protocol.ErrorCodeInternalError, resp.Error.Code)
	})
}
