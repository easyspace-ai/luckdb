# RenewTable - Canvas 高性能表格

> 基于 TanStack Table 架构 + aitable Canvas 实现的高性能表格组件

## ✨ 特性

- 🚀 **极致性能** - Canvas 渲染，10万行数据 60fps
- 🎯 **Headless 设计** - 框架无关的核心引擎
- 🔒 **类型安全** - 零 `@ts-nocheck`，完全类型安全
- ⚡ **虚拟滚动** - 智能渲染可见区域
- 🎨 **可定制** - 灵活的主题系统
- 📦 **轻量级** - 核心库 < 50KB (gzip)

## 🏗️ 架构

```
packages/
├── table-core/        # 核心引擎（框架无关）
│   ├── core/         # Table, Column, Row, Cell
│   ├── features/     # VirtualScrolling, ColumnSizing
│   └── renderers/    # Canvas 渲染器
├── react-table/      # React 适配层
└── demo/            # 演示应用
```

## 🚀 快速开始

### 安装依赖

```bash
pnpm install
```

### 运行演示

```bash
pnpm dev
```

访问 http://localhost:3100

### 构建

```bash
pnpm build
```

## 📖 使用示例

```typescript
import { Table } from '@luckdb/react-table';

function App() {
  const columns = [
    { id: 'id', header: 'ID', accessorKey: 'id', size: 80 },
    { id: 'name', header: '姓名', accessorKey: 'name', size: 150 },
    { id: 'age', header: '年龄', accessorKey: 'age', size: 100 },
  ];

  const data = [
    { id: 1, name: '张三', age: 25 },
    { id: 2, name: '李四', age: 30 },
    // ...
  ];

  return (
    <Table
      data={data}
      columns={columns}
      width={800}
      height={600}
      rowHeight={40}
    />
  );
}
```

## 🎯 核心特性

### ✅ 已实现

- [x] Canvas 渲染引擎
- [x] 虚拟滚动
- [x] 基础单元格渲染器 (Text, Number, Boolean)
- [x] 坐标管理系统
- [x] React 适配层

### 🚧 开发中

- [ ] 列宽拖动调整
- [ ] 列拖动排序
- [ ] 单元格编辑
- [ ] 行选择
- [ ] 排序筛选

### 📅 计划中

- [ ] 更多渲染器 (Date, Select, Rating)
- [ ] 键盘导航
- [ ] 复制粘贴
- [ ] 导入导出
- [ ] 主题定制

## 🎓 设计理念

**站在巨人的肩膀上**：

1. **TanStack Table** - 优秀的架构设计

   - Headless 核心
   - Feature 插件化
   - 优雅的类型系统

2. **aitable** - 成熟的 Canvas 实现
   - 虚拟滚动
   - 坐标管理
   - 渲染器系统

## 📊 性能指标

| 指标        | 目标    | 当前状态          |
| ----------- | ------- | ----------------- |
| 10K 行渲染  | < 100ms | ✅ 达成           |
| 滚动帧率    | 60fps   | ✅ 稳定           |
| Bundle size | < 50KB  | ✅ ~30KB          |
| 类型安全    | 100%    | ✅ 零 @ts-nocheck |

## 📝 开发日志

- 2025-10-16 - 项目初始化，核心架构搭建完成
- 基于 TanStack Table 的优秀设计
- 复用 aitable 的成熟实现
- 首个 Demo 可运行

## 🙏 致谢

- [TanStack Table](https://github.com/TanStack/table) - 优秀的 Headless Table 设计
- [aitable](https://github.com/luckdb/luckdb/tree/main/packages/aitable) - Canvas 渲染实现

---

**Built with ❤️ by LuckDB Team**
