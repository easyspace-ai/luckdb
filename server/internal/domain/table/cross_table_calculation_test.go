package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"testing"
)

// TestExtractRecordIDsFromLinkValue 测试从Link值中提取记录IDs
func TestExtractRecordIDsFromLinkValue(t *testing.T) {
	service := &CrossTableCalculationService{}

	tests := []struct {
		name     string
		input    interface{}
		expected []string
	}{
		{
			name:     "nil value",
			input:    nil,
			expected: []string{},
		},
		{
			name:     "single string",
			input:    "record_1",
			expected: []string{"record_1"},
		},
		{
			name:     "string array",
			input:    []string{"record_1", "record_2"},
			expected: []string{"record_1", "record_2"},
		},
		{
			name:     "interface array",
			input:    []interface{}{"record_1", "record_2"},
			expected: []string{"record_1", "record_2"},
		},
		{
			name: "map array with id",
			input: []interface{}{
				map[string]interface{}{"id": "record_1", "title": "Record 1"},
				map[string]interface{}{"id": "record_2", "title": "Record 2"},
			},
			expected: []string{"record_1", "record_2"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.extractRecordIDsFromLinkValue(tt.input)

			if len(result) != len(tt.expected) {
				t.Errorf("Expected %d IDs, got %d", len(tt.expected), len(result))
				return
			}

			for i, expectedID := range tt.expected {
				if result[i] != expectedID {
					t.Errorf("Expected ID[%d] = %s, got %s", i, expectedID, result[i])
				}
			}
		})
	}
}

// TestFieldDependsOnLink 测试字段依赖检测
func TestFieldDependsOnLink(t *testing.T) {
	service := &CrossTableCalculationService{}

	linkFieldID := "link_field_1"

	tests := []struct {
		name     string
		field    *Field
		expected bool
	}{
		{
			name: "Rollup依赖Link字段",
			field: &Field{
				Type: FieldTypeRollup,
				Options: &FieldOptions{
					RollupLinkFieldID: linkFieldID,
				},
			},
			expected: true,
		},
		{
			name: "Rollup不依赖Link字段",
			field: &Field{
				Type: FieldTypeRollup,
				Options: &FieldOptions{
					RollupLinkFieldID: "other_link",
				},
			},
			expected: false,
		},
		{
			name: "Lookup依赖Link字段",
			field: &Field{
				Type: FieldTypeLookup,
				Options: &FieldOptions{
					LookupLinkFieldID: linkFieldID,
				},
			},
			expected: true,
		},
		{
			name: "普通字段不依赖",
			field: &Field{
				Type:    FieldTypeText,
				Options: &FieldOptions{},
			},
			expected: false,
		},
		{
			name: "Formula字段不直接依赖Link",
			field: &Field{
				Type:    FieldTypeFormula,
				Options: &FieldOptions{},
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.fieldDependsOnLink(tt.field, linkFieldID)
			if result != tt.expected {
				t.Errorf("Expected %v, got %v", tt.expected, result)
			}
		})
	}
}

// TestExtractFieldIDs 测试字段ID提取
func TestExtractFieldIDs(t *testing.T) {
	fields := []*fields.Field{
		{ID: "field_1"},
		{ID: "field_2"},
		{ID: "field_3"},
	}

	ids := extractFieldIDs(fields)

	if len(ids) != 3 {
		t.Errorf("Expected 3 IDs, got %d", len(ids))
	}

	expected := map[string]bool{
		"field_1": true,
		"field_2": true,
		"field_3": true,
	}

	for _, id := range ids {
		if !expected[id] {
			t.Errorf("Unexpected field ID: %s", id)
		}
	}
}

// TestJoinStringsForSQL 测试SQL字符串连接
func TestJoinStringsForSQL(t *testing.T) {
	tests := []struct {
		name     string
		input    []string
		expected string
	}{
		{
			name:     "empty array",
			input:    []string{},
			expected: "''",
		},
		{
			name:     "single string",
			input:    []string{"abc"},
			expected: "'abc'",
		},
		{
			name:     "multiple strings",
			input:    []string{"abc", "def", "ghi"},
			expected: "'abc','def','ghi'",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := joinStringsForSQL(tt.input)
			if result != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, result)
			}
		})
	}
}

// ExampleCrossTableCalculationService 演示跨表计算的使用
func ExampleCrossTableCalculationService() {
	// 注意：这是一个示例，实际使用需要真实的数据库连接
	// ctx := context.Background()

	// 场景：学生成绩更新 -> 班级平均分重算
	// service := NewCrossTableCalculationService(db, fieldRepo, batchService, evaluator)

	// 1. 学生成绩更新
	// sourceTableID := "students"
	// sourceRecordIDs := []string{"student_1"}

	// 2. 查找所有引用这些学生的记录
	// splits, err := service.FindReferencingRecords(ctx, sourceTableID, sourceRecordIDs)
	// splits 可能包含:
	// - class_1 (包含 student_1)
	// - class_2 (包含 student_1)

	// 3. 执行跨表计算
	// for _, split := range splits {
	//     err = service.CalculateCrossTable(ctx, split)
	// }
	// 结果：class_1 和 class_2 的 avg_grade 字段被重新计算
}

// TestRecordSplitContext 测试记录裂变上下文
func TestRecordSplitContext(t *testing.T) {
	split := RecordSplitContext{
		SourceTableID:   "students",
		SourceRecordIDs: []string{"student_1", "student_2"},
		TargetTableID:   "classes",
		TargetRecordIDs: []string{"class_1"},
		LinkFieldID:     "students_link",
		CalculateFields: []string{"avg_grade", "total_students"},
	}

	// 验证结构
	if split.SourceTableID != "students" {
		t.Error("SourceTableID mismatch")
	}

	if len(split.SourceRecordIDs) != 2 {
		t.Error("Expected 2 source records")
	}

	if len(split.CalculateFields) != 2 {
		t.Error("Expected 2 calculate fields")
	}
}

// BenchmarkExtractRecordIDs 性能测试：提取记录IDs
func BenchmarkExtractRecordIDs(b *testing.B) {
	service := &CrossTableCalculationService{}

	// 准备测试数据
	linkValue := []interface{}{
		map[string]interface{}{"id": "rec_1", "title": "Record 1"},
		map[string]interface{}{"id": "rec_2", "title": "Record 2"},
		map[string]interface{}{"id": "rec_3", "title": "Record 3"},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.extractRecordIDsFromLinkValue(linkValue)
	}
}
