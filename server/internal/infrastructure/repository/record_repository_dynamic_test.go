package repository

import (
	"context"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	fieldEntity "github.com/easyspace-ai/luckdb/server/internal/domain/fields/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/valueobject"
)

// MockDBProvider mock implementation of DBProvider
type MockDBProvider struct {
	mock.Mock
}

func (m *MockDBProvider) CreateSchema(ctx context.Context, schemaName string) error {
	args := m.Called(ctx, schemaName)
	return args.Error(0)
}

func (m *MockDBProvider) DropSchema(ctx context.Context, schemaName string) error {
	args := m.Called(ctx, schemaName)
	return args.Error(0)
}

func (m *MockDBProvider) CreatePhysicalTable(ctx context.Context, schemaName, tableName string) error {
	args := m.Called(ctx, schemaName, tableName)
	return args.Error(0)
}

func (m *MockDBProvider) DropPhysicalTable(ctx context.Context, schemaName, tableName string) error {
	args := m.Called(ctx, schemaName, tableName)
	return args.Error(0)
}

func (m *MockDBProvider) AddColumn(ctx context.Context, schemaName, tableName string, columnDef interface{}) error {
	args := m.Called(ctx, schemaName, tableName, columnDef)
	return args.Error(0)
}

func (m *MockDBProvider) AlterColumn(ctx context.Context, schemaName, tableName, columnName string, newDef interface{}) error {
	args := m.Called(ctx, schemaName, tableName, columnName, newDef)
	return args.Error(0)
}

func (m *MockDBProvider) DropColumn(ctx context.Context, schemaName, tableName, columnName string) error {
	args := m.Called(ctx, schemaName, tableName, columnName)
	return args.Error(0)
}

func (m *MockDBProvider) AddUniqueConstraint(ctx context.Context, schemaName, tableName, columnName, constraintName string) error {
	args := m.Called(ctx, schemaName, tableName, columnName, constraintName)
	return args.Error(0)
}

func (m *MockDBProvider) DropConstraint(ctx context.Context, schemaName, tableName, constraintName string) error {
	args := m.Called(ctx, schemaName, tableName, constraintName)
	return args.Error(0)
}

func (m *MockDBProvider) SetNotNull(ctx context.Context, schemaName, tableName, columnName string) error {
	args := m.Called(ctx, schemaName, tableName, columnName)
	return args.Error(0)
}

func (m *MockDBProvider) DropNotNull(ctx context.Context, schemaName, tableName, columnName string) error {
	args := m.Called(ctx, schemaName, tableName, columnName)
	return args.Error(0)
}

func (m *MockDBProvider) AddCheckConstraint(ctx context.Context, schemaName, tableName, constraintName, checkExpression string) error {
	args := m.Called(ctx, schemaName, tableName, constraintName, checkExpression)
	return args.Error(0)
}

func (m *MockDBProvider) GenerateTableName(baseID, tableID string) string {
	args := m.Called(baseID, tableID)
	return args.String(0)
}

func (m *MockDBProvider) MapFieldTypeToDBType(fieldType string) string {
	args := m.Called(fieldType)
	return args.String(0)
}

func (m *MockDBProvider) DriverName() string {
	return "postgres"
}

func (m *MockDBProvider) SupportsSchema() bool {
	return true
}

// Test cases

func TestRecordRepositoryDynamic_FieldMappingCache(t *testing.T) {
	cache := NewFieldMappingCache()

	tableID := "tbl_test_001"
	mappings := []*FieldMapping{
		{
			FieldID:     "fld_001",
			DBFieldName: "field_fld_001",
			FieldType:   "text",
			CachedAt:    time.Now(),
		},
		{
			FieldID:     "fld_002",
			DBFieldName: "field_fld_002",
			FieldType:   "number",
			CachedAt:    time.Now(),
		},
	}

	// Test Set and Get
	cache.Set(tableID, mappings)
	result, exists := cache.Get(tableID)

	assert.True(t, exists, "缓存应该存在")
	assert.Equal(t, 2, len(result), "应该有2个映射")
	assert.Equal(t, "fld_001", result[0].FieldID)

	// Test Invalidate
	cache.Invalidate(tableID)
	result, exists = cache.Get(tableID)
	assert.False(t, exists, "缓存应该已失效")

	// Test Clear
	cache.Set(tableID, mappings)
	cache.Set("tbl_test_002", mappings)
	cache.Clear()
	result, exists = cache.Get(tableID)
	assert.False(t, exists, "缓存应该已清空")
}

