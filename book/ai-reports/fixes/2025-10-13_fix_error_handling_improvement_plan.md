# 错误处理改进计划

**生成日期**: 2025-10-13  
**分类**: Fix  
**关键词**: 错误处理, 错误码规范, 数据验证, 健壮性改进  
**相关模块**: server/pkg/errors, server/internal/interfaces/http, server/internal/application  

## 概述

基于 SDK 综合测试报告，破坏性测试通过率仅 27.50% (11/40)，发现 29 个错误处理问题。本文档提供全面的错误处理改进计划。

## 现状分析

### 现有错误处理机制

#### 1. 错误码体系
位置: `server/pkg/errors/codes.go`

规范: `code = http_status * 1000 + subcode(0-999)`

已定义错误码:
```go
// 成功
200000 = OK

// 4xx 客户端错误
400001 = VALIDATION_FAILED      // 验证失败
400002 = BAD_REQUEST            // 错误请求
401000 = UNAUTHORIZED           // 未授权
401001 = INVALID_TOKEN          // 无效token
401002 = TOKEN_EXPIRED          // token过期
401003 = INVALID_CREDENTIALS    // 无效凭证
403001 = FORBIDDEN              // 权限不足
404001 = NOT_FOUND              // 资源不存在
404101 = USER_NOT_FOUND         // 用户不存在
404201 = SPACE_NOT_FOUND        // 空间不存在
404301 = BASE_NOT_FOUND         // Base不存在
404401 = TABLE_NOT_FOUND        // 表不存在
404501 = FIELD_NOT_FOUND        // 字段不存在
404601 = RECORD_NOT_FOUND       // 记录不存在
404701 = VIEW_NOT_FOUND         // 视图不存在
409001 = CONFLICT               // 资源冲突
409501 = FIELD_IN_USE           // 字段使用中
429001 = TOO_MANY_REQ           // 请求过多

// 5xx 服务端错误
500001 = INTERNAL_ERROR         // 内部错误
500101 = DATABASE_OPERATION     // 数据库操作错误
500102 = DATABASE_QUERY         // 数据库查询错误
500103 = DATABASE_TRANSACTION   // 数据库事务错误
500201 = CACHE_OPERATION        // 缓存操作错误
500301 = QUEUE_OPERATION        // 队列操作错误
500401 = FILE_UPLOAD_FAILED     // 文件上传失败
500901 = TASK_FAILED            // 任务失败
501001 = NOT_IMPLEMENTED        // 未实现
503001 = SERVICE_UNAVAILABLE    // 服务不可用
504001 = TIMEOUT                // 超时
```

#### 2. 错误结构
位置: `server/pkg/errors/errors.go`

```go
type AppError struct {
    Code       string      // 字符串错误码 (如 "VALIDATION_FAILED")
    Message    string      // 错误消息
    Details    interface{} // 详细信息
    HTTPStatus int         // HTTP状态码
}
```

#### 3. 响应结构
位置: `server/pkg/response/response.go`

```go
type APIResponse struct {
    Code       int         // 数字错误码 (如 400001)
    Message    string      // 消息
    Data       interface{} // 数据
    Error      *ErrorPayload
    RequestID  string
    Timestamp  string
}
```

### 发现的问题

#### 问题 1: 参数绑定错误返回 422 而不是 400

**现象**:
```bash
# 测试场景: 创建空间 - 名称为空
期望: 400 Bad Request
实际: 422 Unprocessable Entity
```

**根本原因**:
Handler 中使用 `c.ShouldBindJSON()` 但未正确处理 Gin 的验证错误。

**当前代码**:
```go
// base_handler.go
if err := c.ShouldBindJSON(&req); err != nil {
    response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
    return
}
```

Gin 的 `ShouldBindJSON` 内部会触发自动验证，验证失败时返回 422，但我们期望返回 400。

**解决方案**:
创建统一的绑定和验证中间件，明确返回 400 状态码。

#### 问题 2: 资源不存在返回 500 而不是 404

**现象**:
```bash
# 测试场景: 在不存在的表中创建记录
期望: 404 Not Found
实际: 500 Internal Server Error
```

**根本原因**:
Service 层未检查父资源是否存在，导致数据库操作失败返回 500。

**当前代码缺陷**:
```go
// record_service.go
func (s *RecordService) CreateRecord(cmd *commands.CreateRecordCommand) (*domain.Record, error) {
    // ❌ 未检查表是否存在
    record := domain.NewRecord(...)
    err := s.repo.Create(record)  // 表不存在时数据库报错 -> 500
    return record, err
}
```

