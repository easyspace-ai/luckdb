package helpers

import (
	"testing"

	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/stretchr/testify/assert"
)

// TestPrepareTableDefaults_EmptyRequest 测试空请求时注入默认值
func TestPrepareTableDefaults_EmptyRequest(t *testing.T) {
	// 准备测试数据
	req := &dto.CreateTableRequest{
		Name:   "Test Table",
		BaseID: "bse_123",
	}

	// 执行
	PrepareTableDefaults(req)

	// 验证：应该注入默认视图
	assert.NotEmpty(t, req.Views, "应该注入默认视图")
	assert.Equal(t, 1, len(req.Views), "应该注入1个默认视图")
	assert.Equal(t, "Grid view", req.Views[0].Name, "默认视图名称应该是 Grid view")
	assert.Equal(t, "grid", req.Views[0].Type, "默认视图类型应该是 grid")

	// 验证：应该注入默认字段
	assert.NotEmpty(t, req.Fields, "应该注入默认字段")
	assert.Equal(t, 1, len(req.Fields), "应该注入1个默认字段")
	assert.Equal(t, "name", req.Fields[0].Name, "默认字段名称应该是 name")
	assert.Equal(t, "text", req.Fields[0].Type, "默认字段类型应该是 text")
	assert.True(t, req.Fields[0].IsPrimary, "默认字段应该是主字段")
}

// TestPrepareTableDefaults_WithCustomViews 测试自定义视图时不注入默认值
func TestPrepareTableDefaults_WithCustomViews(t *testing.T) {
	// 准备测试数据
	req := &dto.CreateTableRequest{
		Name:   "Test Table",
		BaseID: "bse_123",
		Views: []dto.ViewConfigDTO{
			{Name: "My Grid", Type: "grid"},
			{Name: "My Kanban", Type: "kanban"},
		},
	}

	// 执行
	PrepareTableDefaults(req)

	// 验证：不应该修改自定义视图
	assert.Equal(t, 2, len(req.Views), "应该保留自定义视图")
	assert.Equal(t, "My Grid", req.Views[0].Name, "第一个视图名称应该保留")
	assert.Equal(t, "My Kanban", req.Views[1].Name, "第二个视图名称应该保留")

	// 验证：应该注入默认字段（因为没有提供字段）
	assert.NotEmpty(t, req.Fields, "应该注入默认字段")
	assert.Equal(t, 1, len(req.Fields), "应该注入1个默认字段")
}

// TestPrepareTableDefaults_WithCustomFields 测试自定义字段时不注入默认值
func TestPrepareTableDefaults_WithCustomFields(t *testing.T) {
	// 准备测试数据
	req := &dto.CreateTableRequest{
		Name:   "Test Table",
		BaseID: "bse_123",
		Fields: []dto.FieldConfigDTO{
			{Name: "title", Type: "text"},
			{Name: "count", Type: "number"},
		},
	}

	// 执行
	PrepareTableDefaults(req)

	// 验证：不应该修改自定义字段
	assert.Equal(t, 2, len(req.Fields), "应该保留自定义字段")
	assert.Equal(t, "title", req.Fields[0].Name, "第一个字段名称应该保留")
	assert.Equal(t, "count", req.Fields[1].Name, "第二个字段名称应该保留")

	// 验证：第一个字段应该被设置为主字段
	assert.True(t, req.Fields[0].IsPrimary, "第一个字段应该被设置为主字段")

	// 验证：应该注入默认视图（因为没有提供视图）
	assert.NotEmpty(t, req.Views, "应该注入默认视图")
	assert.Equal(t, 1, len(req.Views), "应该注入1个默认视图")
}

// TestPrepareTableDefaults_WithPrimaryField 测试已有主字段时不修改
func TestPrepareTableDefaults_WithPrimaryField(t *testing.T) {
	// 准备测试数据
	req := &dto.CreateTableRequest{
		Name:   "Test Table",
		BaseID: "bse_123",
		Fields: []dto.FieldConfigDTO{
			{Name: "title", Type: "text"},
			{Name: "id", Type: "number", IsPrimary: true}, // 第二个字段是主字段
		},
	}

	// 执行
	PrepareTableDefaults(req)

	// 验证：第一个字段不应该被设置为主字段
	assert.False(t, req.Fields[0].IsPrimary, "第一个字段不应该被设置为主字段")

	// 验证：第二个字段应该保持为主字段
	assert.True(t, req.Fields[1].IsPrimary, "第二个字段应该保持为主字段")
}

// TestPrepareTableDefaults_FullCustomRequest 测试完全自定义的请求
func TestPrepareTableDefaults_FullCustomRequest(t *testing.T) {
	// 准备测试数据
	req := &dto.CreateTableRequest{
		Name:   "Test Table",
		BaseID: "bse_123",
		Views: []dto.ViewConfigDTO{
			{Name: "My Grid", Type: "grid"},
		},
		Fields: []dto.FieldConfigDTO{
			{Name: "title", Type: "text", IsPrimary: true},
		},
	}

	// 执行
	PrepareTableDefaults(req)

	// 验证：视图不应该被修改
	assert.Equal(t, 1, len(req.Views), "视图数量应该保持")
	assert.Equal(t, "My Grid", req.Views[0].Name, "视图名称应该保留")

	// 验证：字段不应该被修改
	assert.Equal(t, 1, len(req.Fields), "字段数量应该保持")
	assert.Equal(t, "title", req.Fields[0].Name, "字段名称应该保留")
	assert.True(t, req.Fields[0].IsPrimary, "主字段标记应该保留")
}
