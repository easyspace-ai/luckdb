package http

import (
	"context"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/easyspace-ai/luckdb/server/internal/application"
	"github.com/easyspace-ai/luckdb/server/internal/application/dto"
	recordRepo "github.com/easyspace-ai/luckdb/server/internal/domain/record/repository"
	"github.com/easyspace-ai/luckdb/server/internal/domain/record/valueobject"
	"github.com/easyspace-ai/luckdb/server/pkg/errors"
	"github.com/easyspace-ai/luckdb/server/pkg/logger"
	"github.com/easyspace-ai/luckdb/server/pkg/response"
)

// RecordHandler 记录HTTP处理器
type RecordHandler struct {
	recordService      *application.RecordService
	fieldService       *application.FieldService       // ✅ 新增
	calculationService *application.CalculationService // ✅ 新增
	recordRepo         recordRepo.RecordRepository     // ✅ 新增
}

// NewRecordHandler 创建记录处理器
func NewRecordHandler(
	recordService *application.RecordService,
	fieldService *application.FieldService, // ✅ 新增参数
	calculationService *application.CalculationService, // ✅ 新增参数
	recordRepo recordRepo.RecordRepository, // ✅ 新增参数
) *RecordHandler {
	return &RecordHandler{
		recordService:      recordService,
		fieldService:       fieldService,       // ✅ 注入
		calculationService: calculationService, // ✅ 注入
		recordRepo:         recordRepo,         // ✅ 注入
	}
}

// CreateRecord 创建记录
func (h *RecordHandler) CreateRecord(c *gin.Context) {
	var req dto.CreateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized.WithDetails("未授权"))
		return
	}

	resp, err := h.recordService.CreateRecord(c.Request.Context(), req, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	// ✅ 虚拟字段计算已在 Service 事务内完成，无需异步计算
	response.Success(c, resp, "创建记录成功")
}

// GetRecord 获取记录详情
func (h *RecordHandler) GetRecord(c *gin.Context) {
	recordID := c.Param("recordId")

	resp, err := h.recordService.GetRecord(c.Request.Context(), recordID)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, resp, "获取记录成功")
}

// UpdateRecord 更新记录
func (h *RecordHandler) UpdateRecord(c *gin.Context) {
	ctx := c.Request.Context()
	recordID := c.Param("recordId")

	var req dto.UpdateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
		return
	}

	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized.WithDetails("未授权"))
		return
	}

	resp, err := h.recordService.UpdateRecord(ctx, recordID, req, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	// ✅ 新增：自动计算受影响的虚拟字段
	// 异步计算，不阻塞响应
	logger.Info("⚡ 即将启动虚拟字段异步计算",
		logger.String("record_id", recordID))
	go h.calculateVirtualFieldsAsync(recordID, req)
	logger.Info("⚡ 异步计算goroutine已启动",
		logger.String("record_id", recordID))

	response.Success(c, resp, "更新记录成功")
}

// DeleteRecord 删除记录
func (h *RecordHandler) DeleteRecord(c *gin.Context) {
	recordID := c.Param("recordId")

	if err := h.recordService.DeleteRecord(c.Request.Context(), recordID); err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, nil, "删除记录成功")
}

// BatchCreateRecords 批量创建记录
// POST /api/v1/tables/:tableId/records/batch
// ✅ 严格使用 response.Success
func (h *RecordHandler) BatchCreateRecords(c *gin.Context) {
	tableID := c.Param("tableId")

	// 1. 参数绑定
	var req dto.BatchCreateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
		return
	}

	// 2. 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized.WithDetails("未授权"))
		return
	}

	// 3. 调用Service
	resp, err := h.recordService.BatchCreateRecords(c.Request.Context(), tableID, req, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	// 4. ✅ 严格使用response.Success
	response.Success(c, resp, "批量创建记录成功")
}

