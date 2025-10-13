package table

import (
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields"
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockRecordService 模拟记录服务
type MockRecordService struct {
	mock.Mock
}

func (m *MockRecordService) GetRecord(ctx context.Context, tableID, recordID string) (map[string]interface{}, error) {
	args := m.Called(ctx, tableID, recordID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(map[string]interface{}), args.Error(1)
}

func (m *MockRecordService) GetLinkedRecords(ctx context.Context, tableID, recordID, linkFieldID string) ([]map[string]interface{}, error) {
	args := m.Called(ctx, tableID, recordID, linkFieldID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]map[string]interface{}), args.Error(1)
}

// TestFieldInstanceFactory 测试字段实例工厂
func TestFieldInstanceFactory(t *testing.T) {
	factory := NewFieldInstanceFactory()

	t.Run("CreateFieldInstance", func(t *testing.T) {
		field := &Field{
			ID:                  "field1",
			Name:                "测试字段",
			Type:                FieldTypeNumber,
			CellValueType:       DataTypeNumber,
			IsMultipleCellValue: false,
		}

		instance := factory.CreateFieldInstance(field)

		assert.Equal(t, "field1", instance.ID)
		assert.Equal(t, "测试字段", instance.Name)
		assert.Equal(t, FieldTypeNumber, instance.Type)
		assert.False(t, instance.IsMultipleCellValue)
	})

	t.Run("CreateVirtualFieldInstance", func(t *testing.T) {
		sourceField := &Field{
			ID:                  "field1",
			Name:                "原始字段",
			Type:                FieldTypeNumber,
			CellValueType:       DataTypeNumber,
			IsMultipleCellValue: false,
		}

		instance := factory.CreateVirtualFieldInstance(sourcefield.Field, true)

		assert.Equal(t, "values", instance.ID)
		assert.Equal(t, "values", instance.Name)
		assert.Equal(t, FieldTypeNumber, instance.Type)
		assert.True(t, instance.IsMultipleCellValue)
		assert.True(t, instance.IsVirtual)
	})
}

// TestFormulaEvaluator 测试公式评估器
func TestFormulaEvaluator(t *testing.T) {
	evaluator := NewDefaultFormulaEvaluator()

	t.Run("EvaluateSimpleExpression", func(t *testing.T) {
		fieldMap := make(fields.FieldInstanceMap)
		recordData := map[string]interface{}{
			"num1": 10.0,
			"num2": 20.0,
		}

		result, err := evaluator.Evaluate("{num1} + {num2}", fieldMap, recordData)

		assert.NoError(t, err)
		assert.Equal(t, 30.0, result)
	})

	t.Run("EvaluateSumFunction", func(t *testing.T) {
		fieldMap := make(fields.FieldInstanceMap)
		recordData := map[string]interface{}{
			"values": []interface{}{10.0, 20.0, 30.0},
		}

		result, err := evaluator.Evaluate("sum({values})", fieldMap, recordData)

		assert.NoError(t, err)
		assert.Equal(t, 60.0, result)
	})

	t.Run("EvaluateCountFunction", func(t *testing.T) {
		fieldMap := make(fields.FieldInstanceMap)
		recordData := map[string]interface{}{
			"values": []interface{}{10.0, 20.0, 30.0},
		}

		result, err := evaluator.Evaluate("count({values})", fieldMap, recordData)

		assert.NoError(t, err)
		assert.Equal(t, 3, result)
	})

	t.Run("EvaluateAverageFunction", func(t *testing.T) {
		fieldMap := make(fields.FieldInstanceMap)
		recordData := map[string]interface{}{
			"values": []interface{}{10.0, 20.0, 30.0},
		}

		result, err := evaluator.Evaluate("average({values})", fieldMap, recordData)

		assert.NoError(t, err)
		assert.Equal(t, 20.0, result)
	})

	t.Run("EvaluateMinMaxFunctions", func(t *testing.T) {
		fieldMap := make(fields.FieldInstanceMap)
		recordData := map[string]interface{}{
			"values": []interface{}{10.0, 20.0, 30.0},
		}

		minResult, err := evaluator.Evaluate("min({values})", fieldMap, recordData)
		assert.NoError(t, err)
		assert.Equal(t, 10.0, minResult)

		maxResult, err := evaluator.Evaluate("max({values})", fieldMap, recordData)
		assert.NoError(t, err)
		assert.Equal(t, 30.0, maxResult)
	})
}

// TestRollupFieldHandler 测试 Rollup 字段处理器
func TestRollupFieldHandler(t *testing.T) {
	mockRecordService := new(MockRecordService)
	evaluator := NewDefaultFormulaEvaluator()
	handler := NewRollupFieldHandler(mockRecordService, evaluator)

	t.Run("CalculateSum", func(t *testing.T) {
		// 准备测试数据
		table := &Table{
			ID:   "table1",
			Name: "测试表",
		}

		// 添加汇总字段
		rollupField := &Field{
			ID:   "rollup1",
			Name: "价格总和",
			Type: FieldTypeRollup,
		}

		// 添加被汇总的字段
		priceField := &Field{
			ID:                  "price",
			Name:                "价格",
			Type:                FieldTypeNumber,
			CellValueType:       DataTypeNumber,
			IsMultipleCellValue: false,
		}

		table.fields = []*fields.Field{rollupfield.Field, pricefield.Field}

		// 设置 rollup 选项
		rollupField.Options = &FieldOptions{}
		// 这里需要手动设置，因为没有JSON序列化

		// 模拟关联记录
		linkedRecords := []map[string]interface{}{
			{"id": "rec1", "价格": 100.0},
			{"id": "rec2", "价格": 200.0},
			{"id": "rec3", "价格": 300.0},
		}

		mockRecordService.On("GetLinkedRecords",
			mock.Anything, "table1", "record1", "link1").
			Return(linkedRecords, nil)

		// 准备计算上下文
		ctx := CalculationContext{
			RecordData: map[string]interface{}{
				"id":    "record1",
				"link1": []interface{}{"rec1", "rec2", "rec3"},
			},
			Table: table,
			Field: rollupfield.Field,
			Ctx:   context.Background(),
		}

		// 注意：由于 rollupField.Options 需要正确设置，这里的测试可能需要调整
		// 实际使用时应该通过 ParseVirtualFieldOptions 来设置
	})
}

// TestLookupFieldHandler 测试 Lookup 字段处理器
func TestLookupFieldHandler(t *testing.T) {
	mockRecordService := new(MockRecordService)
	handler := NewLookupFieldHandler(mockRecordService)

	t.Run("HandleMultipleValues", func(t *testing.T) {
		factory := NewFieldInstanceFactory()
		sourceField := &Field{
			ID:                  "name",
			Name:                "名称",
			Type:                FieldTypeText,
			CellValueType:       DataTypeText,
			IsMultipleCellValue: false,
		}

		virtualField := factory.CreateVirtualFieldInstance(sourcefield.Field, true)

		values := []interface{}{"产品A", "产品B", "产品C"}

		// 测试不同的处理方式
		result, err := handler.(*LookupFieldHandler).handleMultipleValues(
			values, "first", virtualfield.Field)
		assert.NoError(t, err)
		assert.Equal(t, "产品A", result)

		result, err = handler.(*LookupFieldHandler).handleMultipleValues(
			values, "last", virtualfield.Field)
		assert.NoError(t, err)
		assert.Equal(t, "产品C", result)

		result, err = handler.(*LookupFieldHandler).handleMultipleValues(
			values, "array", virtualfield.Field)
		assert.NoError(t, err)
		assert.Equal(t, values, result)

		result, err = handler.(*LookupFieldHandler).handleMultipleValues(
			values, "comma_separated", virtualfield.Field)
		assert.NoError(t, err)
		assert.Equal(t, "产品A, 产品B, 产品C", result)
	})
}

// TestFieldInstanceMap 测试字段实例映射
func TestFieldInstanceMap(t *testing.T) {
	fields := []*fields.Field{
		{
			ID:   "field1",
			Name: "字段1",
			Type: FieldTypeText,
		},
		{
			ID:   "field2",
			Name: "字段2",
			Type: FieldTypeNumber,
		},
	}

	instanceMap := CreateFieldInstanceMap(fields)

	t.Run("GetByID", func(t *testing.T) {
		instance, exists := instanceMap.Get("field1")
		assert.True(t, exists)
		assert.Equal(t, "field1", instance.ID)
	})

	t.Run("GetByName", func(t *testing.T) {
		instance, exists := instanceMap.Get("字段1")
		assert.True(t, exists)
		assert.Equal(t, "字段1", instance.Name)
	})

	t.Run("AddVirtualField", func(t *testing.T) {
		factory := NewFieldInstanceFactory()
		virtualField := factory.CreateVirtualFieldInstance(fields[0], true)

		instanceMap.AddVirtualField(virtualfield.Field)

		instance, exists := instanceMap.Get("values")
		assert.True(t, exists)
		assert.Equal(t, "values", instance.ID)
		assert.True(t, instance.IsVirtual)
	})
}

// TestIntegration 集成测试
func TestVirtualFieldIntegration(t *testing.T) {
	t.Run("RollupFieldEndToEnd", func(t *testing.T) {
		// 1. 创建表和字段
		table := &Table{
			ID:   "table1",
			Name: "订单表",
		}

		// 产品价格字段
		priceField := &Field{
			ID:                  "price",
			Name:                "价格",
			Type:                FieldTypeNumber,
			CellValueType:       DataTypeNumber,
			IsMultipleCellValue: false,
		}

		// Rollup 字段（计算总价）
		rollupField := &Field{
			ID:   "total_price",
			Name: "总价",
			Type: FieldTypeRollup,
		}

		table.fields = []*fields.Field{pricefield.Field, rollupfield.Field}

		// 2. 创建字段实例工厂
		factory := NewFieldInstanceFactory()

		// 3. 创建虚拟字段实例
		virtualField := factory.CreateVirtualFieldInstance(pricefield.Field, true)
		assert.Equal(t, "values", virtualField.ID)

		// 4. 准备数据
		linkedRecords := []map[string]interface{}{
			{"价格": 100.0},
			{"价格": 200.0},
			{"价格": 300.0},
		}

		values := make([]interface{}, len(linkedRecords))
		for i, record := range linkedRecords {
			values[i] = record["价格"]
		}

		// 5. 创建字段映射
		fieldMap := CreateFieldInstanceMap(table.GetFields())
		fieldMap.AddVirtualField(virtualfield.Field)

		// 6. 准备记录数据
		recordData := map[string]interface{}{
			"values": values,
		}

		// 7. 评估公式
		evaluator := NewDefaultFormulaEvaluator()
		result, err := evaluator.Evaluate("sum({values})", fieldMap, recordData)

		assert.NoError(t, err)
		assert.Equal(t, 600.0, result)
	})
}
