# @luckdb/sdk

LuckDB JavaScript/TypeScript SDK - 类型安全的 API 客户端

## 安装

```bash
pnpm add @luckdb/sdk
```

## 使用

```typescript
import { LuckDBClient } from '@luckdb/sdk';

const client = new LuckDBClient({
  baseURL: 'https://api.luckdb.com',
});

// 登录
const { data } = await client.auth.login('user@example.com', 'password');
client.setToken(data.token);

// 获取表格列表
const tables = await client.tables.list();

// 创建记录
const record = await client.records.create('table_id', {
  name: 'New Record',
  status: 'active',
});
```

## API

### 认证

- `auth.login(email, password)` - 登录
- `auth.register(data)` - 注册
- `auth.logout()` - 登出
- `auth.me()` - 获取当前用户

### 表格

- `tables.list()` - 获取表格列表
- `tables.get(id)` - 获取表格详情
- `tables.create(data)` - 创建表格
- `tables.update(id, data)` - 更新表格
- `tables.delete(id)` - 删除表格

### 记录

- `records.list(tableId, params)` - 获取记录列表
- `records.get(tableId, recordId)` - 获取记录详情
- `records.create(tableId, data)` - 创建记录
- `records.update(tableId, recordId, data)` - 更新记录
- `records.delete(tableId, recordId)` - 删除记录

### 视图

- `views.list(tableId)` - 获取视图列表
- `views.get(viewId)` - 获取视图详情
- `views.create(tableId, data)` - 创建视图
- `views.update(viewId, data)` - 更新视图
- `views.delete(viewId)` - 删除视图

