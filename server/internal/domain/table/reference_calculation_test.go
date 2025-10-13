package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"context"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record"
	"testing"
)

// Mock 依赖
type mockFieldRepository struct {
	fields map[string]*fields.Field
}

func (m *mockFieldRepository) GetByID(ctx context.Context, id string) (*fields.Field, error) {
	if field, ok := m.fields[id]; ok {
		return field, nil
	}
	return nil, nil
}

func (m *mockFieldRepository) GetByTableID(ctx context.Context, tableID string) ([]*fields.Field, error) {
	var result []*fields.Field
	for _, field := range m.fields {
		if fields.TableID == tableID {
			result = append(result, field)
		}
	}
	return result, nil
}

type mockRecordService struct {
	records map[string]*TestRecord
}

func (m *mockRecordService) GetByID(ctx context.Context, tableID, recordID string) (*TestRecord, error) {
	if rec, ok := m.records[recordID]; ok {
		return rec, nil
	}
	return nil, nil
}

func (m *mockRecordService) GetByIDs(ctx context.Context, tableID string, recordIDs []string) ([]*TestRecord, error) {
	var result []*TestRecord
	for _, id := range recordIDs {
		if rec, ok := m.records[id]; ok {
			result = append(result, rec)
		}
	}
	return result, nil
}

func (m *mockRecordService) GetByTableID(ctx context.Context, tableID string) ([]*TestRecord, error) {
	var result []*TestRecord
	for _, rec := range m.records {
		result = append(result, rec)
	}
	return result, nil
}

func (m *mockRecordService) Update(ctx context.Context, rec *TestRecord) error {
	m.records[rec.ID] = rec
	return nil
}

// 测试依赖图构建
func TestDependencyGraph_BuildGraph(t *testing.T) {
	graph := NewDependencyGraph()

	// 创建测试字段
	fieldA := &Field{ID: "fld_a", Name: "FieldA"}
	fieldB := &Field{ID: "fld_b", Name: "FieldB"}
	fieldC := &Field{ID: "fld_c", Name: "FieldC"}

	// 添加节点: C 依赖 B, B 依赖 A
	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"fld_a"})
	graph.AddNode(fieldC, []string{"fld_b"})

	// 验证节点
	if len(graph.Nodes) != 3 {
		t.Errorf("期望 3 个节点，实际 %d", len(graph.Nodes))
	}

	// 验证边
	if len(graph.GetDependents("fld_a")) != 1 {
		t.Errorf("fld_a 应该有 1 个依赖者")
	}
	if graph.GetDependents("fld_a")[0] != "fld_b" {
		t.Errorf("fld_a 的依赖者应该是 fld_b")
	}
}

// 测试拓扑排序
func TestDependencyGraph_TopologicalSort(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "fld_a", Name: "A", TableID: "table1"}
	fieldB := &Field{ID: "fld_b", Name: "B", TableID: "table1"}
	fieldC := &Field{ID: "fld_c", Name: "C", TableID: "table1"}

	// A → B → C 的依赖链
	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"fld_a"})
	graph.AddNode(fieldC, []string{"fld_b"})

	// 拓扑排序
	order, err := graph.TopologicalSort([]string{"fld_a"})
	if err != nil {
		t.Fatalf("拓扑排序失败: %v", err)
	}

	// 验证顺序: 应该是 A → B → C
	if len(order) < 2 {
		t.Fatalf("期望至少 2 个节点，实际 %d", len(order))
	}

	// A 应该在 B 之前
	aIndex := -1
	bIndex := -1
	for i, node := range order {
		if node.FieldID == "fld_a" {
			aIndex = i
		}
		if node.FieldID == "fld_b" {
			bIndex = i
		}
	}

	if aIndex == -1 || bIndex == -1 {
		t.Fatal("未找到字段 A 或 B")
	}

	if aIndex > bIndex {
		t.Error("A 应该在 B 之前")
	}
}

// 测试循环依赖检测
func TestDependencyGraph_CircularDependency(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "fld_a", Name: "A", TableID: "table1"}
	fieldB := &Field{ID: "fld_b", Name: "B", TableID: "table1"}

	// 创建循环: A → B → A
	graph.AddNode(fieldA, []string{"fld_b"}) // A 依赖 B
	graph.AddNode(fieldB, []string{"fld_a"}) // B 依赖 A

	// 检测循环依赖
	hasCircular, cycle := graph.HasCircularDependency()
	if !hasCircular {
		t.Error("应该检测到循环依赖")
	}

	if len(cycle) == 0 {
		t.Error("应该返回循环路径")
	}

	t.Logf("检测到循环: %v", cycle)
}

