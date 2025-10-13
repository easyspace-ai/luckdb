package http

import (
	"github.com/gin-gonic/gin"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/pkg/response"
)

// MCPTokenHandler MCP Token处理器
type MCPTokenHandler struct {
	tokenService *application.MCPTokenService
}

// NewMCPTokenHandler 创建MCP Token处理器
func NewMCPTokenHandler(tokenService *application.MCPTokenService) *MCPTokenHandler {
	return &MCPTokenHandler{
		tokenService: tokenService,
	}
}

// CreateToken 创建MCP Token
func (h *MCPTokenHandler) CreateToken(c *gin.Context) {
	var req dto.CreateMCPTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, err)
		return
	}

	userID := c.GetString("user_id")
	token, err := h.tokenService.CreateToken(c.Request.Context(), userID, req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, token, "创建Token成功")
}

// ListTokens 列出所有Token
func (h *MCPTokenHandler) ListTokens(c *gin.Context) {
	userID := c.GetString("user_id")
	tokens, err := h.tokenService.ListTokens(c.Request.Context(), userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, tokens, "获取Token列表成功")
}

// GetToken 获取Token详情
func (h *MCPTokenHandler) GetToken(c *gin.Context) {
	tokenID := c.Param("id")
	userID := c.GetString("user_id")

	token, err := h.tokenService.GetToken(c.Request.Context(), userID, tokenID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, token, "获取Token成功")
}

// UpdateToken 更新Token
func (h *MCPTokenHandler) UpdateToken(c *gin.Context) {
	tokenID := c.Param("id")
	userID := c.GetString("user_id")

	var req dto.UpdateMCPTokenRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, err)
		return
	}

	token, err := h.tokenService.UpdateToken(c.Request.Context(), userID, tokenID, req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, token, "更新Token成功")
}

// DeleteToken 删除Token
func (h *MCPTokenHandler) DeleteToken(c *gin.Context) {
	tokenID := c.Param("id")
	userID := c.GetString("user_id")

	if err := h.tokenService.DeleteToken(c.Request.Context(), userID, tokenID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil, "删除Token成功")
}
