package event

import (
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/domain/record/valueobject"

	"github.com/google/uuid"
)

// DomainEvent 领域事件接口
type DomainEvent interface {
	EventID() string
	EventType() string
	OccurredAt() time.Time
	AggregateID() string
}

// BaseDomainEvent 基础领域事件
type BaseDomainEvent struct {
	eventID     string
	eventType   string
	occurredAt  time.Time
	aggregateID string
}

func newBaseDomainEvent(eventType string, aggregateID string) BaseDomainEvent {
	return BaseDomainEvent{
		eventID:     uuid.New().String(),
		eventType:   eventType,
		occurredAt:  time.Now(),
		aggregateID: aggregateID,
	}
}

func (e BaseDomainEvent) EventID() string       { return e.eventID }
func (e BaseDomainEvent) EventType() string     { return e.eventType }
func (e BaseDomainEvent) OccurredAt() time.Time { return e.occurredAt }
func (e BaseDomainEvent) AggregateID() string   { return e.aggregateID }

// RecordCreated 记录创建事件
type RecordCreated struct {
	BaseDomainEvent
	recordID  valueobject.RecordID
	tableID   string
	createdBy string
}

// NewRecordCreated 创建记录创建事件
func NewRecordCreated(
	recordID valueobject.RecordID,
	tableID string,
	createdBy string,
) *RecordCreated {
	return &RecordCreated{
		BaseDomainEvent: newBaseDomainEvent("record.created", recordID.String()),
		recordID:        recordID,
		tableID:         tableID,
		createdBy:       createdBy,
	}
}

func (e *RecordCreated) RecordID() valueobject.RecordID { return e.recordID }
func (e *RecordCreated) TableID() string                { return e.tableID }
func (e *RecordCreated) CreatedBy() string              { return e.createdBy }

// RecordUpdated 记录更新事件
type RecordUpdated struct {
	BaseDomainEvent
	recordID    valueobject.RecordID
	tableID     string
	updatedBy   string
	changedFields []string
}

// NewRecordUpdated 创建记录更新事件
func NewRecordUpdated(
	recordID valueobject.RecordID,
	tableID string,
	updatedBy string,
	changedFields []string,
) *RecordUpdated {
	return &RecordUpdated{
		BaseDomainEvent: newBaseDomainEvent("record.updated", recordID.String()),
		recordID:        recordID,
		tableID:         tableID,
		updatedBy:       updatedBy,
		changedFields:   changedFields,
	}
}

func (e *RecordUpdated) RecordID() valueobject.RecordID { return e.recordID }
func (e *RecordUpdated) TableID() string                { return e.tableID }
func (e *RecordUpdated) UpdatedBy() string              { return e.updatedBy }
func (e *RecordUpdated) ChangedFields() []string        { return e.changedFields }

// RecordDeleted 记录删除事件
type RecordDeleted struct {
	BaseDomainEvent
	recordID  valueobject.RecordID
	tableID   string
	deletedBy string
}

// NewRecordDeleted 创建记录删除事件
func NewRecordDeleted(
	recordID valueobject.RecordID,
	tableID string,
	deletedBy string,
) *RecordDeleted {
	return &RecordDeleted{
		BaseDomainEvent: newBaseDomainEvent("record.deleted", recordID.String()),
		recordID:        recordID,
		tableID:         tableID,
		deletedBy:       deletedBy,
	}
}

func (e *RecordDeleted) RecordID() valueobject.RecordID { return e.recordID }
func (e *RecordDeleted) TableID() string                { return e.tableID }
func (e *RecordDeleted) DeletedBy() string              { return e.deletedBy }

