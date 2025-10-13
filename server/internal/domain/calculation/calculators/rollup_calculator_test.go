package calculators

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// TestRollupCalculator_Sum 测试SUM聚合
func TestRollupCalculator_Sum(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{10, 20, 30, 40, 50}
	result, err := calc.aggregate("SUM", values)

	assert.NoError(t, err)
	assert.Equal(t, 150.0, result)
}

// TestRollupCalculator_Average 测试AVG聚合
func TestRollupCalculator_Average(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{10, 20, 30, 40, 50}
	result, err := calc.aggregate("AVG", values)

	assert.NoError(t, err)
	assert.Equal(t, 30.0, result)
}

// TestRollupCalculator_Count 测试COUNT聚合
func TestRollupCalculator_Count(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{10, 20, 30, 40, 50}
	result, err := calc.aggregate("COUNT", values)

	assert.NoError(t, err)
	assert.Equal(t, 5, result)
}

// TestRollupCalculator_Min 测试MIN聚合
func TestRollupCalculator_Min(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{50, 10, 30, 20, 40}
	result, err := calc.aggregate("MIN", values)

	assert.NoError(t, err)
	assert.Equal(t, 10.0, result)
}

// TestRollupCalculator_Max 测试MAX聚合
func TestRollupCalculator_Max(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{10, 50, 30, 20, 40}
	result, err := calc.aggregate("MAX", values)

	assert.NoError(t, err)
	assert.Equal(t, 50.0, result)
}

// TestRollupCalculator_EmptyValues 测试空值
func TestRollupCalculator_EmptyValues(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{}

	// SUM 应该返回 0
	result, err := calc.aggregate("SUM", values)
	assert.NoError(t, err)
	assert.Equal(t, 0.0, result)

	// COUNT 应该返回 0
	result, err = calc.aggregate("COUNT", values)
	assert.NoError(t, err)
	assert.Equal(t, 0, result)

	// AVG 应该返回 0
	result, err = calc.aggregate("AVG", values)
	assert.NoError(t, err)
	assert.Equal(t, 0.0, result)
}

// TestRollupCalculator_MixedTypes 测试混合类型
func TestRollupCalculator_MixedTypes(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{
		10,            // int
		20.5,          // float64
		int64(30),     // int64
		float32(40.5), // float32
	}

	result, err := calc.aggregate("SUM", values)
	assert.NoError(t, err)
	assert.InDelta(t, 101.0, result, 0.1) // 允许浮点误差
}

// TestRollupCalculator_UnsupportedFunction 测试不支持的函数
func TestRollupCalculator_UnsupportedFunction(t *testing.T) {
	calc := &RollupCalculator{}

	values := []interface{}{10, 20, 30}
	_, err := calc.aggregate("MEDIAN", values)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "unsupported aggregate function")
}

// TestExtractRecordIDs 测试记录ID提取
func TestExtractRecordIDs(t *testing.T) {
	calc := &RollupCalculator{}

	// 测试字符串
	ids := calc.extractRecordIDs("rec_123")
	assert.Equal(t, []string{"rec_123"}, ids)

	// 测试字符串数组
	ids = calc.extractRecordIDs([]string{"rec_1", "rec_2", "rec_3"})
	assert.Equal(t, []string{"rec_1", "rec_2", "rec_3"}, ids)

	// 测试 interface{} 数组
	ids = calc.extractRecordIDs([]interface{}{"rec_1", "rec_2"})
	assert.Equal(t, []string{"rec_1", "rec_2"}, ids)

	// 测试空值
	ids = calc.extractRecordIDs(nil)
	assert.Equal(t, []string{}, ids)

	// 测试其他类型
	ids = calc.extractRecordIDs(123)
	assert.Equal(t, []string{}, ids)
}
