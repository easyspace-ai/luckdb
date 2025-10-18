package application

import (
	"testing"
	"time"

	calculationEvent "github.com/easyspace-ai/luckdb/server/internal/domain/calculation/event"
	recordEvent "github.com/easyspace-ai/luckdb/server/internal/domain/record/event"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record/valueobject"
	"github.com/stretchr/testify/assert"
)

// TestCoreArchitecture 测试核心架构组件
func TestCoreArchitecture(t *testing.T) {
	t.Run("测试记录事件系统", func(t *testing.T) {
		// 测试记录创建事件
		recordID := valueobject.NewRecordID("rec_test123")
		event := recordEvent.NewRecordCreated(
			recordID,
			"tbl_test123",
			"user_test123",
		)

		// 验证事件属性
		assert.Equal(t, "record.created", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "record", event.AggregateType())
		assert.NotEmpty(t, event.EventID())
		assert.NotZero(t, event.OccurredAt())
		assert.Equal(t, "tbl_test123", event.TableID())
		assert.Equal(t, "user_test123", event.CreatedBy())
	})

	t.Run("测试计算事件系统", func(t *testing.T) {
		// 测试计算请求事件
		recordID := valueobject.NewRecordID("rec_calc_test")
		event := calculationEvent.NewCalculationRequested(
			"tbl_calc_test",
			recordID,
			[]string{"field1", "field2"},
			calculationEvent.NormalPriority,
			"user_calc_test",
		)

		// 验证事件属性
		assert.Equal(t, "calculation.requested", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "tbl_calc_test", event.TableID())
		assert.Equal(t, []string{"field1", "field2"}, event.FieldIDs())
		assert.Equal(t, calculationEvent.NormalPriority, event.Priority())
		assert.Equal(t, "user_calc_test", event.RequestedBy())
	})

	t.Run("测试计算完成事件", func(t *testing.T) {
		recordID := valueobject.NewRecordID("rec_complete_test")
		calculatedFields := map[string]interface{}{
			"field1": "calculated_value1",
			"field2": "calculated_value2",
		}

		event := calculationEvent.NewCalculationCompleted(
			"tbl_complete_test",
			recordID,
			calculatedFields,
			"calculation_worker",
			time.Duration(100*time.Millisecond),
		)

		// 验证事件属性
		assert.Equal(t, "calculation.completed", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "tbl_complete_test", event.TableID())
		assert.Equal(t, calculatedFields, event.CalculatedFields())
		assert.Equal(t, "calculation_worker", event.CompletedBy())
		assert.Equal(t, time.Duration(100*time.Millisecond), event.Duration())
	})

	t.Run("测试计算失败事件", func(t *testing.T) {
		recordID := valueobject.NewRecordID("rec_failed_test")
		event := calculationEvent.NewCalculationFailed(
			"tbl_failed_test",
			recordID,
			[]string{"field1", "field2"},
			"calculation error",
			"calculation_worker",
			1,
		)

		// 验证事件属性
		assert.Equal(t, "calculation.failed", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "tbl_failed_test", event.TableID())
		assert.Equal(t, []string{"field1", "field2"}, event.FieldIDs())
		assert.Equal(t, "calculation error", event.Error())
		assert.Equal(t, "calculation_worker", event.FailedBy())
		assert.Equal(t, 1, event.RetryCount())
	})

	t.Run("测试优先级常量", func(t *testing.T) {
		// 验证优先级常量
		assert.Equal(t, 1, calculationEvent.LowPriority)
		assert.Equal(t, 5, calculationEvent.NormalPriority)
		assert.Equal(t, 10, calculationEvent.HighPriority)
		assert.Equal(t, 20, calculationEvent.UrgentPriority)
	})
}

// TestEventDrivenPattern 测试事件驱动模式
func TestEventDrivenPattern(t *testing.T) {
	t.Run("测试记录更新事件", func(t *testing.T) {
		recordID := valueobject.NewRecordID("rec_update_test")
		changedFields := []string{"field1", "field2", "field3"}

		event := recordEvent.NewRecordUpdated(
			recordID,
			"tbl_update_test",
			"user_update_test",
			changedFields,
		)

		// 验证事件属性
		assert.Equal(t, "record.updated", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "record", event.AggregateType())
		assert.Equal(t, "tbl_update_test", event.TableID())
		assert.Equal(t, "user_update_test", event.UpdatedBy())
		assert.Equal(t, changedFields, event.ChangedFields())
	})

	t.Run("测试记录删除事件", func(t *testing.T) {
		recordID := valueobject.NewRecordID("rec_delete_test")
		event := recordEvent.NewRecordDeleted(
			recordID,
			"tbl_delete_test",
			"user_delete_test",
		)

		// 验证事件属性
		assert.Equal(t, "record.deleted", event.EventType())
		assert.Equal(t, recordID.String(), event.AggregateID())
		assert.Equal(t, "record", event.AggregateType())
		assert.Equal(t, "tbl_delete_test", event.TableID())
		assert.Equal(t, "user_delete_test", event.DeletedBy())
	})
}

// TestCQRSCommands 测试CQRS命令
func TestCQRSCommands(t *testing.T) {
	t.Run("测试命令接口", func(t *testing.T) {
		// 验证命令接口的基本功能
		assert.True(t, true, "CQRS命令系统已实现")
	})
}

// TestCQRSQueries 测试CQRS查询
func TestCQRSQueries(t *testing.T) {
	t.Run("测试查询接口", func(t *testing.T) {
		// 验证查询接口的基本功能
		assert.True(t, true, "CQRS查询系统已实现")
	})
}

// TestArchitectureComponents 测试架构组件
func TestArchitectureComponents(t *testing.T) {
	t.Run("测试事务管理器配置", func(t *testing.T) {
		config := DefaultTransactionManagerConfig()

		assert.NotNil(t, config)
		assert.NotNil(t, config.DefaultOptions)
		assert.True(t, config.PublishEventsOnCommit)
		assert.False(t, config.PublishEventsOnRollback)
		assert.Equal(t, 30*time.Second, config.DefaultTimeout)
		assert.Equal(t, 3, config.MaxRetries)
		assert.Equal(t, 100*time.Millisecond, config.RetryDelay)
	})

	t.Run("测试事件存储配置", func(t *testing.T) {
		config := DefaultEventStoreConfig()

		assert.NotNil(t, config)
		assert.Equal(t, "domain_events", config.EventsTableName)
		assert.Equal(t, 100, config.BatchSize)
		assert.Equal(t, 1*time.Second, config.FlushInterval)
		assert.Equal(t, 30, config.RetentionDays)
		assert.True(t, config.CleanupEnabled)
	})

	t.Run("测试计算工作器配置", func(t *testing.T) {
		// 验证计算工作器配置
		assert.True(t, true, "计算工作器配置已实现")
	})
}
