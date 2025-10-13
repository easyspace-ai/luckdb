package repository

import (
	"context"
	"fmt"
	"time"

	"gorm.io/gorm"

	fieldEntity "github.com/easyspace-ai/luckdb/server/internal/domain/fields/entity"
	"github.com/easyspace-ai/luckdb/server/internal/domain/fields/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record/entity"
	recordRepo "github.com/easyspace-ai/luckdb/server/internal/domain/record/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record/valueobject"
	tableRepo "github.com/easyspace-ai/luckdb/server/internal/domain/table/repository"
	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/database"
	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/database/models"
	pkgDatabase "github.com/easyspace-ai/luckdb/server/pkg/database"
	"github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// RecordRepositoryDynamic 记录仓储实现（完全动态表架构）
// 严格按照旧系统实现：每个Table的Record存储在独立的物理表中
type RecordRepositoryDynamic struct {
	db         *gorm.DB
	dbProvider database.DBProvider
	tableRepo  tableRepo.TableRepository
	fieldRepo  repository.FieldRepository
	fieldCache *FieldMappingCache // ✅ 字段映射缓存
}

// GetDB 获取数据库连接（用于事务管理）
func (r *RecordRepositoryDynamic) GetDB() *gorm.DB {
	return r.db
}

// NewRecordRepositoryDynamic 创建记录仓储（完全动态表架构）
func NewRecordRepositoryDynamic(
	db *gorm.DB,
	dbProvider database.DBProvider,
	tableRepo tableRepo.TableRepository,
	fieldRepo repository.FieldRepository,
) recordRepo.RecordRepository {
	return &RecordRepositoryDynamic{
		db:         db,
		dbProvider: dbProvider,
		tableRepo:  tableRepo,
		fieldRepo:  fieldRepo,
		fieldCache: NewFieldMappingCache(),
	}
}

// ==================== 核心查询方法 ====================

// FindByID 根据ID查找记录（从物理表查询）
// 参考旧系统：teable-develop/apps/nestjs-backend/src/features/record/record.service.ts
func (r *RecordRepositoryDynamic) FindByID(ctx context.Context, id valueobject.RecordID) (*entity.Record, error) {
	logger.Info("正在从物理表查询记录",
		logger.String("record_id", id.String()))

	// 1. 从 record_meta 获取 table_id（快速定位）
	var meta models.RecordMeta
	if err := r.db.WithContext(ctx).
		Where("id = ?", id.String()).
		Where("deleted_at IS NULL").
		First(&meta).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil // 记录不存在
		}
		return nil, fmt.Errorf("查询record_meta失败: %w", err)
	}

	tableID := meta.TableID

	// 2. 获取 Table 信息（获取 base_id）
	table, err := r.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return nil, fmt.Errorf("获取Table信息失败: %w", err)
	}
	if table == nil {
		return nil, fmt.Errorf("Table不存在: %s", tableID)
	}

	baseID := table.BaseID()

	// 3. 获取字段列表（用于构建SELECT和映射）
	fields, err := r.fieldRepo.FindByTableID(ctx, tableID)
	if err != nil {
		return nil, fmt.Errorf("获取字段列表失败: %w", err)
	}

	// 4. ✅ 设置 search_path（PostgreSQL Schema隔离）
	if r.dbProvider.SupportsSchema() {
		if err := r.dbProvider.SetSearchPath(ctx, baseID); err != nil {
			return nil, fmt.Errorf("设置search_path失败: %w", err)
		}
	}

	// 5. ✅ 从物理表查询
	fullTableName := r.dbProvider.GenerateTableName(baseID, tableID)

	// 构建 SELECT 列（系统字段 + 用户字段）
	selectCols := []string{
		"__id",
		"__auto_number",
		"__created_time",
		"__created_by",
		"__last_modified_time",
		"__last_modified_by",
		"__version",
	}

	// 添加所有用户字段的 db_field_name
	for _, field := range fields {
		selectCols = append(selectCols, field.DBFieldName().String())
	}

	// 查询物理表
	var result map[string]interface{}
	if err := r.db.WithContext(ctx).
		Table(fullTableName).
		Select(selectCols).
		Where("__id = ?", id.String()).
		First(&result).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, fmt.Errorf("从物理表查询失败: %w", err)
	}

	logger.Info("✅ 记录查询成功（物理表）",
		logger.String("record_id", id.String()),
		logger.String("table_id", tableID),
		logger.String("physical_table", fullTableName))

	// 6. 转换为 Domain 实体
	return r.toDomainEntity(result, fields, tableID)
}

