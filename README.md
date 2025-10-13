# LuckDB

<div align="center">

![LuckDB Logo](https://via.placeholder.com/200x200?text=LuckDB)

**Modern, AI-powered database management platform**

[![GitHub](https://img.shields.io/github/license/easyspace-ai/luckdb)](https://github.com/easyspace-ai/luckdb/blob/main/LICENSE)
[![Go Version](https://img.shields.io/badge/Go-1.23-blue)](https://golang.org/)
[![Node Version](https://img.shields.io/badge/Node-18+-green)](https://nodejs.org/)

[快速开始](./QUICKSTART.md) · [文档](./docs/) · [贡献](./CONTRIBUTING.md) · [反馈](https://github.com/easyspace-ai/luckdb/issues)

</div>

---

## ✨ 特性

- 🚀 **现代化架构** - 基于 Monorepo 的项目结构，前后端分离
- 🎨 **优雅的 UI** - 精心设计的用户界面，提供最佳用户体验
- 🤖 **AI 增强** - 集成 AI 能力，智能化数据处理和分析
- 📊 **多视图支持** - 表格、看板、日历等多种数据展示方式
- 🔐 **安全可靠** - 完善的权限系统和数据加密
- 🌐 **实时协作** - WebSocket 实时同步，支持多人协作
- 🔌 **可扩展** - 插件系统，支持自定义扩展
- 🌍 **MCP 协议** - 支持 Model Context Protocol，无缝集成 AI 应用

## 🎯 核心功能

### 数据管理
- **空间(Space)管理** - 组织和隔离不同项目
- **基础(Base)管理** - 数据库级别的管理
- **表格(Table)管理** - 灵活的数据表结构
- **字段(Field)管理** - 多种字段类型支持
- **记录(Record)管理** - 强大的 CRUD 操作

### 视图系统
- 📊 表格视图 - 传统的表格展示
- 📋 看板视图 - 可视化工作流管理
- 📅 日历视图 - 时间维度的数据展示
- 🖼️ 画廊视图 - 图片内容展示

### 高级功能
- 🔗 关联字段 - 表格间的数据关联
- 📐 公式字段 - 复杂的计算逻辑
- 🔄 汇总字段 - 数据聚合统计
- 🎯 过滤和排序 - 灵活的数据查询
- 📱 实时同步 - WebSocket 实时更新

## 📁 项目结构

```
luckdb/
├── apps/                 # 应用层
│   └── web/             # Next.js Web 应用
├── packages/            # 共享包
│   ├── ui/             # UI 组件库
│   ├── sdk/            # LuckDB SDK
│   ├── core/           # 核心业务逻辑
│   └── utils/          # 工具函数
├── server/             # 后端服务 (Go)
│   ├── cmd/           # 应用入口
│   ├── internal/      # 内部代码
│   ├── pkg/           # 公共包
│   └── migrations/    # 数据库迁移
├── docs/               # 文档
├── docker/             # Docker 配置
└── scripts/            # 实用脚本
```

## 🚀 快速开始

### 前置要求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Go >= 1.21
- PostgreSQL >= 14
- Redis >= 7 (可选)

### 安装

```bash
# 克隆项目
git clone https://github.com/easyspace-ai/luckdb.git
cd luckdb

# 使用自动安装脚本
./scripts/setup.sh

# 或手动安装
pnpm install
cd server && go mod download
```

### 启动

```bash
# 启动数据库服务
docker-compose -f docker/docker-compose.dev.yml up -d

# 运行数据库迁移
cd server && make migrate

# 启动所有服务（前端 + 后端）
cd .. && pnpm dev:all
```

访问：
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080

详细说明请查看 [快速开始指南](./QUICKSTART.md)。

## 🛠️ 技术栈

### 前端
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript 5.3
- **状态管理**: Zustand
- **样式**: Tailwind CSS
- **构建**: Turbo + pnpm

### 后端
- **语言**: Go 1.23
- **框架**: Gin
- **ORM**: GORM
- **数据库**: PostgreSQL 15
- **缓存**: Redis 7
- **实时通信**: WebSocket

### DevOps
- **容器**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **代码质量**: ESLint + Prettier + golangci-lint

## 📚 文档

- [快速开始](./QUICKSTART.md) - 5分钟上手指南
- [架构设计](./docs/architecture/overview.md) - 系统架构详解
- [开发指南](./docs/development/getting-started.md) - 完整开发文档
- [API 文档](./docs/api/rest-api.md) - RESTful API 规范
- [贡献指南](./CONTRIBUTING.md) - 如何贡献代码

## 🤝 贡献

我们欢迎所有形式的贡献！

- 🐛 [报告 Bug](https://github.com/easyspace-ai/luckdb/issues/new?template=bug_report.md)
- 💡 [提出新功能](https://github.com/easyspace-ai/luckdb/issues/new?template=feature_request.md)
- 📖 改进文档
- 🔧 提交代码

请阅读 [贡献指南](./CONTRIBUTING.md) 了解详细信息。

## 🧪 测试

```bash
# 前端测试
pnpm test

# 后端测试
cd server && make test

# 测试覆盖率
pnpm test -- --coverage
cd server && make test-coverage
```

## 📦 构建

```bash
# 构建前端
pnpm build

# 构建后端
cd server && make build

# 构建 Docker 镜像
docker-compose -f docker/docker-compose.yml build
```

## 🐳 Docker 部署

```bash
# 开发环境
docker-compose -f docker/docker-compose.dev.yml up -d

# 生产环境
docker-compose -f docker/docker-compose.yml up -d
```

## 📊 路线图

- [x] 基础数据管理功能
- [x] 多视图支持
- [x] 实时协作
- [x] MCP 协议支持
- [ ] 移动端应用
- [ ] 桌面应用 (Electron)
- [ ] 更多 AI 功能
- [ ] 自动化工作流
- [ ] API 市场

## 🌟 致谢

感谢所有为 LuckDB 做出贡献的开发者！

<a href="https://github.com/easyspace-ai/luckdb/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=easyspace-ai/luckdb" />
</a>

## 📄 许可证

本项目采用 [MIT License](./LICENSE) 许可。

## 📞 联系我们

- **GitHub**: https://github.com/easyspace-ai/luckdb
- **Issues**: https://github.com/easyspace-ai/luckdb/issues
- **Discussions**: https://github.com/easyspace-ai/luckdb/discussions

---

<div align="center">

**Made with ❤️ by LuckDB Team**

如果觉得有帮助，请给我们一个 ⭐️

</div>
