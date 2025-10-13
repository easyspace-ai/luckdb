package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"context"
	"testing"

	"github.com/easyspace-ai/luckdb/server/internal/domain/record"
)

// 集成测试：完整的学生成绩系统
func TestIntegration_StudentScoreSystem(t *testing.T) {
	ctx := context.Background()

	// 设置字段
	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_name": {
				ID:      "fld_name",
				TableID: "table_students",
				Type:    FieldTypeText,
			},
			"fld_math": {
				ID:      "fld_math",
				TableID: "table_students",
				Type:    FieldTypeNumber,
			},
			"fld_english": {
				ID:      "fld_english",
				TableID: "table_students",
				Type:    FieldTypeNumber,
			},
			"fld_total": {
				ID:      "fld_total",
				TableID: "table_students",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_math} + {fld_english}",
				},
			},
			"fld_average": {
				ID:      "fld_average",
				TableID: "table_students",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_total} / 2",
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
					"fld_name":    "张三",
					"fld_math":    85.0,
					"fld_english": 90.0,
				},
			},
		},
	}

	evaluator := NewDefaultFormulaEvaluator()
	refCalcService := NewReferenceCalculationService(fieldRepo, recordService, evaluator)

	// ===== 测试 1：更新数学成绩，自动重算总分和平均分 =====
	t.Log("测试 1: 更新数学成绩")

	// 更新数学成绩
	student := recordService.records["student_001"]
	student.Data["fld_math"] = 95.0

	// 触发引用计算
	err := refCalcService.CalculateReferences(
		ctx,
		"table_students",
		[]string{"student_001"},
		[]string{"fld_math"},
	)

	if err != nil {
		t.Fatalf("引用计算失败: %v", err)
	}

	// 验证结果
	student = recordService.records["student_001"]

	// 总分应该是 95 + 90 = 185
	if total, ok := student.Data["fld_total"].(float64); ok {
		if total != 185.0 {
			t.Errorf("总分错误: 期望 185.0，实际 %f", total)
		} else {
			t.Log("✅ 总分计算正确: 185.0")
		}
	} else {
		t.Error("总分未计算")
	}

	// 平均分应该是 185 / 2 = 92.5
	if avg, ok := student.Data["fld_average"].(float64); ok {
		if avg != 92.5 {
			t.Errorf("平均分错误: 期望 92.5，实际 %f", avg)
		} else {
			t.Log("✅ 平均分计算正确: 92.5")
		}
	} else {
		t.Error("平均分未计算")
	}
}

// 集成测试：学生选课系统（Link + 对称字段）
func TestIntegration_StudentCourseEnrollment(t *testing.T) {
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
		records: map[string]*TestRecord{
			"student_001": {
				ID:      "student_001",
				TableID: "table_students",
				Data: map[string]interface{}{
					"fld_courses": []string{},
				},
			},
			"course_math": {
				ID:      "course_math",
				TableID: "table_courses",
				Data: map[string]interface{}{
					"fld_students": []string{},
				},
			},
		},
	}

	evaluator := NewDefaultFormulaEvaluator()
	refCalcService := NewReferenceCalculationService(fieldRepo, recordService, evaluator)
	linkCalcService := NewLinkCalculationService(fieldRepo, recordService, refCalcService)

	// ===== 测试：学生选课，自动同步对称字段 =====
	t.Log("测试：学生选课")

	changes := []LinkCellContext{
		{
			RecordID: "student_001",
			FieldID:  "fld_courses",
			OldValue: []string{},
			NewValue: []string{"course_math"},
		},
	}

	err := linkCalcService.ProcessLinkChanges(ctx, "table_students", changes)
	if err != nil {
		t.Fatalf("链接计算失败: %v", err)
	}

	// 验证对称字段是否同步
	course := recordService.records["course_math"]
	if students, ok := course.Data["fld_students"].([]string); ok {
		if len(students) == 0 || students[0] != "student_001" {
			t.Error("对称字段未同步")
		} else {
			t.Log("✅ 对称字段同步成功: 课程的学生列表包含 student_001")
		}
	} else {
		t.Error("对称字段未更新")
	}
}

