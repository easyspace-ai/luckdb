# Cursor MCP 集成设置指南

本指南将帮助你在 Cursor 中配置和使用 LuckDB MCP 服务器。

## 前置要求

1. **Cursor 编辑器**: 确保你使用的是支持 MCP 的 Cursor 版本
2. **Go 环境**: 确保系统已安装 Go 1.23+
3. **LuckDB 项目**: 确保项目已正确构建

## 快速设置

### 1. 构建 MCP 服务器

```bash
cd /Users/leven/space/easy/luckdb/server
go build -o bin/mcp-server ./cmd/mcp-server
```

### 2. 验证配置文件

确保以下文件存在：

- `.cursor/mcp.json` - Cursor MCP 配置
- `server/config.yaml` - MCP 服务器配置
- `mcp-manifest.json` - MCP 清单文件

### 3. 测试 MCP 服务器

```bash
# 测试 HTTP 模式
./server/bin/mcp-server

# 测试 stdio 模式 (用于 Cursor)
./server/bin/mcp-server --stdio
```

## 配置说明

### Cursor MCP 配置 (`.cursor/mcp.json`)

```json
{
  "mcpServers": {
    "luckdb": {
      "command": "./server/bin/mcp-server",
      "args": ["--stdio"],
      "cwd": "/Users/leven/space/easy/luckdb",
      "env": {
        "LUCKDB_CONFIG_PATH": "./server/config.yaml"
      }
    }
  }
}
```

### 配置参数说明

- **command**: MCP 服务器可执行文件路径
- **args**: 命令行参数 (`--stdio` 用于 stdio 模式)
- **cwd**: 工作目录 (项目根目录)
- **env**: 环境变量配置

## 可用功能

### 工具 (Tools)

1. **query_records** - 查询记录数据

   - 参数: `space_id`, `table_id`, `limit`, `offset`, `order_by`, `order_direction`

2. **search_records** - 搜索记录

   - 参数: `space_id`, `table_id`, `query`, `fields`, `limit`, `offset`, `case_sensitive`

3. **create_record** - 创建记录

   - 参数: `space_id`, `table_id`, `data`

4. **update_record** - 更新记录

   - 参数: `space_id`, `table_id`, `record_id`, `data`

5. **delete_record** - 删除记录

   - 参数: `space_id`, `table_id`, `record_id`, `permanent`

6. **get_table_schema** - 获取表结构

   - 参数: `space_id`, `table_id`, `include_fields`, `include_metadata`

7. **list_tables** - 列出表
   - 参数: `space_id`, `limit`, `offset`, `include_metadata`, `order_by`, `order_direction`

### 资源 (Resources)

1. **table://{space_id}/{table_id}/schema** - 表结构资源
2. **data://{space_id}/{table_id}/records** - 记录数据资源
3. **metadata://{space_id}/{table_id}/info** - 表元数据资源

### 提示 (Prompts)

1. **analyze_data** - 数据分析提示

   - 参数: `data_description`, `analysis_type`, `focus_areas`

2. **query_data** - 数据查询提示

   - 参数: `query_intent`, `data_source`, `output_format`

3. **analyze_schema** - 表结构分析提示
   - 参数: `schema_description`, `analysis_goal`, `constraints`

## 使用示例

### 在 Cursor 中使用

1. **重启 Cursor**: 配置更改后需要重启 Cursor
2. **检查 MCP 连接**: 在 Cursor 中应该能看到 LuckDB MCP 服务器
3. **使用工具**: 在聊天中可以直接调用 MCP 工具

### 示例对话

```
用户: 帮我查询空间 "my-space" 中表 "users" 的前 10 条记录

Cursor: 我来帮你查询记录数据。
[调用 query_records 工具]
参数: space_id="my-space", table_id="users", limit=10

结果: 查询到 10 条用户记录...
```

## 故障排除

### 常见问题

1. **MCP 服务器无法启动**

   - 检查 Go 环境是否正确安装
   - 检查配置文件是否存在
   - 查看错误日志

2. **Cursor 无法连接 MCP 服务器**

   - 检查 `.cursor/mcp.json` 配置是否正确
   - 确保路径是绝对路径
   - 重启 Cursor

3. **工具调用失败**
   - 检查参数格式是否正确
   - 查看服务器日志
   - 验证数据库连接

### 调试模式

启用调试模式以获取更多信息：

```bash
# 设置环境变量
export LUCKDB_LOG_LEVEL=debug

# 启动服务器
./server/bin/mcp-server --stdio
```

### 日志查看

- **HTTP 模式**: 日志输出到 stdout
- **stdio 模式**: 日志输出到 stderr (避免干扰 MCP 协议)

## 高级配置

### 自定义配置

你可以修改 `server/config.yaml` 来自定义 MCP 服务器行为：

```yaml
mcp:
  server:
    host: '0.0.0.0'
    port: 8081
    enable_debug: true
  auth:
    api_key:
      enabled: true
      key_length: 32
  tools:
    query_records:
      max_limit: 1000
      default_limit: 100
```

### 环境变量

- `LUCKDB_CONFIG_PATH`: 配置文件路径
- `LUCKDB_LOG_LEVEL`: 日志级别 (debug, info, warn, error)

## 开发指南

### 添加新工具

1. 在 `server/internal/mcp/tools/` 中创建新工具
2. 实现 `Tool` 接口
3. 在 `BaseToolService` 中注册工具
4. 更新 `mcp-manifest.json`

### 添加新资源

1. 在 `server/internal/mcp/resources/` 中创建新资源
2. 实现 `Resource` 接口
3. 在 `BaseResourceService` 中注册资源
4. 更新 `mcp-manifest.json`

### 添加新提示

1. 在 `server/internal/mcp/prompts/` 中创建新提示
2. 实现 `Prompt` 接口
3. 在 `BasePromptService` 中注册提示
4. 更新 `mcp-manifest.json`

## 支持

如果遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目 GitHub Issues
3. 联系开发团队

---

**注意**: 当前实现为占位符版本，实际的数据操作需要集成 LuckDB 的数据层。请参考项目文档了解完整的集成步骤。

