# Week 1: TypeScript 严格模式迁移指南

## 🎯 目标
- 启用 TypeScript 严格模式
- 添加错误边界系统
- 清理生产代码中的 console.log
- 建立类型安全的基础设施

## 📋 执行清单

### ✅ 已完成
- [x] 创建严格 TypeScript 配置 (`tsconfig.strict.json`)
- [x] 更新 ESLint 规则（禁止 any，生产环境禁止 console.log）
- [x] 创建错误边界组件 (`GridErrorBoundary`, `FeatureErrorBoundary`)
- [x] 创建类型守卫工具集 (`type-guards.ts`)
- [x] 创建迁移脚本 (`migrate-to-strict.ts`)
- [x] 更新 package.json 脚本

### 🔄 接下来执行

#### 1. 运行迁移脚本
```bash
cd /Users/leven/space/easy/luckdb/packages/aitable
npm install  # 安装 tsx 依赖
npm run migrate:strict
```

#### 2. 查看迁移报告
```bash
cat migration-report.md
```

#### 3. 开始修复类型错误
```bash
# 使用严格模式检查
npm run typecheck:strict

# 修复 ESLint 错误
npm run lint:strict
```

## 🔧 修复策略

### 优先级 1: 核心组件（Grid.tsx）
1. 先修复 `src/grid/core/Grid.tsx`
2. 使用类型守卫替换 any 类型
3. 添加明确的类型注解

### 优先级 2: 状态管理
1. 修复 `src/grid/store/` 下的文件
2. 使用 Zustand 的类型安全模式
3. 消除状态相关的 any 类型

### 优先级 3: 工具函数
1. 修复 `src/utils/` 下的文件
2. 使用类型守卫工具
3. 添加运行时验证

## 📝 常见修复模式

### 1. 替换 any 类型
```typescript
// ❌ 之前
function processData(data: any) {
  return data.name.toUpperCase();
}

// ✅ 修复后
import { isObject, safeString } from '../utils/type-guards';

function processData(data: unknown): string {
  if (!isObject(data)) {
    return '';
  }
  return safeString(data.name).toUpperCase();
}
```

### 2. 事件处理类型
```typescript
// ❌ 之前
function handleClick(event) {
  event.preventDefault();
}

// ✅ 修复后
function handleClick(event: React.MouseEvent<HTMLButtonElement>): void {
  event.preventDefault();
}

// 或者使用 unknown + 类型守卫
function handleClick(event: unknown): void {
  if (isObject(event) && 'preventDefault' in event && typeof event.preventDefault === 'function') {
    event.preventDefault();
  }
}
```

### 3. API 响应类型
```typescript
// ❌ 之前
function handleApiResponse(response: any) {
  return response.data.items;
}

// ✅ 修复后
interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  message?: string;
}

function handleApiResponse(response: unknown): unknown[] {
  if (!isObject(response) || !('data' in response)) {
    return [];
  }
  
  const data = response.data;
  if (isObject(data) && 'items' in data && Array.isArray(data.items)) {
    return data.items;
  }
  
  return [];
}
```

## 🧪 测试验证

每修复一个文件后，运行测试确保功能正常：

```bash
# 运行相关测试
npm test -- --run src/grid/core/Grid.test.ts

# 检查类型
npm run typecheck:strict

# 检查代码质量
npm run lint:strict
```

## 📊 进度跟踪

### 目标指标
- [ ] TypeScript 严格模式编译通过
- [ ] ESLint 检查通过
- [ ] 所有 any 类型被替换
- [ ] 错误边界集成完成
- [ ] 核心功能测试通过

### 每日检查
```bash
# 每日运行这个命令检查整体进度
npm run refactor:check
```

## 🚨 注意事项

1. **不要一次性修复所有文件** - 按优先级逐步修复
2. **保持功能正常** - 每次修复后都要测试
3. **使用类型守卫** - 不要用类型断言 (as)
4. **记录问题** - 遇到复杂类型问题时记录下来
5. **寻求帮助** - 遇到困难时不要硬撑

## 📞 需要帮助？

如果遇到以下情况，可以寻求帮助：
- 复杂的泛型类型问题
- 第三方库类型定义问题
- 性能相关的类型优化
- 大规模重构的架构建议

---

**记住：质量比速度重要。宁可慢一点，也要确保代码质量和功能正确性。**
