# 列宽调整功能测试指南

## 🔍 问题定位

**症状**: 列宽调整时，拖拽鼠标但列宽几乎不变或变化很小

**已添加调试日志**:

1. `[ColumnResize] MouseMove - clientX/canvasLeft/x`
2. `[ColumnResizeManager] resize() - mouseX/startX/delta/newWidth`
3. `[BigTable] Updating engine columns`
4. `[GridEngine] Columns updated, total width`

---

## 🧪 手动测试步骤

### 步骤 1: 刷新页面

打开 `http://localhost:3200` 并刷新（Cmd+R 或 F5）

### 步骤 2: 打开开发者控制台

按 F12 或 Cmd+Option+I，切换到 Console 标签

### 步骤 3: 测试列宽拖拽

1. 将鼠标移动到 **Name 列右边界**（ID 和 Name 之间的分隔线）
   - 光标应变为 `⬌` (col-resize)
2. **按住鼠标左键，向右拖动至少 100px**
3. 松开鼠标

### 步骤 4: 检查控制台日志

**预期日志序列**:

```
[ColumnResize] Start resizing column: 1
[ColumnResize] MouseMove - clientX: XXX canvasLeft: XXX x: XXX
[ColumnResizeManager] resize() - mouseX: XXX startX: XXX delta: +XX startWidth: 200 newWidth before clamp: XXX
[ColumnResizeManager] newWidth after clamp: XXX
[ColumnResize] Resizing: 1 width: XXX
[BigTable] Column resized: 1 new width: XXX
[BigTable] Updating engine columns: [{id: 'id', width: 80}, {id: 'name', width: XXX}, ...]
[GridEngine] Columns updated, total width: XXX
[CanvasRenderer] Rendering...
```

**关键检查点**:

- ✅ `delta` 应该是正数（向右拖）或负数（向左拖）
- ✅ `newWidth` 应该明显不同于 `startWidth` (200)
- ✅ 应该触发 Canvas 重新渲染

---

## 🐛 常见问题诊断

### 问题 1: delta 一直是 0

**原因**: mouseX 和 startX 相同
**检查**:

- startX 是在 startResize() 时记录的
- mouseX 是在 handleMouseMoveDocument 中传入的
- 两者应该使用相同的坐标系统（都是相对于 canvas.left）

### 问题 2: newWidth 没有变化

**原因**: onColumnResize 没有触发或 setColumns 没有生效
**检查**:

- `[BigTable] Column resized` 日志是否出现
- `[BigTable] Updating engine columns` 日志中的 width 值

### 问题 3: 视觉上没有变化

**原因**: CoordinateSystem 缓存没有清空，或 CanvasRenderer 没有使用新宽度
**检查**:

- `[GridEngine] Columns updated, total width` 值是否变化
- Canvas 是否重新渲染

---

## 🔧 调试技巧

### 在浏览器控制台执行:

```javascript
// 1. 检查当前列配置
window.__bigtable_debug = true;

// 2. 手动触发列宽更新
const canvas = document.querySelector('canvas');
// ... 模拟拖拽 ...

// 3. 检查 Canvas 是否重绘
const ctx = canvas.getContext('2d');
console.log('Canvas context:', ctx);
```

### 添加视觉辅助线

在 `CanvasRenderer.ts` 的 `renderHeader` 方法中添加列边界高亮：

```typescript
// 绘制列边界（调试用）
ctx.strokeStyle = '#ff0000';
ctx.lineWidth = 2;
ctx.beginPath();
ctx.moveTo(x + width, 0);
ctx.lineTo(x + width, this.canvas.height);
ctx.stroke();
```

---

## ✅ 修复历史

### 修复 1: 添加 GridEngine.updateColumns()

- 允许动态更新列配置
- 使用 coordinateSystem.updateConfig() 清空缓存
- 触发重新渲染

### 修复 2: 事件监听优化

- 在 document 上添加 mousemove/mouseup（防止鼠标离开 canvas）
- mousedown 时动态添加，mouseup 时移除

### 修复 3: ColumnResizeManager 状态跟踪

- 添加 currentWidth 字段
- endResize() 返回实际调整后的宽度

---

## 📊 测试结果记录

**测试日期**: ******\_\_\_******

**测试结果**:

- [ ] 光标变化正常
- [ ] 拖拽响应正常
- [ ] 控制台日志完整
- [ ] 列宽视觉变化明显
- [ ] 性能流畅（60fps）

**问题记录**:

- ***
- ***

---

刷新页面后请按照上述步骤测试，并分享控制台日志！🔍
