# @luckdb/aitable

新一代 Airtable 风格组件库（重构版本）- 专为 LuckDB 设计。

> ⚠️ **注意**：这是 `@luckdb/grid` 的重构版本，当前处于开发阶段。生产环境请继续使用 `@luckdb/grid`。

## 特性

- ✨ **高性能渲染** - 基于虚拟滚动的高性能表格渲染
- 🎨 **丰富的字段类型** - 支持文本、数字、日期、选择、附件等多种字段类型
- 🔄 **实时协作** - 内置 WebSocket 支持，实现实时协作编辑
- 🎯 **完整的 CRUD** - 完整的增删改查操作支持
- 📊 **视图管理** - 支持多视图、筛选、排序、分组
- 🔌 **SDK 集成** - 集成 @luckdb/sdk，提供完善的 API 支持
- 🎭 **类型安全** - 完整的 TypeScript 类型定义

## 安装

```bash
# 生产环境（稳定版）
pnpm add @luckdb/grid

# 开发/测试环境（重构版）
pnpm add @luckdb/aitable
```

## 快速开始

### 1. 创建 API 客户端

```typescript
import { createSDKAdapter } from '@luckdb/aitable';

const apiClient = createSDKAdapter({
  baseURL: 'http://localhost:8080/api/v1',
  token: 'your-auth-token',
});
```

### 2. 使用组件

```typescript
import { AppProviders, Grid } from '@luckdb/aitable';

function App() {
  return (
    <AppProviders
      baseId="your-base-id"
      tableId="your-table-id"
      viewId="your-view-id"
      apiClient={apiClient}
    >
      <Grid />
    </AppProviders>
  );
}
```

## API 集成

Grid 包现在集成了 `@luckdb/sdk`，提供两种 API 客户端实现：

### SDK 适配器（推荐）

基于 `@luckdb/sdk` 的适配器，提供更完善的功能和更好的类型支持：

```typescript
import { createSDKAdapter } from '@luckdb/aitable';

const apiClient = createSDKAdapter({
  baseURL: 'http://localhost:8080/api/v1',
  token: 'your-auth-token',
  onError: (error) => console.error('API Error:', error),
  onUnauthorized: () => console.log('Unauthorized'),
});
```

### 传统客户端（向后兼容）

基于 axios 的传统实现：

```typescript
import { createLegacyClient } from '@luckdb/aitable';

const apiClient = createLegacyClient({
  baseURL: 'http://localhost:8080/api/v1',
  token: 'your-auth-token',
});
```

### 工厂函数

使用工厂函数动态选择实现：

```typescript
import { createApiClient } from '@luckdb/aitable';

// 使用 SDK（默认）
const sdkClient = createApiClient({
  baseURL: 'http://localhost:8080/api/v1',
  token: 'your-auth-token',
  type: 'sdk',
});

// 使用传统客户端
const legacyClient = createApiClient({
  baseURL: 'http://localhost:8080/api/v1',
  token: 'your-auth-token',
  type: 'legacy',
});
```

详细的 API 文档请查看 [API 模块文档](./src/api/README.md)。

## 上下文系统

Grid 使用 React Context 来管理应用状态：

### AppProvider

应用级别的上下文，提供全局配置：

```typescript
import { AppProvider } from '@luckdb/aitable';

<AppProvider>
  {children}
</AppProvider>
```

### BaseProvider

Base 级别的上下文，管理 base 相关数据：

```typescript
import { BaseProvider, useBase } from '@luckdb/aitable';

<BaseProvider baseId="base-id" apiClient={apiClient}>
  {children}
</BaseProvider>

// 在子组件中使用
function Component() {
  const { bases, currentBase, createBase, updateBase, deleteBase } = useBase();
  // ...
}
```

### TableProvider

Table 级别的上下文，管理 table 相关数据：

```typescript
import { TableProvider, useTable } from '@luckdb/aitable';

<TableProvider baseId="base-id" tableId="table-id" apiClient={apiClient}>
  {children}
</TableProvider>

// 在子组件中使用
function Component() {
  const { tables, currentTable, createTable, updateTable, deleteTable } = useTable();
  // ...
}
```

### FieldProvider

Field 级别的上下文，管理字段数据：

```typescript
import { FieldProvider } from '@luckdb/aitable';

<FieldProvider tableId="table-id" apiClient={apiClient}>
  {children}
</FieldProvider>
```

### ViewProvider

View 级别的上下文，管理视图数据：

```typescript
import { ViewProvider } from '@luckdb/aitable';

<ViewProvider tableId="table-id" viewId="view-id" apiClient={apiClient}>
  {children}
</ViewProvider>
```

### PermissionProvider

权限管理上下文：

```typescript
import { PermissionProvider } from '@luckdb/aitable';

<PermissionProvider baseId="base-id" tableId="table-id" apiClient={apiClient}>
  {children}
</PermissionProvider>
```

## 组件

### Grid

主网格组件：

```typescript
import { Grid } from '@luckdb/aitable';

<Grid 
  // 配置选项
/>
```

### 编辑器

Grid 提供了多种字段编辑器：

- TextEditor - 文本编辑器
- NumberEditor - 数字编辑器
- SelectEditor - 选择编辑器
- DateEditor - 日期编辑器
- CheckboxEditor - 复选框编辑器
- AttachmentEditor - 附件编辑器
- 等等...

## 数据模型

Grid 提供了完整的数据模型层：

### Field 模型

```typescript
import { TextField, NumberField, SelectField } from '@luckdb/aitable';

// 创建字段实例
const textField = new TextField({
  id: 'field-1',
  name: 'Name',
  type: 'singleLineText',
  // ...
});
```

### Record 模型

```typescript
import { Record } from '@luckdb/aitable';

const record = new Record({
  id: 'record-1',
  fields: {
    'field-1': 'value',
  },
});
```

### View 模型

```typescript
import { View } from '@luckdb/aitable';

const view = new View({
  id: 'view-1',
  name: 'Grid View',
  type: 'grid',
  // ...
});
```

## 类型定义

Grid 提供完整的 TypeScript 类型定义：

### Grid 类型（向后兼容）

```typescript
import type {
  IBase,
  ITable,
  IField,
  IRecord,
  IView,
  FieldType,
  ViewType,
} from '@luckdb/aitable';
```

### SDK 类型（推荐）

```typescript
import type {
  Base,
  Table,
  Field,
  Record,
  View,
  CreateBaseRequest,
  CreateTableRequest,
  CreateFieldRequest,
  CreateRecordRequest,
  CreateViewRequest,
} from '@luckdb/aitable';
```

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 测试
pnpm test

# 代码检查
pnpm lint

# 格式化
pnpm format
```

## 许可证

MIT

## 贡献

欢迎贡献！请查看 [贡献指南](../../CONTRIBUTING.md)。

