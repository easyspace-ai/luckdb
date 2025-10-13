package dependency

import (
	"fmt"
	"testing"
)

// TestDebugTopoOrder 调试拓扑排序结果
func TestDebugTopoOrder(t *testing.T) {
	// A -> B -> C
	// B 依赖 A，C 依赖 B
	graph := []GraphItem{
		{FromFieldID: "B", ToFieldID: "A"}, // B 依赖 A
		{FromFieldID: "C", ToFieldID: "B"}, // C 依赖 B
	}

	orders, err := GetTopoOrders(graph)
	if err != nil {
		t.Fatal(err)
	}

	fmt.Println("=== 拓扑排序结果 ===")
	for i, order := range orders {
		fmt.Printf("[%d] ID=%s, Dependencies=%v\n", i, order.ID, order.Dependencies)
	}
}
