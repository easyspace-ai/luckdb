package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"fmt"
	"testing"
)

// ExampleTopologicalSort 演示拓扑排序的基本用法
func ExampleTopologicalSort() {
	// 创建依赖图
	graph := NewDependencyGraph()

	// 创建字段: A -> B -> C (C依赖B, B依赖A)
	fieldA := &Field{
		ID:   "field_a",
		Name: "FieldA",
		Type: FieldTypeText,
	}

	fieldB := &Field{
		ID:   "field_b",
		Name: "FieldB",
		Type: FieldTypeFormula,
		Options: &FieldOptions{
			Expression: "{FieldA} * 2",
		},
	}

	fieldC := &Field{
		ID:   "field_c",
		Name: "FieldC",
		Type: FieldTypeFormula,
		Options: &FieldOptions{
			Expression: "{FieldB} + 10",
		},
	}

	// 添加到图中
	graph.AddNode(fieldA, []string{})          // A无依赖
	graph.AddNode(fieldB, []string{"field_a"}) // B依赖A
	graph.AddNode(fieldC, []string{"field_b"}) // C依赖B

	// 执行拓扑排序
	result, err := graph.TopologicalSort([]string{"field_c"})
	if err != nil {
		fmt.Printf("Error: %v\n", err)
		return
	}

	// 输出计算顺序
	fmt.Println("Calculation order:")
	for i, node := range result {
		fmt.Printf("%d. %s (depends on: %v)\n", i+1, node.FieldID, node.Dependencies)
	}

	// Output:
	// Calculation order:
	// 1. field_a (depends on: [])
	// 2. field_b (depends on: [field_a])
	// 3. field_c (depends on: [field_b])
}

// ExampleCircularDependencyDetection 演示循环依赖检测
func ExampleCircularDependencyDetection() {
	graph := NewDependencyGraph()

	// 创建循环依赖: A -> B -> C -> A
	fieldA := &Field{ID: "field_a", Name: "FieldA", Type: FieldTypeFormula}
	fieldB := &Field{ID: "field_b", Name: "FieldB", Type: FieldTypeFormula}
	fieldC := &Field{ID: "field_c", Name: "FieldC", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{"field_c"}) // A依赖C
	graph.AddNode(fieldB, []string{"field_a"}) // B依赖A
	graph.AddNode(fieldC, []string{"field_b"}) // C依赖B -> 形成循环

	// 检测循环依赖
	hasCycle, cycle := graph.HasCircularDependency()
	if hasCycle {
		fmt.Printf("Circular dependency detected: %v\n", cycle)
	}

	// Output:
	// Circular dependency detected: [field_a field_c field_b field_a]
}

// TestDependencyGraph_BasicFunctionality 基础功能测试
func TestDependencyGraph_BasicFunctionality(t *testing.T) {
	graph := NewDependencyGraph()

	// 测试AddNode
	field := &Field{ID: "test", Name: "Test", Type: FieldTypeText}
	graph.AddNode(field, []string{})

	if graph.Nodes["test"] == nil {
		t.Error("Node was not added to graph")
	}

	if !graph.allNodes["test"] {
		t.Error("Node was not added to allNodes set")
	}
}

// TestDependencyGraph_EdgeConstruction 测试边构建
func TestDependencyGraph_EdgeConstruction(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "A", Name: "A", Type: FieldTypeText}
	fieldB := &Field{ID: "B", Name: "B", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"A"}) // B依赖A

	// 检查正向边: A -> B
	if len(graph.Edges["A"]) != 1 || graph.Edges["A"][0] != "B" {
		t.Error("Forward edge A->B was not created correctly")
	}

	// 检查反向边: B -> A
	if len(graph.ReverseEdges["B"]) != 1 || graph.ReverseEdges["B"][0] != "A" {
		t.Error("Reverse edge B->A was not created correctly")
	}
}

// TestGetLeafNodes 测试获取叶子节点
func TestGetLeafNodes(t *testing.T) {
	graph := NewDependencyGraph()

	fieldA := &Field{ID: "A", Name: "A", Type: FieldTypeText}
	fieldB := &Field{ID: "B", Name: "B", Type: FieldTypeFormula}
	fieldC := &Field{ID: "C", Name: "C", Type: FieldTypeFormula}

	graph.AddNode(fieldA, []string{})
	graph.AddNode(fieldB, []string{"A"})
	graph.AddNode(fieldC, []string{"A"})

	leafNodes := graph.getLeafNodes()

	// B和C是叶子节点（没有其他节点依赖它们）
	found := make(map[string]bool)
	for _, node := range leafNodes {
		found[node] = true
	}

	if !found["B"] || !found["C"] {
		t.Errorf("Expected B and C to be leaf nodes, got %v", leafNodes)
	}

	if found["A"] {
		t.Error("A should not be a leaf node")
	}
}
