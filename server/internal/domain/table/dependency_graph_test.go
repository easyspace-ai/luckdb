package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"testing"
)

// TestTopologicalSort_SimpleChain 测试简单依赖链
// A -> B -> C
func TestTopologicalSort_SimpleChain(t *testing.T) {
	graph := NewDependencyGraph()

	// 创建字段 A, B, C
	fieldA := &Field{ID: "A", Name: "FieldA", Type: FieldTypeText}
	fieldB := &Field{ID: "B", Name: "FieldB", Type: FieldTypeFormula}
	fieldC := &Field{ID: "C", Name: "FieldC", Type: FieldTypeFormula}

	// B 依赖 A, C 依赖 B
	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"A"})
	graph.AddNode(fieldC, []string{"B"})

	// 从 C 开始计算
	result, err := graph.TopologicalSort([]string{"C"})
	if err != nil {
		t.Fatalf("TopologicalSort failed: %v", err)
	}

	// 应该按 A -> B -> C 的顺序
	if len(result) != 3 {
		t.Fatalf("Expected 3 nodes, got %d", len(result))
	}

	// 验证顺序：A 必须在 B 前面，B 必须在 C 前面
	nodeOrder := make(map[string]int)
	for i, node := range result {
		nodeOrder[node.FieldID] = i
	}

	if nodeOrder["A"] >= nodeOrder["B"] {
		t.Errorf("A should come before B")
	}
	if nodeOrder["B"] >= nodeOrder["C"] {
		t.Errorf("B should come before C")
	}
}

// TestTopologicalSort_ComplexDependencies 测试复杂网状依赖
//
//	  A
//	 / \
//	B   C
//	 \ /
//	  D
func TestTopologicalSort_ComplexDependencies(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "A", Name: "FieldA", Type: FieldTypeText}
	fieldB := &Field{ID: "B", Name: "FieldB", Type: FieldTypeFormula}
	fieldC := &Field{ID: "C", Name: "FieldC", Type: FieldTypeFormula}
	fieldD := &Field{ID: "D", Name: "FieldD", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"A"})
	graph.AddNode(fieldC, []string{"A"})
	graph.AddNode(fieldD, []string{"B", "C"})

	result, err := graph.TopologicalSort([]string{"D"})
	if err != nil {
		t.Fatalf("TopologicalSort failed: %v", err)
	}

	// 应该包含所有4个节点
	if len(result) != 4 {
		t.Fatalf("Expected 4 nodes, got %d", len(result))
	}

	// 验证依赖顺序
	nodeOrder := make(map[string]int)
	for i, node := range result {
		nodeOrder[node.FieldID] = i
	}

	// A 必须在 B 和 C 前面
	if nodeOrder["A"] >= nodeOrder["B"] {
		t.Errorf("A should come before B")
	}
	if nodeOrder["A"] >= nodeOrder["C"] {
		t.Errorf("A should come before C")
	}

	// B 和 C 都必须在 D 前面
	if nodeOrder["B"] >= nodeOrder["D"] {
		t.Errorf("B should come before D")
	}
	if nodeOrder["C"] >= nodeOrder["D"] {
		t.Errorf("C should come before D")
	}
}

// TestCircularDependency 测试循环依赖检测
// A -> B -> C -> A (循环)
func TestCircularDependency(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "A", Name: "FieldA", Type: FieldTypeFormula}
	fieldB := &Field{ID: "B", Name: "FieldB", Type: FieldTypeFormula}
	fieldC := &Field{ID: "C", Name: "FieldC", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{"C"}) // A 依赖 C
	graph.AddNode(fieldB, []string{"A"}) // B 依赖 A
	graph.AddNode(fieldC, []string{"B"}) // C 依赖 B，形成循环

	// 检测循环依赖
	hasCycle, cycle := graph.HasCircularDependency()
	if !hasCycle {
		t.Fatal("Expected circular dependency to be detected")
	}

	if len(cycle) == 0 {
		t.Fatal("Expected cycle path to be returned")
	}

	t.Logf("Detected cycle: %v", cycle)

	// 拓扑排序应该失败
	_, err := graph.TopologicalSort([]string{"A"})
	if err == nil {
		t.Fatal("Expected TopologicalSort to fail with circular dependency")
	}

	t.Logf("TopologicalSort error: %v", err)
}

