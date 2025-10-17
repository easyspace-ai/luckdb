# MCP 客户端授权指南

## 概述

LuckDB MCP 服务器支持**两种授权方式**，确保灵活性和安全性：

1. **JWT Token** - 使用现有的用户认证系统
2. **MCP Token** - 专用的 MCP API Token（推荐用于 AI 应用）

## 授权流程

```
┌──────────────┐
│ Client       │
│ (AI App)     │
└──────┬───────┘
       │
       │ 1. 发送请求 + Token
       ↓
┌──────────────────┐
│ MCP Server       │
│ Auth Middleware  │
└──────┬───────────┘
       │
       │ 2. 验证 Token
       ↓
┌─────────────────────┐
│ Authenticator       │
│ ├─ JWT 认证         │
│ └─ MCP Token 认证   │
└──────┬──────────────┘
       │
       │ 3. 返回 User ID
       ↓
┌──────────────────┐
│ Tool Handler     │
│ (执行业务逻辑)    │
└──────────────────┘
```

## 方式一：JWT Token 认证

### 1. 获取 JWT Token

通过标准的用户登录流程获取 JWT Token：

```bash
# 登录获取 Token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
    "user": { ... }
  }
}
```

### 2. 使用 JWT Token

#### HTTP 请求方式

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..." \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_tables",
      "arguments": {
        "base_id": "base_xxx"
      }
    },
    "id": 1
  }'
```

#### SSE 连接方式

```javascript
const token = "eyJhbGciOiJIUzI1NiIs...";
const eventSource = new EventSource(
  `http://localhost:3001/mcp/sse?token=${token}`
);

eventSource.onmessage = (event) => {
  console.log("Received:", event.data);
};
```

### 特点

✅ **优点**：
- 与现有用户系统集成
- 支持用户会话管理
- Token 自动过期

❌ **限制**：
- Token 有效期较短（需要定期刷新）
- 需要用户登录

## 方式二：MCP Token 认证（推荐）

MCP Token 是专门为 AI 应用设计的长期 API Token。

### 1. 创建 MCP Token

使用命令行工具创建：

```bash
# 创建永不过期的 Token
luckdb mcp token create \
  --name="Claude Desktop" \
  --user-id="usr_xxx"

# 创建 30 天后过期的 Token
luckdb mcp token create \
  --name="Temporary Token" \
  --user-id="usr_xxx" \
  --expires-in="720h"

# 创建有限权限的 Token
luckdb mcp token create \
  --name="Read Only" \
  --user-id="usr_xxx" \
  --scopes="tool:list*,tool:get*"
```

输出示例：
```
✅ MCP Token 创建成功

Token ID:     tok_abc123def456
Token:        a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Name:         Claude Desktop
User ID:      usr_xxx
Scopes:       [*]
Expires At:   Never

⚠️  请妥善保存此 Token，它只会显示一次！

使用方法：
  1. 环境变量： export EASYDB_TOKEN=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
  2. HTTP Header: Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### 2. 管理 MCP Token

#### 列出所有 Token

```bash
luckdb mcp token list --user-id="usr_xxx"
```

输出：
```
用户 usr_xxx 的 MCP Tokens（共 3 个）:

1. Claude Desktop (✅ Active)
   ID:         tok_abc123def456
   Scopes:     [*]
   Created:    2025-10-17T10:00:00Z
   Expires:    Never
   Last Used:  2025-10-17T15:30:00Z

2. Temporary Token (✅ Active)
   ID:         tok_xyz789ghi012
   Scopes:     [*]
   Created:    2025-10-17T11:00:00Z
   Expires:    2025-11-16T11:00:00Z

3. Old Token (❌ Expired)
   ID:         tok_old123old456
   Scopes:     [*]
   Created:    2025-09-01T10:00:00Z
   Expires:    2025-10-01T10:00:00Z
   Last Used:  2025-09-30T23:59:00Z
```

