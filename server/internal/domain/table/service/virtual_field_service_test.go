package service

import (
	"testing"
	"time"
)

// 测试缓存功能

func TestInMemoryVirtualFieldCache(t *testing.T) {
	cache := NewInMemoryVirtualFieldCache()

	// Test Set and Get
	cache.Set("rec1", "field1", "value1", 1*time.Minute)
	value, found := cache.Get("rec1", "field1")
	if !found {
		t.Error("Expected to find cached value")
	}
	if value != "value1" {
		t.Errorf("Expected value 'value1', got '%v'", value)
	}

	// Test Delete
	cache.Delete("rec1", "field1")
	_, found = cache.Get("rec1", "field1")
	if found {
		t.Error("Expected cached value to be deleted")
	}

	// Test DeleteByRecord
	cache.Set("rec2", "field1", "value1", 1*time.Minute)
	cache.Set("rec2", "field2", "value2", 1*time.Minute)
	cache.DeleteByRecord("rec2")
	_, found = cache.Get("rec2", "field1")
	if found {
		t.Error("Expected all cached values for record to be deleted")
	}

	// Test DeleteByField
	cache.Set("rec3", "field3", "value3", 1*time.Minute)
	cache.Set("rec4", "field3", "value4", 1*time.Minute)
	cache.DeleteByField("field3")
	_, found = cache.Get("rec3", "field3")
	if found {
		t.Error("Expected all cached values for field to be deleted")
	}
}

func TestAggregateValues(t *testing.T) {
	tests := []struct {
		name     string
		function string
		values   []interface{}
		expected interface{}
	}{
		{
			name:     "sum",
			function: "sum",
			values:   []interface{}{1, 2, 3, 4, 5},
			expected: 15.0,
		},
		{
			name:     "average",
			function: "average",
			values:   []interface{}{10, 20, 30},
			expected: 20.0,
		},
		{
			name:     "count",
			function: "count",
			values:   []interface{}{1, 2, 3},
			expected: 3,
		},
		{
			name:     "min",
			function: "min",
			values:   []interface{}{10, 5, 20, 3},
			expected: 3.0,
		},
		{
			name:     "max",
			function: "max",
			values:   []interface{}{10, 5, 20, 3},
			expected: 20.0,
		},
		{
			name:     "empty sum",
			function: "sum",
			values:   []interface{}{},
			expected: 0.0,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := aggregateValues(tt.function, tt.values)
			if result != tt.expected {
				t.Errorf("aggregateValues(%s, %v) = %v, want %v",
					tt.function, tt.values, result, tt.expected)
			}
		})
	}
}

func TestToFloat64(t *testing.T) {
	tests := []struct {
		name     string
		input    interface{}
		expected float64
		ok       bool
	}{
		{"float64", float64(3.14), 3.14, true},
		{"float32", float32(2.5), 2.5, true},
		{"int", int(42), 42.0, true},
		{"int64", int64(100), 100.0, true},
		{"int32", int32(50), 50.0, true},
		{"string", "not a number", 0, false},
		{"nil", nil, 0, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, ok := toFloat64(tt.input)
			if ok != tt.ok {
				t.Errorf("toFloat64(%v) ok = %v, want %v", tt.input, ok, tt.ok)
			}
			if ok && result != tt.expected {
				t.Errorf("toFloat64(%v) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestNeedsRelatedRecords(t *testing.T) {
	tests := []struct {
		fieldType string
		expected  bool
	}{
		{"lookup", true},
		{"rollup", true},
		{"count", true},
		{"formula", false},
		{"ai", false},
		{"text", false},
	}

	for _, tt := range tests {
		t.Run(tt.fieldType, func(t *testing.T) {
			result := needsRelatedRecords(tt.fieldType)
			if result != tt.expected {
				t.Errorf("needsRelatedRecords(%s) = %v, want %v",
					tt.fieldType, result, tt.expected)
			}
		})
	}
}

func TestGetEmptyRollupValue(t *testing.T) {
	tests := []struct {
		function string
		expected interface{}
	}{
		{"count", 0},
		{"sum", 0.0},
		{"average", 0.0},
		{"min", nil},
		{"max", nil},
		{"and", true},
		{"or", false},
	}

	for _, tt := range tests {
		t.Run(tt.function, func(t *testing.T) {
			result := getEmptyRollupValue(tt.function)
			if result != tt.expected {
				t.Errorf("getEmptyRollupValue(%s) = %v, want %v",
					tt.function, result, tt.expected)
			}
		})
	}
}