// BatchUpdateRecords 批量更新记录
// PATCH /api/v1/records/batch
// ✅ 严格使用 response.Success
func (h *RecordHandler) BatchUpdateRecords(c *gin.Context) {
	// 1. 参数绑定
	var req dto.BatchUpdateRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
		return
	}

	// 2. 获取用户ID
	userID := c.GetString("user_id")
	if userID == "" {
		response.Error(c, errors.ErrUnauthorized.WithDetails("未授权"))
		return
	}

	// 3. 调用Service
	resp, err := h.recordService.BatchUpdateRecords(c.Request.Context(), req, userID)
	if err != nil {
		response.Error(c, err)
		return
	}

	// 4. ✅ 严格使用response.Success
	response.Success(c, resp, "批量更新记录成功")
}

// BatchDeleteRecords 批量删除记录
// DELETE /api/v1/records/batch
// ✅ 严格使用 response.Success
func (h *RecordHandler) BatchDeleteRecords(c *gin.Context) {
	// 1. 参数绑定
	var req dto.BatchDeleteRecordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
		return
	}

	// 2. 调用Service
	resp, err := h.recordService.BatchDeleteRecords(c.Request.Context(), req)
	if err != nil {
		response.Error(c, err)
		return
	}

	// 3. ✅ 严格使用response.Success
	response.Success(c, resp, "批量删除记录成功")
}

// ListRecords 列出表格的所有记录
func (h *RecordHandler) ListRecords(c *gin.Context) {
	tableID := c.Param("tableId")

	// 解析分页参数
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "100"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	resp, err := h.recordService.ListRecords(c.Request.Context(), tableID, limit, offset)
	if err != nil {
		response.Error(c, err)
		return
	}

	response.Success(c, resp, "获取记录列表成功")
}

// ==================== 辅助方法 ====================

// calculateVirtualFieldsForCreate 创建记录后异步计算虚拟字段
func (h *RecordHandler) calculateVirtualFieldsForCreate(recordID string, req dto.CreateRecordRequest) {
	// ⚠️ 关键：添加延迟确保主线程的数据库事务已提交
	time.Sleep(100 * time.Millisecond)

	ctx := context.Background() // 使用独立context避免被取消

	logger.Info("🚀 开始异步计算虚拟字段（创建）",
		logger.String("record_id", recordID))

	// 1. 提取所有字段ID（创建时req.Data的keys已经是字段ID）
	fieldIDs := make([]string, 0, len(req.Data))
	for fieldID := range req.Data {
		fieldIDs = append(fieldIDs, fieldID)
	}

	if len(fieldIDs) == 0 {
		logger.Info("⚠️ 没有字段数据，跳过虚拟字段计算",
			logger.String("record_id", recordID))
		return
	}

	logger.Info("📝 检测到字段数据",
		logger.String("record_id", recordID),
		logger.Strings("field_ids", fieldIDs))

	// 2. 获取记录（确保获取到最新数据）
	record, err := h.recordService.GetRecord(ctx, recordID)
	if err != nil {
		logger.Error("❌ 获取记录失败",
			logger.String("record_id", recordID),
			logger.ErrorField(err))
		return
	}

	logger.Info("🔍 准备计算虚拟字段",
		logger.String("record_id", recordID),
		logger.String("table_id", record.TableID),
		logger.Int("changed_field_count", len(fieldIDs)))

	// 3. 通过RecordRepository获取Record entity（包含最新数据）
	recordIDObj := valueobject.NewRecordID(recordID)
	recordEntity, err := h.recordRepo.FindByID(ctx, recordIDObj)
	if err != nil {
		logger.Error("❌ 获取Record entity失败",
			logger.String("record_id", recordID),
			logger.ErrorField(err))
		return
	}

	logger.Info("🔍 当前Record数据",
		logger.String("record_id", recordID),
		logger.Any("data_keys", h.getDataKeys(recordEntity.Data().ToMap())))

	// 4. 调用CalculationService进行虚拟字段重算
	if err := h.calculationService.CalculateAffectedFields(ctx, recordEntity, fieldIDs); err != nil {
		logger.Error("❌ 虚拟字段计算失败",
			logger.String("record_id", recordID),
			logger.ErrorField(err))
		return
	}

	logger.Info("✅ 虚拟字段计算完成（创建）",
		logger.String("record_id", recordID))
}

