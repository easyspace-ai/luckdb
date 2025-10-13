# LuckDB 项目文档

本目录包含 LuckDB 项目的所有文档，按照类别组织。

## 📚 文档结构

### 🎯 [tasks/](./tasks/) - 任务文档
记录具体开发任务的执行过程、进度和总结。

### 🏗️ [architecture/](./architecture/) - 架构文档
系统架构设计、数据库设计、API 设计等技术架构文档。

### ⭐ [features/](./features/) - 功能文档
各功能模块的详细说明、使用指南和 API 参考。

### 📖 [guides/](./guides/) - 开发指南
开发环境搭建、编码规范、最佳实践、部署指南等。

### 📊 [analysis/](./analysis/) - 分析报告
性能分析、安全审计、竞品对比、技术调研等分析文档。

### 🧪 [testing/](./testing/) - 测试文档
测试计划、测试用例、测试报告、覆盖率分析等。

## 📋 文档规范

所有项目文档必须遵循 [文档规范](./.cursorrules-documentation)，要点如下：

1. ✅ 所有文档必须存放在 `book/` 目录的子目录中
2. ✅ 每个任务/主题有独立的文件夹
3. ✅ 使用小写字母和短横线命名
4. ✅ 每个目录包含 `README.md` 索引文件
5. ❌ 严禁在项目根目录或代码目录创建文档

## 🔗 快速链接

### 开始使用
- [快速开始指南](./guides/getting-started/README.md)
- [开发环境搭建](./guides/development-setup/README.md)

### 架构设计
- [系统架构概览](./architecture/system-overview/README.md)
- [数据库设计](./architecture/database-design/README.md)
- [API 设计规范](./architecture/api-design/README.md)

### 开发指南
- [编码规范](./guides/coding-standards/README.md)
- [Git 提交规范](./guides/git-workflow/README.md)
- [代码审查清单](./guides/code-review/README.md)

## 📝 更新记录

- 2024-01-15: 创建文档目录结构
- 2024-01-15: 添加文档规范

## 🤝 贡献

如需添加或更新文档，请：

1. 确定文档类别
2. 在对应目录下创建子目录（如需要）
3. 创建 Markdown 文件
4. 更新目录的 README.md 索引
5. 提交 Pull Request

详细规范请参考 [文档规范](../.cursorrules-documentation)。

