package application

import (
	"context"
	"fmt"

	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	"github.com/easyspace-ai/luckdb/server/internal/application/helpers"
	baseRepo "github.com/easyspace-ai/luckdb/server/internal/domain/base/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/space/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/table/aggregate"
	"github.com/easyspace-ai/luckdb/server/internal/domain/table/entity"
	tableRepo "github.com/easyspace-ai/luckdb/server/internal/domain/table/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/table/valueobject"
	"github.com/easyspace-ai/luckdb/server/internal/infrastructure/database"
	pkgerrors "github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
)

// TableService 表格应用服务
// 集成完全动态表架构：每个Table创建独立的物理表
type TableService struct {
	tableRepo    tableRepo.TableRepository
	baseRepo     baseRepo.BaseRepository
	spaceRepo    repository.SpaceRepository
	fieldService *FieldService       // ✅ 添加字段服务依赖
	viewService  *ViewService        // ✅ 添加视图服务依赖
	dbProvider   database.DBProvider // ✅ 数据库提供者（物理表管理）
}

// NewTableService 创建表格服务
func NewTableService(
	tableRepo tableRepo.TableRepository,
	baseRepo baseRepo.BaseRepository,
	spaceRepo repository.SpaceRepository,
	fieldService *FieldService,
	viewService *ViewService,
	dbProvider database.DBProvider,
) *TableService {
	return &TableService{
		tableRepo:    tableRepo,
		baseRepo:     baseRepo,
		spaceRepo:    spaceRepo,
		fieldService: fieldService, // ✅ 注入字段服务
		viewService:  viewService,  // ✅ 注入视图服务
		dbProvider:   dbProvider,   // ✅ 注入数据库提供者
	}
}

