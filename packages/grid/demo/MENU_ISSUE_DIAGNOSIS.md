# 🔍 列右键菜单问题诊断报告

## ✅ 菜单是显示的！但是位置不对！

### 问题描述
菜单没有在鼠标右键点击的位置显示，而是固定在**左上角**（left: 8px, top: 30px）。

---

## 📊 测试数据

### Playwright检测结果

```json
{
  "found": true,  // ✅ 菜单已找到！
  "buttonPosition": {
    "left": 10,   // 菜单在左边10px
    "top": 36,    // 菜单在顶部36px
    "width": 73.5,
    "height": 28.5
  },
  "parentStyles": {
    "position": "fixed",    // ✅ fixed定位正确
    "zIndex": "9999",       // ✅ z-index很高
    "left": "8px",          // ❌ 位置固定在左边
    "top": "30px",          // ❌ 位置固定在顶部
    "backgroundColor": "rgba(255, 0, 0, 0.1)"
  }
}
```

### 鼠标点击位置
```
clientX: 200
clientY: 30
```

### 预期结果
菜单应该显示在 `(200, 30)` 附近。

### 实际结果
菜单显示在 `(8, 30)` —— **完全在左上角！**

---

## 🐛 问题分析

### 原因1：`calculateMenuPosition` 函数有问题
检查 `src/grid/utils/core/menu-position.ts` 的实现。

### 原因2：`computedPosition` 计算错误
在 `ColumnContextMenu.tsx` 的 `useEffect` 中调用 `calculateMenuPosition(position, menuSize, {...})`。

### 原因3：坐标系转换问题
`InteractionLayer` 传递的坐标是 `event.clientX/clientY`（屏幕坐标），但 `calculateMenuPosition` 可能需要相对坐标？

---

## 🔍 调试日志

### 控制台输出
```
🔍 Right-click detected: {type: ColumnHeader, x: 200, y: 30, rowIndex: -1, columnIndex: 0}
✅ Column header menu clicked: {columnIndex: 0, clientX: 200, clientY: 30}
🎯 handleColumnHeaderMenuClick: {colIndex: 0, bounds: Object, ref: Object}
```

所有事件都正确触发了！坐标也是对的（200, 30）！

---

## 💡 解决方案

需要检查并修复：

1. **`calculateMenuPosition` 函数** 
   - 输入参数是什么？
   - 输出结果是什么？
   - 坐标计算逻辑是否正确？

2. **`ColumnContextMenu` 的 `useEffect`**
   - `position` 传递的值是否正确？
   - `computed` 的计算结果是什么？

3. **添加更多调试日志**
   - 打印 `position` 的值
   - 打印 `computedPosition` 的值
   - 打印 `menuSize` 的值

---

## 📸 截图

已保存截图到：
- `.playwright-mcp/menu-debug-full.png`
- `.playwright-mcp/menu-debug-highlighted.png`
- `.playwright-mcp/menu-fixed-test.png`

菜单在**左上角可见**，被红色边框高亮。

---

## 🎯 下一步

1. 添加调试日志到 `ColumnContextMenu.tsx`
2. 添加调试日志到 `calculateMenuPosition()`
3. 检查坐标传递流程
4. 修复位置计算逻辑

---

**访问**: http://localhost:3001  
**右键点击列头**，然后查看**浏览器控制台**的日志。

