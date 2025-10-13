# SDK 重构详细变更记录

## 一、核心模块变更

### 1. HTTP Client (`src/core/http-client.ts`)

#### 变更内容
- **响应解析逻辑**：更新为检查 `code` 字段（200000-299999）
- **数据提取**：从 `response.data.data` 提取实际数据
- **类型导入**：使用 `import type` 语法

#### 修改前
```typescript
// 直接返回 response.data
return response.data as T;
```

#### 修改后
```typescript
// 检查 APIResponse 格式
if (data && typeof data === 'object' && 'code' in data) {
  const code = data.code;
  if (code >= 200000 && code < 300000) {
    return data.data as T;  // 提取 data 字段
  } else {
    throw new LuckDBError(...);
  }
}
```

### 2. 类型定义 (`src/types/index.ts`)

#### 变更内容
- 统一使用 camelCase 命名
- 更新 `APIResponse` 接口
- 更新 `PaginationMeta` 接口

#### 关键类型

```typescript
export interface APIResponse<T = any> {
  code: number;           // 业务状态码
  message: string;        // 响应消息
  data: T;                // 响应数据
  error?: ErrorPayload;   // 错误详情
  requestId?: string;     // 请求ID（camelCase）
  timestamp?: string;     // 响应时间戳
  durationMs?: number;    // 处理耗时（camelCase）
  version?: string;       // API版本
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;     // camelCase
}
```

### 3. WebSocket Client (`src/core/websocket-client.ts`)

#### 变更内容
- 类型导入改为 `import type`

## 二、客户端模块变更

### 1. Auth Client (`src/clients/auth-client.ts`)

#### API 端点
- `POST /api/v1/auth/login` - 登录
- `POST /api/v1/auth/register` - 注册
- `POST /api/v1/auth/logout` - 登出
- `POST /api/v1/auth/refresh` - 刷新 token
- `GET /api/v1/auth/me` - 获取当前用户

#### 变更
- ✅ 类型导入改为 `import type`
- ✅ 保持方法签名不变

### 2. Space Client (`src/clients/space-client.ts`)

#### API 端点
- `POST /api/v1/spaces` - 创建空间
- `GET /api/v1/spaces` - 获取空间列表
- `GET /api/v1/spaces/:id` - 获取空间详情
- `PUT /api/v1/spaces/:id` - 更新空间
- `DELETE /api/v1/spaces/:id` - 删除空间
- `GET /api/v1/spaces/:id/collaborators` - 获取协作者
- `POST /api/v1/spaces/:id/collaborators` - 添加协作者

#### 变更
- ✅ 类型导入改为 `import type`

### 3. Base Client (`src/clients/base-client.ts`)

#### API 端点
- `POST /api/v1/spaces/:spaceId/bases` - 创建 Base
- `GET /api/v1/bases` - 获取 Base 列表
- `GET /api/v1/bases/:id` - 获取 Base 详情
- `PUT /api/v1/bases/:id` - 更新 Base
- `DELETE /api/v1/bases/:id` - 删除 Base
- `POST /api/v1/bases/:id/duplicate` - 复制 Base

#### 变更
- ✅ 类型导入改为 `import type`
- ✅ 修复 `BackendPaginatedResponse` 导入

### 4. Table Client (`src/clients/table-client.ts`)

#### API 端点
- `POST /api/v1/bases/:baseId/tables` - 创建表格
- `GET /api/v1/tables` - 获取表格列表
- `GET /api/v1/tables/:id` - 获取表格详情
- `PUT /api/v1/tables/:id` - 更新表格
- `DELETE /api/v1/tables/:id` - 删除表格

#### 变更
- ✅ 类型导入改为 `import type`

### 5. Field Client (`src/clients/field-client.ts`)

#### API 端点
- `POST /api/v1/tables/:tableId/fields` - 创建字段
- `GET /api/v1/fields` - 获取字段列表
- `GET /api/v1/fields/:id` - 获取字段详情
- `PUT /api/v1/fields/:id` - 更新字段
- `DELETE /api/v1/fields/:id` - 删除字段