// calculateVirtualFieldsAsync 异步计算虚拟字段
func (h *RecordHandler) calculateVirtualFieldsAsync(recordID string, req dto.UpdateRecordRequest) {
	// ⚠️ 关键：添加延迟确保主线程的数据库事务已提交
	time.Sleep(100 * time.Millisecond)

	ctx := context.Background() // 使用独立context避免被取消

	logger.Info("🚀 开始异步计算虚拟字段",
		logger.String("record_id", recordID))

	// 1. 提取变更的字段（现在是字段ID）
	changedFields := h.extractChangedFieldNames(req.Data)
	if len(changedFields) == 0 {
		logger.Warn("⚠️ 没有字段变更",
			logger.String("record_id", recordID))
		return
	}

	logger.Info("📝 检测到字段变更",
		logger.String("record_id", recordID),
		logger.Strings("changed_fields", changedFields))

	// 2. 获取记录（确保获取到最新数据）
	record, err := h.recordService.GetRecord(ctx, recordID)
	if err != nil {
		logger.Error("❌ 获取记录失败",
			logger.String("record_id", recordID),
			logger.ErrorField(err))
		return
	}

	// 3. ✅ 修复：检查是字段ID还是字段名
	// 现在前端发送的是字段ID，直接使用
	tableID := record.TableID
	fieldIDs := make([]string, 0, len(changedFields))

	// 检查第一个字段是否为字段ID格式（fld_开头）
	isFieldID := len(changedFields) > 0 && strings.HasPrefix(changedFields[0], "fld_")

	if isFieldID {
		// ✅ 已经是字段ID，直接使用
		fieldIDs = changedFields
		logger.Info("🔍 检测到字段ID格式，直接使用",
			logger.Int("field_count", len(fieldIDs)))
	} else {
		// 旧格式：字段名，需要转换
		var err error
		fieldIDs, err = h.fieldService.GetFieldIDsByNames(ctx, tableID, changedFields)
		if err != nil {
			logger.Error("❌ 获取字段ID失败",
				logger.String("table_id", tableID),
				logger.ErrorField(err))
			return
		}
		logger.Info("🔍 字段名称转换完成",
			logger.Int("field_count", len(fieldIDs)))
	}

	// 4. 通过RecordRepository获取Record entity（包含最新数据）
	recordIDObj := valueobject.NewRecordID(recordID)
	recordEntity, err := h.recordRepo.FindByID(ctx, recordIDObj)
	if err != nil {
		logger.Error("❌ 获取Record entity失败",
			logger.String("record_id", recordID),
			logger.ErrorField(err))
		return
	}

	// 📊 诊断：输出当前record的数据
	logger.Info("🔍 当前Record数据",
		logger.String("record_id", recordID),
		logger.Any("data_keys", h.getDataKeys(recordEntity.Data().ToMap())))

	// 5. 调用CalculationService进行虚拟字段重算
	if err := h.calculationService.CalculateAffectedFields(ctx, recordEntity, fieldIDs); err != nil {
		logger.Error("❌ 虚拟字段计算失败",
			logger.String("record_id", recordID),
			logger.ErrorField(err))
		return
	}

	logger.Info("✅ 虚拟字段计算完成",
		logger.String("record_id", recordID))
}

// getDataKeys 获取data的keys用于诊断
func (h *RecordHandler) getDataKeys(data map[string]interface{}) []string {
	keys := make([]string, 0, len(data))
	for k := range data {
		keys = append(keys, k)
	}
	return keys
}

// extractChangedFieldNames 提取变更的字段名称
func (h *RecordHandler) extractChangedFieldNames(fields map[string]interface{}) []string {
	if fields == nil {
		return []string{}
	}

	names := make([]string, 0, len(fields))
	for name := range fields {
		names = append(names, name)
	}

	return names
}