**解决方案**:
在创建前检查父资源是否存在。

#### 问题 3: 数据类型验证缺失

**现象**:
```bash
# 测试场景: 数字字段传入字符串
期望: 400 Bad Request (类型不匹配)
实际: 200 OK (成功创建)
```

**根本原因**:
`TypecastService` 仅做类型转换，不做严格验证。

**当前代码缺陷**:
```go
// typecast_service.go
func (s *TypecastService) CastValue(field *domain.Field, value interface{}) (interface{}, error) {
    switch field.Type {
    case "number":
        // ❌ 未验证类型，直接尝试转换
        if num, ok := value.(float64); ok {
            return num, nil
        }
        // 转换失败也不报错，返回 nil
        return nil, nil
    }
}
```

**解决方案**:
增强类型验证，严格检查数据类型和范围。

#### 问题 4: 必填字段验证缺失

**现象**:
```bash
# 测试场景: 创建记录缺少必填字段
期望: 400 Bad Request (缺少必填字段 XXX)
实际: 500 Internal Server Error (服务器内部错误)
```

**根本原因**:
Record 创建时未验证必填字段。

**解决方案**:
在 RecordService 中添加必填字段验证。

#### 问题 5: 资源存在性检查不足

**现象**:
```bash
# 测试场景: 删除不存在的空间
期望: 404 Not Found
实际: 200 OK (成功删除)

# 测试场景: 重复删除同一空间
期望: 404 Not Found  
实际: 200 OK (成功删除)
```

**根本原因**:
软删除实现中未检查资源是否存在。

**当前代码缺陷**:
```go
// space_service.go
func (s *SpaceService) Delete(id string) error {
    // ❌ 直接执行软删除，不检查是否存在
    return s.repo.Delete(id)
}
```

**解决方案**:
删除前先查询资源是否存在。

#### 问题 6: 错误消息不明确

**现象**:
- "请求参数错误" → 应该指出具体哪个字段有问题
- "服务器内部错误" → 应该提供更多上下文
- "资源冲突" → 应该说明是什么资源冲突

**解决方案**:
使用结构化错误详情，提供字段级别的错误信息。

## 改进方案

### 第一阶段: 增强错误码定义

**目标**: 添加缺失的验证相关错误码

**文件**: `server/pkg/errors/codes.go`

```go
const (
    // 新增: 数据验证相关 (400xxx)
    CodeInvalidFieldValue  = 400101  // 字段值无效
    CodeInvalidFieldType   = 400102  // 字段类型无效
    CodeFieldRequired      = 400103  // 必填字段缺失
    CodeFieldTooLong       = 400104  // 字段过长
    CodeFieldOutOfRange    = 400105  // 字段超出范围
    CodeInvalidEmail       = 400106  // 无效邮箱
    CodeInvalidURL         = 400107  // 无效URL
    CodeInvalidPhone       = 400108  // 无效手机号
    CodeDuplicateValue     = 400109  // 重复值
    CodeInvalidPattern     = 400110  // 格式不匹配
    
    // 新增: 资源相关 (409xxx)
    CodeDuplicateField     = 409101  // 字段名重复
    CodeDuplicateRecord    = 409102  // 记录重复
    CodeDuplicateView      = 409103  // 视图名重复
)
```

**预定义错误**:

```go
// errors.go
var (
    // 新增: 验证错误
    ErrFieldRequired      = New("FIELD_REQUIRED", "必填字段不能为空", http.StatusBadRequest)
    ErrInvalidFieldValue  = New("INVALID_FIELD_VALUE", "字段值无效", http.StatusBadRequest)
    ErrInvalidFieldType   = New("INVALID_FIELD_TYPE", "字段类型不匹配", http.StatusBadRequest)
    ErrFieldTooLong       = New("FIELD_TOO_LONG", "字段长度超出限制", http.StatusBadRequest)
    ErrFieldOutOfRange    = New("FIELD_OUT_OF_RANGE", "字段值超出范围", http.StatusBadRequest)
    ErrInvalidEmail       = New("INVALID_EMAIL", "邮箱格式不正确", http.StatusBadRequest)
    ErrDuplicateField     = New("DUPLICATE_FIELD", "字段名已存在", http.StatusConflict)
)
```

### 第二阶段: 创建统一验证中间件

**目标**: 统一处理参数绑定和验证错误

