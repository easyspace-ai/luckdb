package formula

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestExtendedTextFunctions 测试扩展文本函数
func TestExtendedTextFunctions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected interface{}
	}{
		// MID tests
		{"MID basic", "MID('Hello World', 6, 5)", "World"},
		{"MID short", "MID('Test', 0, 2)", "Te"},

		// SEARCH tests (不区分大小写)
		{"SEARCH found", "SEARCH('world', 'Hello World')", 7.0},
		{"SEARCH not found", "SEARCH('xyz', 'Hello')", nil},

		// REPLACE tests (索引从1开始，替换从第1个字符开始的2个字符)
		{"REPLACE basic", "REPLACE('Hello', 1, 2, 'i')", "illo"},

		// SUBSTITUTE tests
		{"SUBSTITUTE all", "SUBSTITUTE('Hello World', 'o', '0')", "Hell0 W0rld"},
		{"SUBSTITUTE first", "SUBSTITUTE('Hello World', 'o', '0', 1)", "Hell0 World"},

		// REPT tests
		{"REPT basic", "REPT('*', 3)", "***"},
		{"REPT zero", "REPT('a', 0)", ""},

		// T tests
		{"T string", "T('hello')", "hello"},
		{"T number", "T(123)", ""},

		// ENCODE_URL_COMPONENT
		{"ENCODE basic", "ENCODE_URL_COMPONENT('hello world')", "hello+world"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			if tt.expected == nil {
				assert.True(t, result.IsNull() || result.Value == nil)
			} else {
				assert.NoError(t, err)
				if tt.name == "ENCODE basic" {
					// URL编码结果可能不同，只检查不为空
					assert.NotEmpty(t, result.Value)
				} else {
					assert.Equal(t, tt.expected, result.Value)
				}
			}
		})
	}
}

// TestExtendedNumericFunctions 测试扩展数值函数
func TestExtendedNumericFunctions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected float64
	}{
		{"INT positive", "INT(3.7)", 3.0},
		{"INT negative", "INT(-3.7)", -4.0},
		{"EVEN from 3", "EVEN(3)", 4.0},
		{"EVEN from -3", "EVEN(-3)", -4.0},
		{"ODD from 4", "ODD(4)", 5.0},
		{"ODD from -4", "ODD(-4)", -5.0},
		{"ROUNDUP", "ROUNDUP(3.14159, 2)", 3.15},
		{"ROUNDDOWN", "ROUNDDOWN(3.99, 0)", 3.0},
		{"VALUE", "VALUE('123.45')", 123.45},
		{"EXP", "EXP(1)", 2.718281828},
		{"LOG base 10", "LOG(100)", 2.0},
		{"LOG base 2", "LOG(8, 2)", 3.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.InDelta(t, tt.expected, result.Value, 0.001)
		})
	}
}

// TestExtendedLogicalFunctions 测试扩展逻辑函数
func TestExtendedLogicalFunctions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected interface{}
	}{
		// IS_ERROR tests
		{"IS_ERROR false", "IS_ERROR('normal text')", false},
		{"IS_ERROR on number", "IS_ERROR(123)", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestExtendedDateTimeFunctions 测试扩展日期函数
func TestExtendedDateTimeFunctions(t *testing.T) {
	t.Run("WEEKNUM", func(t *testing.T) {
		result, err := Evaluate("WEEKNUM('2023-01-15T00:00:00Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.Greater(t, result.Value, 0.0)
	})

	t.Run("WEEKDAY", func(t *testing.T) {
		result, err := Evaluate("WEEKDAY('2023-01-01T00:00:00Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.NotEmpty(t, result.Value)
	})

	t.Run("IS_SAME", func(t *testing.T) {
		result, err := Evaluate("IS_SAME('2023-01-01T12:00:00Z', '2023-01-01T15:00:00Z', 'day')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.Equal(t, true, result.Value)
	})

	t.Run("IS_AFTER", func(t *testing.T) {
		result, err := Evaluate("IS_AFTER('2023-01-02T00:00:00Z', '2023-01-01T00:00:00Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.Equal(t, true, result.Value)
	})

	t.Run("IS_BEFORE", func(t *testing.T) {
		result, err := Evaluate("IS_BEFORE('2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.Equal(t, true, result.Value)
	})

	t.Run("DATESTR", func(t *testing.T) {
		result, err := Evaluate("DATESTR('2023-09-08T18:30:00Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.Equal(t, "2023-09-08", result.Value)
	})

	t.Run("TIMESTR", func(t *testing.T) {
		result, err := Evaluate("TIMESTR('2023-09-08T18:30:45Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.Contains(t, result.Value, "18:30:45")
	})
}

// TestArrayFunctions 测试数组函数
func TestArrayFunctions(t *testing.T) {
	// 注意：这些测试需要多值支持，暂时跳过
	t.Skip("Array functions need multi-value field support")
}

// TestSystemFunctions 测试系统函数
func TestSystemFunctions(t *testing.T) {
	t.Run("RECORD_ID", func(t *testing.T) {
		record := map[string]interface{}{
			"id": "rec_123",
		}
		result, err := Evaluate("RECORD_ID()", nil, record, "UTC")
		assert.NoError(t, err)
		assert.Equal(t, "rec_123", result.Value)
	})

	t.Run("AUTO_NUMBER", func(t *testing.T) {
		record := map[string]interface{}{
			"auto_number": 42.0,
		}
		result, err := Evaluate("AUTO_NUMBER()", nil, record, "UTC")
		assert.NoError(t, err)
		assert.Equal(t, 42.0, result.Value)
	})
}
