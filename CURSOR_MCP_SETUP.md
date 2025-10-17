# Cursor MCP 配置和测试指南

## 📋 配置信息

### 1. MCP 服务器配置

配置文件位置：`.cursor/mcp.json`

```json
{
  "mcpServers": {
    "luckdb": {
      "command": "/Users/leven/space/easy/luckdb/server/bin/luckdb",
      "args": [
        "mcp",
        "serve",
        "--transport=stdio",
        "--config=/Users/leven/space/easy/luckdb/server/config.yaml"
      ],
      "env": {
        "EASYDB_TOKEN": "e79b2d88916ea4c201b65f9658135d6b5806f530a45015bc27d1b33109598e4f"
      }
    }
  }
}
```

### 2. 关键路径

| 项目 | 路径 |
|-----|------|
| 可执行文件 | `/Users/leven/space/easy/luckdb/server/bin/luckdb` |
| 配置文件 | `/Users/leven/space/easy/luckdb/server/config.yaml` |
| MCP 配置 | `/Users/leven/space/easy/luckdb/.cursor/mcp.json` |

### 3. Token 信息

```
Token:   e79b2d88916ea4c201b65f9658135d6b5806f530a45015bc27d1b33109598e4f
User ID: usr_weZb3N78EFgm2oYhUPMb6
Scopes:  [*] (所有权限)
Expires: Never (永不过期)
```

## 🚀 在 Cursor 中启用 MCP

### 步骤 1: 重启 Cursor

配置文件已创建，需要重启 Cursor 以加载 MCP 配置：

1. 完全退出 Cursor
2. 重新打开 Cursor
3. Cursor 会自动读取 `.cursor/mcp.json` 配置

### 步骤 2: 验证 MCP 连接

在 Cursor 的聊天界面中，你应该能看到 LuckDB MCP 服务器已连接。

### 步骤 3: 查看可用工具

MCP 服务器提供以下工具（共31个）：

#### 表格操作 (6个)
- `list_tables` - 列出所有表格
- `get_table` - 获取表格详情
- `create_table` - 创建新表格
- `update_table` - 更新表格
- `delete_table` - 删除表格
- `duplicate_table` - 复制表格

#### 字段操作 (6个)
- `list_fields` - 列出字段
- `get_field` - 获取字段详情
- `create_field` - 创建字段
- `update_field` - 更新字段
- `delete_field` - 删除字段
- `convert_field_type` - 转换字段类型

#### 记录操作 (8个)
- `list_records` - 列出记录
- `get_record` - 获取记录
- `create_record` - 创建记录
- `update_record` - 更新记录
- `delete_record` - 删除记录
- `batch_create_records` - 批量创建
- `batch_update_records` - 批量更新
- `batch_delete_records` - 批量删除

#### 视图操作 (8个)
- `list_views` - 列出视图
- `get_view` - 获取视图
- `create_view` - 创建视图
- `update_view` - 更新视图
- `delete_view` - 删除视图
- `update_view_filter` - 更新过滤器
- `update_view_sort` - 更新排序
- `duplicate_view` - 复制视图

#### 用户操作 (3个)
- `get_current_user` - 获取当前用户
- `update_user_profile` - 更新用户资料
- `change_password` - 修改密码

## 🧪 测试示例

### 测试 1: 列出表格

在 Cursor 中问：
```
请列出 base_xxx 中的所有表格
```

或者直接使用工具：
```
使用 list_tables 工具，参数 base_id 为 "base_xxx"
```

### 测试 2: 创建表格

```
帮我在 base_xxx 中创建一个名为"客户信息"的表格，包含以下字段：
- 姓名（文本）
- 年龄（数字）
- 邮箱（文本）
```

### 测试 3: 创建记录

```
在表格 tbl_xxx 中创建一条记录：
- 姓名: 张三
- 年龄: 25
- 邮箱: zhangsan@example.com
```

### 测试 4: 批量创建记录

```
批量创建以下客户信息：
1. 张三，25，zhangsan@example.com
2. 李四，30，lisi@example.com
3. 王五，28，wangwu@example.com
```

