package valueobject

import (
	"testing"
)

func TestConvertToASCII(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "中文字段名",
			input:    "学生姓名",
			expected: "xueshengxingming",
		},
		{
			name:     "混合ASCII和中文",
			input:    "User姓名",
			expected: "Userxingming",
		},
		{
			name:     "纯ASCII",
			input:    "username",
			expected: "username",
		},
		{
			name:     "包含数字和中文",
			input:    "成绩123",
			expected: "chengji123",
		},
		{
			name:     "复杂中文",
			input:    "综合评价分数",
			expected: "zonghepingjiafenshu",
		},
		{
			name:     "特殊字符和中文",
			input:    "邮箱地址@email",
			expected: "youxiangdizhi@email",
		},
		{
			name:     "日期相关",
			input:    "入学日期",
			expected: "ruxueriqi",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := convertToASCII(tt.input)
			if result != tt.expected {
				t.Errorf("convertToASCII(%q) = %q, expected %q", tt.input, result, tt.expected)
			}
		})
	}
}

func TestGenerateDBFieldName(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "中文字段名转换",
			input:    "学生姓名",
			expected: "xueshengxingming",
		},
		{
			name:     "包含空格",
			input:    "用户 姓名",
			expected: "yonghu_xingming",
		},
		{
			name:     "特殊字符处理",
			input:    "成绩@分数!",
			expected: "chengji_fenshu",
		},
		{
			name:     "数字开头添加前缀",
			input:    "123字段",
			expected: "t123ziduan",
		},
		{
			name:     "保留字处理",
			input:    "user",
			expected: "fld_user",
		},
		{
			name:     "超长字段名截断",
			input:    "这是一个非常非常非常非常非常非常长的字段名称",
			expected: "zheshiyigefeichangfeichangfeichangfeicha",
		},
		{
			name:     "空字段名",
			input:    "",
			expected: "unnamed",
		},
		{
			name:     "只有特殊字符",
			input:    "!@#$%",
			expected: "unnamed",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := generateDBFieldName(tt.input)
			if result != tt.expected {
				t.Errorf("generateDBFieldName(%q) = %q, expected %q", tt.input, result, tt.expected)
			}

			// 验证生成的字段名符合规范
			if len(result) > 40 {
				t.Errorf("generateDBFieldName(%q) length %d exceeds 40 characters", tt.input, len(result))
			}

			// 验证必须以字母开头
			if len(result) > 0 && !isLetter(rune(result[0])) {
				t.Errorf("generateDBFieldName(%q) = %q does not start with a letter", tt.input, result)
			}
		})
	}
}

func TestNewDBFieldName(t *testing.T) {
	tests := []struct {
		name      string
		fieldName string
		wantErr   bool
	}{
		{
			name:      "有效的中文字段名",
			fieldName: "学生姓名",
			wantErr:   false,
		},
		{
			name:      "有效的英文字段名",
			fieldName: "Username",
			wantErr:   false,
		},
		{
			name:      "有效的混合字段名",
			fieldName: "User姓名123",
			wantErr:   false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			fieldName, err := NewFieldName(tt.fieldName)
			if err != nil {
				t.Fatalf("NewFieldName failed: %v", err)
			}

			dbFieldName, err := NewDBFieldName(fieldName)
			if (err != nil) != tt.wantErr {
				t.Errorf("NewDBFieldName() error = %v, wantErr %v", err, tt.wantErr)
				return
			}

			if !tt.wantErr {
				// 验证返回的 DBFieldName 不为空
				if dbFieldName.String() == "" {
					t.Errorf("NewDBFieldName() returned empty string")
				}

				t.Logf("%s -> %s", tt.fieldName, dbFieldName.String())
			}
		})
	}
}
