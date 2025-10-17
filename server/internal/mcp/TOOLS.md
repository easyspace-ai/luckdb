# MCP Tools 工具清单

## 当前状态（聚焦表操作）

为了简化接口和聚焦核心功能，当前MCP服务器只启用了**表相关的核心操作**。

### ✅ 已启用的工具（31个）

#### 1. Table 工具（6个）
表格的基础操作

| 工具名 | 描述 | 参数 |
|-------|------|------|
| `list_tables` | 列出所有表格 | base_id |
| `get_table` | 获取表格详情 | table_id |
| `create_table` | 创建新表格 | base_id, name, description, fields |
| `update_table` | 更新表格信息 | table_id, name, description |
| `delete_table` | 删除表格 | table_id |
| `duplicate_table` | 复制表格 | table_id, name |

#### 2. Field 工具（6个）
字段的管理操作

| 工具名 | 描述 | 参数 |
|-------|------|------|
| `list_fields` | 列出表格的所有字段 | table_id |
| `get_field` | 获取字段详情 | field_id |
| `create_field` | 创建新字段 | table_id, name, type, options |
| `update_field` | 更新字段配置 | field_id, name, options |
| `delete_field` | 删除字段 | field_id |
| `convert_field_type` | 转换字段类型 | field_id, new_type, options |

#### 3. Record 工具（8个）
记录的CRUD和批量操作

| 工具名 | 描述 | 参数 |
|-------|------|------|
| `list_records` | 列出记录 | table_id, view_id, filter, sort, limit |
| `get_record` | 获取记录详情 | record_id |
| `create_record` | 创建记录 | table_id, fields |
| `update_record` | 更新记录 | record_id, fields |
| `delete_record` | 删除记录 | record_id |
| `batch_create_records` | 批量创建记录 | table_id, records |
| `batch_update_records` | 批量更新记录 | updates |
| `batch_delete_records` | 批量删除记录 | record_ids |

#### 4. View 工具（8个）
视图的管理和配置

| 工具名 | 描述 | 参数 |
|-------|------|------|
| `list_views` | 列出表格的所有视图 | table_id |
| `get_view` | 获取视图详情 | view_id |
| `create_view` | 创建新视图 | table_id, name, type, config |
| `update_view` | 更新视图配置 | view_id, name, config |
| `delete_view` | 删除视图 | view_id |
| `update_view_filter` | 更新视图过滤器 | view_id, filter |
| `update_view_sort` | 更新视图排序 | view_id, sort |
| `duplicate_view` | 复制视图 | view_id, name |

#### 5. User 工具（3个）
用户管理和认证

| 工具名 | 描述 | 参数 |
|-------|------|------|
| `get_current_user` | 获取当前用户信息 | - |
| `update_user_profile` | 更新用户资料 | name, avatar, bio |
| `change_password` | 修改密码 | old_password, new_password |

### 🚫 已注释的工具（12个）

这些工具暂时被注释，未来可根据需要重新启用。

#### 1. Space 工具（5个）
空间级别的操作

| 工具名 | 描述 | 状态 |
|-------|------|------|
| `list_spaces` | 列出所有空间 | 🔴 已注释 |
| `get_space` | 获取空间详情 | 🔴 已注释 |
| `create_space` | 创建新空间 | 🔴 已注释 |
| `update_space` | 更新空间信息 | 🔴 已注释 |
| `delete_space` | 删除空间 | 🔴 已注释 |

#### 2. Base 工具（7个）
数据库级别的操作

| 工具名 | 描述 | 状态 |
|-------|------|------|
| `list_bases` | 列出空间的所有数据库 | 🔴 已注释 |
| `get_base` | 获取数据库详情 | 🔴 已注释 |
| `create_base` | 创建新数据库 | 🔴 已注释 |
| `update_base` | 更新数据库信息 | 🔴 已注释 |
| `delete_base` | 删除数据库 | 🔴 已注释 |
| `duplicate_base` | 复制数据库 | 🔴 已注释 |
| `get_base_collaborators` | 获取数据库协作者 | 🔴 已注释 |

## 工具使用示例

### 1. 列出表格

```json
{
  "method": "tools/call",
  "params": {
    "name": "list_tables",
    "arguments": {
      "base_id": "base_xxx"
    }
  }
}
```