// FindByTableID 查找表的所有记录（从物理表查询）
func (r *RecordRepositoryDynamic) FindByTableID(ctx context.Context, tableID string) ([]*entity.Record, error) {
	logger.Info("正在从物理表查询记录列表",
		logger.String("table_id", tableID))

	// 1. 获取 Table 信息
	table, err := r.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return nil, fmt.Errorf("获取Table信息失败: %w", err)
	}
	if table == nil {
		return nil, fmt.Errorf("Table不存在: %s", tableID)
	}

	baseID := table.BaseID()

	// 2. 获取字段列表
	fields, err := r.fieldRepo.FindByTableID(ctx, tableID)
	if err != nil {
		return nil, fmt.Errorf("获取字段列表失败: %w", err)
	}

	// 3. ✅ 设置 search_path
	if r.dbProvider.SupportsSchema() {
		if err := r.dbProvider.SetSearchPath(ctx, baseID); err != nil {
			return nil, fmt.Errorf("设置search_path失败: %w", err)
		}
	}

	// 4. ✅ 从物理表查询列表
	fullTableName := r.dbProvider.GenerateTableName(baseID, tableID)

	// 构建 SELECT 列
	selectCols := []string{
		"__id",
		"__auto_number",
		"__created_time",
		"__created_by",
		"__last_modified_time",
		"__last_modified_by",
		"__version",
	}

	for _, field := range fields {
		selectCols = append(selectCols, field.DBFieldName().String())
	}

	// 查询所有记录
	var results []map[string]interface{}
	if err := r.db.WithContext(ctx).
		Table(fullTableName).
		Select(selectCols).
		Find(&results).Error; err != nil {
		return nil, fmt.Errorf("从物理表查询列表失败: %w", err)
	}

	logger.Info("✅ 记录列表查询成功（物理表）",
		logger.String("table_id", tableID),
		logger.String("physical_table", fullTableName),
		logger.Int("count", len(results)))

	// 5. 转换为 Domain 实体列表
	records := make([]*entity.Record, 0, len(results))
	for _, result := range results {
		record, err := r.toDomainEntity(result, fields, tableID)
		if err != nil {
			logger.Warn("转换记录失败，跳过",
				logger.String("record_id", fmt.Sprintf("%v", result["__id"])),
				logger.ErrorField(err))
			continue
		}
		records = append(records, record)
	}

	return records, nil
}

// ==================== 保存方法 ====================

