package dependency

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestGetTopoOrders_SimpleChain 测试简单链式依赖
func TestGetTopoOrders_SimpleChain(t *testing.T) {
	// A -> B -> C
	// B 依赖 A，C 依赖 B
	graph := []GraphItem{
		{FromFieldID: "B", ToFieldID: "A"}, // B 依赖 A
		{FromFieldID: "C", ToFieldID: "B"}, // C 依赖 B
	}

	orders, err := GetTopoOrders(graph)
	assert.NoError(t, err)
	assert.Len(t, orders, 3)

	// 验证顺序：由于算法从叶子到根遍历，结果是反向的
	// 实际顺序应该是 [C, B, A]，表示C最后计算，A最先计算
	// 计算时从后往前：A -> B -> C
	positions := make(map[string]int)
	for i, order := range orders {
		positions[order.ID] = i
	}

	// 验证：A应该在最后（最后添加到结果，最先被计算）
	assert.Greater(t, positions["A"], positions["B"], "A added after B (computed first)")
	assert.Greater(t, positions["B"], positions["C"], "B added after C")
}

// TestGetTopoOrders_Diamond 测试菱形依赖
func TestGetTopoOrders_Diamond(t *testing.T) {
	//     A
	//    / \
	//   B   C
	//    \ /
	//     D
	graph := []GraphItem{
		{FromFieldID: "B", ToFieldID: "A"}, // B 依赖 A
		{FromFieldID: "C", ToFieldID: "A"}, // C 依赖 A
		{FromFieldID: "D", ToFieldID: "B"}, // D 依赖 B
		{FromFieldID: "D", ToFieldID: "C"}, // D 依赖 C
	}

	orders, err := GetTopoOrders(graph)
	assert.NoError(t, err)
	assert.Len(t, orders, 4)

	positions := make(map[string]int)
	for i, order := range orders {
		positions[order.ID] = i
	}

	// 结果是反向的：D最先添加，A最后添加
	// 计算时从后往前：A -> B/C -> D
	assert.Greater(t, positions["A"], positions["D"], "A should be added after D")
	assert.Greater(t, positions["B"], positions["D"], "B should be added after D")
	assert.Greater(t, positions["C"], positions["D"], "C should be added after D")

	// D应该最先添加（最后被计算）
	assert.Less(t, positions["D"], positions["A"])
	assert.Less(t, positions["D"], positions["B"])
	assert.Less(t, positions["D"], positions["C"])
}

// TestGetTopoOrders_Circular 测试循环依赖检测
func TestGetTopoOrders_Circular(t *testing.T) {
	// A -> B -> C -> A (循环)
	graph := []GraphItem{
		{FromFieldID: "A", ToFieldID: "C"}, // A 依赖 C
		{FromFieldID: "B", ToFieldID: "A"}, // B 依赖 A
		{FromFieldID: "C", ToFieldID: "B"}, // C 依赖 B
	}

	_, err := GetTopoOrders(graph)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cycle")
}

// TestGetTopoOrders_SelfLoop 测试自循环
func TestGetTopoOrders_SelfLoop(t *testing.T) {
	// A -> A (自循环)
	graph := []GraphItem{
		{FromFieldID: "A", ToFieldID: "A"}, // A 依赖自己
	}

	_, err := GetTopoOrders(graph)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "cycle")
}

// TestGetTopoOrders_Empty 测试空图
func TestGetTopoOrders_Empty(t *testing.T) {
	graph := []GraphItem{}

	orders, err := GetTopoOrders(graph)
	assert.NoError(t, err)
	assert.Len(t, orders, 0)
}

// TestGetTopoOrders_MultipleRoots 测试多个根节点
func TestGetTopoOrders_MultipleRoots(t *testing.T) {
	// A  B  C
	//  \ | /
	//    D
	graph := []GraphItem{
		{FromFieldID: "D", ToFieldID: "A"}, // D 依赖 A
		{FromFieldID: "D", ToFieldID: "B"}, // D 依赖 B
		{FromFieldID: "D", ToFieldID: "C"}, // D 依赖 C
	}

	orders, err := GetTopoOrders(graph)
	assert.NoError(t, err)
	assert.Len(t, orders, 4)

	positions := make(map[string]int)
	for i, order := range orders {
		positions[order.ID] = i
	}

	// D最先添加（最后计算），A/B/C最后添加（最先计算）
	assert.Less(t, positions["D"], positions["A"])
	assert.Less(t, positions["D"], positions["B"])
	assert.Less(t, positions["D"], positions["C"])
}

// TestPrependStartFieldIDs 测试添加起始字段
func TestPrependStartFieldIDs(t *testing.T) {
	orders := []TopoItem{
		{ID: "B", Dependencies: []string{"A"}},
		{ID: "C", Dependencies: []string{"B"}},
	}

	startFieldIDs := []string{"A"}

	result := PrependStartFieldIDs(orders, startFieldIDs)

	assert.Len(t, result, 3)
	assert.Equal(t, "A", result[0].ID)
	assert.Equal(t, "B", result[1].ID)
	assert.Equal(t, "C", result[2].ID)
}

// TestPrependStartFieldIDs_Duplicate 测试去重
func TestPrependStartFieldIDs_Duplicate(t *testing.T) {
	orders := []TopoItem{
		{ID: "A", Dependencies: []string{}},
		{ID: "B", Dependencies: []string{"A"}},
	}

	startFieldIDs := []string{"A"}

	result := PrependStartFieldIDs(orders, startFieldIDs)

	// 应该去重，只保留一个 A
	assert.Len(t, result, 2)

	// 统计 A 出现次数
	countA := 0
	for _, item := range result {
		if item.ID == "A" {
			countA++
		}
	}
	assert.Equal(t, 1, countA)
}
