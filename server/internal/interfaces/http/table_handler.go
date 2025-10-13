package http

import (
	"github.com/gin-gonic/gin"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/response"
)

// TableHandler 表格HTTP处理器
type TableHandler struct {
	tableService *application.TableService
}

// NewTableHandler 创建表格处理器
func NewTableHandler(tableService *application.TableService) *TableHandler {
	return &TableHandler{
		tableService: tableService,
	}
}

// CreateTable 创建表格
func (h *TableHandler) CreateTable(c *gin.Context) {
	var req dto.CreateTableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized.WithDetails("未授权"))
		return
	}

	resp, err := h.tableService.CreateTable(c.Request.Context(), req, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, resp, "创建表格成功")
}

// GetTable 获取表格详情
func (h *TableHandler) GetTable(c *gin.Context) {
	tableID := c.Param("tableId")

	resp, err := h.tableService.GetTable(c.Request.Context(), tableID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, resp, "获取表格成功")
}

// UpdateTable 更新表格
func (h *TableHandler) UpdateTable(c *gin.Context) {
	tableID := c.Param("tableId")

	var req dto.UpdateTableRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
		return
	}

	resp, err := h.tableService.UpdateTable(c.Request.Context(), tableID, req)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, resp, "更新表格成功")
}

// DeleteTable 删除表格
func (h *TableHandler) DeleteTable(c *gin.Context) {
	tableID := c.Param("tableId")

	if err := h.tableService.DeleteTable(c.Request.Context(), tableID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil, "删除表格成功")
}

// ListTables 列出Base下的所有表格
func (h *TableHandler) ListTables(c *gin.Context) {
	baseID := c.Param("baseId")

	resp, err := h.tableService.ListTables(c.Request.Context(), baseID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, resp, "获取表格列表成功")
}
