package constants

// Table 默认值常量
// 参考 teable-develop/apps/nestjs-backend/src/features/table/constant.ts

// DefaultViewName 默认视图名称
const DefaultViewName = "Grid view"

// DefaultViewType 默认视图类型
const DefaultViewType = "grid"

// DefaultFieldName 默认字段名称
const DefaultFieldName = "name"

// DefaultFieldType 默认字段类型
const DefaultFieldType = "text"

// ViewConfig 视图配置
type ViewConfig struct {
	Name        string                   `json:"name"`
	Type        string                   `json:"type"`
	Description string                   `json:"description,omitempty"`
	ColumnMeta  []map[string]interface{} `json:"columnMeta,omitempty"`
}

// FieldConfig 字段配置
type FieldConfig struct {
	Name        string                 `json:"name"`
	Type        string                 `json:"type"`
	Description string                 `json:"description,omitempty"`
	Required    bool                   `json:"required"`
	Unique      bool                   `json:"unique"`
	IsPrimary   bool                   `json:"isPrimary,omitempty"`
	Options     map[string]interface{} `json:"options,omitempty"`
}

// GetDefaultViews 获取默认视图配置
// 对应 Teable 的 DEFAULT_VIEWS
func GetDefaultViews() []ViewConfig {
	return []ViewConfig{
		{
			Name:       DefaultViewName,
			Type:       DefaultViewType,
			ColumnMeta: nil, // 使用nil表示空的ColumnMeta，数据库会存储为NULL
		},
	}
}

// GetDefaultFields 获取默认字段配置
// 对应 Teable 的 DEFAULT_FIELDS
func GetDefaultFields() []FieldConfig {
	return []FieldConfig{
		{
			Name:      DefaultFieldName,
			Type:      DefaultFieldType,
			Required:  false,
			Unique:    false,
			IsPrimary: true, // 第一个字段默认为主字段
		},
	}
}
