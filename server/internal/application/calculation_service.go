package application

import (
	"context"
	"regexp"

	"github.com/easyspace-ai/luckdb/server/internal/domain/calculation/dependency"
	formulaPkg "github.com/easyspace-ai/luckdb/server/internal/domain/calculation/formula"
	"github.com/easyspace-ai/luckdb/server/internal/domain/calculation/lookup"
	"github.com/easyspace-ai/luckdb/server/internal/domain/calculation/rollup"
	fieldEntity "github.com/easyspace-ai/luckdb/server/internal/domain/fields/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record/entity"
	recordRepo "github.com/easyspace-ai/luckdb/server/internal/domain/record/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record/valueobject"
	"github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// CalculationService 计算服务（对齐原版ReferenceService）
//
// 设计哲学：
//   - 单一职责：专注于虚拟字段的计算协调
//   - 事件驱动：数据变化自动触发计算
//   - 依赖感知：自动识别需要重算的字段
//   - 性能优先：批量计算，拓扑优化
//
// 核心职责：
//  1. 协调所有虚拟字段的计算
//  2. 管理字段依赖关系
//  3. 确保计算顺序正确（拓扑排序）
//  4. 优化批量计算性能
//
// 支持的虚拟字段类型：
//   - Formula: 公式计算
//   - Rollup: 关联记录汇总
//   - Lookup: 关联记录查找
//   - Count: 关联记录计数
//
// 对齐原版：
//   - reference.service.ts - 计算协调
//   - batch.service.ts - 批量计算
//   - field-calculation.service.ts - 字段级计算
type CalculationService struct {
	fieldRepo        repository.FieldRepository
	recordRepo       recordRepo.RecordRepository
	rollupCalculator *rollup.RollupCalculator
	lookupCalculator *lookup.LookupCalculator
	wsService        WebSocketService // ✅ 新增：WebSocket 服务
}

// NewCalculationService 创建计算服务（完美架构）
func NewCalculationService(
	fieldRepo repository.FieldRepository,
	recordRepo recordRepo.RecordRepository,
	wsService WebSocketService, // ✅ 新增参数
) *CalculationService {
	return &CalculationService{
		fieldRepo:        fieldRepo,
		recordRepo:       recordRepo,
		rollupCalculator: rollup.NewRollupCalculator("UTC"), // 默认UTC时区
		lookupCalculator: lookup.NewLookupCalculator(),
		wsService:        wsService, // ✅ 注入 WebSocket 服务
	}
}

// CalculateRecordFields 计算Record的所有虚拟字段（对齐原版）
// 使用场景：
//   - Record创建后立即调用
//   - 确保新Record包含所有计算字段的值
//
// 参数：
//   - ctx: 上下文
//   - record: 新创建的Record实体
//
// 计算流程：
//  1. 获取Table的所有字段定义
//  2. 过滤出虚拟字段（Formula, Rollup, Lookup, Count）
//  3. 构建字段依赖图
//  4. 拓扑排序（确保计算顺序）
//  5. 按顺序计算每个虚拟字段
//  6. 更新Record数据
//
// 设计考量：
//   - 计算失败不阻塞Record创建
//   - 使用依赖图确保计算顺序正确
//   - 详细的日志记录，便于调试
func (s *CalculationService) CalculateRecordFields(ctx context.Context, record *entity.Record) error {
	// 1. 获取Table的所有字段
	fields, err := s.fieldRepo.FindByTableID(ctx, record.TableID())
	if err != nil {
		return errors.ErrDatabaseQuery.WithDetails(err.Error())
	}

	// 2. 过滤虚拟字段
	virtualFields := s.filterVirtualFields(fields)
	if len(virtualFields) == 0 {
		logger.Debug("no virtual fields to calculate",
			logger.String("table_id", record.TableID()),
			logger.String("record_id", record.ID().String()),
		)
		return nil // 无虚拟字段，直接返回
	}

	logger.Info("calculating virtual fields",
		logger.String("record_id", record.ID().String()),
		logger.Int("virtual_fields_count", len(virtualFields)),
		logger.Int("total_fields_count", len(fields)),
	)

	// 3. 构建依赖图（传入所有字段，以便查找依赖）
	depGraph := s.buildDependencyGraph(fields)

	logger.Info("🔧 依赖图构建完成",
		logger.String("record_id", record.ID().String()),
		logger.Int("graph_items_count", len(depGraph)),
		logger.Any("graph_items", depGraph),
	)

	// 4. 检查循环依赖
	if dependency.HasCycle(depGraph) {
		logger.Error("❌ 检测到循环依赖", logger.String("record_id", record.ID().String()))
		return errors.ErrValidationFailed.WithDetails("circular dependency detected in fields")
	}

	// 5. 拓扑排序
	sortedFields, _ := dependency.GetTopoOrders(depGraph)

	logger.Info("📊 拓扑排序完成",
		logger.String("record_id", record.ID().String()),
		logger.Int("sorted_count", len(sortedFields)),
		logger.Any("sorted_order", func() []string {
			ids := make([]string, len(sortedFields))
			for i, item := range sortedFields {
				ids[i] = item.ID
			}
			return ids
		}()),
	)

	// 6. 确保所有虚拟字段都被计算（包括那些没有依赖关系的）
	sortedFieldIDs := make(map[string]bool)
	for _, item := range sortedFields {
		sortedFieldIDs[item.ID] = true
	}

	// 将不在拓扑排序中的虚拟字段也添加进去（这些字段可能没有有效的依赖关系）
	for _, field := range virtualFields {
		if !sortedFieldIDs[field.ID().String()] {
			sortedFields = append(sortedFields, dependency.TopoItem{
				ID:           field.ID().String(),
				Dependencies: []string{},
			})
			logger.Warn("⚠️ 虚拟字段不在拓扑排序中，已添加",
				logger.String("field_id", field.ID().String()),
				logger.String("field_name", field.Name().String()),
			)
		}
	}

	// 7. 按顺序计算
	recordData := record.Data().ToMap()
	hasChanges := false

	logger.Info("📝 当前记录数据",
		logger.String("record_id", record.ID().String()),
		logger.Int("field_count", len(recordData)),
		logger.Any("field_keys", func() []string {
			keys := make([]string, 0, len(recordData))
			for k := range recordData {
				keys = append(keys, k)
			}
			return keys
		}()),
	)

	// 8. 按顺序计算（收集错误信息）
	errorFields := make([]string, 0)

	for _, item := range sortedFields {
		field := s.getFieldByID(virtualFields, item.ID)
		if field == nil {
			logger.Warn("⚠️ 字段未找到", logger.String("field_id", item.ID))
			continue
		}

		logger.Info("🔄 开始计算字段",
			logger.String("field_id", field.ID().String()),
			logger.String("field_name", field.Name().String()),
			logger.String("field_type", field.Type().String()),
		)

		// 根据字段类型计算
		value, calcErr := s.calculateField(ctx, record, field, recordData)

		if calcErr != nil {
			logger.Error("❌ 字段计算失败",
				logger.String("field_id", field.ID().String()),
				logger.String("field_name", field.Name().String()),
				logger.String("field_type", field.Type().String()),
				logger.String("error", calcErr.Error()),
				logger.Any("record_id", record.ID().String()),
			)

			// 标记字段为错误状态
			field.MarkAsError()
			errorFields = append(errorFields, field.Name().String())

			// 设置字段值为 nil（失败不影响其他字段）
			recordData[field.ID().String()] = nil // ✅ 使用字段ID作为键
			hasChanges = true                     // 需要保存以更新错误状态

			// 保存字段错误状态
			if err := s.fieldRepo.Save(ctx, field); err != nil {
				logger.Warn("保存字段错误状态失败",
					logger.String("field_id", field.ID().String()),
					logger.ErrorField(err),
				)
			}
		} else {
			logger.Info("✅ 字段计算成功",
				logger.String("field_id", field.ID().String()),
				logger.String("field_name", field.Name().String()),
				logger.Any("calculated_value", value),
			)

			// 清除字段错误状态（如果之前有错误）
			if field.HasError() {
				field.ClearError()
				if err := s.fieldRepo.Save(ctx, field); err != nil {
					logger.Warn("清除字段错误状态失败",
						logger.String("field_id", field.ID().String()),
						logger.ErrorField(err),
					)
				}
			}

			recordData[field.ID().String()] = value // ✅ 使用字段ID作为键
			hasChanges = true
		}
	}

	// 记录错误字段汇总
	if len(errorFields) > 0 {
		logger.Warn("⚠️ 部分字段计算失败",
			logger.String("record_id", record.ID().String()),
			logger.Int("error_count", len(errorFields)),
			logger.Any("error_fields", errorFields),
		)
	}

	// 9. 如果有计算结果，更新Record
	if hasChanges {
		updatedData, err := valueobject.NewRecordData(recordData)
		if err != nil {
			return errors.ErrValidationFailed.WithDetails(err.Error())
		}

		// 更新Record的数据
		// 注意：这里使用Update会增加版本号，实际应该有单独的UpdateData方法
		// 暂时使用Update，后续可优化
		if err := record.Update(updatedData, "system"); err != nil {
			return errors.ErrDatabaseOperation.WithDetails(err.Error())
		}

		// 保存
		if err := s.recordRepo.Save(ctx, record); err != nil {
			return errors.ErrDatabaseOperation.WithDetails(err.Error())
		}

		logger.Info("virtual fields calculated successfully",
			logger.String("record_id", record.ID().String()),
		)

		// ✅ 新增：推送 WebSocket 更新
		if s.wsService != nil {
			if err := s.publishRecordUpdate(record, &updatedData); err != nil {
				logger.Warn("WebSocket 推送失败",
					logger.String("record_id", record.ID().String()),
					logger.ErrorField(err),
				)
			}
		}
	}

	return nil
}

// CalculateAffectedFields 计算受影响的字段（对齐原版calculateDirtyFields）
// 使用场景：
//   - Record更新后调用
//   - 只重算受变化影响的字段，性能优化
//
// 参数：
//   - record: 更新后的Record
//   - changedFieldIDs: 直接变化的字段ID列表
//
// 计算流程：
//  1. 获取所有字段
//  2. 构建完整依赖图
//  3. 传播依赖：找出所有受影响的虚拟字段
//  4. 拓扑排序
//  5. 只重算受影响的字段
//
// 设计考量：
//   - 增量计算：只算需要的，避免浪费
//   - 依赖传播：自动识别间接影响
//   - 容错机制：计算失败不影响已保存的数据
func (s *CalculationService) CalculateAffectedFields(ctx context.Context, record *entity.Record, changedFieldIDs []string) error {
	if len(changedFieldIDs) == 0 {
		return nil
	}

	// 1. 获取所有字段
	fields, err := s.fieldRepo.FindByTableID(ctx, record.TableID())
	if err != nil {
		return errors.ErrDatabaseQuery.WithDetails(err.Error())
	}

	// 2. 构建完整依赖图
	depGraph := s.buildDependencyGraph(fields)
	logger.Info("📊 依赖图构建完成",
		logger.String("record_id", record.ID().String()),
		logger.Int("depGraph_size", len(depGraph)))

	// 3. 传播依赖：找出所有受影响的虚拟字段
	affectedFieldIDs := s.propagateDependencies(changedFieldIDs, depGraph, fields)
	logger.Info("🔗 依赖传播完成",
		logger.String("record_id", record.ID().String()),
		logger.Int("changed_fields", len(changedFieldIDs)),
		logger.Int("affected_fields", len(affectedFieldIDs)))

	if len(affectedFieldIDs) == 0 {
		logger.Info("⚠️ 没有受影响的虚拟字段",
			logger.String("record_id", record.ID().String()),
			logger.Strings("changed_field_ids", changedFieldIDs))
		return nil
	}

	logger.Info("calculating affected fields",
		logger.String("record_id", record.ID().String()),
		logger.Int("changed_fields", len(changedFieldIDs)),
		logger.Int("affected_fields", len(affectedFieldIDs)),
	)

	// 4. 拓扑排序
	logger.Info("🔀 开始拓扑排序",
		logger.Int("depGraph_size", len(depGraph)))

	sortedFields, err := dependency.GetTopoOrders(depGraph)

	logger.Info("🔀 拓扑排序完成",
		logger.Int("sortedFields_count", len(sortedFields)),
		logger.Bool("has_error", err != nil))

	if err != nil {
		logger.Error("❌ 拓扑排序失败",
			logger.ErrorField(err))
		return err
	}

	// 5. 按顺序重新计算受影响的字段
	recordData := record.Data().ToMap()
	hasChanges := false

	logger.Info("🔢 开始重新计算字段",
		logger.Int("sortedFields_count", len(sortedFields)),
		logger.Int("affectedFieldIDs_count", len(affectedFieldIDs)),
		logger.Int("recordData_keys_count", len(recordData)))

	for _, item := range sortedFields {
		// 只计算受影响的字段
		if !s.contains(affectedFieldIDs, item.ID) {
			continue
		}

		field := s.getFieldByID(fields, item.ID)
		if field == nil {
			logger.Warn("⚠️ field not found",
				logger.String("field_id", item.ID))
			continue
		}

		logger.Info("🧮 计算字段",
			logger.String("field_id", field.ID().String()),
			logger.String("field_name", field.Name().String()))

		// 计算字段值
		value, calcErr := s.calculateField(ctx, record, field, recordData)

		if calcErr != nil {
			logger.Warn("❌ affected field calculation failed",
				logger.String("field_id", field.ID().String()),
				logger.String("field_name", field.Name().String()),
				logger.String("error", calcErr.Error()),
			)
			recordData[field.ID().String()] = nil // ✅ 只使用字段ID
		} else {
			logger.Info("✅ 字段计算成功",
				logger.String("field_id", field.ID().String()),
				logger.String("field_name", field.Name().String()),
				logger.Any("value", value))
			recordData[field.ID().String()] = value // ✅ 只使用字段ID
			hasChanges = true
		}
	}

	logger.Info("📊 字段计算完成",
		logger.Bool("hasChanges", hasChanges),
		logger.Int("recordData_size", len(recordData)))

	// 6. 更新Record
	if hasChanges {
		updatedData, _ := valueobject.NewRecordData(recordData)

		logger.Info("🔄 准备更新Record entity",
			logger.String("record_id", record.ID().String()))

		if err := record.Update(updatedData, "system"); err != nil {
			logger.Error("❌ Record.Update 失败",
				logger.String("record_id", record.ID().String()),
				logger.ErrorField(err))
			return errors.ErrDatabaseOperation.WithDetails(err.Error())
		}

		logger.Info("💾 准备保存到数据库",
			logger.String("record_id", record.ID().String()))

		if err := s.recordRepo.Save(ctx, record); err != nil {
			logger.Error("❌ recordRepo.Save 失败",
				logger.String("record_id", record.ID().String()),
				logger.ErrorField(err))
			return errors.ErrDatabaseOperation.WithDetails(err.Error())
		}

		logger.Info("✅ affected fields recalculated and saved",
			logger.String("record_id", record.ID().String()),
		)

		// ✅ 新增：推送 WebSocket 更新
		logger.Info("📤 准备推送记录更新",
			logger.String("record_id", record.ID().String()),
			logger.Bool("ws_service_available", s.wsService != nil))

		if s.wsService != nil {
			logger.Info("调用 publishRecordUpdate",
				logger.String("record_id", record.ID().String()))
			if err := s.publishRecordUpdate(record, &updatedData); err != nil {
				logger.Warn("WebSocket 推送失败",
					logger.String("record_id", record.ID().String()),
					logger.ErrorField(err),
				)
			}
		} else {
			logger.Warn("❌ wsService 为 nil，无法推送 WebSocket 更新")
		}
	}

	return nil
}

// calculateField 计算单个字段的值（统一入口）
// 根据字段类型分发到不同的计算器
//
// 设计考量：
//   - 统一的计算入口
//   - 类型分发清晰
//   - 错误处理一致
func (s *CalculationService) calculateField(
	ctx context.Context,
	record *entity.Record,
	field *fieldEntity.Field,
	recordData map[string]interface{},
) (interface{}, error) {
	fieldType := field.Type().String()

	switch fieldType {
	case "formula":
		return s.calculateFormula(ctx, record, field, recordData)
	case "rollup":
		return s.calculateRollup(ctx, record, field)
	case "lookup":
		return s.calculateLookup(ctx, record, field)
	case "count":
		return s.calculateCount(ctx, record, field)
	default:
		return nil, errors.ErrBadRequest.WithDetails(map[string]interface{}{
			"message": "unsupported virtual field type",
			"type":    fieldType,
		})
	}
}

// calculateFormula 计算公式字段
func (s *CalculationService) calculateFormula(
	ctx context.Context,
	record *entity.Record,
	field *fieldEntity.Field,
	recordData map[string]interface{},
) (interface{}, error) {
	// 1. 获取公式表达式
	options := field.Options()
	if options == nil || options.Formula == nil {
		logger.Warn("⚠️ 公式配置未找到",
			logger.String("field_id", field.ID().String()),
			logger.String("field_name", field.Name().String()),
		)
		return nil, errors.ErrValidationFailed.WithDetails("formula options not configured")
	}

	expression := options.Formula.Expression

	logger.Info("🧮 准备计算公式",
		logger.String("field_id", field.ID().String()),
		logger.String("field_name", field.Name().String()),
		logger.String("expression", expression),
		logger.Any("recordData_keys", func() []string {
			keys := make([]string, 0, len(recordData))
			for k := range recordData {
				keys = append(keys, k)
			}
			return keys
		}()),
		logger.Any("recordData_sample", func() map[string]interface{} {
			sample := make(map[string]interface{})
			count := 0
			for k, v := range recordData {
				if count < 5 { // 只打印前5个字段
					sample[k] = v
					count++
				}
			}
			return sample
		}()),
	)

	// 1.5 ✅ 关键修复：将recordData的字段ID映射为字段名称
	// 因为公式表达式使用字段名称引用（如{数学}），但recordData使用字段ID作为key
	logger.Info("🔄 开始映射字段ID到字段名称",
		logger.String("field_id", field.ID().String()),
		logger.Int("recordData_keys", len(recordData)))

	recordDataWithNames, err := s.mapFieldIDsToNames(ctx, record.TableID(), recordData)
	if err != nil {
		logger.Error("❌ 字段ID映射失败",
			logger.String("field_id", field.ID().String()),
			logger.ErrorField(err))
		return nil, err
	}

	logger.Info("✅ 字段ID映射完成",
		logger.String("field_id", field.ID().String()),
		logger.Int("recordDataWithNames_keys", len(recordDataWithNames)),
		logger.Any("sample_data", func() map[string]interface{} {
			sample := make(map[string]interface{})
			count := 0
			for k, v := range recordDataWithNames {
				if count < 3 {
					sample[k] = v
					count++
				}
			}
			return sample
		}()))

	// 2. 执行公式计算（使用formula包的Evaluate函数）
	// Evaluate返回 (*TypedValue, error)
	// 获取用户时区配置
	// TODO: 从用户配置获取时区
	//
	// 实现步骤：
	// 1. 从上下文获取用户ID
	//    userID := ctx.Value("user_id").(string)
	// 2. 查询用户配置
	//    userConfig, err := s.userConfigRepo.GetByUserID(ctx, userID)
	// 3. 使用用户配置的时区，默认UTC
	//    timezone := "UTC"
	//    if userConfig != nil && userConfig.Timezone != "" {
	//        timezone = userConfig.Timezone
	//    }
	//
	// 暂时使用UTC
	timezone := "UTC"

	logger.Info("🧮 开始公式求值",
		logger.String("field_id", field.ID().String()),
		logger.String("expression", expression))

	result, err := formulaPkg.Evaluate(
		expression,
		recordDataWithNames, // dependencies (使用字段名称映射后的数据)
		recordDataWithNames, // record context (使用字段名称映射后的数据)
		timezone,
	)

	if err != nil {
		logger.Error("❌ 公式求值失败",
			logger.String("field_id", field.ID().String()),
			logger.String("field_name", field.Name().String()),
			logger.String("expression", expression),
			logger.ErrorField(err),
		)
		return nil, errors.ErrValidationFailed.WithDetails(map[string]interface{}{
			"message":    "formula evaluation failed",
			"expression": expression,
			"error":      err.Error(),
		})
	}

	// result是*formula.TypedValue (即*functions.TypedValue)
	if result != nil {
		logger.Info("✨ 公式求值成功",
			logger.String("field_id", field.ID().String()),
			logger.String("field_name", field.Name().String()),
			logger.Any("result_value", result.Value),
			logger.String("result_type", string(result.Type)),
		)

		// ✅ 关键修复：使用字段实体的类型转换方法（参考 teable 设计）
		convertedValue := field.ConvertCellValueToDBValue(result.Value)

		logger.Info("✅ 数据库类型转换成功",
			logger.String("field_id", field.ID().String()),
			logger.String("field_name", field.Name().String()),
			logger.Any("original_value", result.Value),
			logger.Any("converted_value", convertedValue),
			logger.String("db_field_type", field.DBFieldType()))

		return convertedValue, nil
	}

	logger.Warn("⚠️ 公式求值返回nil",
		logger.String("field_id", field.ID().String()),
		logger.String("field_name", field.Name().String()),
	)
	return nil, nil
}

// calculateRollup 计算汇总字段
func (s *CalculationService) calculateRollup(
	ctx context.Context,
	record *entity.Record,
	field *fieldEntity.Field,
) (interface{}, error) {
	// 1. 获取Rollup配置
	options := field.Options()
	if options == nil || options.Rollup == nil {
		return nil, errors.ErrValidationFailed.WithDetails("rollup options not configured")
	}

	linkFieldID := options.Rollup.LinkFieldID
	rollupFieldID := options.Rollup.RollupFieldID
	expression := options.Rollup.Expression

	// 2. 获取Link字段的值（关联记录IDs）
	recordData := record.Data().ToMap()
	linkValue := recordData[linkFieldID]

	if linkValue == nil {
		return nil, nil // 无关联记录，返回nil
	}

	// 3. 查询关联记录的目标字段值
	linkedRecordIDs := s.extractRecordIDs(linkValue)
	values := s.fetchFieldValues(ctx, linkedRecordIDs, rollupFieldID)

	// 4. 执行汇总计算
	result, err := s.rollupCalculator.Calculate(expression, values)
	if err != nil {
		return nil, errors.ErrValidationFailed.WithDetails(map[string]interface{}{
			"message":    "rollup calculation failed",
			"expression": expression,
			"error":      err.Error(),
		})
	}

	// rollup.Calculate返回的是interface{}
	return result, nil
}

// calculateLookup 计算查找字段
func (s *CalculationService) calculateLookup(
	ctx context.Context,
	record *entity.Record,
	field *fieldEntity.Field,
) (interface{}, error) {
	// 1. 获取Lookup配置
	options := field.Options()
	if options == nil || options.Lookup == nil {
		return nil, errors.ErrValidationFailed.WithDetails("lookup options not configured")
	}

	linkFieldID := options.Lookup.LinkFieldID
	lookupFieldID := options.Lookup.LookupFieldID

	// 2. 获取Link字段的值
	recordData := record.Data().ToMap()
	linkValue := recordData[linkFieldID]

	if linkValue == nil {
		return nil, nil
	}

	// 3. 查询关联记录
	linkedRecordIDs := s.extractRecordIDs(linkValue)
	linkedRecordsMap := s.fetchRecordsMap(ctx, linkedRecordIDs)

	// 4. 转换为lookup.Calculate需要的格式
	// lookup.Calculate接受 map[string]interface{}
	// 实际需要的是第一条关联记录的数据（简化版）
	// TODO: 处理多条关联记录的情况
	//
	// 改进方向：
	// 1. 支持返回数组（多条关联记录的lookup结果）
	// 2. 添加Lookup配置：
	//    type LookupOptions struct {
	//        LinkFieldID   string `json:"link_field_id"`
	//        LookupFieldID string `json:"lookup_field_id"`
	//        ReturnMultiple bool  `json:"return_multiple"` // 是否返回多个结果
	//    }
	// 3. 根据ReturnMultiple决定返回单个值还是数组
	//    if options.ReturnMultiple {
	//        results := make([]interface{}, 0, len(linkedRecordsMap))
	//        for _, record := range linkedRecordsMap {
	//            val := lookup.Calculate(lookupFieldID, record)
	//            results = append(results, val)
	//        }
	//        return results, nil
	//    }
	//
	var lookedRecord map[string]interface{}
	for _, record := range linkedRecordsMap {
		lookedRecord = record
		break // 取第一条
	}

	if lookedRecord == nil {
		return nil, nil
	}

	// 5. 执行查找
	result, err := s.lookupCalculator.Calculate(
		linkValue,
		lookedRecord, // 修正为单个record的map
		lookupFieldID,
	)

	if err != nil {
		return nil, errors.ErrValidationFailed.WithDetails(map[string]interface{}{
			"message":         "lookup calculation failed",
			"link_field_id":   linkFieldID,
			"lookup_field_id": lookupFieldID,
			"error":           err.Error(),
		})
	}

	return result, nil
}

// calculateCount 计算计数字段
func (s *CalculationService) calculateCount(
	ctx context.Context,
	record *entity.Record,
	field *fieldEntity.Field,
) (interface{}, error) {
	// 1. 获取Count配置
	options := field.Options()
	if options == nil || options.Link == nil {
		return nil, errors.ErrValidationFailed.WithDetails("count options not configured")
	}

	// TODO: 修正为正确的配置字段
	//
	// 正确的实现应该是：
	// 1. 定义CountOptions（在valueobject/field_options.go）:
	//    type CountOptions struct {
	//        LinkFieldID string `json:"link_field_id"`
	//    }
	// 2. 添加到FieldOptions.Count *CountOptions
	// 3. 从Count配置获取linkFieldID:
	//    if options.Count == nil {
	//        return nil, errors.ErrValidationFailed.WithDetails("count options not configured")
	//    }
	//    linkFieldID := options.Count.LinkFieldID
	//
	// 暂时使用Link配置作为workaround
	linkFieldID := options.Link.LinkedTableID

	// 2. 获取Link字段的值
	recordData := record.Data().ToMap()
	linkValue := recordData[linkFieldID]

	if linkValue == nil {
		return 0, nil
	}

	// 3. 统计关联记录数量
	linkedRecordIDs := s.extractRecordIDs(linkValue)
	return len(linkedRecordIDs), nil
}

// ==================== 辅助方法 ====================

// filterVirtualFields 过滤虚拟字段
func (s *CalculationService) filterVirtualFields(fields []*fieldEntity.Field) []*fieldEntity.Field {
	virtualTypes := map[string]bool{
		"formula": true,
		"rollup":  true,
		"lookup":  true,
		"count":   true,
	}

	result := make([]*fieldEntity.Field, 0)
	for _, field := range fields {
		if virtualTypes[field.Type().String()] {
			result = append(result, field)
		}
	}

	return result
}

// buildDependencyGraph 构建字段依赖图
// 返回：dependency.GraphItem切片，用于拓扑排序
//
// 依赖关系：
//   - Formula字段：依赖表达式中引用的所有字段
//   - Rollup字段：依赖Link字段和被汇总的字段
//   - Lookup字段：依赖Link字段
//   - Count字段：依赖Link字段
func (s *CalculationService) buildDependencyGraph(fields []*fieldEntity.Field) []dependency.GraphItem {
	items := make([]dependency.GraphItem, 0)

	logger.Info("📋 开始构建依赖图",
		logger.Int("total_fields", len(fields)),
		logger.Any("field_names", func() []string {
			names := make([]string, len(fields))
			for i, f := range fields {
				names[i] = f.Name().String()
			}
			return names
		}()),
	)

	for _, field := range fields {
		fieldType := field.Type().String()

		switch fieldType {
		case "formula":
			// Formula依赖于表达式中的字段
			deps := s.extractFormulaDependencies(field)

			logger.Info("🔗 提取公式依赖",
				logger.String("field_id", field.ID().String()),
				logger.String("field_name", field.Name().String()),
				logger.Int("dependencies_count", len(deps)),
				logger.Any("dependencies", deps),
			)

			// deps可能包含字段名称，需要转换为字段ID
			for _, depFieldRef := range deps {
				// 尝试通过名称或ID查找字段
				depField := s.findFieldByNameOrID(fields, depFieldRef)
				if depField != nil {
					logger.Info("✅ 找到依赖字段",
						logger.String("ref", depFieldRef),
						logger.String("resolved_field_id", depField.ID().String()),
						logger.String("resolved_field_name", depField.Name().String()),
					)
					items = append(items, dependency.GraphItem{
						FromFieldID: depField.ID().String(),
						ToFieldID:   field.ID().String(),
					})
				} else {
					logger.Warn("⚠️ 依赖字段未找到",
						logger.String("formula_field", field.Name().String()),
						logger.String("dependency_ref", depFieldRef),
					)
				}
			}

		case "rollup":
			// Rollup依赖于Link字段
			options := field.Options()
			if options != nil && options.Rollup != nil {
				items = append(items, dependency.GraphItem{
					FromFieldID: options.Rollup.LinkFieldID,
					ToFieldID:   field.ID().String(),
				})
			}

		case "lookup":
			// Lookup依赖于Link字段
			options := field.Options()
			if options != nil && options.Lookup != nil {
				items = append(items, dependency.GraphItem{
					FromFieldID: options.Lookup.LinkFieldID,
					ToFieldID:   field.ID().String(),
				})
			}

		case "count":
			// Count依赖于Link字段
			// TODO: 从Count配置中获取linkFieldID
			//
			// 实现步骤：
			// options := field.Options()
			// if options != nil && options.Count != nil {
			//     linkFieldID := options.Count.LinkFieldID
			//     if linkFieldID != "" {
			//         items = append(items, DependencyItem{
			//             FieldID:  linkFieldID,
			//             Type:     "field",
			//             IsLocal:  true,
			//         })
			//     }
			// }
		}
	}

	return items
}

// propagateDependencies 传播依赖：找出所有受影响的字段
// 参数：
//   - changedFieldIDs: 直接变化的字段
//   - depGraph: 依赖图
//   - allFields: 所有字段
//
// 返回：
//   - 所有受影响的虚拟字段ID（包括间接影响）
//
// 算法：
//   - BFS/DFS遍历依赖图
//   - 从changedFieldIDs开始
//   - 找出所有下游虚拟字段
func (s *CalculationService) propagateDependencies(
	changedFieldIDs []string,
	depGraph []dependency.GraphItem,
	allFields []*fieldEntity.Field,
) []string {
	affected := make(map[string]bool)
	queue := make([]string, len(changedFieldIDs))
	copy(queue, changedFieldIDs)

	// BFS遍历依赖图
	for len(queue) > 0 {
		currentFieldID := queue[0]
		queue = queue[1:]

		// 找出依赖于currentFieldID的所有字段
		for _, item := range depGraph {
			if item.FromFieldID == currentFieldID {
				// 检查ToField是否是虚拟字段
				toField := s.getFieldByID(allFields, item.ToFieldID)
				if toField != nil && s.isVirtualField(toField) {
					if !affected[item.ToFieldID] {
						affected[item.ToFieldID] = true
						queue = append(queue, item.ToFieldID) // 继续传播
					}
				}
			}
		}
	}

	// 转换为数组
	result := make([]string, 0, len(affected))
	for fieldID := range affected {
		result = append(result, fieldID)
	}

	return result
}

// extractFormulaDependencies 提取公式的依赖字段（参考原版逻辑）
// 从公式表达式中提取 {fieldName} 引用
func (s *CalculationService) extractFormulaDependencies(field *fieldEntity.Field) []string {
	options := field.Options()
	if options == nil || options.Formula == nil {
		return []string{}
	}

	expression := options.Formula.Expression
	if expression == "" {
		return []string{}
	}

	// 使用正则表达式提取 {fieldName} 引用
	// 匹配模式: {任意字符}
	re := regexp.MustCompile(`\{([^}]+)\}`)
	matches := re.FindAllStringSubmatch(expression, -1)

	if len(matches) == 0 {
		return []string{}
	}

	// 提取字段名称/ID
	dependencies := make([]string, 0, len(matches))
	for _, match := range matches {
		if len(match) > 1 {
			fieldRef := match[1] // 提取括号内的内容
			dependencies = append(dependencies, fieldRef)
		}
	}

	return dependencies
}

// extractRecordIDs 从Link字段值中提取Record IDs
func (s *CalculationService) extractRecordIDs(linkValue interface{}) []string {
	if linkValue == nil {
		return []string{}
	}

	switch v := linkValue.(type) {
	case string:
		return []string{v}
	case []string:
		return v
	case []interface{}:
		result := make([]string, 0, len(v))
		for _, item := range v {
			if id, ok := item.(string); ok {
				result = append(result, id)
			}
		}
		return result
	default:
		return []string{}
	}
}

// fetchFieldValues 批量查询字段值
// ⚠️ 废弃：需要提供 tableID 参数，因为 FindByID 已废弃
// TODO: 重构调用方传入 tableID，改用 FindByIDs
func (s *CalculationService) fetchFieldValues(ctx context.Context, recordIDs []string, fieldID string) []interface{} {
	if len(recordIDs) == 0 {
		return []interface{}{}
	}

	logger.Warn("❌ fetchFieldValues 使用了废弃的 FindByID，需要重构",
		logger.Int("record_count", len(recordIDs)),
		logger.String("field_id", fieldID))

	// ❌ FindByID 已废弃，返回空值
	// 正确做法：调用方传入 tableID，使用 FindByIDs(tableID, recordIDs)
	return []interface{}{}
}

// fetchRecordsMap 批量查询Records并转为Map
// ⚠️ 废弃：需要提供 tableID 参数，因为 FindByID 已废弃
// TODO: 重构调用方传入 tableID，改用 FindByIDs
func (s *CalculationService) fetchRecordsMap(ctx context.Context, recordIDs []string) map[string]map[string]interface{} {
	if len(recordIDs) == 0 {
		return map[string]map[string]interface{}{}
	}

	logger.Warn("❌ fetchRecordsMap 使用了废弃的 FindByID，需要重构",
		logger.Int("record_count", len(recordIDs)))

	// ❌ FindByID 已废弃，返回空Map
	// 正确做法：调用方传入 tableID，使用 FindByIDs(tableID, recordIDs)
	return map[string]map[string]interface{}{}
}

// isVirtualField 检查是否为虚拟字段
func (s *CalculationService) isVirtualField(field *fieldEntity.Field) bool {
	virtualTypes := map[string]bool{
		"formula": true,
		"rollup":  true,
		"lookup":  true,
		"count":   true,
	}
	return virtualTypes[field.Type().String()]
}

// findFieldByNameOrID 通过名称或ID查找字段
func (s *CalculationService) findFieldByNameOrID(fields []*fieldEntity.Field, nameOrID string) *fieldEntity.Field {
	// 先尝试按ID查找
	for _, field := range fields {
		if field.ID().String() == nameOrID {
			return field
		}
	}

	// 再尝试按名称查找
	for _, field := range fields {
		if field.Name().String() == nameOrID {
			return field
		}
	}

	return nil
}

// getFieldByID 根据ID查找字段
func (s *CalculationService) getFieldByID(fields []*fieldEntity.Field, fieldID string) *fieldEntity.Field {
	for _, field := range fields {
		if field.ID().String() == fieldID {
			return field
		}
	}
	return nil
}

// contains 检查数组是否包含元素
func (s *CalculationService) contains(arr []string, target string) bool {
	for _, item := range arr {
		if item == target {
			return true
		}
	}
	return false
}

// ==================== WebSocket 推送方法 ====================

// publishRecordUpdate 推送记录更新到 WebSocket
func (s *CalculationService) publishRecordUpdate(record *entity.Record, updatedData *valueobject.RecordData) error {
	// 构建操作列表（参考 ShareDB 的操作格式）
	operations := []interface{}{
		map[string]interface{}{
			"p":        []string{"fields"},   // path: 字段路径
			"oi":       updatedData.ToMap(),  // object insert: 新的字段值
			"recordId": record.ID().String(), // ✅ 添加 recordId 供前端识别
		},
	}

	// 推送到 WebSocket
	if err := s.wsService.PublishRecordOp(
		record.TableID(),
		record.ID().String(),
		operations,
	); err != nil {
		return err
	}

	logger.Info("记录更新已推送到 WebSocket",
		logger.String("record_id", record.ID().String()),
		logger.String("table_id", record.TableID()),
		logger.Int("operations_count", len(operations)),
	)

	return nil
}

// mapFieldIDsToNames 辅助方法：将recordData的字段ID映射为字段名称
// 添加到 calculation_service.go 的末尾

func (s *CalculationService) mapFieldIDsToNames(
	ctx context.Context,
	tableID string,
	recordData map[string]interface{},
) (map[string]interface{}, error) {
	// 1. 获取表的所有字段
	fields, err := s.fieldRepo.FindByTableID(ctx, tableID)
	if err != nil {
		logger.Error("❌ mapFieldIDsToNames: 获取字段列表失败", logger.ErrorField(err))
		return nil, err
	}

	logger.Info("📋 mapFieldIDsToNames: 获取字段列表",
		logger.Int("fields_count", len(fields)),
		logger.Int("recordData_keys", len(recordData)))

	// 2. 创建字段ID到字段名称的映射
	idToName := make(map[string]string)
	for _, field := range fields {
		idToName[field.ID().String()] = field.Name().String()
	}

	logger.Info("🗺️ mapFieldIDsToNames: 映射表创建",
		logger.Int("mapping_count", len(idToName)))

	// 3. 创建新的recordData，key为字段名称
	// ✅ 关键修复：先保留所有keys，然后用字段ID映射的值覆盖字段名称的值
	// 这样确保：1) 所有字段都有值  2) 字段ID的值（最新）优先于字段名称的值（旧）
	result := make(map[string]interface{})

	// 第一步：先复制所有原始数据（包括字段名称keys）
	for key, value := range recordData {
		result[key] = value
	}

	// 第二步：用字段ID映射的值覆盖（如果存在）
	mappedCount := 0
	overwrittenKeys := []string{}
	for fieldID, value := range recordData {
		if fieldName, ok := idToName[fieldID]; ok {
			if _, exists := result[fieldName]; exists {
				overwrittenKeys = append(overwrittenKeys, fieldName)
			}
			result[fieldName] = value // 覆盖旧的字段名称key的值
			mappedCount++
		}
	}

	logger.Info("🎯 mapFieldIDsToNames: 映射完成",
		logger.Int("input_keys", len(recordData)),
		logger.Int("output_keys", len(result)),
		logger.Int("mapped_from_id", mappedCount),
		logger.Int("overwritten", len(overwrittenKeys)))

	if len(overwrittenKeys) > 0 {
		logger.Info("✅ mapFieldIDsToNames: 字段ID值覆盖了字段名称值",
			logger.Strings("overwritten_fields", overwrittenKeys))
	}

	return result, nil
}
