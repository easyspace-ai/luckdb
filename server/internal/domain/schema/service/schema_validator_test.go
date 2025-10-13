package service

import (
	"context"
	"testing"

	fieldEntity "github.com/easyspace-ai/luckdb/server/internal/domain/fields/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/valueobject"
	"github.com/easyspace-ai/luckdb/server/internal/domain/schema/entity"
)

func TestNewSchemaValidator(t *testing.T) {
	validator := NewSchemaValidator()
	if validator == nil {
		t.Fatal("Expected validator to be non-nil")
	}
}

func TestValidateRenameField(t *testing.T) {
	validator := NewSchemaValidator()
	ctx := context.Background()

	// 创建测试字段
	fields := createTestFields(t)

	// 测试重命名为已存在的名称（应该失败）
	change := createSchemaChange(t, entity.ChangeTypeRenameField, "field1", "Field 2")

	err := validator.ValidateChange(ctx, change, fields)
	if err == nil {
		t.Error("Expected error when renaming to existing field name")
	}

	// 测试重命名为新名称（应该成功）
	change = createSchemaChange(t, entity.ChangeTypeRenameField, "field1", "New Field")

	err = validator.ValidateChange(ctx, change, fields)
	if err != nil {
		t.Errorf("Expected no error when renaming to new name, got: %v", err)
	}
}

func TestValidateAddField(t *testing.T) {
	validator := NewSchemaValidator()
	ctx := context.Background()

	fields := createTestFields(t)

	// 测试添加已存在的字段名（应该失败）
	change := createSchemaChange(t, entity.ChangeTypeAddField, "", "Field 1")

	err := validator.ValidateChange(ctx, change, fields)
	if err == nil {
		t.Error("Expected error when adding field with existing name")
	}

	// 测试添加新字段（应该成功）
	change = createSchemaChange(t, entity.ChangeTypeAddField, "", "New Field")

	err = validator.ValidateChange(ctx, change, fields)
	if err != nil {
		t.Errorf("Expected no error when adding new field, got: %v", err)
	}
}

func TestValidateChangeType(t *testing.T) {
	validator := NewSchemaValidator()
	ctx := context.Background()

	fields := createTestFields(t)

	// 测试修改虚拟字段类型（应该失败）
	virtualField := createVirtualField(t, "formula", "field_virtual")
	fieldsWithVirtual := append(fields, virtualField)

	change := createSchemaChange(t, entity.ChangeTypeChangeType, "field_virtual", "text")

	err := validator.ValidateChange(ctx, change, fieldsWithVirtual)
	if err == nil {
		t.Error("Expected error when changing type of virtual field")
	}
}

func TestAnalyzeImpact(t *testing.T) {
	validator := NewSchemaValidator()
	ctx := context.Background()

	fields := createTestFields(t)

	// 测试删除字段的影响分析
	change := createSchemaChange(t, entity.ChangeTypeRemoveField, "field1", nil)

	impact, err := validator.AnalyzeImpact(ctx, change, fields)
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if len(impact.BreakingChanges) == 0 {
		t.Error("Expected breaking changes for field removal")
	}

	if len(impact.Migrations) == 0 {
		t.Error("Expected migration scripts for field removal")
	}
}

// Helper functions

func createTestFields(t *testing.T) []*fieldEntity.Field {
	field1 := createTestField(t, "field1", "Field 1", "text")
	field2 := createTestField(t, "field2", "Field 2", "number")
	return []*fieldEntity.Field{field1, field2}
}

func createTestField(t *testing.T, id, name, fieldType string) *fieldEntity.Field {
	fieldID := valueobject.NewFieldID(id)
	fieldName, err := valueobject.NewFieldName(name)
	if err != nil {
		t.Fatalf("Failed to create field name: %v", err)
	}

	fType, err := valueobject.NewFieldType(fieldType)
	if err != nil {
		t.Fatalf("Failed to create field type: %v", err)
	}

	dbFieldName, err := valueobject.NewDBFieldName(fieldID)
	if err != nil {
		t.Fatalf("Failed to create db field name: %v", err)
	}

	return fieldEntity.ReconstructField(
		fieldID,
		"table123",
		fieldName,
		fType,
		dbFieldName,
		"text",
		valueobject.NewFieldOptions(),
		0,
		1,
		"user123",
		time.Now(),
		time.Now(),
	)
}

func createVirtualField(t *testing.T, fieldType, id string) *fieldEntity.Field {
	fieldID := valueobject.NewFieldID(id)
	fieldName, _ := valueobject.NewFieldName("Virtual Field")
	fType, _ := valueobject.NewFieldType(fieldType)
	dbFieldName, _ := valueobject.NewDBFieldName(fieldID)

	options := valueobject.NewFieldOptions().WithFormula("field1 + field2")

	return fieldEntity.ReconstructField(
		fieldID,
		"table123",
		fieldName,
		fType,
		dbFieldName,
		"text",
		options,
		0,
		1,
		"user123",
		time.Now(),
		time.Now(),
	)
}

func createSchemaChange(t *testing.T, changeType entity.SchemaChangeType, fieldID string, newValue interface{}) *entity.SchemaChange {
	change, err := entity.NewSchemaChange(
		"table123",
		changeType,
		fieldID,
		nil,
		newValue,
		"user123",
	)
	if err != nil {
		t.Fatalf("Failed to create schema change: %v", err)
	}
	return change
}

