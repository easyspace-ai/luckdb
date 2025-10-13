# LuckDB TypeScript SDK

一个功能强大的 TypeScript SDK，用于与 LuckDB 协作数据库平台进行交互。该 SDK 提供了类似 Airtable SDK 的 API 设计，支持完整的 CRUD 操作、实时协作、高级查询等功能。

## 特性

- 🚀 **完整的 API 覆盖** - 支持所有 LuckDB 平台功能
- 🔄 **实时协作** - WebSocket 支持，实时数据同步
- 📊 **多种视图类型** - 网格、表单、看板、日历、画廊视图
- 🔍 **高级查询** - 复杂查询、聚合、搜索功能
- 🛡️ **类型安全** - 完整的 TypeScript 类型定义
- 🔧 **易于使用** - 类似 Airtable SDK 的 API 设计
- 📦 **模块化** - 按功能模块组织，按需使用
- 🎯 **错误处理** - 完善的错误处理和重试机制

## 安装

```bash
npm install @luckdb/sdk
```

## 快速开始

### 前置条件

1. 启动 LuckDB 服务器
   ```bash
   cd server
   ./bin/luckdb serve
   ```

2. 初始化测试用户（首次使用）
   ```bash
   cd packages/sdk
   pnpm test:setup
   ```

### 基本使用

```typescript
import LuckDB from '@luckdb/sdk';

// 初始化 SDK
const luckdb = new LuckDB({
  baseUrl: 'http://localhost:8080',  // 本地开发
  debug: true
});

// 用户登录
const authResponse = await luckdb.login({
  email: 'admin@126.com',
  password: 'Pmker123'
});

// 创建空间
const space = await luckdb.createSpace({
  name: '我的工作空间',
  description: '用于项目管理的空间'
});

// 创建基础表
const base = await luckdb.createBase({
  spaceId: space.id,
  name: '项目管理',
  description: '项目管理和任务跟踪'
});

// 创建数据表
const table = await luckdb.createTable({
  baseId: base.id,
  name: '任务列表',
  description: '项目任务管理表'
});
```

### 字段管理

```typescript
// 创建文本字段
const titleField = await luckdb.createField({
  tableId: table.id,
  name: '任务标题',
  type: 'singleLineText',
  required: true
});

// 创建单选字段
const statusField = await luckdb.createField({
  tableId: table.id,
  name: '状态',
  type: 'singleSelect',
  required: true,
  options: {
    choices: [
      { id: 'todo', name: '待办', color: '#FF6B6B' },
      { id: 'doing', name: '进行中', color: '#4ECDC4' },
      { id: 'done', name: '已完成', color: '#45B7D1' }
    ]
  }
});

// 创建日期字段
const dueDateField = await luckdb.createField({
  tableId: table.id,
  name: '截止日期',
  type: 'date'
});
```

### 记录操作

```typescript
// 创建记录
const record = await luckdb.createRecord({
  tableId: table.id,
  data: {
    '任务标题': '设计用户界面',
    '状态': 'doing',
    '截止日期': '2024-12-31'
  }
});

// 查询记录
const records = await luckdb.listRecords({
  tableId: table.id,
  limit: 20
});

// 更新记录
const updatedRecord = await luckdb.updateRecord(record.id, {
  '状态': 'done'
});

// 批量创建记录
const bulkRecords = await luckdb.bulkCreateRecords(table.id, [
  {
    '任务标题': '编写API文档',
    '状态': 'todo',
    '截止日期': '2024-12-25'
  },
  {
    '任务标题': '单元测试',
    '状态': 'todo',
    '截止日期': '2024-12-28'
  }
]);
```

### 实时协作

```typescript
// 设置事件监听器
luckdb.onRecordChange((message) => {
  console.log('记录变更:', message.data);
});

luckdb.onCollaboration((message) => {
  console.log('协作事件:', message.data);
});

luckdb.onPresenceUpdate((message) => {
  console.log('在线状态更新:', message.data);
});

// 订阅表格的实时更新
luckdb.subscribeToTable(table.id);

// 更新在线状态
await luckdb.updatePresence('table', table.id, {
  x: 100,
  y: 200
});
```

## API 参考

### 主要类

- `LuckDB` - 主 SDK 类
- `HttpClient` - HTTP 客户端
- `WebSocketClient` - WebSocket 客户端
- `AuthClient` - 认证客户端
- `SpaceClient` - 空间管理客户端
- `TableClient` - 表格管理客户端
- `RecordClient` - 记录操作客户端
- `ViewClient` - 视图管理客户端
- `CollaborationClient` - 协作功能客户端

### 支持的操作

#### 认证
- `login(credentials)` - 用户登录
- `register(userData)` - 用户注册
- `logout()` - 用户登出
- `getCurrentUser()` - 获取当前用户信息

#### 空间管理
- `createSpace(data)` - 创建空间
- `listSpaces(params)` - 获取空间列表
- `getSpace(id)` - 获取空间详情
- `updateSpace(id, updates)` - 更新空间
- `deleteSpace(id)` - 删除空间

#### 基础表管理
- `createBase(data)` - 创建基础表
- `listBases(params)` - 获取基础表列表
- `getBase(id)` - 获取基础表详情
- `updateBase(id, updates)` - 更新基础表
- `deleteBase(id)` - 删除基础表

#### 数据表管理
- `createTable(data)` - 创建数据表
- `listTables(params)` - 获取数据表列表
- `getTable(id)` - 获取数据表详情
- `updateTable(id, updates)` - 更新数据表
- `deleteTable(id)` - 删除数据表