// CreateTable 创建表格
// ✅ 对齐 Teable 实现：支持批量创建字段和视图
// 参考：teable-develop/apps/nestjs-backend/src/features/table/open-api/table-open-api.service.ts
func (s *TableService) CreateTable(ctx context.Context, req dto.CreateTableRequest, userID string) (*dto.TableResponse, error) {
	// 0. ✅ 准备默认值（对齐 Teable 的 TablePipe）
	helpers.PrepareTableDefaults(&req)

	logger.Info("🔍 PrepareTableDefaults 完成",
		logger.Int("views_count", len(req.Views)),
		logger.Int("fields_count", len(req.Fields)))

	// 1. 验证表格名称
	tableName, err := valueobject.NewTableName(req.Name)
	if err != nil {
		return nil, pkgerrors.ErrValidationFailed.WithDetails(fmt.Sprintf("表格名称无效: %v", err))
	}

	// 2. 验证Base是否存在
	exists, err := s.baseRepo.Exists(ctx, req.BaseID)
	if err != nil {
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("验证Base存在性失败: %v", err))
	}
	if !exists {
		return nil, pkgerrors.ErrNotFound.WithDetails(map[string]interface{}{
			"resource": "base",
			"id":       req.BaseID,
			"message":  "Base不存在",
		})
	}

	// 3. 创建表格实体
	table, err := entity.NewTable(req.BaseID, tableName, userID)
	if err != nil {
		return nil, pkgerrors.ErrInternalServer.WithDetails(fmt.Sprintf("创建表格实体失败: %v", err))
	}

	// 4. 设置可选属性
	if req.Description != "" {
		table.UpdateDescription(req.Description)
	}

	// 5. ✅ 创建物理表（包含系统字段）
	tableID := table.ID().String()
	baseID := req.BaseID
	dbTableName := s.dbProvider.GenerateTableName(baseID, tableID)

	logger.Info("正在创建物理表",
		logger.String("table_id", tableID),
		logger.String("base_id", baseID),
		logger.String("db_table_name", dbTableName))

	if err := s.dbProvider.CreatePhysicalTable(ctx, baseID, tableID); err != nil {
		logger.Error("创建物理表失败",
			logger.String("table_id", tableID),
			logger.String("db_table_name", dbTableName),
			logger.ErrorField(err))
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails(
			fmt.Sprintf("创建物理表失败: %v", err))
	}

	logger.Info("✅ 物理表创建成功",
		logger.String("table_id", tableID),
		logger.String("db_table_name", dbTableName))

	// 6. 保存表格元数据（设置DBTableName）
	table.SetDBTableName(dbTableName)

	tableAgg := aggregate.NewTableAggregate(table)
	if err := s.tableRepo.Save(ctx, table); err != nil {
		// ❌ 回滚：删除已创建的物理表
		if rollbackErr := s.dbProvider.DropPhysicalTable(ctx, baseID, tableID); rollbackErr != nil {
			logger.Error("回滚删除物理表失败",
				logger.String("table_id", tableID),
				logger.ErrorField(rollbackErr))
		}
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("保存表格失败: %v", err))
	}

	// 临时存储聚合根以便未来扩展
	_ = tableAgg

	// 7. ✅ 批量创建字段（对齐 Teable）
	createdFieldCount := 0
	if s.fieldService != nil && len(req.Fields) > 0 {
		logger.Info("开始批量创建字段",
			logger.String("table_id", tableID),
			logger.Int("field_count", len(req.Fields)))

		for i, fieldConfig := range req.Fields {
			fieldReq := dto.CreateFieldRequest{
				TableID:  tableID,
				Name:     fieldConfig.Name,
				Type:     fieldConfig.Type,
				Required: fieldConfig.Required,
				Unique:   fieldConfig.Unique,
				Options:  fieldConfig.Options,
			}

			if _, err := s.fieldService.CreateField(ctx, fieldReq, userID); err != nil {
				logger.Warn("创建字段失败",
					logger.String("table_id", tableID),
					logger.Int("field_index", i),
					logger.String("field_name", fieldConfig.Name),
					logger.ErrorField(err),
				)
			} else {
				createdFieldCount++
				logger.Debug("字段创建成功",
					logger.String("table_id", tableID),
					logger.String("field_name", fieldConfig.Name),
					logger.String("field_type", fieldConfig.Type),
				)
			}
		}

		logger.Info("✅ 字段批量创建完成",
			logger.String("table_id", tableID),
			logger.Int("created_count", createdFieldCount),
			logger.Int("total_count", len(req.Fields)))
	}

	// 8. ✅ 批量创建视图（对齐 Teable）
	var defaultViewID *string
	createdViews := make([]*dto.ViewResponse, 0, len(req.Views))

	logger.Info("🔍 检查视图服务状态",
		logger.Bool("viewService_nil", s.viewService == nil),
		logger.Int("views_count", len(req.Views)))

	if s.viewService != nil && len(req.Views) > 0 {
		logger.Info("开始批量创建视图",
			logger.String("table_id", tableID),
			logger.Int("view_count", len(req.Views)))

		for i, viewConfig := range req.Views {
			viewReq := dto.CreateViewRequest{
				TableID:     tableID,
				Name:        viewConfig.Name,
				Type:        viewConfig.Type,
				Description: viewConfig.Description,
				ColumnMeta:  viewConfig.ColumnMeta,
			}

			if viewResp, err := s.viewService.CreateView(ctx, viewReq, userID); err != nil {
				logger.Warn("创建视图失败",
					logger.String("table_id", tableID),
					logger.Int("view_index", i),
					logger.String("view_name", viewConfig.Name),
					logger.ErrorField(err),
				)
			} else {
				createdViews = append(createdViews, viewResp)
				logger.Info("✅ 视图创建成功",
					logger.String("table_id", tableID),
					logger.String("view_id", viewResp.ID),
					logger.String("view_name", viewConfig.Name),
					logger.String("view_type", viewConfig.Type),
				)
			}
		}

		// 设置第一个视图为默认视图（对齐 Teable）
		if len(createdViews) > 0 {
			defaultViewID = &createdViews[0].ID
		}

		logger.Info("✅ 视图批量创建完成",
			logger.String("table_id", tableID),
			logger.Int("created_count", len(createdViews)),
			logger.Int("total_count", len(req.Views)))
	}

	logger.Info("✅ 表格创建成功（含物理表、字段、视图）",
		logger.String("table_id", tableID),
		logger.String("base_id", req.BaseID),
		logger.String("name", tableName.String()),
		logger.String("db_table_name", dbTableName),
		logger.Int("field_count", createdFieldCount),
		logger.Int("view_count", len(createdViews)))

	// 返回响应，包含 defaultViewId
	response := dto.FromTableEntity(table)
	response.DefaultViewID = defaultViewID
	response.FieldCount = createdFieldCount
	return response, nil
}