#### 变更
- ✅ 类型导入改为 `import type`

### 6. Record Client (`src/clients/record-client.ts`)

#### API 端点
- `POST /api/v1/tables/:tableId/records` - 创建记录
- `POST /api/v1/tables/:tableId/records/bulk` - 批量创建记录
- `GET /api/v1/records` - 查询记录列表
- `GET /api/v1/records/:id` - 获取记录详情
- `PUT /api/v1/records/:id` - 更新记录
- `PUT /api/v1/records/bulk` - 批量更新记录
- `DELETE /api/v1/records/:id` - 删除记录
- `DELETE /api/v1/records/bulk` - 批量删除记录

#### 变更
- ✅ 类型导入改为 `import type`

### 7. View Client (`src/clients/view-client.ts`)

#### API 端点
- `POST /api/v1/tables/:tableId/views` - 创建视图
- `GET /api/v1/views` - 获取视图列表
- `GET /api/v1/views/:id` - 获取视图详情
- `PUT /api/v1/views/:id` - 更新视图
- `DELETE /api/v1/views/:id` - 删除视图

#### 变更
- ✅ 类型导入改为 `import type`

### 8. Collaboration Client (`src/clients/collaboration-client.ts`)

#### 功能
- 实时协作会话管理
- 在线状态跟踪
- 光标位置同步
- 记录变更监听

#### 变更
- ✅ 类型导入改为 `import type`

### 9. 工具模块 (`src/utils/response-adapter.ts`)

#### 变更
- ✅ 类型导入改为 `import type`

## 三、测试基础设施新增

### 1. 公共配置 (`examples/common/config.ts`)

```typescript
export const config = {
  apiUrl: 'http://localhost:8080',
  testEmail: 'admin@126.com',
  testPassword: 'Pmker123',
  debug: true,
};
```

### 2. SDK 管理 (`examples/common/sdk.ts`)

```typescript
// 单例模式
export function getSDK(): LuckDB

// 初始化并登录
export async function initAndLogin()

// 清理资源
export async function cleanup()
```

### 3. 工具函数 (`examples/common/utils.ts`)

```typescript
// 日志工具
export function log(title: string, data?: any)
export function error(title: string, err: any)
export function info(title: string, data?: any)
export function warn(title: string, data?: any)

// 工具函数
export function delay(ms: number): Promise<void>
export function randomName(prefix: string): string
export function randomEmail(): string
export function separator(title?: string)
export function formatError(err: any): string
export async function safeExecute<T>(fn: () => Promise<T>, errorMessage: string): Promise<T | null>
export async function timeExecute<T>(fn: () => Promise<T>, label: string): Promise<T>
```

## 四、测试示例文件

### 1. 认证测试 (`examples/01-auth-test.ts`)

测试功能：
- ✅ 用户登录
- ✅ 获取当前用户信息
- ✅ 用户登出

### 2. 空间 CRUD (`examples/02-space-crud.ts`)

测试功能：
- ✅ 创建空间
- ✅ 获取空间详情
- ✅ 获取空间列表
- ✅ 更新空间
- ✅ 删除空间

### 3. Base/Table/Field 流程 (`examples/03-base-table-field.ts`)

测试功能：
- ✅ 创建空间
- ✅ 创建 Base
- ✅ 创建 Table
- ✅ 创建多种类型字段（文本、单选、数字）
- ✅ 获取字段列表

### 4. 记录操作 (`examples/04-record-operations.ts`)

测试功能：
- ✅ 创建单条记录
- ✅ 批量创建记录
- ✅ 获取记录列表
- ✅ 获取单条记录详情
- ✅ 更新单条记录
- ✅ 批量更新记录
- ✅ 删除单条记录
- ✅ 批量删除记录

### 5. 视图管理 (`examples/05-view-management.ts`)

