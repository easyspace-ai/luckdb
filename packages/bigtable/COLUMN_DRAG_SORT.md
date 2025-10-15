# 列拖动排序功能

## 功能概述

BigTable 现已支持通过拖动列头来重新排序列。该功能提供了直观的视觉反馈，包括拖动阴影和目标插入位置指示器。

## 功能特性

### ✨ 核心功能

- **拖动排序**：在列头按住鼠标拖动可重新排序列
- **视觉反馈**：
  - 半透明拖动阴影跟随鼠标移动
  - 蓝色插入位置指示线
  - 顶部和底部的三角形指示器
- **自动更新**：列顺序变化后自动更新表格渲染
- **状态同步**：拖动状态实时同步到引擎和渲染器

### 🎨 交互设计

1. **开始拖动**：在列头区域按下鼠标
2. **拖动中**：
   - 显示半透明的列头阴影跟随鼠标
   - 显示蓝色的插入位置指示线
   - 实时计算并高亮目标插入位置
3. **完成拖动**：释放鼠标完成列重排序

## 技术实现

### 架构组件

#### 1. `useColumnDrag` Hook

位置：`/src/react/hooks/useColumnDrag.ts`

**职责**：

- 处理鼠标事件（mousedown, mousemove, mouseup）
- 计算拖动列索引和目标插入位置
- 触发列重排序回调

**核心方法**：

```typescript
interface IColumnDragState {
  isDragging: boolean; // 是否正在拖动
  dragColumnIndex: number; // 被拖动的列索引
  dropTargetIndex: number; // 目标插入位置索引
  dragStartX: number; // 拖动起始 X 坐标
  currentX: number; // 当前鼠标 X 坐标
}
```

**使用示例**：

```typescript
useColumnDrag({
  canvasRef,
  columns,
  engine,
  onColumnReorder: (fromIndex, toIndex) => {
    // 处理列重排序
    console.log(`Column moved from ${fromIndex} to ${toIndex}`);
  },
  enabled: true,
});
```

#### 2. GridEngine 扩展

位置：`/src/core/engine/GridEngine.ts`

**新增方法**：

- `setColumnDragState(state)`: 设置拖动状态
- `getColumnDragState()`: 获取拖动状态
- `reorderColumn(fromIndex, toIndex)`: 执行列重排序

**实现要点**：

```typescript
// 设置拖动状态并触发重新渲染
setColumnDragState(state: IColumnDragState | null): void {
  this.columnDragState = state;
  this.render(); // 触发渲染以显示拖动反馈
}

// 列重排序逻辑
reorderColumn(fromIndex: number, toIndex: number): void {
  const newColumns = [...this.columns];
  const [removed] = newColumns.splice(fromIndex, 1);
  const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
  newColumns.splice(adjustedToIndex, 0, removed);
  this.updateColumns(newColumns);
}
```

#### 3. CanvasRenderer 扩展

位置：`/src/core/renderers/canvas/CanvasRenderer.ts`

**新增功能**：

- 渲染拖动列的半透明阴影
- 渲染目标插入位置指示器
- 支持拖动状态的实时更新

**渲染流程**：

```typescript
render(data: IRenderData): void {
  // 1. 渲染常规内容
  this.renderCells(data);
  this.renderHeader(data);
  this.renderGridLines(data);

  // 2. 渲染拖动反馈（如果正在拖动）
  if (this.columnDragState?.isDragging) {
    this.renderColumnDragFeedback(data);
  }
}
```

**视觉反馈实现**：

```typescript
private renderColumnDragFeedback(data: IRenderData): void {
  // 1. 绘制拖动阴影
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = theme.bgSecondary;
  ctx.strokeStyle = theme.borderColorActive;
  // 绘制半透明背景和边框...

  // 2. 绘制插入位置指示器
  ctx.strokeStyle = theme.borderColorActive;
  ctx.lineWidth = 3;
  // 绘制垂直线...

  // 3. 绘制顶部和底部三角形
  // 绘制指示三角形...
}
```

## 使用指南

### 基本使用

列拖动功能已默认集成到 `BigTable` 组件中，无需额外配置：