// GetTable 获取表格详情
func (s *TableService) GetTable(ctx context.Context, tableID string) (*dto.TableResponse, error) {
	table, err := s.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("查找表格失败: %v", err))
	}
	if table == nil {
		return nil, pkgerrors.ErrNotFound.WithDetails("表格不存在")
	}

	// 构建响应
	response := dto.FromTableEntity(table)

	// ✅ 获取默认视图（第一个视图）
	if s.viewService != nil {
		views, err := s.viewService.ListViewsByTable(ctx, tableID)
		if err == nil && len(views) > 0 {
			response.DefaultViewID = &views[0].ID
		}
	}

	return response, nil
}

// UpdateTable 更新表格
func (s *TableService) UpdateTable(ctx context.Context, tableID string, req dto.UpdateTableRequest) (*dto.TableResponse, error) {
	// 1. 查找表格
	table, err := s.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("查找表格失败: %v", err))
	}
	if table == nil {
		return nil, pkgerrors.ErrNotFound.WithDetails("表格不存在")
	}

	// 2. 更新名称
	if req.Name != nil && *req.Name != "" {
		tableName, err := valueobject.NewTableName(*req.Name)
		if err != nil {
			return nil, pkgerrors.ErrValidationFailed.WithDetails(fmt.Sprintf("表格名称无效: %v", err))
		}
		if err := table.Rename(tableName); err != nil {
			return nil, pkgerrors.ErrValidationFailed.WithDetails(fmt.Sprintf("重命名失败: %v", err))
		}
	}

	// 3. 更新描述
	if req.Description != nil {
		table.UpdateDescription(*req.Description)
	}

	// 4. 保存
	if err := s.tableRepo.Update(ctx, table); err != nil {
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("保存表格失败: %v", err))
	}

	logger.Info("表格更新成功", logger.String("table_id", tableID))

	return dto.FromTableEntity(table), nil
}

// DeleteTable 删除表格
// ✅ 完全动态表架构：删除Table时删除物理表
// 严格按照旧系统实现
func (s *TableService) DeleteTable(ctx context.Context, tableID string) error {
	// 1. 获取表格信息（需要base_id和db_table_name）
	table, err := s.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("查找表格失败: %v", err))
	}
	if table == nil {
		return pkgerrors.ErrNotFound.WithDetails("表格不存在")
	}

	baseID := table.BaseID()

	logger.Info("正在删除表格及其物理表",
		logger.String("table_id", tableID),
		logger.String("base_id", baseID))

	// 2. ✅ 删除物理表
	// 参考旧系统：DROP TABLE IF EXISTS schema.table CASCADE
	if err := s.dbProvider.DropPhysicalTable(ctx, baseID, tableID); err != nil {
		logger.Error("删除物理表失败",
			logger.String("table_id", tableID),
			logger.String("base_id", baseID),
			logger.ErrorField(err))
		return pkgerrors.ErrDatabaseOperation.WithDetails(
			fmt.Sprintf("删除物理表失败: %v", err))
	}

	logger.Info("✅ 物理表删除成功",
		logger.String("table_id", tableID))

	// 3. 删除表格元数据
	if err := s.tableRepo.Delete(ctx, tableID); err != nil {
		return pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("删除表格失败: %v", err))
	}

	logger.Info("✅ 表格删除成功（含物理表）",
		logger.String("table_id", tableID),
		logger.String("base_id", baseID))

	return nil
}

// ListTables 列出空间的所有表格
func (s *TableService) ListTables(ctx context.Context, baseID string) ([]*dto.TableResponse, error) {
	tables, err := s.tableRepo.GetByBaseID(ctx, baseID)
	if err != nil {
		return nil, pkgerrors.ErrDatabaseOperation.WithDetails(fmt.Sprintf("查询表格列表失败: %v", err))
	}

	tableList := make([]*dto.TableResponse, 0, len(tables))
	for _, table := range tables {
		response := dto.FromTableEntity(table)

		// ✅ 获取默认视图（第一个视图）
		if s.viewService != nil {
			views, err := s.viewService.ListViewsByTable(ctx, table.ID().String())
			if err == nil && len(views) > 0 {
				response.DefaultViewID = &views[0].ID
			}
		}

		tableList = append(tableList, response)
	}

	return tableList, nil
}
