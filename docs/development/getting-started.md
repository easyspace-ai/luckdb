# 快速开始

本指南将帮助你快速搭建 LuckDB 开发环境。

## 前置要求

### 必需
- **Node.js** >= 18.0.0
- **pnpm** >= 8.0.0
- **Go** >= 1.21
- **PostgreSQL** >= 14

### 可选
- **Redis** >= 7 (推荐)
- **Docker** (用于容器化部署)

## 快速安装

### 方法一：自动安装脚本

```bash
# 克隆项目
git clone https://github.com/your-org/luckdb.git
cd luckdb

# 运行安装脚本
./scripts/setup.sh
```

### 方法二：手动安装

#### 1. 安装前端依赖

```bash
# 使用 pnpm 安装
pnpm install
```

#### 2. 安装后端依赖

```bash
cd server
go mod download
```

#### 3. 启动数据库服务

```bash
# 使用 Docker Compose 启动 PostgreSQL 和 Redis
docker-compose -f docker/docker-compose.dev.yml up -d
```

#### 4. 配置环境变量

```bash
# 后端配置
cd server
cp config.yaml.example config.yaml
# 编辑 config.yaml 配置数据库连接

# 前端配置
cd ../apps/web
cp .env.example .env.local
# 编辑 .env.local 配置 API 地址
```

#### 5. 运行数据库迁移

```bash
cd server
make migrate
```

## 启动开发服务器

### 启动所有服务

```bash
pnpm dev:all
```

这会同时启动：
- 前端开发服务器 (http://localhost:3000)
- 后端 API 服务器 (http://localhost:8080)

### 单独启动服务

```bash
# 只启动前端
pnpm dev:web

# 只启动后端
pnpm dev:server
```

## 访问应用

- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **API 文档**: http://localhost:8080/docs (如果配置了 Swagger)

## 开发工作流

### 1. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 2. 开发和测试

```bash
# 运行测试
pnpm test

# 运行类型检查
pnpm type-check

# 运行代码检查
pnpm lint
```

### 3. 提交代码

```bash
# 格式化代码
pnpm format

# 提交 (会自动运行 pre-commit hooks)
git add .
git commit -m "feat: add new feature"
```

### 4. 推送和创建 PR

```bash
git push origin feature/your-feature-name
```

然后在 GitHub 上创建 Pull Request。

## 项目结构

```
luckdb/
├── apps/
│   └── web/              # Web 应用
│       ├── src/
│       │   ├── app/     # Next.js 页面
│       │   └── components/
│       └── package.json
├── packages/
│   ├── ui/              # UI 组件库
│   ├── sdk/             # API 客户端
│   ├── core/            # 核心业务逻辑
│   └── utils/           # 工具函数
├── server/
│   ├── cmd/             # 应用入口
│   ├── internal/        # 内部代码
│   │   ├── application/ # 应用层
│   │   ├── domain/      # 领域层
│   │   ├── infrastructure/ # 基础设施层
│   │   └── interfaces/  # 接口层
│   └── pkg/             # 公共包
└── docs/                # 文档
```

## 常用命令

### 前端命令

```bash
pnpm dev              # 启动所有包的开发模式
pnpm build            # 构建所有包
pnpm lint             # 检查代码
pnpm lint:fix         # 修复代码问题
pnpm type-check       # TypeScript 类型检查
pnpm test             # 运行测试
pnpm clean            # 清理构建产物
```

### 后端命令

```bash
cd server

make dev              # 启动开发服务器
make build            # 构建二进制文件
make test             # 运行测试
make test-coverage    # 测试覆盖率
make lint             # 代码检查
make migrate          # 运行数据库迁移
make migrate-down     # 回滚迁移
make clean            # 清理构建产物
```

## 开发工具推荐

### VS Code 扩展

项目已包含推荐的扩展列表 (`.vscode/extensions.json`):
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Go

### Chrome 扩展

- React Developer Tools
- Redux DevTools

## 故障排除

### 端口被占用

如果端口 3000 或 8080 被占用：

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### 数据库连接失败

1. 确认 PostgreSQL 正在运行：
```bash
docker-compose -f docker/docker-compose.dev.yml ps
```

2. 检查配置文件：
```bash
cat server/config.yaml
```

### 依赖安装失败

```bash
# 清理并重新安装
pnpm clean
rm -rf node_modules
pnpm install
```

### Go 模块问题

```bash
cd server
go clean -modcache
go mod download
```

## 下一步

- 阅读 [架构文档](../architecture/overview.md)
- 查看 [API 文档](../api/rest-api.md)
- 了解 [编码规范](./coding-standards.md)
- 阅读 [贡献指南](../../CONTRIBUTING.md)

## 获取帮助

- 查看 [FAQ](./faq.md)
- 提交 [Issue](https://github.com/your-org/luckdb/issues)
- 加入讨论 [Discussions](https://github.com/your-org/luckdb/discussions)