```tsx
import { BigTable } from '@luckdb/bigtable';

function App() {
  const [columns, setColumns] = useState<IColumn[]>([
    { id: 'col1', key: 'name', width: 200, title: 'Name' },
    { id: 'col2', key: 'age', width: 100, title: 'Age' },
    { id: 'col3', key: 'email', width: 300, title: 'Email' },
  ]);

  return (
    <BigTable
      rows={rows}
      columns={columns}
      // 列拖动功能已自动启用
    />
  );
}
```

### 禁用列拖动

如果需要禁用列拖动功能，可以通过 props 控制：

```tsx
// 注意：当前版本默认启用，如需禁用功能，需要在 BigTable props 中添加 enableColumnDrag 选项
```

### 监听列顺序变化

列顺序变化会自动反映在组件的 `columns` state 中。如果需要持久化列顺序，可以监听变化：

```tsx
function App() {
  const [columns, setColumns] = useState<IColumn[]>(initialColumns);

  // columns 变化时保存到本地存储
  useEffect(() => {
    localStorage.setItem('columnOrder', JSON.stringify(columns));
  }, [columns]);

  return <BigTable rows={rows} columns={columns} />;
}
```

## 性能优化

### 渲染优化

1. **状态同步优化**：拖动状态只在必要时触发重新渲染
2. **Canvas 优化**：使用 `globalAlpha` 实现半透明效果，避免额外的图层
3. **计算缓存**：列位置计算结果在同一帧内复用

### 交互优化

1. **鼠标移出处理**：鼠标离开画布时自动取消拖动
2. **边界检测**：只在列头区域响应拖动事件
3. **实时反馈**：拖动时立即显示视觉反馈，无延迟

## 已知限制

1. **冻结列**：当前实现中，冻结列可能受拖动影响（待优化）
2. **触摸设备**：目前仅支持鼠标拖动，触摸设备支持待实现
3. **拖动范围**：拖动范围限制在表格画布内

## 未来计划

- [ ] 支持触摸设备拖动
- [ ] 支持冻结列的拖动限制
- [ ] 添加拖动动画效果
- [ ] 支持列分组时的拖动
- [ ] 添加拖动撤销/重做功能

## 相关文件

- `/src/react/hooks/useColumnDrag.ts` - 拖动交互逻辑
- `/src/core/engine/GridEngine.ts` - 引擎拖动状态管理
- `/src/core/renderers/canvas/CanvasRenderer.ts` - 拖动视觉反馈渲染
- `/src/react/BigTable.tsx` - 组件集成
- `/example/App.tsx` - 使用示例

## 测试建议

### 手动测试

1. 打开示例应用
2. 在列头区域按住鼠标
3. 拖动到目标位置
4. 释放鼠标
5. 验证列顺序是否正确更新

### 自动化测试（待实现）

```typescript
describe('Column Drag', () => {
  it('should reorder columns on drag', () => {
    // 模拟拖动事件
    // 验证列顺序变化
  });

  it('should show drag feedback', () => {
    // 验证拖动时的视觉反馈
  });

  it('should cancel drag on mouse leave', () => {
    // 验证鼠标离开时取消拖动
  });
});
```

## 故障排查

### 问题：拖动时没有视觉反馈

**原因**：拖动状态未正确同步到渲染器

**解决**：检查 `GridEngine.render()` 中是否调用了 `renderer.setColumnDragState()`

### 问题：列顺序更新不正确

**原因**：索引计算错误

**解决**：检查 `reorderColumn()` 中的索引调整逻辑：

```typescript
const adjustedToIndex = fromIndex < toIndex ? toIndex - 1 : toIndex;
```

### 问题：拖动后列宽度重置

**原因**：列重排序时未保留列的其他属性

**解决**：确保在 `onColumnReorder` 回调中保留所有列属性

## 贡献指南

欢迎贡献代码！如果您想改进列拖动功能：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/column-drag-improvement`)
3. 提交更改 (`git commit -m 'Improve column drag'`)
4. 推送到分支 (`git push origin feature/column-drag-improvement`)
5. 创建 Pull Request

---

**最后更新**: 2025-10-15
**版本**: 1.0.0