### 2. 创建表格

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_table",
    "arguments": {
      "base_id": "base_xxx",
      "name": "我的表格",
      "description": "表格描述",
      "fields": [
        {
          "name": "名称",
          "type": "text"
        },
        {
          "name": "年龄",
          "type": "number"
        }
      ]
    }
  }
}
```

### 3. 创建记录

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_record",
    "arguments": {
      "table_id": "tbl_xxx",
      "fields": {
        "名称": "张三",
        "年龄": 25
      }
    }
  }
}
```

### 4. 批量创建记录

```json
{
  "method": "tools/call",
  "params": {
    "name": "batch_create_records",
    "arguments": {
      "table_id": "tbl_xxx",
      "records": [
        {
          "fields": {
            "名称": "张三",
            "年龄": 25
          }
        },
        {
          "fields": {
            "名称": "李四",
            "年龄": 30
          }
        }
      ]
    }
  }
}
```

### 5. 创建视图

```json
{
  "method": "tools/call",
  "params": {
    "name": "create_view",
    "arguments": {
      "table_id": "tbl_xxx",
      "name": "我的视图",
      "type": "grid",
      "config": {
        "filter": {
          "conditions": [
            {
              "field": "年龄",
              "operator": "greater_than",
              "value": 18
            }
          ]
        }
      }
    }
  }
}
```

## 工具分类

### 按功能分类

```
表操作层 (Table Level)
├── 表格管理 (6个工具)
├── 字段管理 (6个工具)
└── 视图管理 (8个工具)

数据操作层 (Data Level)
└── 记录操作 (8个工具)
    ├── 单条操作 (5个)
    └── 批量操作 (3个)

用户层 (User Level)
└── 用户管理 (3个工具)
```

### 按操作类型分类

```
读操作 (Read) - 10个
├── list_tables
├── get_table
├── list_fields
├── get_field
├── list_records
├── get_record
├── list_views
├── get_view
├── get_current_user

写操作 (Write) - 12个
├── 创建 (Create) - 5个
│   ├── create_table
│   ├── create_field
│   ├── create_record
│   ├── create_view
│   └── batch_create_records
├── 更新 (Update) - 5个
│   ├── update_table
│   ├── update_field
│   ├── update_record
│   ├── update_view
│   ├── update_view_filter
│   ├── update_view_sort
│   ├── batch_update_records
│   ├── update_user_profile
│   └── change_password
└── 删除 (Delete) - 5个
    ├── delete_table
    ├── delete_field
    ├── delete_record
    ├── delete_view
    └── batch_delete_records

特殊操作 - 3个
├── duplicate_table
├── duplicate_view
└── convert_field_type
```

## 性能建议

### 1. 批量操作

对于多条记录的操作，优先使用批量工具：

✅ **推荐**：
```
batch_create_records - 创建100条记录只需1次调用
batch_update_records - 更新100条记录只需1次调用
batch_delete_records - 删除100条记录只需1次调用
```

❌ **避免**：
```
循环调用 create_record 100次
循环调用 update_record 100次
循环调用 delete_record 100次
```

### 2. 缓存利用

以下读操作会被自动缓存：

- `list_tables` - TTL: 2分钟
- `get_table` - TTL: 5分钟
- `list_fields` - TTL: 2分钟
- `get_field` - TTL: 5分钟
- `list_views` - TTL: 2分钟
- `get_view` - TTL: 5分钟

### 3. 限流提醒

- 默认限流：100次/分钟
- 突发容量：10次
- 建议合理使用批量操作减少请求次数

## 恢复已注释的工具

如需恢复 Space 或 Base 工具，修改 `server/internal/mcp/server.go`：

```go
// 取消注释以启用 Space 工具
if err := s.registerSpaceTools(); err != nil {
    return fmt.Errorf("failed to register space tools: %w", err)
}

// 取消注释以启用 Base 工具
if err := s.registerBaseTools(); err != nil {
    return fmt.Errorf("failed to register base tools: %w", err)
}
```

然后重启服务即可。

## 版本历史

### v2.0.1 (2025-10-17)
- 🎯 聚焦表操作
- 🔴 暂时注释 Space 和 Base 工具
- ✅ 保留 31个核心表操作工具
- 📉 工具数量从 43个 减少到 31个

### v2.0.0 (2025-10-17)
- 🚀 完整的架构优化
- 📦 中间件系统
- 💾 缓存支持
- 📊 监控指标
- 🛡️ 限流保护

## 相关文档

- [MCP Server README](./README.md)
- [优化报告](/book/ai-reports/optimization/2025-10-17_optimize_mcp_server_architecture.md)
- [配置文件](/server/config.yaml)