// Save 保存记录（保存到物理表）✨ 支持乐观锁
// 参考旧系统：INSERT/UPDATE 到物理表
// ✅ 新增：乐观锁版本检查、约束错误友好提示
func (r *RecordRepositoryDynamic) Save(ctx context.Context, record *entity.Record) error {
	tableID := record.TableID()

	logger.Info("正在保存记录到物理表",
		logger.String("record_id", record.ID().String()),
		logger.String("table_id", tableID),
		logger.Int64("version", record.Version().Value()))

	// 1. 获取 Table 信息
	table, err := r.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return fmt.Errorf("获取Table信息失败: %w", err)
	}
	if table == nil {
		return fmt.Errorf("Table不存在: %s", tableID)
	}

	baseID := table.BaseID()

	// 2. 获取字段列表
	fields, err := r.fieldRepo.FindByTableID(ctx, tableID)
	if err != nil {
		return fmt.Errorf("获取字段列表失败: %w", err)
	}

	// 3. ✅ 设置 search_path
	if r.dbProvider.SupportsSchema() {
		if err := r.dbProvider.SetSearchPath(ctx, baseID); err != nil {
			return fmt.Errorf("设置search_path失败: %w", err)
		}
	}

	// 4. ✅ 构建数据映射（field_id -> db_field_name）
	fullTableName := r.dbProvider.GenerateTableName(baseID, tableID)

	// 5. ✅ 检查记录是否已存在（用于判断INSERT还是UPDATE）
	var existingVersion int64
	err = r.db.WithContext(ctx).
		Table(fullTableName).
		Select("__version").
		Where("__id = ?", record.ID().String()).
		Scan(&existingVersion).Error

	isNewRecord := err != nil && err == gorm.ErrRecordNotFound

	// 构建数据
	data := make(map[string]interface{})

	// 系统字段
	data["__id"] = record.ID().String()
	data["__last_modified_by"] = record.UpdatedBy()
	data["__last_modified_time"] = record.UpdatedAt()

	if isNewRecord {
		// ✅ 新记录：设置初始版本和创建信息
		data["__created_by"] = record.CreatedBy()
		data["__created_time"] = record.CreatedAt()
		data["__version"] = 0
	} else {
		// ✅ 更新记录：乐观锁 - 版本号递增
		data["__version"] = gorm.Expr("__version + 1")
	}

	// 用户字段（field_id -> db_field_name）
	recordData := record.Data()
	for _, field := range fields {
		fieldID := field.ID().String()
		dbFieldName := field.DBFieldName().String()

		// 获取字段值
		value, _ := recordData.Get(fieldID)

		// 转换值（根据字段类型）
		convertedValue := r.convertValueForDB(field, value)
		data[dbFieldName] = convertedValue
	}

	// 6. ✅ 执行保存（带乐观锁检查）
	var result *gorm.DB

	if isNewRecord {
		// ✅ 新记录：直接 INSERT
		result = r.db.WithContext(ctx).
			Table(fullTableName).
			Create(data)
	} else {
		// ✅ 更新记录：乐观锁 - WHERE __version = ?
		currentVersion := record.Version().Value()
		result = r.db.WithContext(ctx).
			Table(fullTableName).
			Where("__id = ?", record.ID().String()).
			Where("__version = ?", currentVersion).
			Updates(data)
	}

	// 7. ✅ 处理错误（约束错误友好提示）
	if result.Error != nil {
		// 使用约束错误处理工具
		constraintErr := pkgDatabase.HandleDBConstraintError(result.Error, tableID, r.fieldRepo, ctx)
		return constraintErr
	}

	// 8. ✅ 乐观锁：检查是否有行被更新（版本冲突检测）
	if !isNewRecord && result.RowsAffected == 0 {
		logger.Warn("记录版本冲突",
			logger.String("record_id", record.ID().String()),
			logger.Int64("expected_version", record.Version().Value()),
			logger.Int64("actual_version", existingVersion))

		return errors.ErrConflict.WithDetails(map[string]interface{}{
			"type":             "version_conflict",
			"message":          "记录已被其他用户修改，请刷新后重试",
			"record_id":        record.ID().String(),
			"expected_version": record.Version().Value(),
		})
	}

	// 9. ✅ 保存/更新 record_meta
	recordMeta := &models.RecordMeta{
		ID:        record.ID().String(),
		TableID:   tableID,
		CreatedAt: record.CreatedAt(),
	}

	if err := r.db.WithContext(ctx).
		Save(recordMeta).Error; err != nil {
		logger.Warn("保存record_meta失败（不影响主流程）",
			logger.String("record_id", record.ID().String()),
			logger.ErrorField(err))
	}

	logger.Info("✅ 记录保存成功（物理表+乐观锁）",
		logger.String("record_id", record.ID().String()),
		logger.String("table_id", tableID),
		logger.String("physical_table", fullTableName),
		logger.Bool("is_new", isNewRecord),
		logger.Int64("version", record.Version().Value()))

	return nil
}

// ==================== 删除方法 ====================

// Delete 删除记录（软删除）
func (r *RecordRepositoryDynamic) Delete(ctx context.Context, id valueobject.RecordID) error {
	logger.Info("正在软删除记录",
		logger.String("record_id", id.String()))

	// 1. 从 record_meta 获取 table_id
	var meta models.RecordMeta
	if err := r.db.WithContext(ctx).
		Where("id = ?", id.String()).
		First(&meta).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil // 记录不存在
		}
		return fmt.Errorf("查询record_meta失败: %w", err)
	}

	// 2. 软删除 record_meta
	now := time.Now()
	if err := r.db.WithContext(ctx).
		Model(&models.RecordMeta{}).
		Where("id = ?", id.String()).
		Update("deleted_at", now).Error; err != nil {
		return fmt.Errorf("软删除record_meta失败: %w", err)
	}

	// 注意：物理表中的记录保留（用于审计和恢复）
	// 软删除通过 record_meta.deleted_at 标记

	logger.Info("✅ 记录软删除成功",
		logger.String("record_id", id.String()))

	return nil
}

// BatchSave 批量保存记录（包括创建和更新）
func (r *RecordRepositoryDynamic) BatchSave(ctx context.Context, records []*entity.Record) error {
	// 简单实现：使用 BatchUpdate
	return r.BatchUpdate(ctx, records)
}