### 测试 5: 查询记录

```
列出表格 tbl_xxx 中所有年龄大于 25 的记录
```

## 🔧 故障排查

### 问题 1: MCP 服务器未连接

**可能原因**：
- 配置文件路径错误
- 可执行文件权限问题
- Token 无效

**解决方法**：
1. 检查配置文件路径是否正确
2. 确认可执行文件有执行权限：
   ```bash
   chmod +x /Users/leven/space/easy/luckdb/server/bin/luckdb
   ```
3. 验证 Token 是否有效：
   ```bash
   cd /Users/leven/space/easy/luckdb/server
   ./bin/luckdb mcp token list --user-id="usr_weZb3N78EFgm2oYhUPMb6"
   ```

### 问题 2: 工具调用失败

**可能原因**：
- 数据库未运行
- 配置文件错误
- 权限不足

**解决方法**：
1. 确认数据库正在运行
2. 检查配置文件 `server/config.yaml`
3. 查看日志文件：`server/logs/`

### 问题 3: 查看 MCP 日志

MCP 运行日志会输出到 Cursor 的开发者控制台：

1. 在 Cursor 中按 `Cmd+Shift+P` (Mac) 或 `Ctrl+Shift+P` (Windows)
2. 输入 "Developer: Toggle Developer Tools"
3. 打开 Console 标签查看 MCP 日志

## 📝 手动测试 MCP 服务器

在配置到 Cursor 之前，可以手动测试 MCP 服务器：

### 1. Stdio 模式测试

```bash
cd /Users/leven/space/easy/luckdb/server

# 启动 MCP 服务器
./bin/luckdb mcp serve --transport=stdio --config=config.yaml

# 然后输入 JSON-RPC 请求（测试initialize）
{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}},"id":1}
```

### 2. HTTP 模式测试

```bash
# 终端 1: 启动 HTTP 服务器
cd /Users/leven/space/easy/luckdb/server
./bin/luckdb mcp serve --transport=http --config=config.yaml

# 终端 2: 测试 API
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer e79b2d88916ea4c201b65f9658135d6b5806f530a45015bc27d1b33109598e4f" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/list",
    "id": 1
  }'
```

### 3. 查看服务器状态

```bash
# 查看统计信息
curl http://localhost:3001/mcp/stats

# 查看指标
curl http://localhost:3001/mcp/metrics

# 健康检查
curl http://localhost:3001/mcp/ping
```

## 🔐 安全提示

1. **Token 安全**
   - Token 已经在配置文件中，请不要将配置文件提交到代码仓库
   - 建议将 `.cursor/` 添加到 `.gitignore`

2. **权限控制**
   - 当前 Token 拥有所有权限 (`scopes: [*]`)
   - 生产环境建议创建限制权限的 Token

3. **Token 轮换**
   - 定期更换 Token
   - 如发现泄露，立即撤销并创建新 Token

## 📚 相关文档

- [MCP Server README](server/internal/mcp/README.md)
- [工具清单](server/internal/mcp/TOOLS.md)
- [授权指南](server/internal/mcp/AUTHENTICATION.md)
- [优化报告](book/ai-reports/optimization/2025-10-17_optimize_mcp_server_architecture.md)

## 🆘 获取帮助

如遇到问题：
1. 查看日志文件：`server/logs/`
2. 检查数据库连接
3. 验证 Token 有效性
4. 查看 MCP 服务器输出

## ✅ 验证清单

- [ ] `.cursor/mcp.json` 配置文件已创建
- [ ] 可执行文件路径正确
- [ ] 配置文件路径正确
- [ ] Token 已正确配置
- [ ] Cursor 已重启
- [ ] MCP 服务器已连接
- [ ] 可以看到可用工具列表
- [ ] 成功执行了测试用例

## 🎉 开始使用

配置完成后，你可以在 Cursor 中自然对话来操作 LuckDB：

```
"帮我创建一个客户管理表"
"列出所有表格"
"在客户表中添加一条记录"
"查询年龄大于30的客户"
"批量导入客户数据"
```

享受 AI 驱动的数据库管理体验！🚀