// 集成测试：批量计算性能
func TestIntegration_BatchCalculation(t *testing.T) {
	ctx := context.Background()

	// 创建 100 个学生记录
	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_score": {
				ID:      "fld_score",
				TableID: "table_students",
				Type:    FieldTypeNumber,
			},
			"fld_double": {
				ID:      "fld_double",
				TableID: "table_students",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_score} * 2",
				},
			},
		},
	}

	recordService := &mockRecordService{
		records: make(map[string]*TestRecord),
	}

	var recordIDs []string
	for i := 0; i < 100; i++ {
		recordID := "student_" + string(rune('0'+i))
		recordIDs = append(recordIDs, recordID)

		recordService.records[recordID] = &record.Record{
			ID:      recordID,
			TableID: "table_students",
			Data: map[string]interface{}{
				"fld_score": float64(i * 10),
			},
		}
	}

	evaluator := NewDefaultFormulaEvaluator()
	refCalcService := NewReferenceCalculationService(fieldRepo, recordService, evaluator)
	batchService := NewBatchCalculationService(refCalcService, 20) // 每批 20 条

	// ===== 测试：批量计算 =====
	t.Log("测试：批量计算 100 条记录")

	err := batchService.OptimizedBatchCalculate(
		ctx,
		"table_students",
		recordIDs,
		[]string{"fld_score"},
	)

	if err != nil {
		t.Fatalf("批量计算失败: %v", err)
	}

	// 验证所有记录都计算了
	calculatedCount := 0
	for _, recordID := range recordIDs {
		rec := recordService.records[recordID]
		if _, ok := rec.Data["fld_double"]; ok {
			calculatedCount++
		}
	}

	if calculatedCount != len(recordIDs) {
		t.Errorf("期望计算 %d 条记录，实际 %d", len(recordIDs), calculatedCount)
	} else {
		t.Logf("✅ 批量计算成功: %d 条记录", calculatedCount)
	}
}

// 集成测试：数据完整性检查和修复
func TestIntegration_DataIntegrityCheckAndRepair(t *testing.T) {
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

	integrityService := NewDataIntegrityService(fieldRepo, recordService, nil)

	// ===== 测试 1：检查完整性 =====
	t.Log("测试 1: 检查数据完整性")

	result, err := integrityService.CheckLinkIntegrity(
		ctx,
		"table_students",
		[]string{"student_001"},
	)

	if err != nil {
		t.Fatalf("检查失败: %v", err)
	}

	if result.Valid {
		t.Error("应该检测到问题")
	} else {
		t.Logf("✅ 检测到 %d 个问题", len(result.Errors))
		for _, errMsg := range result.Errors {
			t.Logf("  - %s", errMsg)
		}
	}

	// ===== 测试 2：修复数据 =====
	t.Log("测试 2: 修复数据")

	err = integrityService.RepairLinkIntegrity(
		ctx,
		"table_students",
		result.InvalidRecords,
	)

	if err != nil {
		t.Fatalf("修复失败: %v", err)
	}

	// 再次检查
	result, _ = integrityService.CheckLinkIntegrity(
		ctx,
		"table_students",
		[]string{"student_001"},
	)

	if !result.Valid {
		t.Errorf("修复后仍有问题: %v", result.Errors)
	} else {
		t.Log("✅ 数据修复成功，完整性检查通过")
	}
}

// 集成测试：复杂的依赖链
func TestIntegration_ComplexDependencyChain(t *testing.T) {
	ctx := context.Background()

	// A → B → C → D 的依赖链
	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_a": {
				ID:      "fld_a",
				TableID: "table1",
				Type:    FieldTypeNumber,
			},
			"fld_b": {
				ID:      "fld_b",
				TableID: "table1",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_a} + 10",
				},
			},
			"fld_c": {
				ID:      "fld_c",
				TableID: "table1",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_b} * 2",
				},
			},
			"fld_d": {
				ID:      "fld_d",
				TableID: "table1",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_c} + 5",
				},
			},
		},
	}

	recordService := &mockRecordService{
		records: map[string]*TestRecord{
			"rec1": {
				ID:      "rec1",
				TableID: "table1",
				Data: map[string]interface{}{
					"fld_a": 10.0,
				},
			},
		},
	}

	evaluator := NewDefaultFormulaEvaluator()
	refCalcService := NewReferenceCalculationService(fieldRepo, recordService, evaluator)

	// 更新 A，应该级联计算 B, C, D
	err := refCalcService.CalculateReferences(
		ctx,
		"table1",
		[]string{"rec1"},
		[]string{"fld_a"},
	)

	if err != nil {
		t.Fatalf("计算失败: %v", err)
	}

	rec := recordService.records["rec1"]

	// 验证计算链
	// A = 10
	// B = A + 10 = 20
	// C = B * 2 = 40
	// D = C + 5 = 45

	if b, ok := rec.Data["fld_b"].(float64); !ok || b != 20.0 {
		t.Errorf("fld_b 错误: 期望 20.0，实际 %v", rec.Data["fld_b"])
	}

	if c, ok := rec.Data["fld_c"].(float64); !ok || c != 40.0 {
		t.Errorf("fld_c 错误: 期望 40.0，实际 %v", rec.Data["fld_c"])
	}

	if d, ok := rec.Data["fld_d"].(float64); !ok || d != 45.0 {
		t.Errorf("fld_d 错误: 期望 45.0，实际 %v", rec.Data["fld_d"])
	} else {
		t.Log("✅ 复杂依赖链计算成功: A(10) → B(20) → C(40) → D(45)")
	}
}