**文件**: `server/internal/interfaces/middleware/validation.go` (新建)

```go
package middleware

import (
    "github.com/gin-gonic/gin"
    "github.com/easyspace-ai/luckdb/server/pkg/errors"
    "github.com/easyspace-ai/luckdb/server/pkg/response"
)

// ValidationMiddleware 验证中间件
func ValidationMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        c.Next()
    }
}

// BindJSON 绑定并验证JSON
func BindJSON(c *gin.Context, obj interface{}) error {
    if err := c.ShouldBindJSON(obj); err != nil {
        // 解析 Gin 的验证错误
        validationErr := parseValidationError(err)
        return validationErr
    }
    return nil
}

// parseValidationError 解析验证错误
func parseValidationError(err error) *errors.AppError {
    // TODO: 解析 validator 错误，提供详细的字段级别错误
    details := map[string]string{}
    
    // 示例: 字段级别错误
    details["name"] = "名称不能为空"
    details["email"] = "邮箱格式不正确"
    
    return errors.ErrValidationFailed.WithDetails(details)
}
```

### 第三阶段: 增强资源存在性检查

**目标**: 在操作前检查资源是否存在

**示例: Space Service**

```go
// space_service.go

// Delete 删除空间（增强版）
func (s *SpaceService) Delete(ctx context.Context, id string) error {
    // 1. 检查空间是否存在
    space, err := s.repo.FindByID(ctx, id)
    if err != nil {
        return errors.ErrDatabaseOperation.WithDetails(err.Error())
    }
    if space == nil {
        return errors.ErrSpaceNotFound.WithDetails(fmt.Sprintf("space %s not found", id))
    }
    
    // 2. 执行删除
    if err := s.repo.Delete(ctx, id); err != nil {
        return errors.ErrDatabaseOperation.WithDetails(err.Error())
    }
    
    return nil
}
```

**示例: Base Service**

```go
// base_service.go

// CreateBase 创建Base（增强版）
func (s *BaseService) CreateBase(ctx context.Context, cmd *commands.CreateBaseCommand) (*domain.Base, error) {
    // 1. 检查父空间是否存在
    space, err := s.spaceRepo.FindByID(ctx, cmd.SpaceID)
    if err != nil {
        return nil, errors.ErrDatabaseOperation.WithDetails(err.Error())
    }
    if space == nil {
        return nil, errors.ErrSpaceNotFound.WithDetails(
            fmt.Sprintf("parent space %s not found", cmd.SpaceID),
        )
    }
    
    // 2. 检查Base名称是否重复
    existing, _ := s.repo.FindByName(ctx, cmd.SpaceID, cmd.Name)
    if existing != nil {
        return nil, errors.ErrBaseExists.WithDetails(
            fmt.Sprintf("base with name '%s' already exists", cmd.Name),
        )
    }
    
    // 3. 创建Base
    base := domain.NewBase(cmd.SpaceID, cmd.Name, cmd.Icon, cmd.CreatedBy)
    if err := s.repo.Create(ctx, base); err != nil {
        return nil, errors.ErrDatabaseOperation.WithDetails(err.Error())
    }
    
    return base, nil
}
```

### 第四阶段: 增强数据类型验证

**目标**: 在 TypecastService 中添加严格的类型和范围验证

**文件**: `server/internal/application/typecast_service.go`

