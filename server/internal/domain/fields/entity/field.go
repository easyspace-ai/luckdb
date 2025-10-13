package entity

import (
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/valueobject"
)

// Field 字段实体（充血模型）
// 所有字段私有，通过方法访问和操作
type Field struct {
	// 基础属性（私有）
	id          valueobject.FieldID
	tableID     string
	name        valueobject.FieldName
	description *string
	fieldType   valueobject.FieldType

	// 数据库映射
	dbFieldName valueobject.DBFieldName
	dbFieldType string

	// 字段配置
	options      *valueobject.FieldOptions
	defaultValue *string

	// 约束
	isRequired bool
	isUnique   bool
	isPrimary  bool
	notNull    bool

	// 排序和版本
	order   float64
	version int

	// 审计字段
	createdBy string
	createdAt time.Time
	updatedAt time.Time
	deletedAt *time.Time

	// 状态标记
	hasError  bool
	isPending bool
}

// NewField 创建新字段（工厂方法）
func NewField(
	tableID string,
	name valueobject.FieldName,
	fieldType valueobject.FieldType,
	createdBy string,
) (*Field, error) {
	// 生成数据库字段名
	dbFieldName, err := valueobject.NewDBFieldName(name)
	if err != nil {
		return nil, err
	}

	// 确定数据库字段类型
	dbFieldType := determineDBFieldType(fieldType)

	now := time.Now()

	return &Field{
		id:          valueobject.NewFieldID(""),
		tableID:     tableID,
		name:        name,
		fieldType:   fieldType,
		dbFieldName: dbFieldName,
		dbFieldType: dbFieldType,
		options:     valueobject.NewFieldOptions(),
		order:       0.0, // 修复：使用0.0作为默认值，避免numeric(10,2)溢出
		version:     1,
		createdBy:   createdBy,
		createdAt:   now,
		updatedAt:   now,
		isRequired:  false,
		isUnique:    false,
		isPrimary:   false,
		notNull:     false,
		hasError:    false,
		isPending:   false,
	}, nil
}

// ReconstructField 重建字段（从数据库加载）
func ReconstructField(
	id valueobject.FieldID,
	tableID string,
	name valueobject.FieldName,
	fieldType valueobject.FieldType,
	dbFieldName valueobject.DBFieldName,
	dbFieldType string,
	options *valueobject.FieldOptions,
	order float64,
	version int,
	createdBy string,
	createdAt time.Time,
	updatedAt time.Time,
) *Field {
	return &Field{
		id:          id,
		tableID:     tableID,
		name:        name,
		fieldType:   fieldType,
		dbFieldName: dbFieldName,
		dbFieldType: dbFieldType,
		options:     options,
		order:       order,
		version:     version,
		createdBy:   createdBy,
		createdAt:   createdAt,
		updatedAt:   updatedAt,
	}
}

// ==================== 访问器方法 ====================

// ID 获取字段ID
func (f *Field) ID() valueobject.FieldID {
	return f.id
}

// TableID 获取表ID
func (f *Field) TableID() string {
	return f.tableID
}

// Name 获取字段名称
func (f *Field) Name() valueobject.FieldName {
	return f.name
}

// Description 获取描述
func (f *Field) Description() *string {
	return f.description
}

// Type 获取字段类型
func (f *Field) Type() valueobject.FieldType {
	return f.fieldType
}

// DBFieldName 获取数据库字段名
func (f *Field) DBFieldName() valueobject.DBFieldName {
	return f.dbFieldName
}

// DBFieldType 获取数据库字段类型
func (f *Field) DBFieldType() string {
	return f.dbFieldType
}

// Options 获取字段选项
func (f *Field) Options() *valueobject.FieldOptions {
	return f.options
}

// DefaultValue 获取默认值
func (f *Field) DefaultValue() *string {
	return f.defaultValue
}

// Order 获取排序
func (f *Field) Order() float64 {
	return f.order
}

// Version 获取版本号
func (f *Field) Version() int {
	return f.version
}

// CreatedBy 获取创建者
func (f *Field) CreatedBy() string {
	return f.createdBy
}

// CreatedAt 获取创建时间
func (f *Field) CreatedAt() time.Time {
	return f.createdAt
}

