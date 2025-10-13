package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"context"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record"
	"testing"
)

// 测试 Link 值检测
func TestLinkCalculationService_IsLinkValue(t *testing.T) {
	service := &LinkCalculationService{}

	tests := []struct {
		name     string
		value    interface{}
		expected bool
	}{
		{"字符串值", "rec_001", true},
		{"字符串数组", []string{"rec_001", "rec_002"}, true},
		{"interface 数组", []interface{}{"rec_001"}, true},
		{"空字符串", "", false},
		{"空数组", []string{}, false},
		{"nil 值", nil, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.isLinkValue(tt.value)
			if result != tt.expected {
				t.Errorf("期望 %v，实际 %v", tt.expected, result)
			}
		})
	}
}

// 测试值转换为记录 ID
func TestLinkCalculationService_ValueToRecordIDs(t *testing.T) {
	service := &LinkCalculationService{}

	tests := []struct {
		name     string
		value    interface{}
		expected []string
	}{
		{
			name:     "单个字符串",
			value:    "rec_001",
			expected: []string{"rec_001"},
		},
		{
			name:     "字符串数组",
			value:    []string{"rec_001", "rec_002"},
			expected: []string{"rec_001", "rec_002"},
		},
		{
			name:     "interface 数组",
			value:    []interface{}{"rec_001", "rec_002"},
			expected: []string{"rec_001", "rec_002"},
		},
		{
			name:     "空值",
			value:    nil,
			expected: nil,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.valueToRecordIDs(tt.value)

			if tt.expected == nil {
				if result != nil {
					t.Errorf("期望 nil，实际 %v", result)
				}
				return
			}

			if len(result) != len(tt.expected) {
				t.Errorf("长度不匹配: 期望 %d，实际 %d", len(tt.expected), len(result))
				return
			}

			for i, id := range result {
				if id != tt.expected[i] {
					t.Errorf("索引 %d: 期望 %s，实际 %s", i, tt.expected[i], id)
				}
			}
		})
	}
}

// 测试链接单元格验证（重复检测）
func TestLinkCalculationService_ValidateLinkCell(t *testing.T) {
	service := &LinkCalculationService{}

	tests := []struct {
		name      string
		context   LinkCellContext
		expectErr bool
	}{
		{
			name: "无重复值 - 通过",
			context: LinkCellContext{
				RecordID: "rec1",
				FieldID:  "fld1",
				NewValue: []string{"rec_a", "rec_b", "rec_c"},
			},
			expectErr: false,
		},
		{
			name: "有重复值 - 失败",
			context: LinkCellContext{
				RecordID: "rec1",
				FieldID:  "fld1",
				NewValue: []string{"rec_a", "rec_b", "rec_a"}, // rec_a 重复
			},
			expectErr: true,
		},
		{
			name: "单个值 - 通过",
			context: LinkCellContext{
				RecordID: "rec1",
				FieldID:  "fld1",
				NewValue: "rec_a",
			},
			expectErr: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.validateLinkCell(tt.context)

			if tt.expectErr && err == nil {
				t.Error("期望错误，但没有返回错误")
			}

			if !tt.expectErr && err != nil {
				t.Errorf("不期望错误，但返回了: %v", err)
			}
		})
	}
}

// 测试差集计算
func TestLinkCalculationService_Difference(t *testing.T) {
	service := &LinkCalculationService{}

	tests := []struct {
		name     string
		a        []string
		b        []string
		expected []string
	}{
		{
			name:     "基本差集",
			a:        []string{"a", "b", "c"},
			b:        []string{"b"},
			expected: []string{"a", "c"},
		},
		{
			name:     "无交集",
			a:        []string{"a", "b"},
			b:        []string{"c", "d"},
			expected: []string{"a", "b"},
		},
		{
			name:     "完全包含",
			a:        []string{"a", "b"},
			b:        []string{"a", "b", "c"},
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.difference(tt.a, tt.b)

			if len(result) != len(tt.expected) {
				t.Errorf("长度不匹配: 期望 %d，实际 %d", len(tt.expected), len(result))
				return
			}

			for i, v := range result {
				if v != tt.expected[i] {
					t.Errorf("索引 %d: 期望 %s，实际 %s", i, tt.expected[i], v)
				}
			}
		})
	}
}