```go
// ValidateAndCast 验证并转换字段值（增强版）
func (s *TypecastService) ValidateAndCast(field *domain.Field, value interface{}) (interface{}, error) {
    // 1. 检查 nil 值
    if value == nil {
        if field.Required {
            return nil, errors.ErrFieldRequired.WithDetails(
                fmt.Sprintf("field '%s' is required", field.Name),
            )
        }
        return nil, nil
    }
    
    // 2. 按字段类型验证
    switch field.Type {
    case "singleLineText", "longText":
        return s.validateText(field, value)
    case "number":
        return s.validateNumber(field, value)
    case "email":
        return s.validateEmail(field, value)
    case "url":
        return s.validateURL(field, value)
    case "phone":
        return s.validatePhone(field, value)
    case "select", "singleSelect":
        return s.validateSelect(field, value)
    default:
        return value, nil
    }
}

// validateNumber 验证数字类型
func (s *TypecastService) validateNumber(field *domain.Field, value interface{}) (float64, error) {
    // 1. 类型检查
    var num float64
    switch v := value.(type) {
    case float64:
        num = v
    case float32:
        num = float64(v)
    case int:
        num = float64(v)
    case int64:
        num = float64(v)
    default:
        return 0, errors.ErrInvalidFieldType.WithDetails(
            fmt.Sprintf("field '%s' expects number, got %T", field.Name, value),
        )
    }
    
    // 2. 范围检查
    if field.Options != nil {
        if minValue, ok := field.Options["minValue"].(float64); ok {
            if num < minValue {
                return 0, errors.ErrFieldOutOfRange.WithDetails(
                    fmt.Sprintf("field '%s' value %.2f is below minimum %.2f", 
                        field.Name, num, minValue),
                )
            }
        }
        if maxValue, ok := field.Options["maxValue"].(float64); ok {
            if num > maxValue {
                return 0, errors.ErrFieldOutOfRange.WithDetails(
                    fmt.Sprintf("field '%s' value %.2f exceeds maximum %.2f", 
                        field.Name, num, maxValue),
                )
            }
        }
    }
    
    return num, nil
}

// validateText 验证文本类型
func (s *TypecastService) validateText(field *domain.Field, value interface{}) (string, error) {
    // 1. 类型检查
    str, ok := value.(string)
    if !ok {
        return "", errors.ErrInvalidFieldType.WithDetails(
            fmt.Sprintf("field '%s' expects string, got %T", field.Name, value),
        )
    }
    
    // 2. 长度检查
    maxLength := 255
    if field.Type == "longText" {
        maxLength = 10000
    }
    if field.Options != nil {
        if ml, ok := field.Options["maxLength"].(int); ok {
            maxLength = ml
        }
    }
    
    if len(str) > maxLength {
        return "", errors.ErrFieldTooLong.WithDetails(
            fmt.Sprintf("field '%s' exceeds maximum length %d", field.Name, maxLength),
        )
    }
    
    // 3. 安全检查（防止注入）
    dangerous := []string{"DROP", "DELETE", "TRUNCATE", "<script>", "javascript:", "--"}
    upperStr := strings.ToUpper(str)
    for _, pattern := range dangerous {
        if strings.Contains(upperStr, pattern) {
            return "", errors.ErrInvalidFieldValue.WithDetails(
                fmt.Sprintf("field '%s' contains dangerous characters", field.Name),
            )
        }
    }
    
    return str, nil
}

// validateEmail 验证邮箱
func (s *TypecastService) validateEmail(field *domain.Field, value interface{}) (string, error) {
    str, ok := value.(string)
    if !ok {
        return "", errors.ErrInvalidFieldType.WithDetails(
            fmt.Sprintf("field '%s' expects string, got %T", field.Name, value),
        )
    }
    
    // 邮箱正则
    emailRegex := regexp.MustCompile(`^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$`)
    if !emailRegex.MatchString(str) {
        return "", errors.ErrInvalidEmail.WithDetails(
            fmt.Sprintf("field '%s' has invalid email format", field.Name),
        )
    }
    
    return str, nil
}
```

### 第五阶段: 添加必填字段验证

**目标**: 在创建/更新记录时验证必填字段

**文件**: `server/internal/application/record_service.go`

```go
// ValidateRequiredFields 验证必填字段
func (s *RecordService) ValidateRequiredFields(
    ctx context.Context,
    tableID string,
    data map[string]interface{},
) error {
    // 1. 获取表的所有字段
    fields, err := s.fieldService.ListByTableID(ctx, tableID)
    if err != nil {
        return err
    }
    
    // 2. 检查必填字段
    missingFields := []string{}
    for _, field := range fields {
        if field.Required {
            if _, exists := data[field.Name]; !exists {
                missingFields = append(missingFields, field.Name)
            }
        }
    }
    
    // 3. 返回错误
    if len(missingFields) > 0 {
        return errors.ErrFieldRequired.WithDetails(map[string]interface{}{
            "message": "缺少必填字段",
            "missing_fields": missingFields,
        })
    }
    
    return nil
}

// CreateRecord 创建记录（增强版）
func (s *RecordService) CreateRecord(
    ctx context.Context,
    cmd *commands.CreateRecordCommand,
) (*domain.Record, error) {
    // 1. 检查表是否存在
    table, err := s.tableRepo.FindByID(ctx, cmd.TableID)
    if err != nil {
        return nil, errors.ErrDatabaseOperation.WithDetails(err.Error())
    }
    if table == nil {
        return nil, errors.ErrTableNotFound.WithDetails(
            fmt.Sprintf("table %s not found", cmd.TableID),
        )
    }
    
    // 2. 验证必填字段
    if err := s.ValidateRequiredFields(ctx, cmd.TableID, cmd.Data); err != nil {
        return nil, err
    }
    
    // 3. 验证字段是否存在
    if err := s.ValidateFieldsExist(ctx, cmd.TableID, cmd.Data); err != nil {
        return nil, err
    }
    
    // 4. 类型转换和验证
    validatedData, err := s.typecastService.ValidateAndCastAll(ctx, cmd.TableID, cmd.Data)
    if err != nil {
        return nil, err
    }
    
    // 5. 创建记录
    record := domain.NewRecord(cmd.TableID, validatedData, cmd.CreatedBy)
    if err := s.repo.Create(ctx, record); err != nil {
        return nil, errors.ErrDatabaseOperation.WithDetails(err.Error())
    }
    
    return record, nil
}
```