// UpdatedAt 获取更新时间
func (f *Field) UpdatedAt() time.Time {
	return f.updatedAt
}

// DeletedAt 获取删除时间
func (f *Field) DeletedAt() *time.Time {
	return f.deletedAt
}

// IsRequired 是否必填
func (f *Field) IsRequired() bool {
	return f.isRequired
}

// IsUnique 是否唯一
func (f *Field) IsUnique() bool {
	return f.isUnique
}

// IsPrimary 是否主键
func (f *Field) IsPrimary() bool {
	return f.isPrimary
}

// NotNull 是否非空
func (f *Field) NotNull() bool {
	return f.notNull
}

// HasError 是否有错误
func (f *Field) HasError() bool {
	return f.hasError
}

// IsPending 是否待处理
func (f *Field) IsPending() bool {
	return f.isPending
}

// IsDeleted 是否已删除
func (f *Field) IsDeleted() bool {
	return f.deletedAt != nil
}

// IsVirtual 是否为虚拟字段
func (f *Field) IsVirtual() bool {
	return f.fieldType.IsVirtual()
}

// IsComputed 是否为计算字段
func (f *Field) IsComputed() bool {
	return f.fieldType.IsComputed()
}

// ==================== 业务方法 ====================

// Rename 重命名字段
func (f *Field) Rename(newName valueobject.FieldName) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	f.name = newName
	f.updatedAt = time.Now()
	f.incrementVersion()

	return nil
}

// UpdateDescription 更新描述
func (f *Field) UpdateDescription(description string) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	f.description = &description
	f.updatedAt = time.Now()

	return nil
}

// ChangeType 变更字段类型
func (f *Field) ChangeType(newType valueobject.FieldType) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	// 虚拟字段不能变更类型
	if f.IsVirtual() {
		return fields.NewDomainError(
			"CANNOT_CHANGE_VIRTUAL_FIELD_TYPE",
			"virtual field type cannot be changed",
			nil,
		)
	}

	// 检查类型兼容性
	if !f.fieldType.IsCompatibleWith(newType) {
		return fields.ErrIncompatibleTypeChange
	}

	f.fieldType = newType
	f.dbFieldType = determineDBFieldType(newType)
	f.updatedAt = time.Now()
	f.incrementVersion()

	return nil
}

// UpdateOptions 更新字段选项
func (f *Field) UpdateOptions(options *valueobject.FieldOptions) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	// 验证选项是否适用于当前字段类型
	if err := f.validateOptions(options); err != nil {
		return err
	}

	f.options = options
	f.updatedAt = time.Now()
	f.incrementVersion()

	return nil
}

// SetDefaultValue 设置默认值
func (f *Field) SetDefaultValue(value string) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	f.defaultValue = &value
	f.updatedAt = time.Now()

	return nil
}

// SetRequired 设置是否必填
func (f *Field) SetRequired(required bool) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	f.isRequired = required
	f.notNull = required // 必填字段自动设置非空
	f.updatedAt = time.Now()

	return nil
}

// SetUnique 设置是否唯一
func (f *Field) SetUnique(unique bool) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	// 虚拟字段不能设置唯一约束
	if f.IsVirtual() && unique {
		return fields.NewDomainError(
			"VIRTUAL_FIELD_CANNOT_BE_UNIQUE",
			"virtual field cannot have unique constraint",
			nil,
		)
	}

	f.isUnique = unique
	f.updatedAt = time.Now()

	return nil
}

// SetPrimary 设置为主键
func (f *Field) SetPrimary(primary bool) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	// 虚拟字段不能设置为主键
	if f.IsVirtual() && primary {
		return fields.NewDomainError(
			"VIRTUAL_FIELD_CANNOT_BE_PRIMARY",
			"virtual field cannot be primary key",
			nil,
		)
	}

	f.isPrimary = primary
	if primary {
		f.isRequired = true
		f.isUnique = true
		f.notNull = true
	}
	f.updatedAt = time.Now()

	return nil
}

// UpdateOrder 更新排序
func (f *Field) UpdateOrder(order float64) error {
	if f.IsDeleted() {
		return fields.ErrCannotModifyDeletedField
	}

	f.order = order
	f.updatedAt = time.Now()

	return nil
}

