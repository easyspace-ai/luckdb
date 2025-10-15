# BigTable 快速上手指南

## 🚀 10秒快速开始

```bash
cd packages/bigtable
pnpm install
pnpm dev
```

打开浏览器访问 `http://localhost:3200`

---

## ✨ 核心功能

### 1. 基础使用

```tsx
import { BigTable } from '@luckdb/bigtable';

function App() {
  const rows = [
    { id: 1, data: { name: 'John', age: 25 } },
    { id: 2, data: { name: 'Jane', age: 30 } },
  ];

  const columns = [
    { id: 'name', key: 'name', title: 'Name', width: 200 },
    { id: 'age', key: 'age', title: 'Age', width: 100, type: 'number' },
  ];

  return <BigTable rows={rows} columns={columns} editable={true} showPerformance={true} />;
}
```

### 2. 编辑功能

✅ **双击编辑**

- 双击任意单元格打开编辑器
- Enter 保存，Escape 取消
- 自动聚焦并选中内容

✅ **Tab 导航**

- Tab：保存并移动到下一列
- Shift+Tab：保存并移动到上一列
- 流畅的跨单元格编辑体验

### 3. 冻结列

```tsx
<BigTable
  frozenColumnCount={1}  // 冻结第一列
  ...
/>
```

### 4. 列宽调整

拖拽列头分隔线即可调整列宽：

- 最小宽度：50px
- 最大宽度：1000px
- 实时预览

### 5. 右键菜单

右键单击：

- **单元格**：复制/粘贴/删除行
- **列头**：排序/筛选/隐藏列/删除列
- **行头**：复制行/插入行/删除行

### 6. 导入导出

```tsx
import { useImportExport } from '@luckdb/bigtable';

const { exportAsCSV, exportAsExcel, triggerImport } = useImportExport({
  rows,
  columns,
  onImport: (importedRows, importedColumns) => {
    setRows(importedRows);
  },
});

// 导出 CSV
exportAsCSV('data.csv');

// 导出 Excel
exportAsExcel('data.xlsx');

// 导入
triggerImport('.csv');
```

---

## 🎯 10种字段类型

| 字段类型      | 说明                          | 示例               |
| ------------- | ----------------------------- | ------------------ |
| `text`        | 单行/多行文本                 | "Hello World"      |
| `number`      | 数字（整数/小数/百分比/货币） | 123.45             |
| `date`        | 日期/时间                     | 2025-10-15         |
| `checkbox`    | 布尔值                        | true/false         |
| `select`      | 单选（带颜色）                | "Active"           |
| `multiselect` | 多选                          | ["Tag1", "Tag2"]   |
| `attachment`  | 附件                          | [{url, name}]      |
| `url`         | 网址                          | "https://..."      |
| `email`       | 邮箱                          | "user@example.com" |
| `phone`       | 电话                          | "+86 138..."       |

---

## 📊 性能表现

| 场景           | 性能      |
| -------------- | --------- |
| 10K 行渲染     | ~50ms     |
| 滚动帧率       | 60fps     |
| 可见单元格渲染 | 0.3-1.0ms |
| 100K 行支持    | ✅ 流畅   |

---

## 🔧 高级配置

### 虚拟化

```tsx
<BigTable
  virtualization={{
    enabled: true,
    overscanCount: 3,  // 预渲染行数
  }}
  ...
/>
```

### 渲染模式

```tsx
<BigTable
  renderMode="canvas"  // 'canvas' | 'dom' | 'webgl'
  ...
/>
```

### 主题自定义

```tsx
const customTheme = {
  bgPrimary: '#ffffff',
  textPrimary: '#1f2937',
  borderColor: '#e5e7eb',
  headerHeight: 40,
  rowHeight: 36,
};

// Theme 在 GridEngine 初始化时传入
```

---

## 📖 API 文档

### BigTable Props

| 属性                | 类型                               | 默认值     | 说明           |
| ------------------- | ---------------------------------- | ---------- | -------------- |
| `rows`              | `IRow[]`                           | **必填**   | 数据行         |
| `columns`           | `IColumn[]`                        | **必填**   | 列定义         |
| `renderMode`        | `'canvas' \| 'dom' \| 'webgl'`     | `'canvas'` | 渲染模式       |
| `frozenColumnCount` | `number`                           | `0`        | 冻结列数量     |
| `editable`          | `boolean`                          | `true`     | 是否可编辑     |
| `showPerformance`   | `boolean`                          | `false`    | 显示性能指标   |
| `onCellClick`       | `(rowId, columnId) => void`        | -          | 单元格点击回调 |
| `onCellDoubleClick` | `(rowId, columnId) => void`        | -          | 单元格双击回调 |
| `onCellChange`      | `(rowId, columnId, value) => void` | -          | 单元格修改回调 |

### 数据结构

```typescript
interface IRow {
  id: number | string;
  data: Record<string, unknown>;
  height?: number;
}

interface IColumn {
  id: string | number;
  key: string;
  title?: string;
  width?: number;
  type?: FieldType;
  frozen?: boolean;
}
```

---

## 🐛 问题排查

### Canvas 不显示内容

1. 检查 `rows` 和 `columns` 数据是否正确
2. 查看浏览器控制台是否有错误
3. 确认容器有明确的宽度和高度

### 编辑器位置不对

1. 确保使用了 `frozenColumnCount` 配置
2. 检查列宽设置是否正确
3. 查看 console 日志中的编辑器位置信息

### 性能问题

1. 启用虚拟化：`virtualization={{ enabled: true }}`
2. 减少行数：建议单次渲染 < 10K 行
3. 使用 `showPerformance` 查看性能指标

---

## 🎓 最佳实践

### 1. 数据管理

```tsx
// ✅ 推荐：使用 state 管理数据
const [rows, setRows] = useState(initialRows);

const handleCellChange = (rowId, columnId, value) => {
  setRows((prevRows) =>
    prevRows.map((row) =>
      row.id === rowId ? { ...row, data: { ...row.data, [columnKey]: value } } : row
    )
  );
};
```

### 2. 大数据场景

```tsx
// 10K+ 行数据建议使用
<BigTable
  virtualization={{ enabled: true, overscanCount: 5 }}
  showPerformance={process.env.NODE_ENV === 'development'}
  ...
/>
```

### 3. 列配置

```tsx
// ✅ 推荐：明确指定列宽和类型
const columns = [
  { id: 'id', key: 'id', width: 80, title: 'ID', frozen: true },
  { id: 'name', key: 'name', width: 200, title: 'Name', type: 'text' },
  { id: 'age', key: 'age', width: 100, title: 'Age', type: 'number' },
];
```

---

## 📦 导出模块

```typescript
// 核心组件
import { BigTable } from '@luckdb/bigtable';

// Hook
import { useBigTable, useImportExport } from '@luckdb/bigtable';

// 工具
import { CSVExporter, CSVImporter, ExcelExporter } from '@luckdb/bigtable';

// 类型
import type { IRow, IColumn, ICell, ITheme } from '@luckdb/bigtable';
```

---

## 🔗 资源链接

- **源码**：`packages/bigtable/`
- **示例**：`packages/bigtable/example/`
- **文档**：`book/ai-reports/features/`
- **开发计划**：`bigtable-complete-development.plan.md`

---

## 🙏 反馈与贡献

遇到问题或有功能建议？

1. 提交 Issue
2. 查看开发计划
3. 参与贡献

---

**Happy coding with BigTable!** 🚀
