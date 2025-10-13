package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"context"
	"testing"
)

// 测试链接完整性检查 - 悬空引用检测
func TestDataIntegrityService_CheckLinkIntegrity_DanglingReference(t *testing.T) {
	ctx := context.Background()

	// 设置测试数据
	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_courses": {
				ID:      "fld_courses",
				TableID: "table_students",
				Type:    FieldTypeLink,
				Options: &FieldOptions{
					LinkedTableID: "table_courses",
				},
			},
		},
	}

	recordService := &mockRecordService{
		records: map[string]*TestRecord{
			"student_001": {
				ID:      "student_001",
				TableID: "table_students",
				Data: map[string]interface{}{
					"fld_courses": []string{"course_001", "course_999"}, // course_999 不存在
				},
			},
			"course_001": {
				ID:      "course_001",
				TableID: "table_courses",
				Data:    map[string]interface{}{},
			},
		},
	}

	service := NewDataIntegrityService(fieldRepo, recordService, nil)

	// 检查完整性
	result, err := service.CheckLinkIntegrity(
		ctx,
		"table_students",
		[]string{"student_001"},
	)

	if err != nil {
		t.Fatalf("检查失败: %v", err)
	}

	// 应该检测到问题
	if result.Valid {
		t.Error("应该检测到悬空引用")
	}

	if len(result.InvalidRecords) == 0 {
		t.Error("应该有无效记录")
	}

	if len(result.Errors) == 0 {
		t.Error("应该有错误信息")
	}

	t.Logf("✅ 检测到 %d 个问题", len(result.Errors))
	for _, err := range result.Errors {
		t.Logf("  - %s", err)
	}
}

// 测试链接完整性检查 - 通过
func TestDataIntegrityService_CheckLinkIntegrity_Valid(t *testing.T) {
	ctx := context.Background()

	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_courses": {
				ID:      "fld_courses",
				TableID: "table_students",
				Type:    FieldTypeLink,
				Options: &FieldOptions{
					LinkedTableID: "table_courses",
				},
			},
		},
	}

	recordService := &mockRecordService{
		records: map[string]*TestRecord{
			"student_001": {
				ID:      "student_001",
				TableID: "table_students",
				Data: map[string]interface{}{
					"fld_courses": []string{"course_001", "course_002"},
				},
			},
			"course_001": {
				ID:      "course_001",
				TableID: "table_courses",
				Data:    map[string]interface{}{},
			},
			"course_002": {
				ID:      "course_002",
				TableID: "table_courses",
				Data:    map[string]interface{}{},
			},
		},
	}

	service := NewDataIntegrityService(fieldRepo, recordService, nil)

	result, err := service.CheckLinkIntegrity(
		ctx,
		"table_students",
		[]string{"student_001"},
	)

	if err != nil {
		t.Fatalf("检查失败: %v", err)
	}

	// 应该通过检查
	if !result.Valid {
		t.Errorf("应该通过检查，但发现问题: %v", result.Errors)
	}

	t.Log("✅ 完整性检查通过")
}

// 测试对称字段一致性检查
func TestDataIntegrityService_CheckSymmetricFieldConsistency(t *testing.T) {
	ctx := context.Background()

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
		},
	}

	recordService := &mockRecordService{
		records: map[string]*TestRecord{
			"student_001": {
				ID:      "student_001",
				TableID: "table_students",
				Data: map[string]interface{}{
					"fld_courses": []string{"course_001"},
				},
			},
			"course_001": {
				ID:      "course_001",
				TableID: "table_courses",
				Data: map[string]interface{}{
					// 对称字段缺少 student_001，不一致
					"fld_students": []string{},
				},
			},
		},
	}

	service := NewDataIntegrityService(fieldRepo, recordService, nil)

	result, err := service.CheckLinkIntegrity(
		ctx,
		"table_students",
		[]string{"student_001"},
	)

	if err != nil {
		t.Fatalf("检查失败: %v", err)
	}

	// 应该检测到对称字段不一致
	if result.Valid {
		t.Error("应该检测到对称字段不一致")
	}

	t.Logf("✅ 检测到对称字段不一致: %v", result.Errors)
}

// 测试数据修复
func TestDataIntegrityService_RepairLinkIntegrity(t *testing.T) {
	ctx := context.Background()

	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_courses": {
				ID:      "fld_courses",
				TableID: "table_students",
				Type:    FieldTypeLink,
				Options: &FieldOptions{
					LinkedTableID: "table_courses",
				},
			},
		},
	}

	recordService := &mockRecordService{
		records: map[string]*TestRecord{
			"student_001": {
				ID:      "student_001",
				TableID: "table_students",
				Data: map[string]interface{}{
					"fld_courses": []string{"course_001", "course_999"}, // course_999 不存在
				},
			},
			"course_001": {
				ID:      "course_001",
				TableID: "table_courses",
				Data:    map[string]interface{}{},
			},
		},
	}

	service := NewDataIntegrityService(fieldRepo, recordService, nil)

	// 修复数据
	err := service.RepairLinkIntegrity(
		ctx,
		"table_students",
		[]string{"student_001"},
	)

	if err != nil {
		t.Fatalf("修复失败: %v", err)
	}

	// 验证修复结果
	student := recordService.records["student_001"]
	courses := student.Data["fld_courses"].([]string)

	// 应该只保留有效的 course_001
	if len(courses) != 1 {
		t.Errorf("期望 1 个课程，实际 %d", len(courses))
	}

	if courses[0] != "course_001" {
		t.Errorf("期望 course_001，实际 %s", courses[0])
	}

	t.Log("✅ 数据修复成功，删除了无效引用")
}

// 测试唯一性验证
func TestDataIntegrityService_ValidateUniqueness(t *testing.T) {
	ctx := context.Background()

	service := NewDataIntegrityService(nil, nil, nil)

	field := &Field{
		ID:       "fld_email",
		IsUnique: true,
	}

	// 测试非唯一字段
	fields.IsUnique = false
	isUnique, err := service.ValidateUniqueness(ctx, field, "test@example.com", "")
	if err != nil {
		t.Fatalf("验证失败: %v", err)
	}
	if !isUnique {
		t.Error("非唯一字段应该始终返回 true")
	}

	// 测试空值
	fields.IsUnique = true
	isUnique, err = service.ValidateUniqueness(ctx, field, nil, "")
	if err != nil {
		t.Fatalf("验证失败: %v", err)
	}
	if !isUnique {
		t.Error("空值应该返回 true")
	}

	t.Log("✅ 唯一性验证测试通过")
}

// 测试值转换为记录 ID
func TestDataIntegrityService_ValueToRecordIDs(t *testing.T) {
	service := &DataIntegrityService{}

	tests := []struct {
		name     string
		value    interface{}
		expected []string
	}{
		{
			name:     "字符串",
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
			name:     "nil",
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

// 测试包含检查
func TestDataIntegrityService_Contains(t *testing.T) {
	service := &DataIntegrityService{}

	tests := []struct {
		name     string
		slice    []string
		item     string
		expected bool
	}{
		{
			name:     "包含",
			slice:    []string{"a", "b", "c"},
			item:     "b",
			expected: true,
		},
		{
			name:     "不包含",
			slice:    []string{"a", "b", "c"},
			item:     "d",
			expected: false,
		},
		{
			name:     "空数组",
			slice:    []string{},
			item:     "a",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := service.contains(tt.slice, tt.item)
			if result != tt.expected {
				t.Errorf("期望 %v，实际 %v", tt.expected, result)
			}
		})
	}
}