// MarkAsError 标记为错误状态
func (f *Field) MarkAsError() {
	f.hasError = true
	f.updatedAt = time.Now()
}

// ClearError 清除错误状态
func (f *Field) ClearError() {
	f.hasError = false
	f.updatedAt = time.Now()
}

// MarkAsPending 标记为待处理
func (f *Field) MarkAsPending() {
	f.isPending = true
	f.updatedAt = time.Now()
}

// ClearPending 清除待处理状态
func (f *Field) ClearPending() {
	f.isPending = false
	f.updatedAt = time.Now()
}

// SoftDelete 软删除字段
func (f *Field) SoftDelete() error {
	if f.IsDeleted() {
		return fields.ErrFieldAlreadyDeleted
	}

	// 主键字段不能删除
	if f.isPrimary {
		return fields.NewDomainError(
			"CANNOT_DELETE_PRIMARY_KEY",
			"primary key field cannot be deleted",
			nil,
		)
	}

	now := time.Now()
	f.deletedAt = &now
	f.updatedAt = now

	return nil
}

// Restore 恢复已删除的字段
func (f *Field) Restore() error {
	if !f.IsDeleted() {
		return fields.NewDomainError(
			"FIELD_NOT_DELETED",
			"field is not deleted",
			nil,
		)
	}

	f.deletedAt = nil
	f.updatedAt = time.Now()

	return nil
}

// ==================== 私有辅助方法 ====================

// incrementVersion 递增版本号
func (f *Field) incrementVersion() {
	f.version++
}

// validateOptions 验证字段选项
func (f *Field) validateOptions(options *valueobject.FieldOptions) error {
	if options == nil {
		return nil
	}

	// 根据字段类型验证选项
	switch {
	case f.fieldType.String() == valueobject.TypeFormula:
		if !options.HasFormula() {
			return fields.ErrMissingRequiredOption
		}

	case f.fieldType.String() == valueobject.TypeRollup:
		if !options.HasRollup() {
			return fields.ErrMissingRequiredOption
		}

	case f.fieldType.String() == valueobject.TypeLookup:
		if !options.HasLookup() {
			return fields.ErrMissingRequiredOption
		}

	case f.fieldType.String() == valueobject.TypeLink:
		if !options.HasLink() {
			return fields.ErrMissingRequiredOption
		}

	case f.fieldType.String() == valueobject.TypeSelect || f.fieldType.String() == valueobject.TypeMultipleSelect:
		if !options.HasSelect() {
			return fields.ErrMissingRequiredOption
		}
	}

	return nil
}

// determineDBFieldType 确定数据库字段类型
func determineDBFieldType(fieldType valueobject.FieldType) string {
	// 根据字段类型映射到数据库类型（PostgreSQL）
	switch fieldType.String() {
	case valueobject.TypeText, valueobject.TypeEmail, valueobject.TypeURL, valueobject.TypePhone:
		return "TEXT"

	case valueobject.TypeNumber, valueobject.TypeRating, valueobject.TypePercent,
		valueobject.TypeCurrency, valueobject.TypeDuration:
		return "NUMERIC"

	case valueobject.TypeDate:
		return "DATE"

	case valueobject.TypeDateTime, valueobject.TypeCreatedTime, valueobject.TypeModifiedTime:
		return "TIMESTAMP"

	case valueobject.TypeBoolean, valueobject.TypeCheckbox:
		return "BOOLEAN"

	case valueobject.TypeSelect:
		return "TEXT"

	case valueobject.TypeMultipleSelect, valueobject.TypeAttachment, valueobject.TypeUser:
		return "JSONB"

	case valueobject.TypeLink:
		return "TEXT[]" // 数组类型

	case valueobject.TypeAutoNumber:
		return "SERIAL"

	// 虚拟字段不存储在数据库中
	case valueobject.TypeFormula, valueobject.TypeRollup, valueobject.TypeLookup,
		valueobject.TypeAI, valueobject.TypeCount:
		return "VIRTUAL"

	default:
		return "TEXT"
	}
}

// SetOrder 设置字段排序值（用于创建字段时设置正确的order，参考原系统）
func (f *Field) SetOrder(order float64) {
	f.order = order
	f.updatedAt = time.Now()
}
