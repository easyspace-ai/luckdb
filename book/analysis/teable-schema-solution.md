# Teable Schema 管理方案分析

## 一、核心发现

### 1.1 Teable 的 dbTableName 设计

在 Teable 系统中，`dbTableName` **包含完整的 schema 前缀**：

```typescript
// apps/nestjs-backend/src/db-provider/postgres.provider.ts:55-57
generateDbTableName(baseId: string, name: string) {
  return `${baseId}.${name}`;  // ✅ 返回 "baseId"."tableName"
}
```

例如：
- Base ID: `b645a638-3d6e-4ba1-bfae-689be627152e`
- Table Name: `tbl_xxx`
- **存储的 dbTableName**: `"b645a638-3d6e-4ba1-bfae-689be627152e"."tbl_xxx"`

### 1.2 Teable 不使用 SET search_path

在整个 Teable 代码库中，**没有动态设置 `search_path`**。他们只在需要角色限制时使用 `SET ROLE`：

```typescript
// apps/nestjs-backend/src/features/base-sql-executor/base-sql-executor.service.ts:228-235
private async setRole(prisma: Prisma.TransactionClient, baseId: string) {
  const roleName = this.getReadOnlyRoleName(baseId);
  await prisma.$executeRawUnsafe(this.knex.raw(`SET ROLE ??`, [roleName]).toQuery());
}

private async resetRole(prisma: Prisma.TransactionClient) {
  await prisma.$executeRawUnsafe(this.knex.raw(`RESET ROLE`).toQuery());
}
```

**`SET ROLE` 是用于权限控制，不是 schema 切换！**

### 1.3 查询时使用完整表名

```typescript
// apps/nestjs-backend/src/features/record/record.service.ts:177-188
async getDbTableName(tableId: string) {
  const tableMeta = await this.prismaService
    .txClient()
    .tableMeta.findUniqueOrThrow({
      where: { id: tableId },
      select: { dbTableName: true },  // 直接获取完整表名
    });
  return tableMeta.dbTableName;  // 返回 "baseId"."tableName"
}

// 使用示例
const dbTableName = await this.getDbTableName(tableId);
const queryBuilder = this.knex(dbTableName);  // Knex 自动解析 schema
```

### 1.4 元数据表始终在 public schema

所有全局元数据表都在 `public` schema，使用 Prisma 的默认配置：

```prisma
// packages/db-main-prisma/prisma/postgres/schema.prisma
datasource db {
  provider = "postgres"
  url      = env("PRISMA_DATABASE_URL")
  // 默认 schema 是 public，所有模型都在 public 中
}

model User {
  @@map("users")  // 映射到 public.users
}

model TableMeta {
  @@map("table_meta")  // 映射到 public.table_meta
}

model Field {
  @@map("field")  // 映射到 public.field
}
```

---

## 二、LuckDB 当前的问题

### 2.1 我们的实现方式

```go
// server/internal/infrastructure/repository/record_repository_dynamic.go
func (r *RecordRepositoryDynamic) Save(ctx context.Context, record *entity.Record) error {
    // 问题：这里设置了 search_path
    if err := tx.Exec("SET search_path TO \"" + baseID + "\"").Error; err != nil {
        return err
    }
    
    // 之后的所有查询都在 baseID schema 中查找！
    // 导致找不到 public.field, public.users 等表
    tx.Table("field").Where(...)  // ❌ 查找 "baseID"."field" (不存在)
    tx.Table("record_meta").Where(...)  // ❌ 查找 "baseID"."record_meta" (不存在)
}
```

### 2.2 我们的临时修复方案

在所有 repository 中显式指定 `public` schema：

```go
// ✅ 临时修复
tx.Table("public.field").Where(...)
tx.Table("public.record_meta").Where(...)
tx.Table("public.users").Where(...)
```

**问题：**
- 需要修改几十个文件
- 容易遗漏
- 维护成本高
- 代码不够优雅

---

## 三、推荐的长期解决方案

### 方案 A：采用 Teable 的方式（推荐 ⭐⭐⭐⭐⭐）

**完全移除 `SET search_path`，使用完整表名**

#### 3.1 修改 dbTableName 存储

```go
// 创建表时，存储完整的表名
dbTableName := fmt.Sprintf(`"%s"."%s"`, baseID, tableID)

tableMeta := &models.Table{
    ID:          tableID,
    BaseID:      baseID,
    Name:        req.Name,
    DbTableName: dbTableName,  // ✅ 存储 "baseID"."tableID"
}
```

#### 3.2 移除所有 SET search_path

```go
// ❌ 删除所有这样的代码
// tx.Exec("SET search_path TO \"" + baseID + "\"")

// ✅ 直接使用完整表名
physicalTableName := record.TableID()  // 从 table_meta 读取，已包含 schema
tx.Table(physicalTableName).Create(&data)
```

