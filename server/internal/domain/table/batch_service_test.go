package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"context"
	"testing"
)

// TestBatchService_MergeUpdatesByRecord 测试合并同一记录的多个字段更新
func TestBatchService_MergeUpdatesByRecord(t *testing.T) {
	service := &BatchService{}

	updates := []RecordUpdate{
		{TableID: "table1", RecordID: "rec1", FieldID: "field1", Value: "value1"},
		{TableID: "table1", RecordID: "rec1", FieldID: "field2", Value: "value2"},
		{TableID: "table1", RecordID: "rec2", FieldID: "field1", Value: "value3"},
	}

	merged := service.mergeUpdatesByRecord(updates)

	// 应该合并为2条记录
	if len(merged) != 2 {
		t.Errorf("Expected 2 merged records, got %d", len(merged))
	}

	// 验证rec1有2个字段更新
	var rec1Found bool
	for _, record := range merged {
		if record.RecordID == "rec1" {
			rec1Found = true
			if len(record.Updates) != 2 {
				t.Errorf("Expected rec1 to have 2 field updates, got %d", len(record.Updates))
			}
			if record.Updates["field1"] != "value1" {
				t.Error("Field1 value mismatch")
			}
			if record.Updates["field2"] != "value2" {
				t.Error("Field2 value mismatch")
			}
		}
	}

	if !rec1Found {
		t.Error("rec1 not found in merged results")
	}
}

// TestBatchService_SplitIntoBatches 测试分批逻辑
func TestBatchService_SplitIntoBatches(t *testing.T) {
	service := &BatchService{}

	// 创建10条记录
	updates := make([]BatchRecordUpdate, 10)
	for i := 0; i < 10; i++ {
		updates[i] = BatchRecordUpdate{RecordID: string(rune('A' + i))}
	}

	// 分成每批3条
	batches := service.splitIntoBatches(updates, 3)

	// 应该分成4批：3+3+3+1
	if len(batches) != 4 {
		t.Errorf("Expected 4 batches, got %d", len(batches))
	}

	// 验证批次大小
	expectedSizes := []int{3, 3, 3, 1}
	for i, batch := range batches {
		if len(batch) != expectedSizes[i] {
			t.Errorf("Batch %d: expected size %d, got %d", i, expectedSizes[i], len(batch))
		}
	}
}

// TestBatchService_GroupUpdatesByTable 测试按表分组
func TestBatchService_GroupUpdatesByTable(t *testing.T) {
	service := &BatchService{}

	updates := []RecordUpdate{
		{TableID: "table1", RecordID: "rec1", FieldID: "field1", Value: "value1"},
		{TableID: "table2", RecordID: "rec2", FieldID: "field2", Value: "value2"},
		{TableID: "table1", RecordID: "rec3", FieldID: "field3", Value: "value3"},
	}

	grouped := service.groupUpdatesByTable(updates)

	// 应该分成2个表
	if len(grouped) != 2 {
		t.Errorf("Expected 2 tables, got %d", len(grouped))
	}

	// table1应该有2条更新
	if len(grouped["table1"]) != 2 {
		t.Errorf("Expected 2 updates for table1, got %d", len(grouped["table1"]))
	}

	// table2应该有1条更新
	if len(grouped["table2"]) != 1 {
		t.Errorf("Expected 1 update for table2, got %d", len(grouped["table2"]))
	}
}

// TestBatchService_GetOptimalBatchSize 测试动态批量大小计算
func TestBatchService_GetOptimalBatchSize(t *testing.T) {
	service := &BatchService{}

	tests := []struct {
		totalRecords int
		expectedSize int
	}{
		{50, 50},      // 小于100，返回原值
		{500, 100},    // 100-1000，返回100
		{5000, 500},   // 1000-10000，返回500
		{50000, 1000}, // 大于10000，返回1000
	}

	for _, test := range tests {
		size := service.GetOptimalBatchSize(test.totalRecords)
		if size != test.expectedSize {
			t.Errorf("For %d records, expected batch size %d, got %d",
				test.totalRecords, test.expectedSize, size)
		}
	}
}

// TestBatchService_SplitRecordIDsIntoBatches 测试记录ID分批
func TestBatchService_SplitRecordIDsIntoBatches(t *testing.T) {
	service := &BatchService{}

	recordIDs := []string{"r1", "r2", "r3", "r4", "r5", "r6", "r7"}
	batches := service.splitRecordIDsIntoBatches(recordIDs, 3)

	// 应该分成3批：3+3+1
	if len(batches) != 3 {
		t.Errorf("Expected 3 batches, got %d", len(batches))
	}

	// 验证总数
	total := 0
	for _, batch := range batches {
		total += len(batch)
	}

	if total != len(recordIDs) {
		t.Errorf("Expected total %d record IDs, got %d", len(recordIDs), total)
	}
}

// ExampleBatchService_BatchUpdateRecords 演示批量更新的使用
func ExampleBatchService_BatchUpdateRecords() {
	// 注意：这是一个示例，实际使用需要真实的数据库连接
	ctx := context.Background()

	// 创建批量服务（需要真实的DB连接）
	// service := NewBatchService(db, fieldRepo)

	// 准备批量更新
	updates := []RecordUpdate{
		{
			TableID:  "table_students",
			RecordID: "student_1",
			FieldID:  "field_grade",
			Value:    95,
		},
		{
			TableID:  "table_students",
			RecordID: "student_1",
			FieldID:  "field_updated",
			Value:    "2025-10-09",
		},
		{
			TableID:  "table_students",
			RecordID: "student_2",
			FieldID:  "field_grade",
			Value:    88,
		},
	}

	// 执行批量更新
	// err := service.BatchUpdateRecords(ctx, updates)
	// if err != nil {
	//     log.Fatal(err)
	// }

	_ = ctx
	_ = updates
}

// BenchmarkBatchService_MergeUpdates 性能测试：合并更新
func BenchmarkBatchService_MergeUpdates(b *testing.B) {
	service := &BatchService{}

	// 准备1000条更新
	updates := make([]RecordUpdate, 1000)
	for i := 0; i < 1000; i++ {
		updates[i] = RecordUpdate{
			TableID:  "table1",
			RecordID: string(rune('A' + (i % 100))), // 100条不同的记录
			FieldID:  string(rune('F' + (i % 10))),  // 10个不同的字段
			Value:    i,
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.mergeUpdatesByRecord(updates)
	}
}

// BenchmarkBatchService_GroupByTable 性能测试：按表分组
func BenchmarkBatchService_GroupByTable(b *testing.B) {
	service := &BatchService{}

	// 准备1000条更新
	updates := make([]RecordUpdate, 1000)
	for i := 0; i < 1000; i++ {
		updates[i] = RecordUpdate{
			TableID:  string(rune('T' + (i % 5))), // 5个不同的表
			RecordID: string(rune('R' + i)),
			FieldID:  "field1",
			Value:    i,
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		service.groupUpdatesByTable(updates)
	}
}
