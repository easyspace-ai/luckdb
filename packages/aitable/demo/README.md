# @luckdb/aitable Demo

这是一个完整的 Grid 组件演示，展示了重构后的新架构。

## 🎯 特性

- ✅ **新的状态管理** - 使用 GridStoreProvider（单一 Store）
- ✅ **错误边界** - 完整的错误处理
- ✅ **类型安全** - 100% TypeScript 严格模式
- ✅ **24种字段类型** - 文本、数字、日期、选择、布尔等
- ✅ **右键菜单** - 列头、行头、单元格菜单
- ✅ **虚拟滚动** - 高性能渲染
- ✅ **工具栏** - 完整的工具栏组件
- ✅ **统计行** - 数据统计展示

## 🚀 快速开始

### 1. 安装依赖

```bash
# 在项目根目录
cd /Users/leven/space/easy/luckdb

# 安装所有依赖
pnpm install
```

### 2. 构建 aitable 包

```bash
# 构建 aitable
cd packages/aitable
npm run build

# 或者使用 watch 模式
npm run dev
```

### 3. 运行 demo

```bash
# 在 demo 目录
cd demo
npm run dev
```

然后打开浏览器访问 `http://localhost:5173`

## 📁 文件结构

```
demo/
├── src/
│   ├── main.tsx           # 入口文件
│   ├── App.tsx            # 主应用
│   ├── FullFeatureGridExample.tsx  # 完整示例
│   └── data.ts            # 演示数据生成
├── index.html             # HTML 模板
├── package.json           # 依赖配置
├── vite.config.ts         # Vite 配置
└── README.md              # 本文件
```

## 🎨 示例说明

### 使用新的 API

```tsx
import { GridStoreProvider } from '@luckdb/aitable/store';
import { createSDKAdapter } from '@luckdb/aitable/api';
import { GridErrorBoundary } from '@luckdb/aitable/grid/error-handling';

// 创建 API 客户端
const apiClient = createSDKAdapter({
  baseURL: 'http://localhost:8080/api/v1',
  token: 'your-token',
});

function Demo() {
  return (
    <GridStoreProvider
      apiClient={apiClient}
      baseId="demo-base"
      tableId="demo-table"
      viewId="demo-view"
      autoLoad={false} // demo 使用模拟数据，不自动加载
    >
      <GridErrorBoundary>
        {/* 你的 Grid 组件 */}
      </GridErrorBoundary>
    </GridStoreProvider>
  );
}
```

### 主要组件

#### Grid 组件
```tsx
<Grid
  ref={gridRef}
  columns={columns}
  records={records}
  rowControls={rowControls}
  onCellEdited={handleCellEdit}
  onSelectionChanged={handleSelectionChange}
  // ... 更多配置
/>
```

#### 工具栏
```tsx
<GridToolbar
  onUndo={() => {}}
  onRedo={() => {}}
  onAddRow={() => {}}
  onAddColumn={() => {}}
  onFilter={() => {}}
  onSort={() => {}}
  onGroup={() => {}}
  // ... 更多操作
/>
```

#### 统计行
```tsx
<StatisticsRow
  statistics={statistics}
  totalRecords={records.length}
  selectedRecords={selectedRows}
  onStatisticClick={(colIndex) => {}}
  width={1200}
/>
```

## 🎯 支持的字段类型（24种）

### 基础类型
- 文本（单行、多行）
- 数字
- 货币
- 百分比

### 布尔类型
- 复选框
- 开关

### 选择类型
- 单选
- 多选

### 日期时间
- 日期
- 时间
- 日期时间

### 用户类型
- 用户选择
- 创建者
- 修改者

### 评分类型
- 星级评分

### 链接类型
- URL
- 邮箱
- 电话

### 富文本
- Markdown
- HTML

## 🖱️ 右键菜单功能

### 列头右键
- 编辑字段
- 复制字段
- 插入字段
- 筛选
- 排序
- 分组
- 冻结列
- 隐藏字段

### 行头右键
- 删除行
- 复制行
- 插入行

### 单元格右键
- 复制
- 粘贴
- 删除

## 📊 性能特性

- **虚拟滚动** - 只渲染可见区域，支持百万级数据
- **精确更新** - 只更新变化的单元格
- **智能缓存** - 渲染结果缓存
- **优化的事件处理** - 防抖和节流

## 🐛 调试

### 查看状态
使用 Redux DevTools 查看 Zustand Store 的状态变化

### 查看渲染
打开 React DevTools Profiler 查看组件渲染性能

### 查看错误
错误会被 ErrorBoundary 捕获，并显示友好的错误界面

## 📝 注意事项

### 模拟数据
Demo 使用 `generateDemoData()` 生成模拟数据，不连接真实后端。

如果要连接真实后端：
1. 设置正确的 `baseURL` 和 `token`
2. 将 `autoLoad` 设置为 `true`
3. 提供真实的 `baseId`、`tableId`、`viewId`

### 依赖版本
确保使用正确的依赖版本：
- React >= 18.0.0
- TypeScript >= 5.4.0
- Vite >= 5.0.0

### 开发模式
Demo 默认运行在开发模式，会有 React.StrictMode 和额外的类型检查。

## 🔗 相关文档

- [重构完成报告](../REFACTOR_COMPLETE.md)
- [Week 1 指南](../REFACTOR_WEEK1.md)
- [Week 2 指南](../REFACTOR_WEEK2.md)
- [API 文档](../src/api/README.md)
- [类型系统文档](../src/types/README.md)

## 🎓 学习资源

### 状态管理
查看 `src/store/` 了解新的状态管理架构

### 错误处理
查看 `src/grid/error-handling/` 了解错误边界实现

### 可访问性
查看 `src/accessibility/` 了解键盘导航和 ARIA 支持

## 💡 常见问题

### Q: 为什么不连接真实后端？
A: Demo 专注于展示 UI 功能，使用模拟数据更简单。实际项目中连接真实后端即可。

### Q: 如何自定义字段类型？
A: 查看 `src/model/field/` 了解字段系统，可以继承 `Field` 类创建自定义字段。

### Q: 性能如何？
A: 使用虚拟滚动，支持 10万+ 行数据，60fps 流畅滚动。

### Q: 兼容性如何？
A: 支持现代浏览器（Chrome, Firefox, Safari, Edge），IE 不支持。

---

**Enjoy coding!** 🚀