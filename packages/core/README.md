# @luckdb/core

LuckDB 核心业务逻辑 - 状态管理、Hooks 和类型定义

## 安装

```bash
pnpm add @luckdb/core
```

## 使用

### 状态管理

```tsx
import { useAuthStore, useTableStore } from '@luckdb/core';

function MyComponent() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { tables, currentTable } = useTableStore();

  // ...
}
```

### Hooks

```tsx
import { useAuth, useTables } from '@luckdb/core';

function MyComponent() {
  const { user, isAuthenticated } = useAuth();
  const { tables, currentTable } = useTables();

  // ...
}
```

### 常量

```tsx
import { ROUTES, API_BASE_URL } from '@luckdb/core';

// 路由
const tableUrl = ROUTES.TABLE('table_id');

// API 地址
console.log(API_BASE_URL);
```

### 类型

```tsx
import type { User, Table, Field, Record, View } from '@luckdb/core';
```

