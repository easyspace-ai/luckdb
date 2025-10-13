package application

import (
	"context"
	"fmt"

	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/validation"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// TypecastService 类型转换服务
// 参考旧系统: TypeCastAndValidate (teable-develop/apps/nestjs-backend/src/features/record/typecast.validate.ts)
type TypecastService struct {
	fieldRepo repository.FieldRepository
	factory   *validation.ValidatorFactory
}

// NewTypecastService 创建类型转换服务
func NewTypecastService(fieldRepo repository.FieldRepository) *TypecastService {
	return &TypecastService{
		fieldRepo: fieldRepo,
		factory:   validation.NewValidatorFactory(),
	}
}

// ValidateAndTypecastRecord 验证并转换记录数据
//
// typecast:
//   - true: 尝试自动转换类型（宽松模式）
//   - false: 严格验证，不匹配则报错
//
// 参考旧系统: validateFieldsAndTypecast
func (s *TypecastService) ValidateAndTypecastRecord(
	ctx context.Context,
	tableID string,
	data map[string]interface{},
	typecast bool,
) (map[string]interface{}, error) {
	logger.Info("开始验证和类型转换",
		logger.String("table_id", tableID),
		logger.Bool("typecast", typecast),
		logger.Int("field_count", len(data)))

	// 1. 获取所有涉及的字段
	fields, err := s.fieldRepo.FindByTableID(ctx, tableID)
	if err != nil {
		return nil, fmt.Errorf("获取字段列表失败: %w", err)
	}

	// 2. 构建字段映射（field_id -> Field）
	fieldMap := make(map[string]*entity.Field)
	for _, field := range fields {
		fieldMap[field.ID().String()] = field
	}

	// 3. 验证和转换每个字段的值
	result := make(map[string]interface{})

	for fieldID, value := range data {
		field, exists := fieldMap[fieldID]
		if !exists {
			logger.Warn("字段不存在，跳过",
				logger.String("field_id", fieldID))
			continue
		}

		// 跳过计算字段（只读）
		if field.IsComputed() {
			logger.Debug("跳过计算字段",
				logger.String("field_id", fieldID),
				logger.String("field_name", field.Name().String()))
			continue
		}

		// 验证值
		validationResult := s.factory.ValidateField(ctx, value, field)

		if !validationResult.Success {
			if typecast {
				// 宽松模式：尝试修复
				logger.Info("验证失败，尝试类型转换",
					logger.String("field_id", fieldID),
					logger.String("field_name", field.Name().String()),
					logger.ErrorField(validationResult.Error))

				repairedValue := s.factory.RepairValue(ctx, value, field)
				if repairedValue != nil {
					result[fieldID] = repairedValue
					logger.Info("类型转换成功",
						logger.String("field_id", fieldID),
						logger.Any("original_value", value),
						logger.Any("repaired_value", repairedValue))
				} else {
					logger.Warn("类型转换失败，跳过此字段",
						logger.String("field_id", fieldID))
				}
			} else {
				// 严格模式：直接返回错误
				return nil, fmt.Errorf("字段 %s 验证失败: %w",
					field.Name().String(),
					validationResult.Error)
			}
		} else {
			result[fieldID] = validationResult.Value
		}
	}

	logger.Info("验证和类型转换完成",
		logger.Int("input_fields", len(data)),
		logger.Int("output_fields", len(result)))

	return result, nil
}

// ValidateFieldValue 验证单个字段值
func (s *TypecastService) ValidateFieldValue(
	ctx context.Context,
	value interface{},
	field *entity.Field,
) *validation.ValidationResult {
	return s.factory.ValidateField(ctx, value, field)
}

// RepairFieldValue 修复单个字段值
func (s *TypecastService) RepairFieldValue(
	ctx context.Context,
	value interface{},
	field *entity.Field,
) interface{} {
	return s.factory.RepairValue(ctx, value, field)
}