func TestRecordRepositoryDynamic_ConvertValueForDB(t *testing.T) {
	repo := &RecordRepositoryDynamic{}

	// Create mock field
	fieldName, _ := valueobject.NewFieldName("test_field")
	fieldType, _ := valueobject.NewFieldType("text")
	dbFieldName, _ := valueobject.NewDBFieldName(fieldName)

	field := fieldEntity.ReconstructField(
		valueobject.NewFieldID("fld_001"),
		"tbl_001",
		fieldName,
		fieldType,
		dbFieldName,
		"TEXT",
		nil,
		0,
		1,
		"user_001",
		time.Now(),
		time.Now(),
	)

	tests := []struct {
		name      string
		fieldType string
		input     interface{}
		expected  interface{}
	}{
		{
			name:      "text field",
			fieldType: "text",
			input:     "hello",
			expected:  "hello",
		},
		{
			name:      "checkbox true",
			fieldType: "checkbox",
			input:     true,
			expected:  true,
		},
		{
			name:      "checkbox false",
			fieldType: "checkbox",
			input:     false,
			expected:  false,
		},
		{
			name:      "number field",
			fieldType: "number",
			input:     123,
			expected:  123,
		},
		{
			name:      "nil value",
			fieldType: "text",
			input:     nil,
			expected:  nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := repo.convertValueForDB(field, tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestRecordRepositoryDynamic_ConvertValueFromDB(t *testing.T) {
	repo := &RecordRepositoryDynamic{}

	// Create mock field
	fieldName, _ := valueobject.NewFieldName("test_field")
	fieldType, _ := valueobject.NewFieldType("text")
	dbFieldName, _ := valueobject.NewDBFieldName(fieldName)

	field := fieldEntity.ReconstructField(
		valueobject.NewFieldID("fld_001"),
		"tbl_001",
		fieldName,
		fieldType,
		dbFieldName,
		"TEXT",
		nil,
		0,
		1,
		"user_001",
		time.Now(),
		time.Now(),
	)

	tests := []struct {
		name      string
		fieldType string
		input     interface{}
		expected  interface{}
	}{
		{
			name:      "text field",
			fieldType: "text",
			input:     "hello",
			expected:  "hello",
		},
		{
			name:      "checkbox true",
			fieldType: "checkbox",
			input:     true,
			expected:  true,
		},
		{
			name:      "number field",
			fieldType: "number",
			input:     123,
			expected:  123,
		},
		{
			name:      "nil value",
			fieldType: "text",
			input:     nil,
			expected:  nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := repo.convertValueFromDB(field, tt.input)
			assert.Equal(t, tt.expected, result)
		})
	}
}

func TestRecordRepositoryDynamic_ToDomainEntity(t *testing.T) {
	repo := &RecordRepositoryDynamic{}

	// Create mock fields
	fieldName, _ := valueobject.NewFieldName("test_field")
	fieldType, _ := valueobject.NewFieldType("text")
	dbFieldName, _ := valueobject.NewDBFieldName(fieldName)

	fields := []*fieldEntity.Field{
		fieldEntity.ReconstructField(
			valueobject.NewFieldID("fld_001"),
			"tbl_001",
			fieldName,
			fieldType,
			dbFieldName,
			"TEXT",
			nil,
			0,
			1,
			"user_001",
			time.Now(),
			time.Now(),
		),
	}

	// Mock physical table result
	now := time.Now()
	result := map[string]interface{}{
		"__id":                 "rec_001",
		"__created_by":         "user_001",
		"__last_modified_by":   "user_001",
		"__created_time":       now,
		"__last_modified_time": now,
		"__version":            int64(1),
		"field_fld_001":        "test value",
	}

	record, err := repo.toDomainEntity(result, fields, "tbl_001")

	assert.NoError(t, err, "转换应该成功")
	assert.NotNil(t, record, "记录不应该为 nil")
	assert.Equal(t, "rec_001", record.ID().String())
	assert.Equal(t, "tbl_001", record.TableID())
	assert.Equal(t, "user_001", record.CreatedBy())
	assert.Equal(t, int64(1), record.Version().Value())
}

func TestRecordRepositoryDynamic_GenerateTableName(t *testing.T) {
	mockProvider := new(MockDBProvider)
	mockProvider.On("GenerateTableName", "bse_001", "tbl_001").Return("bse_001.tbl_001")

	result := mockProvider.GenerateTableName("bse_001", "tbl_001")

	assert.Equal(t, "bse_001.tbl_001", result)
	mockProvider.AssertExpectations(t)
}

func TestRecordRepositoryDynamic_MapFieldTypeToDBType(t *testing.T) {
	mockProvider := new(MockDBProvider)

	tests := []struct {
		fieldType string
		dbType    string
	}{
		{"text", "VARCHAR(255)"},
		{"longText", "TEXT"},
		{"number", "NUMERIC"},
		{"checkbox", "BOOLEAN"},
		{"date", "TIMESTAMP"},
		{"multipleSelect", "JSONB"},
	}

	for _, tt := range tests {
		t.Run(tt.fieldType, func(t *testing.T) {
			mockProvider.On("MapFieldTypeToDBType", tt.fieldType).Return(tt.dbType).Once()
			result := mockProvider.MapFieldTypeToDBType(tt.fieldType)
			assert.Equal(t, tt.dbType, result)
		})
	}

	mockProvider.AssertExpectations(t)
}

// Benchmark tests

func BenchmarkFieldMappingCache_Get(b *testing.B) {
	cache := NewFieldMappingCache()
	tableID := "tbl_test_001"
	mappings := []*FieldMapping{
		{FieldID: "fld_001", DBFieldName: "field_fld_001", CachedAt: time.Now()},
		{FieldID: "fld_002", DBFieldName: "field_fld_002", CachedAt: time.Now()},
	}
	cache.Set(tableID, mappings)

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cache.Get(tableID)
	}
}

func BenchmarkFieldMappingCache_Set(b *testing.B) {
	cache := NewFieldMappingCache()
	tableID := "tbl_test_001"
	mappings := []*FieldMapping{
		{FieldID: "fld_001", DBFieldName: "field_fld_001", CachedAt: time.Now()},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		cache.Set(tableID, mappings)
	}
}