#### 字段管理
- `createField(data)` - 创建字段
- `listFields(params)` - 获取字段列表
- `getField(id)` - 获取字段详情
- `updateField(id, updates)` - 更新字段
- `deleteField(id)` - 删除字段

#### 记录操作
- `createRecord(data)` - 创建记录
- `listRecords(params)` - 获取记录列表
- `getRecord(id)` - 获取记录详情
- `updateRecord(id, updates)` - 更新记录
- `deleteRecord(id)` - 删除记录
- `bulkCreateRecords(tableId, records)` - 批量创建记录
- `bulkUpdateRecords(updates)` - 批量更新记录
- `bulkDeleteRecords(ids)` - 批量删除记录

#### 视图管理
- `createView(data)` - 创建视图
- `listViews(params)` - 获取视图列表
- `getView(id)` - 获取视图详情
- `updateView(id, updates)` - 更新视图
- `deleteView(id)` - 删除视图

#### 协作功能
- `createCollaborationSession(data)` - 创建协作会话
- `updatePresence(resourceType, resourceId, cursor)` - 更新在线状态
- `updateCursor(resourceType, resourceId, cursor, fieldId, recordId)` - 更新光标位置
- `subscribeToTable(tableId)` - 订阅表格更新
- `subscribeToRecord(tableId, recordId)` - 订阅记录更新
- `subscribeToView(viewId)` - 订阅视图更新

### 字段类型

SDK 支持以下字段类型：

- `singleLineText` - 单行文本
- `longText` - 长文本
- `number` - 数字
- `singleSelect` - 单选
- `multipleSelects` - 多选
- `date` - 日期
- `checkbox` - 复选框
- `url` - 链接
- `email` - 邮箱
- `phoneNumber` - 电话
- `attachment` - 附件
- `rating` - 评分
- `link` - 关联
- `lookup` - 查找
- `formula` - 公式
- `rollup` - 汇总
- `count` - 计数
- `createdTime` - 创建时间
- `lastModifiedTime` - 最后修改时间
- `createdBy` - 创建者
- `lastModifiedBy` - 最后修改者
- `autoNumber` - 自动编号

### 视图类型

SDK 支持以下视图类型：

- `grid` - 网格视图
- `form` - 表单视图
- `kanban` - 看板视图
- `calendar` - 日历视图
- `gallery` - 画廊视图

## 错误处理

SDK 提供了完善的错误处理机制：

```typescript
import { 
  LuckDBError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  ServerError
} from '@luckdb/sdk';

try {
  const record = await luckdb.createRecord(data);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.log('认证失败，请重新登录');
  } else if (error instanceof ValidationError) {
    console.log('数据验证失败:', error.details);
  } else if (error instanceof RateLimitError) {
    console.log('请求频率超限，请稍后重试');
  } else {
    console.log('未知错误:', error.message);
  }
}
```

## 配置选项

```typescript
const luckdb = new LuckDB({
  baseUrl: 'https://api.luckdb.ai',     // API 基础 URL
  apiKey: 'your-api-key',               // API 密钥（可选）
  accessToken: 'your-access-token',     // 访问令牌（可选）
  refreshToken: 'your-refresh-token',   // 刷新令牌（可选）
  timeout: 30000,                       // 请求超时时间（毫秒）
  retries: 3,                          // 重试次数
  retryDelay: 1000,                    // 重试延迟（毫秒）
  userAgent: 'MyApp/1.0.0',            // 用户代理
  debug: false                         // 调试模式
});
```

## 测试套件

LuckDB SDK 配备了完整的测试套件，确保系统的健壮性和商用级别的质量：

### 测试类型

- **功能测试** - 验证所有核心功能正常工作（认证、空间、记录、视图等）
- **破坏性测试** - 测试错误处理和边界条件（45+ 测试用例）
- **性能测试** - 评估系统在高负载下的表现（批量操作、并发测试）

### 运行测试

```bash
# 启动服务器（第一个终端）
cd server
./bin/luckdb serve

# 运行测试（第二个终端）
cd packages/sdk

# 初始化测试用户（首次运行）
pnpm test:setup

# 运行所有测试
pnpm test:all

# 运行单个测试
pnpm test:auth           # 认证测试
pnpm test:space          # 空间管理
pnpm test:record         # 记录操作
pnpm test:view           # 视图管理
pnpm test:comprehensive  # 完整集成测试
pnpm test:destructive    # 破坏性测试（错误处理）
pnpm test:performance    # 性能测试

# 使用一键测试脚本
./run-all-tests.sh              # 全部测试
./run-all-tests.sh --functional # 功能测试
./run-all-tests.sh --destructive # 破坏性测试
./run-all-tests.sh --performance # 性能测试
```

### 测试覆盖

- ✅ 认证（登录、登出、Token刷新）
- ✅ 空间管理（CRUD）
- ✅ Base 管理（CRUD）
- ✅ 表管理（CRUD）
- ✅ 字段管理（CRUD、类型验证）
- ✅ 记录操作（CRUD、批量操作）
- ✅ 视图管理（CRUD）
- ✅ 错误处理（40+ 边界测试）
- ✅ 性能测试（批量、并发）

## 示例项目

查看 `examples/` 目录中的完整示例：

- `basic-usage.ts` - 基础使用示例
- `collaboration-example.ts` - 协作功能示例
- `advanced-queries.ts` - 高级查询示例
- `99-comprehensive-test.ts` - 完整集成测试
- `98-destructive-tests.ts` - 破坏性测试
- `97-performance-tests.ts` - 性能测试

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 支持

如有问题，请访问 [GitHub Issues](https://github.com/easyspace-ai/luckdb/issues) 或联系我们的支持团队。

