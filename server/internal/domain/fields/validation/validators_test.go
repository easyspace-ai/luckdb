package validation

import (
	"context"
	"testing"
	"time"

	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/valueobject"
)

// 测试辅助函数：创建模拟字段
func createTestField(t *testing.T, fieldType, name string) *entity.Field {
	t.Helper()

	// 创建字段ID
	fieldID := valueobject.NewFieldID("fld_test_" + fieldType)

	// 创建字段名
	fieldName, err := valueobject.NewFieldName(name)
	if err != nil {
		t.Fatalf("创建字段名失败: %v", err)
	}

	// 创建字段类型
	fType, err := valueobject.NewFieldType(fieldType)
	if err != nil {
		t.Fatalf("创建字段类型失败: %v", err)
	}

	// 创建数据库字段名
	dbFieldName, err := valueobject.NewDBFieldName(fieldName)
	if err != nil {
		t.Fatalf("创建数据库字段名失败: %v", err)
	}

	// 重构字段实体
	field := entity.ReconstructField(
		fieldID,
		"tbl_test",
		fieldName,
		fType,
		dbFieldName,
		"text",                      // dbFieldType
		valueobject.NewFieldOptions(), // options
		0.0,                         // order
		1,                           // version
		"usr_test",                  // createdBy
		time.Now(),                  // createdAt
		time.Now(),                  // updatedAt
	)

	return field
}

// TestSingleLineTextValidator 测试单行文本验证器
func TestSingleLineTextValidator(t *testing.T) {
	validator := NewSingleLineTextValidator()
	field := createTestField(t, "singleLineText", "标题")
	ctx := context.Background()

	tests := []struct {
		name     string
		input    interface{}
		wantErr  bool
		wantNull bool
	}{
		{"正常文本", "Hello World", false, false},
		{"包含换行符", "Line1\nLine2\tTab", false, false}, // 应该被清理
		{"空字符串", "", false, true},                        // 空字符串转为 nil
		{"nil值", nil, false, true},
		{"数字类型", 123, true, false}, // 非字符串类型应该失败
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateCell(ctx, tt.input, field)

			if (result.Error != nil) != tt.wantErr {
				t.Errorf("ValidateCell() error = %v, wantErr %v", result.Error, tt.wantErr)
				return
			}

			if tt.wantNull && result.Value != nil {
				t.Errorf("ValidateCell() expected nil, got %v", result.Value)
			}
		})
	}
}

// TestNumberValidator 测试数字验证器
func TestNumberValidator(t *testing.T) {
	validator := NewNumberValidator()
	field := createTestField(t, "number", "数量")
	ctx := context.Background()

	tests := []struct {
		name    string
		input   interface{}
		wantErr bool
	}{
		{"整数", 42, false},
		{"浮点数", 3.14, false},
		{"字符串数字", "123", false},
		{"无效字符串", "abc", true},
		{"nil值", nil, false},
		{"负数", -100, false},
		{"零", 0, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateCell(ctx, tt.input, field)

			if (result.Error != nil) != tt.wantErr {
				t.Errorf("ValidateCell() error = %v, wantErr %v", result.Error, tt.wantErr)
			}
		})
	}
}

// TestCheckboxValidator 测试复选框验证器
func TestCheckboxValidator(t *testing.T) {
	validator := NewCheckboxValidator()
	field := createTestField(t, "checkbox", "完成")
	ctx := context.Background()

	tests := []struct {
		name     string
		input    interface{}
		wantBool bool
		wantErr  bool
	}{
		{"布尔true", true, true, false},
		{"布尔false", false, false, false},
		{"字符串true", "true", true, false},
		{"字符串TRUE", "TRUE", true, false},
		{"字符串1", "1", true, false},
		{"字符串yes", "yes", true, false},
		{"字符串false", "false", false, false},
		{"字符串0", "0", false, false},
		{"字符串no", "no", false, false},
		{"空字符串", "", false, false},
		{"nil", nil, false, false},
		{"整数1", 1, true, false},
		{"整数0", 0, false, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateCell(ctx, tt.input, field)

			if (result.Error != nil) != tt.wantErr {
				t.Errorf("ValidateCell() error = %v, wantErr %v", result.Error, tt.wantErr)
				return
			}

			if !tt.wantErr && result.Value != tt.wantBool {
				t.Errorf("ValidateCell() = %v, want %v", result.Value, tt.wantBool)
			}
		})
	}
}

// TestEmailValidator 测试邮箱验证器
func TestEmailValidator(t *testing.T) {
	validator := NewEmailValidator()
	field := createTestField(t, "email", "邮箱")
	ctx := context.Background()

	tests := []struct {
		name    string
		input   interface{}
		wantErr bool
	}{
		{"有效邮箱", "user@example.com", false},
		{"有效邮箱带+", "user+tag@example.com", false},
		{"有效邮箱子域名", "user@mail.example.com", false},
		{"无效邮箱-无@", "invalid-email", true},
		{"无效邮箱-无域名", "user@", true},
		{"无效邮箱-无用户名", "@example.com", true},
		{"空字符串", "", false},
		{"nil值", nil, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateCell(ctx, tt.input, field)

			if (result.Error != nil) != tt.wantErr {
				t.Errorf("ValidateCell() error = %v, wantErr %v", result.Error, tt.wantErr)
			}
		})
	}
}