#### 撤销 Token

```bash
luckdb mcp token revoke tok_abc123def456
```

输出：
```
✅ Token 已撤销: tok_abc123def456 (Claude Desktop)
```

### 3. 使用 MCP Token

#### 方式一：HTTP Header（推荐）

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_tables",
      "arguments": {
        "base_id": "base_xxx"
      }
    },
    "id": 1
  }'
```

#### 方式二：自定义 Header

```bash
curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "X-MCP-Token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6" \
  -d '...'
```

#### 方式三：Query 参数（SSE 连接）

```javascript
const token = "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6";
const eventSource = new EventSource(
  `http://localhost:3001/mcp/sse?token=${token}`
);
```

### 特点

✅ **优点**：
- 长期有效（可设置永不过期）
- 专为 AI 应用设计
- 支持细粒度权限控制
- 可以随时撤销
- 追踪使用情况

✅ **适用场景**：
- Claude Desktop 集成
- 其他 AI 应用集成
- 自动化脚本
- 第三方服务

## 方式三：Stdio 模式（本地开发）

在 stdio 模式下（如 Claude Desktop 本地集成），可以配置默认用户 ID，无需 Token。

### 配置

```yaml
# config.yaml
mcp:
  default_user_id: "usr_xxx"  # 默认用户 ID
```

### 使用

```bash
# Stdio 模式会自动使用默认用户
luckdb mcp serve --transport=stdio
```

### 特点

✅ **适用场景**：
- 本地开发
- Claude Desktop 本地集成

⚠️ **注意**：
- 仅在 stdio 模式下生效
- 不适合生产环境

## 认证流程详解

### 1. Token 提取

服务器会按以下顺序尝试提取 Token：

```
1. Authorization Header (Bearer <token>)
   ↓ 未找到
2. X-MCP-Token Header
   ↓ 未找到
3. Query Parameter (?token=<token>)
   ↓ 未找到
4. Stdio 模式 → 使用默认 User ID
   ↓ 仍未找到
5. 返回 401 Unauthorized
```

### 2. Token 验证

```
提取到 Token
   ↓
尝试 JWT 验证
   ├─ 成功 → 获取 User ID → 验证用户状态 → 通过
   └─ 失败 ↓
         尝试 MCP Token 验证
            ├─ 成功 → 获取 User ID → 验证用户状态 → 通过
            └─ 失败 → 返回 401
```

### 3. 安全检查

认证成功后会进行以下检查：

1. **用户存在性检查** - 确认用户存在
2. **用户状态检查** - 确认用户处于活跃状态
3. **Token 过期检查** - 确认 Token 未过期（MCP Token）
4. **权限检查** - 验证 Token 权限范围（可选）

### 4. 上下文传递

认证成功后，User ID 会被添加到请求上下文中：

```go
ctx = mcp.WithUserID(ctx, userID)
```

所有后续的工具调用都可以访问这个 User ID。

## Token 权限范围（Scopes）

MCP Token 支持细粒度的权限控制：

### 权限语法

- `*` - 所有权限
- `tool:*` - 所有工具权限
- `tool:list*` - 所有列表工具
- `tool:get*` - 所有获取工具
- `tool:create*` - 所有创建工具
- `tool:list_tables` - 特定工具

### 示例

```bash
# 只读权限
luckdb mcp token create \
  --name="ReadOnly" \
  --user-id="usr_xxx" \
  --scopes="tool:list*,tool:get*"

# 表操作权限
luckdb mcp token create \
  --name="TableOps" \
  --user-id="usr_xxx" \
  --scopes="tool:list_tables,tool:get_table,tool:create_table"

# 所有权限
luckdb mcp token create \
  --name="FullAccess" \
  --user-id="usr_xxx" \
  --scopes="*"
