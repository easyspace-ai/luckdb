package dto

import (
	"time"

	tableEntity "github.com/easyspace-ai/luckdb/server/internal/domain/table/entity"
)

// CreateTableRequest 创建表请求
type CreateTableRequest struct {
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
	BaseID      string `json:"baseId" binding:"required"` // ✅ 统一使用 camelCase
}

// UpdateTableRequest 更新表请求
type UpdateTableRequest struct {
	Name        *string `json:"name"`
	Description *string `json:"description"`
}

// TableListFilter 表列表过滤器
type TableListFilter struct {
	BaseID    *string    `json:"baseId"`
	Name      *string    `json:"name"`
	CreatedAt *time.Time `json:"createdAt"`
	Page      int        `json:"page"`
	PageSize  int        `json:"pageSize"`
	Offset    int        `json:"offset"`
	Limit     int        `json:"limit"`
}

// TableResponse 表响应
type TableResponse struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	BaseID      string    `json:"baseId"`
	FieldCount  int       `json:"fieldCount"`
	RecordCount int64     `json:"recordCount"`
	CreatedBy   string    `json:"createdBy"`
	UpdatedBy   string    `json:"updatedBy"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

// TableListResponse 表列表响应
type TableListResponse struct {
	Tables     []*TableResponse    `json:"tables"`
	Pagination *PaginationResponse `json:"pagination"`
}

// FromTableEntity 从Domain实体转换为DTO
func FromTableEntity(table *tableEntity.Table) *TableResponse {
	if table == nil {
		return nil
	}

	desc := ""
	if table.Description() != nil {
		desc = *table.Description()
	}

	// UpdatedBy 通常应该从操作上下文中获取
	// 如果没有专门的 UpdatedBy 字段，可以使用 CreatedBy 作为默认值
	// 在实际应用中，应该从请求上下文中获取当前操作用户
	updatedBy := table.CreatedBy() // 默认使用创建者

	return &TableResponse{
		ID:          table.ID().String(),
		Name:        table.Name().String(),
		Description: desc,
		BaseID:      table.BaseID(),
		CreatedBy:   table.CreatedBy(),
		UpdatedBy:   updatedBy,
		CreatedAt:   table.CreatedAt(),
		UpdatedAt:   table.UpdatedAt(),
	}
}