// 测试外键变更构建
func TestLinkCalculationService_BuildForeignKeyChanges(t *testing.T) {
	ctx := context.Background()

	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_link": {
				ID:      "fld_link",
				TableID: "table_students",
				Type:    FieldTypeLink,
				Options: &FieldOptions{
					LinkedTableID: "table_courses",
					Relationship:  ptrString(string(RelationshipManyOne)),
				},
			},
		},
	}

	service := &LinkCalculationService{
		fieldRepo: fieldRepo,
	}

	contexts := []LinkCellContext{
		{
			RecordID: "student_001",
			FieldID:  "fld_link",
			OldValue: "course_001",
			NewValue: "course_002",
		},
	}

	fieldMap, _ := service.getRelatedFieldMap(ctx, []string{"fld_link"})
	changes, err := service.buildForeignKeyChanges(ctx, contexts, fieldMap)

	if err != nil {
		t.Fatalf("构建外键变更失败: %v", err)
	}

	if len(changes) == 0 {
		t.Error("应该生成外键变更")
	}

	t.Logf("✅ 生成了 %d 个外键变更", len(changes))
}

// 测试对称字段同步
func TestLinkCalculationService_SyncSymmetricFields(t *testing.T) {
	ctx := context.Background()

	// 设置测试数据
	symmetricFieldID := "fld_students"

	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_courses": {
				ID:      "fld_courses",
				TableID: "table_students",
				Type:    FieldTypeLink,
				Options: &FieldOptions{
					LinkedTableID:    "table_courses",
					SymmetricFieldID: &symmetricFieldID,
				},
			},
			"fld_students": {
				ID:      "fld_students",
				TableID: "table_courses",
				Type:    FieldTypeLink,
				Options: &FieldOptions{
					LinkedTableID: "table_students",
				},
			},
		},
	}

	recordService := &mockRecordService{
		records: map[string]*record.Record{
			"course_001": {
				ID:      "course_001",
				TableID: "table_courses",
				Data:    map[string]interface{}{},
			},
		},
	}

	service := &LinkCalculationService{
		fieldRepo:     fieldRepo,
		recordService: recordService,
	}

	contexts := []LinkCellContext{
		{
			RecordID: "student_001",
			FieldID:  "fld_courses",
			OldValue: []string{},
			NewValue: []string{"course_001"}, // 学生选择了课程
		},
	}

	fieldMap, _ := service.getRelatedFieldMap(ctx, []string{"fld_courses"})
	err := service.syncSymmetricFields(ctx, contexts, fieldMap)

	if err != nil {
		t.Fatalf("同步对称字段失败: %v", err)
	}

	// 验证课程记录是否更新
	courseRec := recordService.records["course_001"]
	if students, ok := courseRec.Data["fld_students"].([]string); ok {
		if len(students) == 0 || students[0] != "student_001" {
			t.Error("对称字段未正确同步")
		} else {
			t.Log("✅ 对称字段同步成功")
		}
	}
}

// 测试去重
func TestLinkCalculationService_Unique(t *testing.T) {
	service := &LinkCalculationService{}

	tests := []struct {
		name     string
		input    []string
		expected []string
	}{
		{
			name:     "有重复",
			input:    []string{"a", "b", "a", "c", "b"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "无重复",
			input:    []string{"a", "b", "c"},
			expected: []string{"a", "b", "c"},
		},
		{
			name:     "空数组",
			input:    []string{},
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.unique(tt.input)

			if len(result) != len(tt.expected) {
				t.Errorf("长度不匹配: 期望 %d，实际 %d", len(tt.expected), len(result))
			}
		})
	}
}

// 辅助函数
func ptrString(s string) *string {
	return &s
}