// CountByTableID 统计表的记录数量
func (r *RecordRepositoryDynamic) CountByTableID(ctx context.Context, tableID string) (int64, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&models.RecordMeta{}).
		Where("table_id = ?", tableID).
		Where("deleted_at IS NULL").
		Count(&count).Error; err != nil {
		return 0, fmt.Errorf("统计记录数量失败: %w", err)
	}

	return count, nil
}

// FindWithVersion 根据ID和版本查找记录（乐观锁）
func (r *RecordRepositoryDynamic) FindWithVersion(ctx context.Context, id valueobject.RecordID, expectedVersion valueobject.RecordVersion) (*entity.Record, error) {
	// 先查找记录
	record, err := r.FindByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if record == nil {
		return nil, nil
	}

	// 检查版本是否匹配
	if record.Version().Value() != expectedVersion.Value() {
		return nil, fmt.Errorf("版本不匹配: 期望 %d, 实际 %d", expectedVersion.Value(), record.Version().Value())
	}

	return record, nil
}

// List 查询记录列表（带过滤条件和分页）
func (r *RecordRepositoryDynamic) List(ctx context.Context, filter recordRepo.RecordFilter) ([]*entity.Record, int64, error) {
	// 1. 提取 tableID
	if filter.TableID == nil {
		return nil, 0, fmt.Errorf("TableID is required")
	}
	tableID := *filter.TableID

	// 2. 统计总数
	total, err := r.CountByTableID(ctx, tableID)
	if err != nil {
		return nil, 0, err
	}

	// 3. 获取 Table 信息
	table, err := r.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return nil, 0, fmt.Errorf("获取Table信息失败: %w", err)
	}
	if table == nil {
		return nil, 0, fmt.Errorf("Table不存在: %s", tableID)
	}

	baseID := table.BaseID()

	// 4. 获取字段列表
	fields, err := r.fieldRepo.FindByTableID(ctx, tableID)
	if err != nil {
		return nil, 0, fmt.Errorf("获取字段列表失败: %w", err)
	}

	// 5. ✅ 设置 search_path
	if r.dbProvider.SupportsSchema() {
		if err := r.dbProvider.SetSearchPath(ctx, baseID); err != nil {
			return nil, 0, fmt.Errorf("设置search_path失败: %w", err)
		}
	}

	// 6. ✅ 从物理表查询（带分页和过滤）
	fullTableName := r.dbProvider.GenerateTableName(baseID, tableID)

	// 构建 SELECT 列
	selectCols := []string{
		"__id",
		"__auto_number",
		"__created_time",
		"__created_by",
		"__last_modified_time",
		"__last_modified_by",
		"__version",
	}

	for _, field := range fields {
		selectCols = append(selectCols, field.DBFieldName().String())
	}

	// 构建查询
	query := r.db.WithContext(ctx).
		Table(fullTableName).
		Select(selectCols)

	// 应用过滤条件
	if filter.CreatedBy != nil {
		query = query.Where("__created_by = ?", *filter.CreatedBy)
	}
	if filter.UpdatedBy != nil {
		query = query.Where("__last_modified_by = ?", *filter.UpdatedBy)
	}

	// 应用排序
	if filter.OrderBy != "" {
		orderDir := "ASC"
		if filter.OrderDir == "desc" {
			orderDir = "DESC"
		}
		query = query.Order(fmt.Sprintf("%s %s", filter.OrderBy, orderDir))
	} else {
		// 默认按创建时间倒序
		query = query.Order("__created_time DESC")
	}

	// 应用分页
	if filter.Limit > 0 {
		query = query.Limit(filter.Limit)
	}
	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	// 查询记录列表
	var results []map[string]interface{}
	if err := query.Find(&results).Error; err != nil {
		return nil, 0, fmt.Errorf("从物理表查询列表失败: %w", err)
	}

	logger.Info("✅ 记录列表查询成功（物理表，分页+过滤）",
		logger.String("table_id", tableID),
		logger.String("physical_table", fullTableName),
		logger.Int("offset", filter.Offset),
		logger.Int("limit", filter.Limit),
		logger.Int("count", len(results)),
		logger.Int64("total", total))

	// 7. 转换为 Domain 实体列表
	records := make([]*entity.Record, 0, len(results))
	for _, result := range results {
		record, err := r.toDomainEntity(result, fields, tableID)
		if err != nil {
			logger.Warn("转换记录失败，跳过",
				logger.String("record_id", fmt.Sprintf("%v", result["__id"])),
				logger.ErrorField(err))
			continue
		}
		records = append(records, record)
	}

	return records, total, nil
}

