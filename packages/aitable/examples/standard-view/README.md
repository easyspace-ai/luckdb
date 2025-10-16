# Aitable Standard View Example

这是一个使用 `@luckdb/aitable` 包中的 `StandardDataView` 组件的示例项目。

## 功能特性

- 展示 StandardDataView 组件的基本使用方法
- 包含多种字段类型：文本、数字、单选
- 带工具栏和状态栏的完整视图

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 访问 http://localhost:5174
```

## 构建

```bash
# 构建生产版本
pnpm build

# 预览构建结果
pnpm preview
```

## 项目结构

```
standard-view/
├── src/
│   ├── App.tsx          # 主应用组件
│   └── main.tsx         # 应用入口
├── public/              # 静态资源
├── index.html           # HTML 模板
├── vite.config.ts       # Vite 配置
├── tsconfig.json        # TypeScript 配置
└── package.json         # 项目配置
```

## 核心代码

示例展示了如何：

1. 定义表格列结构
2. 实现 `getCellContent` 方法来提供单元格数据
3. 配置工具栏和状态栏
4. 使用不同的字段类型（Text, Number, Select）

## 相关文档

- [@luckdb/aitable 文档](../../README.md)
- [StandardDataView API](../../doc/api/standard-data-view.md)

