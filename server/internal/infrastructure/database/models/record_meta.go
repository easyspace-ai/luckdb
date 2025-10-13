package models

import "time"

// RecordMeta 记录元数据（轻量级）
// 用于快速定位记录所属的表，避免扫描所有物理表
// 完全动态表架构：实际数据存储在各个物理表中
type RecordMeta struct {
	ID        string     `gorm:"primaryKey;type:varchar(50)" json:"id"`
	TableID   string     `gorm:"type:varchar(50);not null;index:idx_record_meta_table" json:"table_id"`
	CreatedAt time.Time  `gorm:"not null;default:CURRENT_TIMESTAMP" json:"created_at"`
	DeletedAt *time.Time `gorm:"index:idx_record_meta_deleted" json:"deleted_at,omitempty"`
}

// TableName 指定表名
func (RecordMeta) TableName() string {
	return "record_meta"
}

// IsDeleted 是否已删除
func (rm *RecordMeta) IsDeleted() bool {
	return rm.DeletedAt != nil
}
