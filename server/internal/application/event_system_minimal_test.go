package application

import (
	"testing"

	recordEvent "github.com/easyspace-ai/luckdb/server/internal/domain/record/event"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record/valueobject"
	"github.com/stretchr/testify/assert"
)

// TestEventSystemMinimal 测试事件系统最小功能
func TestEventSystemMinimal(t *testing.T) {
	t.Run("测试记录创建事件", func(t *testing.T) {
		// 创建测试记录ID
		recordID := valueobject.NewRecordID("rec_test123")

		// 创建记录创建事件
		event := recordEvent.NewRecordCreated(
			recordID,
			"tbl_test123",
			"user_test456",
		)

		// 验证事件属性
		assert.Equal(t, "record.created", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "record", event.AggregateType())
		assert.NotEmpty(t, event.EventID())
		assert.NotZero(t, event.OccurredAt())
		assert.Equal(t, "tbl_test123", event.TableID())
		assert.Equal(t, "user_test456", event.CreatedBy())
	})

	t.Run("测试记录更新事件", func(t *testing.T) {
		// 创建测试记录ID
		recordID := valueobject.NewRecordID("rec_updated_test")
		changedFields := []string{"field1", "field2"}

		// 创建记录更新事件
		event := recordEvent.NewRecordUpdated(
			recordID,
			"tbl_updated_test",
			"user_updated_test",
			changedFields,
		)

		// 验证事件属性
		assert.Equal(t, "record.updated", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "record", event.AggregateType())
		assert.NotEmpty(t, event.EventID())
		assert.NotZero(t, event.OccurredAt())
		assert.Equal(t, "tbl_updated_test", event.TableID())
		assert.Equal(t, "user_updated_test", event.UpdatedBy())
		assert.Equal(t, changedFields, event.ChangedFields())
	})

	t.Run("测试记录删除事件", func(t *testing.T) {
		// 创建测试记录ID
		recordID := valueobject.NewRecordID("rec_deleted_test")

		// 创建记录删除事件
		event := recordEvent.NewRecordDeleted(
			recordID,
			"tbl_deleted_test",
			"user_deleted_test",
		)

		// 验证事件属性
		assert.Equal(t, "record.deleted", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "record", event.AggregateType())
		assert.NotEmpty(t, event.EventID())
		assert.NotZero(t, event.OccurredAt())
		assert.Equal(t, "tbl_deleted_test", event.TableID())
		assert.Equal(t, "user_deleted_test", event.DeletedBy())
	})
}

// TestEventSystemArchitecture 测试事件系统架构
func TestEventSystemArchitecture(t *testing.T) {
	t.Run("验证事件接口实现", func(t *testing.T) {
		// 创建测试事件
		recordID := valueobject.NewRecordID("rec_interface_test")
		event := recordEvent.NewRecordCreated(
			recordID,
			"tbl_interface_test",
			"user_interface_test",
		)

		// 验证事件实现了基本的接口方法
		assert.NotEmpty(t, event.EventID())
		assert.NotEmpty(t, event.EventType())
		assert.NotEmpty(t, event.AggregateID())
		assert.NotEmpty(t, event.AggregateType())
		assert.Greater(t, event.Version(), int64(0))
		assert.NotNil(t, event.Data())
		assert.NotNil(t, event.Metadata())
		assert.NotZero(t, event.OccurredAt())
	})

	t.Run("验证事件数据结构", func(t *testing.T) {
		// 创建测试事件
		recordID := valueobject.NewRecordID("rec_data_test")
		event := recordEvent.NewRecordCreated(
			recordID,
			"tbl_data_test",
			"user_data_test",
		)

		// 验证事件数据
		data := event.Data()
		assert.NotNil(t, data)

		metadata := event.Metadata()
		assert.NotNil(t, metadata)

		version := event.Version()
		assert.Greater(t, version, int64(0))
	})
}
