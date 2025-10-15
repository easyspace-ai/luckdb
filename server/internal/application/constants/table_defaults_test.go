package constants

import (
	"testing"
)

// TestGetDefaultFields 测试默认字段配置
func TestGetDefaultFields(t *testing.T) {
	fields := GetDefaultFields()

	// 验证字段数量
	if len(fields) != 3 {
		t.Errorf("期望 3 个默认字段，实际得到 %d 个", len(fields))
	}

	// 验证第一个字段（文本字段）
	if fields[0].Name != "A≡ 文本" {
		t.Errorf("第一个字段名称期望 'A≡ 文本'，实际得到 '%s'", fields[0].Name)
	}
	if fields[0].Type != "text" {
		t.Errorf("第一个字段类型期望 'text'，实际得到 '%s'", fields[0].Type)
	}
	if !fields[0].IsPrimary {
		t.Error("第一个字段应该是主字段")
	}

	// 验证第二个字段（单选字段）
	if fields[1].Name != "单选" {
		t.Errorf("第二个字段名称期望 '单选'，实际得到 '%s'", fields[1].Name)
	}
	if fields[1].Type != "singleSelect" {
		t.Errorf("第二个字段类型期望 'singleSelect'，实际得到 '%s'", fields[1].Type)
	}

	// 验证单选字段的选项配置
	choices, ok := fields[1].Options["choices"].([]map[string]interface{})
	if !ok {
		t.Error("单选字段应该有 choices 选项")
	}
	if len(choices) != 2 {
		t.Errorf("单选字段应该有 2 个选项，实际得到 %d 个", len(choices))
	}

	// 验证第三个字段（日期字段）
	if fields[2].Name != "日期" {
		t.Errorf("第三个字段名称期望 '日期'，实际得到 '%s'", fields[2].Name)
	}
	if fields[2].Type != "date" {
		t.Errorf("第三个字段类型期望 'date'，实际得到 '%s'", fields[2].Type)
	}

	// 验证日期字段的格式配置
	format, ok := fields[2].Options["format"].(string)
	if !ok || format != "YYYY-MM-DD" {
		t.Errorf("日期字段格式期望 'YYYY-MM-DD'，实际得到 '%v'", format)
	}

	includeTime, ok := fields[2].Options["include_time"].(bool)
	if !ok || includeTime != false {
		t.Error("日期字段默认不应该包含时间")
	}

	t.Logf("默认字段配置验证通过：")
	for i, field := range fields {
		t.Logf("  字段 %d: %s (%s)", i+1, field.Name, field.Type)
	}
}
