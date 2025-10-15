## Week 2: 状态管理重构 - 消灭 Context 地狱

### 🎯 目标
- 将 7 层 Context 嵌套替换为单一 Zustand Store
- 实现精确的状态订阅，避免无脑重渲染
- 提升性能和开发体验

### ✅ 已完成

1. **创建统一的 Zustand Store** (`src/store/grid-store.ts`)
   - 完整的类型定义
   - 分片状态管理（Data, UI, Selection, Editing, Permission, Session）
   - 所有 CRUD 操作
   - 优化的选择器（Selectors）

2. **创建简化的 Provider** (`src/store/GridStoreProvider.tsx`)
   - 单一 Provider 替换 7 层嵌套
   - 自动数据加载
   - React Query 集成

3. **创建便捷 Hooks** (`src/store/hooks.ts`)
   - 20+ 个优化的 hooks
   - 精确状态订阅
   - 类型安全

### 📊 Before vs After

#### Before: Context 地狱（7 层嵌套）
\`\`\`tsx
// 旧代码 - 7 层嵌套，性能差，难维护
<QueryClientProvider client={queryClient}>
  <SessionProvider>
    <AppProvider>
      <BaseProvider baseId={baseId} apiClient={apiClient}>
        <PermissionProvider baseId={baseId} tableId={tableId} apiClient={apiClient}>
          <TableProvider baseId={baseId} tableId={tableId} apiClient={apiClient}>
            <ViewProvider tableId={tableId} viewId={viewId} apiClient={apiClient}>
              <FieldProvider tableId={tableId} apiClient={apiClient}>
                {children}
              </FieldProvider>
            </ViewProvider>
          </TableProvider>
        </PermissionProvider>
      </BaseProvider>
    </AppProvider>
  </SessionProvider>
</QueryClientProvider>

// 使用时 - 需要多个 Context
function MyComponent() {
  const { base } = useBase();
  const { table } = useTable();
  const { fields } = useField();
  const { records } = useRecord(); // 每个都会触发重渲染
  
  return <div>...</div>;
}
\`\`\`

#### After: 单一 Store（优雅、高效）
\`\`\`tsx
// 新代码 - 1 层，性能好，易维护
import { GridStoreProvider } from './store';

<GridStoreProvider
  apiClient={apiClient}
  baseId={baseId}
  tableId={tableId}
  viewId={viewId}
>
  {children}
</GridStoreProvider>

// 使用时 - 精确订阅，只重渲染需要的组件
import { useCurrentBase, useCurrentTable, useFields, useRecords } from './store';

function MyComponent() {
  const { base } = useCurrentBase();  // 只在 base 变化时重渲染
  const { table } = useCurrentTable(); // 只在 table 变化时重渲染
  const { fields } = useFields(apiClient, tableId); // 只在 fields 变化时重渲染
  const { records } = useRecords(apiClient, tableId); // 只在 records 变化时重渲染
  
  return <div>...</div>;
}
\`\`\`

### 🚀 使用指南

#### 1. 基础使用

\`\`\`tsx
import { GridStoreProvider } from '@luckdb/aitable/store';
import { createSDKAdapter } from '@luckdb/aitable/api';

const apiClient = createSDKAdapter({
  baseURL: 'http://localhost:8080/api/v1',
  token: 'your-token',
});

function App() {
  return (
    <GridStoreProvider
      apiClient={apiClient}
      baseId="base-123"
      tableId="table-456"
      viewId="view-789"
      autoLoad={true} // 自动加载数据
    >
      <YourGridComponents />
    </GridStoreProvider>
  );
}
\`\`\`

#### 2. 在组件中使用

\`\`\`tsx
import { useCurrentTable, useFields, useRecords } from '@luckdb/aitable/store';

function GridComponent() {
  const { table } = useCurrentTable();
  const { fields, createField, updateField } = useFields(apiClient, table?.id || '');
  const { records, createRecord, updateRecord } = useRecords(apiClient, table?.id || '');
  
  const handleCreateField = async () => {
    await createField({
      name: 'New Field',
      type: 'singleLineText',
    });
  };
  
  return (
    <div>
      <h1>{table?.name}</h1>
      <button onClick={handleCreateField}>Add Field</button>
      {/* ... */}
    </div>
  );
}
\`\`\`

#### 3. 使用 UI 状态

\`\`\`tsx
import { useScrollState, useSelection, useEditing } from '@luckdb/aitable/store';

function GridBody() {
  const { scrollTop, scrollLeft, setScroll } = useScrollState();
  const { selectedRanges, activeCell, setActiveCell } = useSelection();
  const { isEditing, startEditing, commitEdit } = useEditing();
  
  const handleCellClick = (rowIndex: number, columnIndex: number) => {
    setActiveCell({ rowIndex, columnIndex });
  };
  
  const handleCellDoubleClick = (rowIndex: number, columnIndex: number, value: unknown) => {
    startEditing({ rowIndex, columnIndex }, value);
  };
  
  return <div>...</div>;
}
\`\`\`

#### 4. 直接访问 Store（高级用法）

\`\`\`tsx
import { useGridStore } from '@luckdb/aitable/store';

function AdvancedComponent() {
  // 方式 1: 使用选择器（推荐）
  const base = useGridStore(state => state.currentBase);
  
  // 方式 2: 使用浅比较（避免重渲染）
  const { table, view } = useGridStore(
    useShallow(state => ({
      table: state.currentTable,
      view: state.currentView,
    }))
  );
  
  // 方式 3: 直接调用 actions（不触发重渲染）
  const handleUpdate = () => {
    useGridStore.getState().setCurrentTable(newTable);
  };
  
  return <div>...</div>;
}
\`\`\`

### 📈 性能对比

#### Context 嵌套（旧方案）
- ❌ 任何上层 Context 变化都会导致所有子组件重渲染
- ❌ 无法精确控制更新范围
- ❌ 需要手动 memo 和 useMemo 优化
- ❌ 难以调试状态变化

#### Zustand Store（新方案）
- ✅ 精确订阅，只更新需要的组件
- ✅ 自动优化，无需手动 memo
- ✅ Redux DevTools 支持，易于调试
- ✅ 更少的代码，更好的类型推导

### 🧪 迁移步骤

#### Step 1: 更新依赖
\`\`\`bash
# 已经包含在 package.json 中
# zustand: 4.5.2
# zustand/middleware: included
\`\`\`

#### Step 2: 替换 Provider
\`\`\`tsx
// Before
import { AppProviders } from './context/AppProviders';

<AppProviders
  baseId={baseId}
  tableId={tableId}
  viewId={viewId}
  apiClient={apiClient}
>
  {children}
</AppProviders>

// After
import { GridStoreProvider } from './store';

<GridStoreProvider
  apiClient={apiClient}
  baseId={baseId}
  tableId={tableId}
  viewId={viewId}
>
  {children}
</GridStoreProvider>
\`\`\`

#### Step 3: 替换 Context Hooks
\`\`\`tsx
// Before
import { useBase } from './context/base/BaseContext';
import { useTable } from './context/table/TableContext';
import { useField } from './context/field/FieldContext';

function Component() {
  const { base } = useBase();
  const { table } = useTable();
  const { fields } = useField();
  // ...
}

// After
import { useCurrentBase, useCurrentTable, useFields } from './store';

function Component() {
  const { base } = useCurrentBase();
  const { table } = useCurrentTable();
  const { fields } = useFields(apiClient, tableId);
  // ...
}
\`\`\`

#### Step 4: 更新数据操作
\`\`\`tsx
// Before
const { createField, updateField } = useField();

await createField(data); // 方法签名不明确

// After
const { createField, updateField } = useFields(apiClient, tableId);

await createField(data); // 完全类型安全
\`\`\`

### 🔍 调试技巧

#### 1. 使用 Redux DevTools
\`\`\`tsx
// Store 已经配置了 devtools 中间件
// 打开浏览器 Redux DevTools 即可查看状态变化
\`\`\`

#### 2. 监控状态变化
\`\`\`tsx
useEffect(() => {
  const unsubscribe = useGridStore.subscribe(
    (state) => state.currentTable,
    (table) => {
      console.log('Table changed:', table);
    }
  );
  
  return unsubscribe;
}, []);
\`\`\`

#### 3. 性能分析
\`\`\`tsx
import { useEffect } from 'react';

function Component() {
  useEffect(() => {
    console.log('Component rendered');
  });
  
  // 如果这个 log 频繁出现，说明订阅不够精确
  // 检查是否使用了正确的 selector
}
\`\`\`

### 💡 最佳实践

#### 1. 使用专用 Hooks
\`\`\`tsx
// ❌ 不好 - 订阅整个 store
const store = useGridStore();

// ✅ 好 - 只订阅需要的数据
const { base } = useCurrentBase();
\`\`\`

#### 2. 使用 Shallow 比较
\`\`\`tsx
import { useShallow } from 'zustand/react/shallow';

// ✅ 避免因对象引用变化导致的重渲染
const { scrollTop, scrollLeft } = useGridStore(
  useShallow(state => ({
    scrollTop: state.scrollTop,
    scrollLeft: state.scrollLeft,
  }))
);
\`\`\`

#### 3. Actions 不触发重渲染
\`\`\`tsx
// ✅ 直接调用 action，不会导致组件重渲染
const handleClick = () => {
  useGridStore.getState().setCurrentTable(newTable);
};
\`\`\`

#### 4. 合理拆分组件
\`\`\`tsx
// ❌ 不好 - 一个组件订阅太多状态
function BigComponent() {
  const { base } = useCurrentBase();
  const { table } = useCurrentTable();
  const { fields } = useFields(apiClient, tableId);
  const { records } = useRecords(apiClient, tableId);
  // 任何一个变化都会重渲染整个组件
}

// ✅ 好 - 拆分成小组件，各自订阅需要的状态
function BaseInfo() {
  const { base } = useCurrentBase(); // 只订阅 base
  return <div>{base?.name}</div>;
}

function TableInfo() {
  const { table } = useCurrentTable(); // 只订阅 table
  return <div>{table?.name}</div>;
}
\`\`\`

### 🎯 性能优化建议

1. **避免在循环中使用 hooks**
2. **使用 memo 包装复杂的子组件**
3. **大列表使用虚拟滚动**
4. **批量更新使用 bulkUpdateRecords**
5. **合理使用 React.lazy 和 Suspense**

### ✅ 验证重构成功

运行以下检查确保重构正确：

\`\`\`bash
# 1. 类型检查
npm run typecheck:strict

# 2. 代码检查
npm run lint:strict

# 3. 运行测试
npm run test

# 4. 构建检查
npm run build:strict
\`\`\`

### 📊 预期收益

- **性能提升**: 减少 60%+ 的无效重渲染
- **代码减少**: 移除 ~300 行 Context 相关代码
- **类型安全**: 100% 类型推导，零 any
- **开发体验**: 更好的 IDE 支持和调试体验
- **可维护性**: 单一数据源，易于理解和维护

---

**记住：逐步迁移，先迁移新组件，旧组件保持兼容，最后统一切换。**