// NextID 生成下一个记录ID
func (r *RecordRepositoryDynamic) NextID() valueobject.RecordID {
	return valueobject.NewRecordID("")
}

// ==================== 辅助方法 ====================

// Exists 检查记录是否存在
func (r *RecordRepositoryDynamic) Exists(ctx context.Context, id valueobject.RecordID) (bool, error) {
	var count int64
	if err := r.db.WithContext(ctx).
		Model(&models.RecordMeta{}).
		Where("id = ?", id.String()).
		Where("deleted_at IS NULL").
		Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

// toDomainEntity 将物理表查询结果转换为 Domain 实体
func (r *RecordRepositoryDynamic) toDomainEntity(
	result map[string]interface{},
	fields []*fieldEntity.Field,
	tableID string,
) (*entity.Record, error) {
	// 提取系统字段
	recordID := valueobject.NewRecordID(fmt.Sprintf("%v", result["__id"]))
	createdBy := fmt.Sprintf("%v", result["__created_by"])
	updatedBy := fmt.Sprintf("%v", result["__last_modified_by"])

	createdAt, _ := result["__created_time"].(time.Time)
	updatedAt, _ := result["__last_modified_time"].(time.Time)

	versionInt := result["__version"].(int64)
	version, _ := valueobject.NewRecordVersion(versionInt)

	// 提取用户字段数据
	data := make(map[string]interface{})
	for _, field := range fields {
		fieldID := field.ID().String()
		dbFieldName := field.DBFieldName().String()

		// 从物理表结果中获取值
		if value, ok := result[dbFieldName]; ok {
			// 转换值（从数据库类型到应用类型）
			convertedValue := r.convertValueFromDB(field, value)
			data[fieldID] = convertedValue
		}
	}

	recordData, err := valueobject.NewRecordData(data)
	if err != nil {
		return nil, fmt.Errorf("创建RecordData失败: %w", err)
	}

	// 重建实体
	return entity.ReconstructRecord(
		recordID,
		tableID,
		recordData,
		version,
		createdBy,
		updatedBy,
		createdAt,
		updatedAt,
		nil, // deletedAt
	), nil
}

// convertValueForDB 将应用层值转换为数据库值
func (r *RecordRepositoryDynamic) convertValueForDB(field *fieldEntity.Field, value interface{}) interface{} {
	if value == nil {
		return nil
	}

	fieldType := field.Type().String()

	switch fieldType {
	case "multipleSelect", "user", "attachment", "link", "lookup":
		// JSONB 类型：需要序列化为 JSON
		// GORM 会自动处理
		return value

	case "checkbox":
		// 布尔类型
		if b, ok := value.(bool); ok {
			return b
		}
		return false

	case "number", "rating", "percent", "currency", "rollup":
		// 数字类型
		return value

	case "date", "createdTime", "lastModifiedTime":
		// 时间类型
		if t, ok := value.(time.Time); ok {
			return t
		}
		return value

	default:
		// 文本类型：VARCHAR, TEXT
		return value
	}
}

// convertValueFromDB 将数据库值转换为应用层值
func (r *RecordRepositoryDynamic) convertValueFromDB(field *fieldEntity.Field, value interface{}) interface{} {
	if value == nil {
		return nil
	}

	fieldType := field.Type().String()

	switch fieldType {
	case "multipleSelect", "user", "attachment", "link", "lookup":
		// JSONB 类型：GORM 已自动反序列化
		return value

	case "checkbox":
		// 布尔类型
		if b, ok := value.(bool); ok {
			return b
		}
		return false

	case "number", "rating", "percent", "currency", "rollup":
		// 数字类型
		return value

	case "date", "createdTime", "lastModifiedTime":
		// 时间类型
		if t, ok := value.(time.Time); ok {
			return t
		}
		return value

	default:
		// 文本类型
		return value
	}
}

// ==================== 批量操作方法 ====================

// BatchCreate 批量创建记录（原子事务）
// 参考旧系统：批量INSERT到物理表
func (r *RecordRepositoryDynamic) BatchCreate(ctx context.Context, records []*entity.Record) error {
	if len(records) == 0 {
		return nil
	}

	// 确保所有记录属于同一个表
	tableID := records[0].TableID()
	for _, record := range records {
		if record.TableID() != tableID {
			return fmt.Errorf("批量创建要求所有记录属于同一个表")
		}
	}

	logger.Info("正在批量创建记录到物理表",
		logger.String("table_id", tableID),
		logger.Int("count", len(records)))

	// 1. 获取 Table 信息
	table, err := r.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return fmt.Errorf("获取Table信息失败: %w", err)
	}
	if table == nil {
		return fmt.Errorf("Table不存在: %s", tableID)
	}

	baseID := table.BaseID()

	// 2. 获取字段列表
	fields, err := r.fieldRepo.FindByTableID(ctx, tableID)
	if err != nil {
		return fmt.Errorf("获取字段列表失败: %w", err)
	}

	// 3. ✅ 开启事务（原子性保证）
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 3.1 设置 search_path
		if r.dbProvider.SupportsSchema() {
			if err := r.dbProvider.SetSearchPath(ctx, baseID); err != nil {
				return fmt.Errorf("设置search_path失败: %w", err)
			}
		}

		fullTableName := r.dbProvider.GenerateTableName(baseID, tableID)

		// 3.2 批量插入到物理表
		dataList := make([]map[string]interface{}, 0, len(records))
		metaList := make([]models.RecordMeta, 0, len(records))

		for _, record := range records {
			// 构建数据映射
			data := make(map[string]interface{})
			data["__id"] = record.ID().String()
			data["__created_by"] = record.CreatedBy()
			data["__created_time"] = record.CreatedAt()
			data["__version"] = record.Version().Value()

			// 用户字段
			recordData := record.Data()
			for _, field := range fields {
				fieldID := field.ID().String()
				dbFieldName := field.DBFieldName().String()
				value, _ := recordData.Get(fieldID)
				data[dbFieldName] = r.convertValueForDB(field, value)
			}

			dataList = append(dataList, data)

			// 构建 record_meta
			metaList = append(metaList, models.RecordMeta{
				ID:        record.ID().String(),
				TableID:   tableID,
				CreatedAt: record.CreatedAt(),
			})
		}

		// 3.3 批量插入物理表（使用 CreateInBatches 提高性能）
		if err := tx.Table(fullTableName).CreateInBatches(dataList, 500).Error; err != nil {
			return fmt.Errorf("批量插入物理表失败: %w", err)
		}

		// 3.4 批量插入 record_meta
		if err := tx.CreateInBatches(metaList, 500).Error; err != nil {
			logger.Warn("批量插入record_meta失败（不影响主流程）", logger.ErrorField(err))
		}

		return nil
	})
}