// 测试引用计算服务
func TestReferenceCalculationService_ExtractDependencies(t *testing.T) {
	fieldRepo := &mockFieldRepository{fields: make(map[string]*fields.Field)}
	recordService := &mockRecordService{records: make(map[string]*record.Record)}
	evaluator := NewDefaultFormulaEvaluator()

	service := NewReferenceCalculationService(fieldRepo, recordService, evaluator)

	tests := []struct {
		name     string
		field    *Field
		expected []string
	}{
		{
			name: "Formula 字段提取依赖",
			field: &Field{
				ID:   "fld_formula",
				Type: FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{field_a} + {field_b}",
				},
			},
			expected: []string{"field_a", "field_b"},
		},
		{
			name: "Rollup 字段提取依赖",
			field: &Field{
				ID:   "fld_rollup",
				Type: FieldTypeRollup,
				Options: &FieldOptions{
					RollupLinkFieldID: "link_field",
				},
			},
			expected: []string{"link_field"},
		},
		{
			name: "Lookup 字段提取依赖",
			field: &Field{
				ID:   "fld_lookup",
				Type: FieldTypeLookup,
				Options: &FieldOptions{
					LookupLinkFieldID: "link_field",
				},
			},
			expected: []string{"link_field"},
		},
		{
			name: "普通字段无依赖",
			field: &Field{
				ID:   "fld_text",
				Type: FieldTypeText,
			},
			expected: []string{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			deps := service.extractDependencies(tt.field)

			if len(deps) != len(tt.expected) {
				t.Errorf("期望 %d 个依赖，实际 %d", len(tt.expected), len(deps))
				return
			}

			for i, dep := range deps {
				if dep != tt.expected[i] {
					t.Errorf("依赖 %d: 期望 %s，实际 %s", i, tt.expected[i], dep)
				}
			}
		})
	}
}

// 测试完整的引用计算流程
func TestReferenceCalculationService_CalculateReferences(t *testing.T) {
	ctx := context.Background()

	// 设置测试数据
	fieldRepo := &mockFieldRepository{
		fields: map[string]*fields.Field{
			"fld_score": {
				ID:      "fld_score",
				TableID: "table1",
				Type:    FieldTypeNumber,
			},
			"fld_total": {
				ID:      "fld_total",
				TableID: "table1",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_score} * 2",
				},
			},
			"fld_avg": {
				ID:      "fld_avg",
				TableID: "table1",
				Type:    FieldTypeFormula,
				Options: &FieldOptions{
					Expression: "{fld_total} / 2",
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
					"fld_score": 50.0,
				},
			},
		},
	}

	evaluator := NewDefaultFormulaEvaluator()
	service := NewReferenceCalculationService(fieldRepo, recordService, evaluator)

	// 执行引用计算
	err := service.CalculateReferences(
		ctx,
		"table1",
		[]string{"rec1"},
		[]string{"fld_score"},
	)

	if err != nil {
		t.Fatalf("引用计算失败: %v", err)
	}

	// 验证结果
	rec := recordService.records["rec1"]

	// 检查 total 字段 (50 * 2 = 100)
	if total, ok := rec.Data["fld_total"].(float64); ok {
		if total != 100.0 {
			t.Errorf("fld_total: 期望 100.0，实际 %f", total)
		}
	} else {
		t.Error("fld_total 未计算或类型错误")
	}

	// 检查 avg 字段 (100 / 2 = 50)
	if avg, ok := rec.Data["fld_avg"].(float64); ok {
		if avg != 50.0 {
			t.Errorf("fld_avg: 期望 50.0，实际 %f", avg)
		}
	} else {
		t.Error("fld_avg 未计算或类型错误")
	}

	t.Log("✅ 引用计算测试通过")
}

// 测试过滤图
func TestDependencyGraph_FilterGraph(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "fld_a", Name: "A", TableID: "table1"}
	fieldB := &Field{ID: "fld_b", Name: "B", TableID: "table1"}
	fieldC := &Field{ID: "fld_c", Name: "C", TableID: "table1"}
	fieldD := &Field{ID: "fld_d", Name: "D", TableID: "table1"}

	// A → B → C, D 独立
	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"fld_a"})
	graph.AddNode(fieldC, []string{"fld_b"})
	graph.AddNode(fieldD, []string{})

	// 过滤：只保留从 A 开始的节点
	filtered := graph.FilterGraph([]string{"fld_a"})

	// 应该包含 A, B, C，不包含 D
	if len(filtered.Nodes) != 3 {
		t.Errorf("过滤后期望 3 个节点，实际 %d", len(filtered.Nodes))
	}

	if _, ok := filtered.Nodes["fld_d"]; ok {
		t.Error("不应该包含独立节点 D")
	}

	t.Log("✅ 图过滤测试通过")
}

// 基准测试：批量计算性能
func BenchmarkReferenceCalculation(b *testing.B) {
	ctx := context.Background()

	// 创建 1000 个字段和记录
	fieldRepo := &mockFieldRepository{fields: make(map[string]*fields.Field)}
	recordService := &mockRecordService{records: make(map[string]*record.Record)}

	for i := 0; i < 100; i++ {
		fieldID := "fld_" + string(rune(i))
		fieldRepo.fields[fieldID] = &Field{
			ID:      fieldID,
			TableID: "table1",
			Type:    FieldTypeNumber,
		}

		recordService.records["rec_"+string(rune(i))] = &record.Record{
			ID:      "rec_" + string(rune(i)),
			TableID: "table1",
			Data:    map[string]interface{}{fieldID: float64(i)},
		}
	}

	evaluator := NewDefaultFormulaEvaluator()
	service := NewReferenceCalculationService(fieldRepo, recordService, evaluator)

	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		service.CalculateReferences(ctx, "table1", []string{"rec_0"}, []string{"fld_0"})
	}
}
