package formula

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestBasicArithmetic 测试基本算术运算
func TestBasicArithmetic(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected interface{}
	}{
		{"加法", "1 + 2", 3.0},
		{"减法", "10 - 3", 7.0},
		{"乘法", "4 * 5", 20.0},
		{"除法", "20 / 4", 5.0},
		{"复杂表达式", "2 + 3 * 4", 14.0},
		{"括号优先级", "(2 + 3) * 4", 20.0},
		{"负数", "-5 + 3", -2.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestComparisonOperators 测试比较运算符
func TestComparisonOperators(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected bool
	}{
		{"等于true", "5 = 5", true},
		{"等于false", "5 = 3", false},
		{"不等于true", "5 != 3", true},
		{"不等于false", "5 != 5", false},
		{"大于", "5 > 3", true},
		{"小于", "3 < 5", true},
		{"大于等于", "5 >= 5", true},
		{"小于等于", "3 <= 5", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestLogicalOperators 测试逻辑运算符
func TestLogicalOperators(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected bool
	}{
		{"AND true", "true && true", true},
		{"AND false", "true && false", false},
		{"OR true", "true || false", true},
		{"OR false", "false || false", false},
		{"复杂逻辑", "(true && false) || true", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestStringOperations 测试字符串操作
func TestStringOperations(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected interface{}
	}{
		{"字符串连接", "'Hello' & ' ' & 'World'", "Hello World"},
		{"数字转字符串", "'Value: ' & 42", "Value: 42"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestNumericFunctions 测试数值函数
func TestNumericFunctions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected float64
	}{
		{"SUM", "SUM(1, 2, 3, 4, 5)", 15.0},
		{"AVERAGE", "AVERAGE(10, 20, 30)", 20.0},
		{"MAX", "MAX(5, 10, 3, 8)", 10.0},
		{"MIN", "MIN(5, 10, 3, 8)", 3.0},
		{"ROUND", "ROUND(3.14159, 2)", 3.14},
		{"ABS", "ABS(-5)", 5.0},
		{"CEILING", "CEILING(3.2)", 4.0},
		{"FLOOR", "FLOOR(3.8)", 3.0},
		{"SQRT", "SQRT(16)", 4.0},
		{"POWER", "POWER(2, 3)", 8.0},
		{"MOD", "MOD(10, 3)", 1.0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.InDelta(t, tt.expected, result.Value, 0.0001)
		})
	}
}

// TestTextFunctions 测试文本函数
func TestTextFunctions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected string
	}{
		{"CONCATENATE", "CONCATENATE('Hello', ' ', 'World')", "Hello World"},
		{"LEFT", "LEFT('Hello', 2)", "He"},
		{"RIGHT", "RIGHT('World', 3)", "rld"},
		{"UPPER", "UPPER('hello')", "HELLO"},
		{"LOWER", "LOWER('WORLD')", "world"},
		{"TRIM", "TRIM('  hello  ')", "hello"},
		{"LEN", "LEN('Hello')", "5"},
		{"FIND复杂", "FIND('o', 'Hello World')", "5"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			// LEN和FIND返回数字
			if tt.name == "LEN" {
				assert.Equal(t, 5.0, result.Value)
			} else if tt.name == "FIND复杂" {
				assert.Equal(t, 5.0, result.Value)
			} else {
				assert.Equal(t, tt.expected, result.Value)
			}
		})
	}
}

// TestLogicalFunctions 测试逻辑函数
func TestLogicalFunctions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected interface{}
	}{
		{"IF true分支", "IF(true, 'yes', 'no')", "yes"},
		{"IF false分支", "IF(false, 'yes', 'no')", "no"},
		{"IF无else", "IF(false, 'yes')", ""},
		{"AND all true", "AND(true, true, true)", true},
		{"AND has false", "AND(true, false, true)", false},
		{"OR has true", "OR(false, true, false)", true},
		{"OR all false", "OR(false, false)", false},
		{"NOT", "NOT(false)", true},
		{"BLANK", "BLANK()", ""},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestDateTimeFunctions 测试日期时间函数
func TestDateTimeFunctions(t *testing.T) {
	tests := []struct {
		name    string
		formula string
	}{
		{"TODAY", "TODAY()"},
		{"NOW", "NOW()"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.NotNil(t, result.Value)
			// 日期时间应该是字符串格式
			_, ok := result.Value.(string)
			assert.True(t, ok, "日期应该返回字符串")
		})
	}
}

// TestComplexExpressions 测试复杂表达式
func TestComplexExpressions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected interface{}
	}{
		{
			"嵌套IF",
			"IF(5 > 3, IF(true, 'yes', 'no'), 'never')",
			"yes",
		},
		{
			"函数与运算符组合",
			"SUM(1, 2, 3) * 2",
			12.0,
		},
		{
			"逻辑+数值",
			"IF(10 > 5, SUM(1, 2, 3), 0)",
			6.0,
		},
		{
			"字符串+数值函数",
			"UPPER(LEFT('hello world', 5))",
			"HELLO",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestErrorHandling 测试错误处理
func TestErrorHandling(t *testing.T) {
	t.Run("语法错误", func(t *testing.T) {
		_, err := Evaluate("1 + + 2", nil, nil, "UTC")
		assert.Error(t, err, "应该返回错误")
	})

	t.Run("除以零或未定义函数", func(t *testing.T) {
		// 这些情况下，系统能够检测并处理错误即可
		// 具体行为可能返回error或返回特殊值
		result1, err1 := Evaluate("10 / 0", nil, nil, "UTC")
		result2, err2 := Evaluate("UNDEFINED_FUNC()", nil, nil, "UTC")

		// 至少有一个返回错误或错误值
		hasError := (err1 != nil || (result1 != nil && result1.Type == CellValueTypeString)) &&
			(err2 != nil || (result2 != nil && result2.Type == CellValueTypeString))
		assert.True(t, hasError, "错误情况应该被检测")
	})
}

// TestP0LogicalFunctions 测试P0逻辑函数
func TestP0LogicalFunctions(t *testing.T) {
	tests := []struct {
		name     string
		formula  string
		expected interface{}
	}{
		// SWITCH tests
		{"SWITCH case1", "SWITCH(1, 1, 'one', 2, 'two', 'other')", "one"},
		{"SWITCH case2", "SWITCH(2, 1, 'one', 2, 'two', 'other')", "two"},
		{"SWITCH default", "SWITCH(3, 1, 'one', 2, 'two', 'other')", "other"},
		{"SWITCH no default", "SWITCH(3, 1, 'one', 2, 'two')", nil},
		{"SWITCH string", "SWITCH('b', 'a', 'A', 'b', 'B', 'C')", "B"},

		// XOR tests
		{"XOR all false", "XOR(false, false, false)", false},
		{"XOR one true", "XOR(false, true, false)", true},
		{"XOR two true", "XOR(true, true, false)", false},
		{"XOR three true", "XOR(true, true, true)", true},
		{"XOR simple", "XOR(true, false)", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := Evaluate(tt.formula, nil, nil, "UTC")
			assert.NoError(t, err)
			assert.Equal(t, tt.expected, result.Value)
		})
	}
}

// TestP0DateTimeFunctions 测试P0日期时间函数
func TestP0DateTimeFunctions(t *testing.T) {
	t.Run("DATETIME_DIFF", func(t *testing.T) {
		// 测试日期差值计算
		result, err := Evaluate("DATETIME_DIFF('2023-01-01T00:00:00Z', '2023-01-10T00:00:00Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.InDelta(t, -9.0, result.Value, 0.1) // 差9天

		result, err = Evaluate("DATETIME_DIFF('2023-01-10T00:00:00Z', '2023-01-01T00:00:00Z')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.InDelta(t, 9.0, result.Value, 0.1) // 差9天
	})

	t.Run("DATE_ADD", func(t *testing.T) {
		// 测试日期加法
		result, err := Evaluate("DATE_ADD('2023-01-01T00:00:00Z', 10, 'day')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.NotNil(t, result.Value)
		// 应该是2023-01-11
		dateStr, ok := result.Value.(string)
		assert.True(t, ok)
		assert.Contains(t, dateStr, "2023-01-11")

		// 测试月份加法
		result, err = Evaluate("DATE_ADD('2023-01-15T00:00:00Z', 2, 'month')", nil, nil, "UTC")
		assert.NoError(t, err)
		assert.NotNil(t, result.Value)
		dateStr, ok = result.Value.(string)
		assert.True(t, ok)
		assert.Contains(t, dateStr, "2023-03-15")
	})
}