```

## Token 存储和安全

### 服务端存储

- Token 以 **SHA256 哈希** 方式存储在数据库中
- 原始 Token 只在创建时显示一次
- 无法从数据库恢复原始 Token

### 安全建议

✅ **推荐做法**：
- 妥善保存 Token（如使用密码管理器）
- 为不同应用创建不同的 Token
- 定期轮换 Token
- 为 Token 设置合理的过期时间
- 不需要的 Token 及时撤销

❌ **避免**：
- 将 Token 提交到代码仓库
- 在日志中输出完整 Token
- 使用同一个 Token 给多个应用
- 永不撤销过期的 Token

## 常见问题

### Q1: JWT Token 和 MCP Token 有什么区别？

| 特性 | JWT Token | MCP Token |
|-----|----------|-----------|
| 有效期 | 短期（如1小时） | 长期（可永不过期） |
| 用途 | 用户会话 | API 访问 |
| 获取方式 | 用户登录 | 命令行创建 |
| 权限控制 | 用户权限 | 自定义 Scopes |
| 适用场景 | Web/移动端 | AI应用/脚本 |

### Q2: 如何在 Claude Desktop 中配置？

在 Claude Desktop 配置文件中添加：

```json
{
  "mcpServers": {
    "luckdb": {
      "command": "luckdb",
      "args": ["mcp", "serve", "--transport=stdio"],
      "env": {
        "EASYDB_TOKEN": "your-mcp-token-here"
      }
    }
  }
}
```

### Q3: Token 丢失怎么办？

Token 丢失后无法恢复，需要：
1. 撤销旧 Token
2. 创建新 Token

```bash
# 撤销旧 Token
luckdb mcp token revoke tok_old_token_id

# 创建新 Token
luckdb mcp token create --name="New Token" --user-id="usr_xxx"
```

### Q4: 如何追踪 Token 使用情况？

查看 Token 列表时会显示最后使用时间：

```bash
luckdb mcp token list --user-id="usr_xxx"
```

也可以通过监控 API 查看：

```bash
curl http://localhost:3001/mcp/stats
```

### Q5: 需要认证的操作有哪些？

目前所有工具调用都需要认证：

- `tools/call` - 调用工具
- `resources/read` - 读取资源
- `prompts/get` - 获取提示

不需要认证的操作：

- `initialize` - 初始化连接
- `tools/list` - 列出工具
- `resources/list` - 列出资源
- `prompts/list` - 列出提示

## 示例代码

### Python 客户端

```python
import requests

# 使用 MCP Token
headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer your-mcp-token-here"
}

data = {
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
        "name": "list_tables",
        "arguments": {
            "base_id": "base_xxx"
        }
    },
    "id": 1
}

response = requests.post(
    "http://localhost:3001/mcp",
    headers=headers,
    json=data
)

print(response.json())
```

### JavaScript 客户端

```javascript
// 使用 MCP Token
const token = "your-mcp-token-here";

async function callTool(toolName, args) {
  const response = await fetch("http://localhost:3001/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args
      },
      id: Date.now()
    })
  });
  
  return response.json();
}

// 调用工具
callTool("list_tables", { base_id: "base_xxx" })
  .then(result => console.log(result));
```

### cURL 示例

```bash
# 环境变量方式
export MCP_TOKEN="your-mcp-token-here"

curl -X POST http://localhost:3001/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $MCP_TOKEN" \
  -d '{
    "jsonrpc": "2.0",
    "method": "tools/call",
    "params": {
      "name": "list_tables",
      "arguments": {
        "base_id": "base_xxx"
      }
    },
    "id": 1
  }'
```

## 相关文档

- [MCP Server README](./README.md)
- [工具清单](./TOOLS.md)
- [配置参考](/server/config.yaml)

## 安全提醒

⚠️ **重要**：
- Token 等同于密码，请妥善保管
- 定期审查和更新 Token
- 发现泄露立即撤销并重新创建
- 生产环境建议使用 HTTPS