测试功能：
- ✅ 创建网格视图
- ✅ 创建看板视图
- ✅ 获取视图列表
- ✅ 获取视图详情
- ✅ 更新视图
- ✅ 删除视图

### 6. WebSocket 实时协作 (`examples/06-websocket-realtime.ts`)

测试功能：
- ✅ 检查 WebSocket 连接状态
- ✅ 手动连接 WebSocket
- ✅ 设置事件监听器
- ✅ 接收实时消息
- ✅ 断开 WebSocket

### 7. 完整集成测试 (`examples/99-comprehensive-test.ts`)

测试功能：
- ✅ 空间管理完整流程
- ✅ Base 管理完整流程
- ✅ Table 和 Field 管理完整流程
- ✅ 记录管理完整流程（单条 + 批量）
- ✅ 视图管理完整流程
- ✅ 自动清理测试数据

## 五、主入口文件变更 (`src/index.ts`)

### 变更内容
- ✅ 分离类型导入和值导入
- ✅ 使用 `import type` 导入类型
- ✅ 使用 `export type` 导出类型

#### 修改前
```typescript
import { 
  LuckDBConfig, 
  User,
  // ... 所有类型和类混在一起
} from './types';

export {
  LuckDBConfig,
  User,
  // ...
};
```

#### 修改后
```typescript
import type { 
  LuckDBConfig, 
  User,
  // ... 所有类型
} from './types';

import {
  LuckDBError,
  // ... 所有错误类（值）
} from './types';

export type {
  LuckDBConfig,
  User,
  // ... 所有类型
};

export {
  LuckDBError,
  // ... 所有错误类
};
```

## 六、构建配置

### TypeScript 配置 (`tsconfig.json`)

保持现有配置，关键选项：
- `verbatimModuleSyntax: true` - 强制使用 `import type` 语法
- `strict: true` - 严格模式
- `esModuleInterop: true` - ES 模块互操作

## 七、文件统计

### 新增文件
- `examples/common/config.ts`
- `examples/common/sdk.ts`
- `examples/common/utils.ts`
- `examples/common/index.ts`
- `examples/01-auth-test.ts`
- `examples/02-space-crud.ts`
- `examples/03-base-table-field.ts`
- `examples/04-record-operations.ts`
- `examples/05-view-management.ts`
- `examples/06-websocket-realtime.ts`
- `examples/99-comprehensive-test.ts`

### 修改文件
- `src/index.ts`
- `src/core/http-client.ts`
- `src/core/websocket-client.ts`
- `src/clients/auth-client.ts`
- `src/clients/space-client.ts`
- `src/clients/base-client.ts`
- `src/clients/table-client.ts`
- `src/clients/field-client.ts`
- `src/clients/record-client.ts`
- `src/clients/view-client.ts`
- `src/clients/collaboration-client.ts`
- `src/utils/response-adapter.ts`

### 文件总数
- 新增：11 个文件
- 修改：12 个文件
- 总计：23 个文件

## 八、代码行数

### 公共测试模块
- `config.ts`: 20 行
- `sdk.ts`: 78 行
- `utils.ts`: 149 行
- `index.ts`: 5 行
- **小计**: 252 行

### 测试示例
- `01-auth-test.ts`: 51 行
- `02-space-crud.ts`: 87 行
- `03-base-table-field.ts`: 159 行
- `04-record-operations.ts`: 173 行
- `05-view-management.ts`: 127 行
- `06-websocket-realtime.ts`: 69 行
- `99-comprehensive-test.ts`: 278 行
- **小计**: 944 行

### 总计
**新增代码**: 1,196 行

## 九、技术债务

### 已解决
- ✅ TypeScript 类型导入语法错误
- ✅ APIResponse 格式不统一
- ✅ 测试代码重复

### 待优化
- ⏳ 添加单元测试（目前只有集成测试）
- ⏳ 添加错误重试机制的测试
- ⏳ 添加 WebSocket 重连的测试
- ⏳ 添加性能测试