#### 3.3 查询元数据表无需修改

```go
// ✅ 元数据表继续使用简单名称（默认在 public）
tx.Table("field").Where("table_id = ?", tableID).Find(&fields)
tx.Table("users").Where("email = ?", email).First(&user)
```

**优点：**
- ✅ 与 Teable 一致的架构
- ✅ 不需要修改现有的元数据查询
- ✅ 更安全、更明确
- ✅ 不会出现 schema 泄露问题

**缺点：**
- ⚠️ 需要重新设计表创建逻辑
- ⚠️ 可能需要数据迁移

---

### 方案 B：保留 search_path，但在事务结束时重置

```go
func (r *RecordRepositoryDynamic) Save(ctx context.Context, record *entity.Record) error {
    return database.Transaction(ctx, r.db, nil, func(txCtx context.Context) error {
        tx := database.GetDB(txCtx)
        
        // 设置 search_path
        originalPath := "public"
        if err := tx.Exec("SET search_path TO \"" + baseID + "\"").Error; err != nil {
            return err
        }
        
        // 确保在函数退出时重置
        defer func() {
            tx.Exec("SET search_path TO " + originalPath)
        }()
        
        // 业务逻辑...
        // 注意：查询元数据表时需要显式指定 public schema
        tx.Table("public.field").Where(...)
    })
}
```

**优点：**
- ✅ 相对容易实现
- ✅ 不需要重新设计

**缺点：**
- ❌ 仍需在所有元数据查询中显式指定 `public`
- ❌ defer 在事务回滚时可能不会执行
- ❌ 不如方案 A 优雅

---

### 方案 C：使用 GORM 的 Schema 配置（混合方案）

为租户表使用 schema 配置，而不是 `SET search_path`：

```go
// 为租户数据使用 schema 配置
type RecordData struct {
    // ...
}

func (RecordData) TableName() string {
    // 动态返回带 schema 的表名
    return fmt.Sprintf(`"%s"."%s"`, baseID, tableID)
}

// 或者使用 GORM 的 Scopes
db.Scopes(func(tx *gorm.DB) *gorm.DB {
    return tx.Table(fmt.Sprintf(`"%s"."%s"`, schema, tableName))
}).Create(&data)
```

**优点：**
- ✅ 不需要 SET search_path
- ✅ 元数据查询不受影响

**缺点：**
- ⚠️ 需要重构 repository 层
- ⚠️ 动态表名可能影响性能

---

## 四、推荐实施步骤

### 阶段 1：短期修复（当前已完成）
- [x] 在所有元数据 repository 中显式指定 `public` schema
- [x] 修复 `field`, `table_meta`, `record_meta`, `base`, `space`, `users` 等 repository
- [x] 测试验证

### 阶段 2：长期重构（推荐）
1. **修改表创建逻辑**
   - 修改 `TableService.CreateTable` 生成完整的 `dbTableName`
   - 更新 `table_meta` 表中的数据格式

2. **移除 SET search_path**
   - 在 `RecordRepositoryDynamic` 中移除所有 `SET search_path` 调用
   - 直接使用 `dbTableName` 查询

3. **回退显式 schema 指定**
   - 移除所有 `Table("public.xxx")` 中的 `public.` 前缀
   - 让 GORM 使用默认 schema

4. **数据迁移**
   - 编写迁移脚本，更新现有的 `dbTableName` 字段
   - 从 `"tbl_xxx"` 更新为 `"baseID"."tbl_xxx"`

5. **测试验证**
   - 运行所有测试
   - 验证记录 CRUD 操作
   - 验证多租户隔离

---

## 五、总结

### Teable 的核心智慧

1. **简单即美**：不使用复杂的 `search_path` 切换
2. **明确优于隐式**：表名包含完整 schema，查询更清晰
3. **默认配置**：利用 PostgreSQL 的默认行为，元数据在 `public`
4. **角色分离**：`SET ROLE` 用于权限，不混用于 schema 管理

### 我们应该学习的

> "不要过度设计。如果简单的方案能解决问题，就用简单的方案。"

Teable 的方案证明了：**在查询中使用完整表名**比**动态切换 search_path** 更可靠、更易维护。

---

## 附录：Teable 相关代码位置

1. **dbTableName 生成**:
   - `apps/nestjs-backend/src/db-provider/postgres.provider.ts:55`

2. **表创建逻辑**:
   - `apps/nestjs-backend/src/features/table/table.service.ts:40`

3. **记录查询**:
   - `apps/nestjs-backend/src/features/record/record.service.ts:177`

4. **Prisma Schema**:
   - `packages/db-main-prisma/prisma/postgres/schema.prisma`

5. **SET ROLE 使用（权限控制）**:
   - `apps/nestjs-backend/src/features/base-sql-executor/base-sql-executor.service.ts:228`