// TestFilterGraph 测试图过滤
func TestFilterGraph(t *testing.T) {
	graph := NewDependencyGraph()

	// 创建更复杂的图
	//     A
	//    / \
	//   B   C
	//   |   |
	//   D   E
	fieldA := &Field{ID: "A", Name: "FieldA", Type: FieldTypeText}
	fieldB := &Field{ID: "B", Name: "FieldB", Type: FieldTypeFormula}
	fieldC := &Field{ID: "C", Name: "FieldC", Type: FieldTypeFormula}
	fieldD := &Field{ID: "D", Name: "FieldD", Type: FieldTypeFormula}
	fieldE := &Field{ID: "E", Name: "FieldE", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"A"})
	graph.AddNode(fieldC, []string{"A"})
	graph.AddNode(fieldD, []string{"B"})
	graph.AddNode(fieldE, []string{"C"})

	// 只保留与 D 相关的节点（应该包含 A, B, D）
	filtered := graph.FilterGraph([]string{"D"})

	// 应该包含 A, B, D
	expectedNodes := map[string]bool{
		"A": true,
		"B": true,
		"D": true,
	}

	if len(filtered.Nodes) != len(expectedNodes) {
		t.Errorf("Expected %d nodes in filtered graph, got %d", len(expectedNodes), len(filtered.Nodes))
	}

	for nodeID := range expectedNodes {
		if filtered.Nodes[nodeID] == nil {
			t.Errorf("Expected node %s to be in filtered graph", nodeID)
		}
	}

	// E 不应该在过滤后的图中
	if filtered.Nodes["E"] != nil {
		t.Error("Node E should not be in filtered graph")
	}
}

// TestGetLeafNodes 测试叶子节点识别
func TestGetLeafNodes(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "A", Name: "FieldA", Type: FieldTypeText}
	fieldB := &Field{ID: "B", Name: "FieldB", Type: FieldTypeFormula}
	fieldC := &Field{ID: "C", Name: "FieldC", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"A"})
	graph.AddNode(fieldC, []string{"A"})

	leafNodes := graph.getLeafNodes()

	// B 和 C 是叶子节点（没有其他节点依赖它们）
	leafMap := make(map[string]bool)
	for _, nodeID := range leafNodes {
		leafMap[nodeID] = true
	}

	if !leafMap["B"] {
		t.Error("B should be a leaf node")
	}
	if !leafMap["C"] {
		t.Error("C should be a leaf node")
	}
	if leafMap["A"] {
		t.Error("A should not be a leaf node")
	}
}

// TestMultipleStartFields 测试多个起始字段
func TestMultipleStartFields(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "A", Name: "FieldA", Type: FieldTypeText}
	fieldB := &Field{ID: "B", Name: "FieldB", Type: FieldTypeFormula}
	fieldC := &Field{ID: "C", Name: "FieldC", Type: FieldTypeText}
	fieldD := &Field{ID: "D", Name: "FieldD", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"A"})
	graph.AddNode(fieldC, []string{})
	graph.AddNode(fieldD, []string{"C"})

	// 从 B 和 D 同时开始
	result, err := graph.TopologicalSort([]string{"B", "D"})
	if err != nil {
		t.Fatalf("TopologicalSort failed: %v", err)
	}

	// 应该包含所有4个节点
	if len(result) != 4 {
		t.Fatalf("Expected 4 nodes, got %d", len(result))
	}

	// 验证依赖顺序
	nodeOrder := make(map[string]int)
	for i, node := range result {
		nodeOrder[node.FieldID] = i
	}

	if nodeOrder["A"] >= nodeOrder["B"] {
		t.Errorf("A should come before B")
	}
	if nodeOrder["C"] >= nodeOrder["D"] {
		t.Errorf("C should come before D")
	}
}

// TestEmptyGraph 测试空图
func TestEmptyGraph(t *testing.T) {
	graph := NewDependencyGraph()

	result, err := graph.TopologicalSort([]string{})
	if err != nil {
		t.Fatalf("TopologicalSort failed on empty graph: %v", err)
	}

	if len(result) != 0 {
		t.Errorf("Expected empty result for empty graph, got %d nodes", len(result))
	}
}

// TestSelfReferencing 测试自引用（最简单的循环）
func TestSelfReferencing(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "A", Name: "FieldA", Type: FieldTypeFormula}

	// A 依赖 A 自己
	graph.AddNode(fieldA, []string{"A"})

	// 应该检测到循环
	hasCycle, cycle := graph.HasCircularDependency()
	if !hasCycle {
		t.Fatal("Expected self-referencing to be detected as cycle")
	}

	t.Logf("Self-reference cycle: %v", cycle)

	_, err := graph.TopologicalSort([]string{"A"})
	if err == nil {
		t.Fatal("Expected TopologicalSort to fail with self-reference")
	}
}