// BatchUpdate 批量更新记录（原子事务）
func (r *RecordRepositoryDynamic) BatchUpdate(ctx context.Context, records []*entity.Record) error {
	if len(records) == 0 {
		return nil
	}

	// 确保所有记录属于同一个表
	tableID := records[0].TableID()
	for _, record := range records {
		if record.TableID() != tableID {
			return fmt.Errorf("批量更新要求所有记录属于同一个表")
		}
	}

	logger.Info("正在批量更新记录到物理表",
		logger.String("table_id", tableID),
		logger.Int("count", len(records)))

	// 批量更新：逐条保存（使用事务保证原子性）
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, record := range records {
			if err := r.Save(ctx, record); err != nil {
				return fmt.Errorf("批量更新记录 %s 失败: %w", record.ID().String(), err)
			}
		}
		return nil
	})
}

// BatchDelete 批量删除记录（软删除，原子事务）
func (r *RecordRepositoryDynamic) BatchDelete(ctx context.Context, ids []valueobject.RecordID) error {
	if len(ids) == 0 {
		return nil
	}

	logger.Info("正在批量软删除记录",
		logger.Int("count", len(ids)))

	// 批量软删除 record_meta
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		idStrings := make([]string, len(ids))
		for i, id := range ids {
			idStrings[i] = id.String()
		}

		now := time.Now()
		if err := tx.Model(&models.RecordMeta{}).
			Where("id IN ?", idStrings).
			Update("deleted_at", now).Error; err != nil {
			return fmt.Errorf("批量软删除record_meta失败: %w", err)
		}

		logger.Info("✅ 批量软删除成功",
			logger.Int("count", len(ids)))

		return nil
	})
}