// TestURLValidator 测试URL验证器
func TestURLValidator(t *testing.T) {
	validator := NewURLValidator()
	field := createTestField(t, "url", "网址")
	ctx := context.Background()

	tests := []struct {
		name    string
		input   interface{}
		wantErr bool
	}{
		{"完整URL", "https://example.com", false},
		{"HTTP URL", "http://example.com", false},
		{"带路径", "https://example.com/path", false},
		{"带参数", "https://example.com?key=value", false},
		{"无效URL", "not-a-url", true},
		{"空字符串", "", false},
		{"nil值", nil, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateCell(ctx, tt.input, field)

			if (result.Error != nil) != tt.wantErr {
				t.Errorf("ValidateCell() error = %v, wantErr %v", result.Error, tt.wantErr)
			}
		})
	}

	// 测试自动添加协议
	t.Run("Repair自动添加https", func(t *testing.T) {
		repaired := validator.Repair(ctx, "example.com", field)
		if repaired != "https://example.com" {
			t.Errorf("Repair() = %v, want https://example.com", repaired)
		}
	})
}

// TestDateValidator 测试日期验证器
func TestDateValidator(t *testing.T) {
	validator := NewDateValidator()
	field := createTestField(t, "date", "日期")
	ctx := context.Background()

	tests := []struct {
		name    string
		input   interface{}
		wantErr bool
	}{
		{"ISO8601格式", "2024-01-15T10:30:00Z", false},
		{"简单日期", "2024-01-15", false},
		{"斜杠格式", "2024/01/15", false},
		{"美国格式", "01/15/2024", false},
		{"time.Time", time.Now(), false},
		{"无效日期", "invalid-date", true},
		{"nil值", nil, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateCell(ctx, tt.input, field)

			if (result.Error != nil) != tt.wantErr {
				t.Errorf("ValidateCell() error = %v, wantErr %v", result.Error, tt.wantErr)
			}
		})
	}
}

// TestRatingValidator 测试评分验证器
func TestRatingValidator(t *testing.T) {
	validator := NewRatingValidator()
	field := createTestField(t, "rating", "评分")
	ctx := context.Background()

	tests := []struct {
		name    string
		input   interface{}
		wantErr bool
	}{
		{"有效评分5", 5.0, false},
		{"有效评分0", 0.0, false},
		{"有效评分10", 10.0, false},
		{"超出范围11", 11.0, true},
		{"超出范围-1", -1.0, true},
		{"字符串5", "5", false},
		{"nil值", nil, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := validator.ValidateCell(ctx, tt.input, field)

			if (result.Error != nil) != tt.wantErr {
				t.Errorf("ValidateCell() error = %v, wantErr %v", result.Error, tt.wantErr)
			}
		})
	}
}

// TestValidatorFactory 测试验证器工厂
func TestValidatorFactory(t *testing.T) {
	factory := NewValidatorFactory()
	ctx := context.Background()

	// 测试所有支持的字段类型
	supportedTypes := []string{
		"singleLineText", "longText", "number", "rating", "percent",
		"currency", "duration", "checkbox", "date", "singleSelect",
		"multipleSelect", "url", "email", "phone", "attachment",
		"user", "autoNumber",
	}

	for _, fieldType := range supportedTypes {
		t.Run("GetValidator_"+fieldType, func(t *testing.T) {
			field := createTestField(t, fieldType, "test")
			validator, err := factory.GetValidator(field.Type())

			if err != nil {
				t.Errorf("GetValidator(%s) error = %v", fieldType, err)
				return
			}

			if validator == nil {
				t.Errorf("GetValidator(%s) returned nil validator", fieldType)
			}

			// 测试支持的类型匹配
			if validator.SupportedType().String() != fieldType {
				t.Errorf("Validator.SupportedType() = %v, want %v", validator.SupportedType().String(), fieldType)
			}
		})
	}

	// 测试不支持的类型
	t.Run("GetValidator_unsupported", func(t *testing.T) {
		// 创建一个有效但不支持的字段类型
		unsupportedType, err := valueobject.NewFieldType("formula") // formula 暂未在验证器中实现
		if err != nil {
			t.Skipf("无法创建测试字段类型: %v", err)
			return
		}
		
		_, err = factory.GetValidator(unsupportedType)
		if err == nil {
			t.Error("GetValidator(formula) should return error for unsupported type")
		}
	})

	// 测试 ValidateField
	t.Run("ValidateField_integration", func(t *testing.T) {
		field := createTestField(t, "email", "邮箱")
		result := factory.ValidateField(ctx, "test@example.com", field)

		if result.Error != nil {
			t.Errorf("ValidateField() error = %v", result.Error)
		}
	})

	// 测试 RepairValue
	t.Run("RepairValue_integration", func(t *testing.T) {
		field := createTestField(t, "number", "数量")
		repaired := factory.RepairValue(ctx, "123", field)

		if repaired == nil {
			t.Error("RepairValue() returned nil")
		}
	})
}

// BenchmarkNumberValidator 性能测试：数字验证器
func BenchmarkNumberValidator(b *testing.B) {
	validator := NewNumberValidator()
	t := &testing.T{}
	field := createTestField(t, "number", "数量")
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		validator.ValidateCell(ctx, 42, field)
	}
}

// BenchmarkEmailValidator 性能测试：邮箱验证器
func BenchmarkEmailValidator(b *testing.B) {
	validator := NewEmailValidator()
	t := &testing.T{}
	field := createTestField(t, "email", "邮箱")
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		validator.ValidateCell(ctx, "test@example.com", field)
	}
}

// BenchmarkDateValidator 性能测试：日期验证器
func BenchmarkDateValidator(b *testing.B) {
	validator := NewDateValidator()
	t := &testing.T{}
	field := createTestField(t, "date", "日期")
	ctx := context.Background()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		validator.ValidateCell(ctx, "2024-01-15", field)
	}
}