### 第六阶段: 更新所有 Handler

**目标**: 统一使用错误处理

**示例: Space Handler**

```go
// CreateSpace 创建空间（标准版）
func (h *SpaceHandler) CreateSpace(c *gin.Context) {
    // 1. 绑定参数
    var req dto.CreateSpaceRequest
    if err := middleware.BindJSON(c, &req); err != nil {
        response.Error(c, err)
        return
    }
    
    // 2. 获取用户ID
    userID, exists := authctx.UserFrom(c.Request.Context())
    if !exists {
        response.Error(c, errors.ErrUnauthorized)
        return
    }
    
    // 3. 调用服务
    space, err := h.service.CreateSpace(c.Request.Context(), &req, userID)
    if err != nil {
        response.Error(c, err)  // ✅ 统一错误处理
        return
    }
    
    // 4. 返回成功
    response.Success(c, space, "空间创建成功")
}
```

## 实施步骤

### Phase 1: 基础设施（1-2天）
- [x] 分析现有错误处理机制
- [ ] 创建改进计划文档
- [ ] 增强错误码定义
- [ ] 创建验证中间件
- [ ] 编写单元测试

### Phase 2: Service 层改进（2-3天）
- [ ] 修复 SpaceService（资源存在性检查）
- [ ] 修复 BaseService（父资源检查）
- [ ] 修复 TableService（父资源检查）
- [ ] 修复 FieldService（重复名称检查）
- [ ] 修复 RecordService（必填字段验证）
- [ ] 修复 ViewService（资源检查）

### Phase 3: 数据验证增强（2-3天）
- [ ] 增强 TypecastService（类型验证）
- [ ] 添加范围验证（min/max）
- [ ] 添加格式验证（email、url、phone）
- [ ] 添加长度验证
- [ ] 添加安全验证（防注入）

### Phase 4: Handler 层统一（1-2天）
- [ ] 更新所有 Handler 使用统一错误处理
- [ ] 移除直接的 JSON 响应
- [ ] 统一使用 response.Error()

### Phase 5: 测试和验证（1-2天）
- [ ] 编写单元测试
- [ ] 运行破坏性测试套件
- [ ] 确保通过率提升到 >90%
- [ ] 性能测试（确保改进不影响性能）

## 预期效果

### 改进前
- 破坏性测试通过率: **27.50%** (11/40)
- 错误码不一致
- 缺少验证
- 错误消息模糊

### 改进后（目标）
- 破坏性测试通过率: **>90%** (36+/40)
- 统一的错误码体系
- 完整的数据验证
- 清晰的错误消息
- 健壮的资源检查

## 风险和注意事项

1. **向后兼容性**: 改动可能影响现有客户端
   - 解决: 保持响应结构不变，仅改进错误处理

2. **性能影响**: 额外的验证可能影响性能
   - 解决: 优化验证逻辑，批量查询

3. **测试覆盖**: 需要大量测试确保正确性
   - 解决: 编写完整的单元测试和集成测试

## 下一步行动

1. ✅ 创建改进计划文档（本文档）
2. ⬜ 增强错误码定义（新增验证相关错误码）
3. ⬜ 创建验证中间件
4. ⬜ 修复关键 Service（Space、Base、Record）
5. ⬜ 增强 TypecastService
6. ⬜ 运行测试验证改进效果

## 附录

### A. 错误码完整列表

参见: `server/pkg/errors/codes.go`

### B. 测试用例

参见: `packages/sdk/examples/98-destructive-tests.ts`

### C. API 文档更新

需要更新 API 文档，说明新的错误码和错误格式。

