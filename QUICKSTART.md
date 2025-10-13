# 🚀 LuckDB 快速启动指南

欢迎使用 LuckDB！本指南将帮助你快速启动 LuckDB 开发环境。

## 📋 前置要求

- ✅ Node.js >= 18.0.0
- ✅ pnpm >= 8.0.0  
- ✅ Go >= 1.21
- ✅ PostgreSQL >= 14
- ✅ Docker（可选，用于数据库）

## ⚡ 5 分钟快速启动

### 方法一：使用 Docker（推荐）

```bash
# 1. 进入项目目录
cd /Users/leven/space/easy/luckdb

# 2. 启动数据库服务
docker-compose -f docker/docker-compose.dev.yml up -d

# 等待数据库启动（约 10 秒）
sleep 10

# 3. 安装依赖
pnpm install

# 4. 运行数据库迁移
cd server
make migrate

# 5. 启动所有服务
cd ..
pnpm dev:all
```

### 方法二：自动安装脚本

```bash
cd /Users/leven/space/easy/luckdb
./scripts/setup.sh
```

## 🎯 访问应用

启动成功后，访问：

- **前端应用**: http://localhost:3000
- **后端 API**: http://localhost:8080
- **API 文档**: http://localhost:8080/docs （如果启用）

## 📦 分步安装

### 1. 安装前端依赖

```bash
cd /Users/leven/space/easy/luckdb
pnpm install
```

### 2. 安装后端依赖

```bash
cd server
go mod download
```

### 3. 配置数据库

#### 使用 Docker（推荐）

```bash
# 启动 PostgreSQL 和 Redis
docker-compose -f docker/docker-compose.dev.yml up -d

# 查看服务状态
docker-compose -f docker/docker-compose.dev.yml ps

# 查看日志
docker-compose -f docker/docker-compose.dev.yml logs -f
```

#### 手动安装 PostgreSQL

创建数据库和用户：

```sql
CREATE USER luckdb WITH PASSWORD 'luckdb';
CREATE DATABASE luckdb_dev OWNER luckdb;
GRANT ALL PRIVILEGES ON DATABASE luckdb_dev TO luckdb;
```

### 4. 配置文件

复制配置文件：

```bash
# 后端配置
cd server
cp config.yaml.example config.yaml
# 编辑 config.yaml 修改数据库连接信息

# 前端配置
cd ../apps/web
cp .env.example .env.local
# 编辑 .env.local 配置 API 地址
```

### 5. 运行数据库迁移

```bash
cd server
make migrate

# 或使用二进制文件
./bin/luckdb migrate up
```

## 🚀 启动服务

### 启动所有服务（推荐）

```bash
cd /Users/leven/space/easy/luckdb
pnpm dev:all
```

这将同时启动：
- 前端开发服务器（端口 3000）
- 后端 API 服务器（端口 8080）

### 单独启动服务

#### 只启动前端

```bash
pnpm dev:web
```

#### 只启动后端

```bash
# 方式 1: 使用 Makefile
cd server
make dev

# 方式 2: 使用二进制文件（需要先构建）
make build
./bin/luckdb serve

# 方式 3: 直接运行
go run ./cmd/luckdb serve
```

## 🔨 开发命令

### 前端命令

```bash
# 开发
pnpm dev                 # 启动所有包的开发模式
pnpm dev:web            # 只启动 web 应用

# 构建
pnpm build              # 构建所有包
pnpm build:web          # 只构建 web 应用

# 测试
pnpm test               # 运行所有测试
pnpm test:coverage      # 生成测试覆盖率

# 代码质量
pnpm lint               # 检查代码
pnpm lint:fix           # 修复代码问题
pnpm type-check         # TypeScript 类型检查
pnpm format             # 格式化代码

# 清理
pnpm clean              # 清理构建产物
```

### 后端命令

```bash
cd server

# 开发
make dev                # 启动开发服务器
make run                # 构建并运行

# 构建
make build              # 构建开发版本
make build-prod         # 构建生产版本（带版本信息）
make build-cross        # 交叉编译所有平台

# 数据库
make migrate            # 运行迁移
make migrate-down       # 回滚迁移
make migrate-version    # 查看迁移版本

# 测试
make test               # 运行所有测试
make test-coverage      # 生成测试覆盖率
make test-unit          # 只运行单元测试
make test-integration   # 只运行集成测试

# 代码质量
make lint               # 运行代码检查
make fmt                # 格式化代码
make vet                # 运行代码审查

# 清理
make clean              # 清理构建文件

# 帮助
make help               # 显示所有可用命令
```

## 🧪 测试

### 运行前端测试

```bash
# 所有测试
pnpm test

# 特定包的测试
pnpm --filter @luckdb/ui test
pnpm --filter @luckdb/sdk test
pnpm --filter @luckdb/core test
pnpm --filter @luckdb/utils test

# 监视模式
pnpm test -- --watch

# 覆盖率
pnpm test -- --coverage
```

### 运行后端测试

```bash
cd server

# 所有测试
make test

# 按层级测试
make test-domain          # 领域层
make test-application     # 应用层
make test-infrastructure  # 基础设施层
make test-interfaces      # 接口层

# 性能测试
make test-bench

# 竞态检测
make test-race

# 测试覆盖率
make test-coverage
```

## 🐛 故障排除

### 端口被占用

```bash
# macOS/Linux
lsof -ti:3000 | xargs kill -9  # 前端
lsof -ti:8080 | xargs kill -9  # 后端

# 或者使用 stop 命令
cd server
make stop  # 停止所有 luckdb 进程
```

### 数据库连接失败

1. 检查 Docker 容器状态：
```bash
docker-compose -f docker/docker-compose.dev.yml ps
```

2. 查看数据库日志：
```bash
docker-compose -f docker/docker-compose.dev.yml logs postgres
```

3. 重启数据库：
```bash
docker-compose -f docker/docker-compose.dev.yml restart postgres
```

### 前端依赖问题

```bash
# 清理并重新安装
pnpm clean
rm -rf node_modules
pnpm install
```

### 后端依赖问题

```bash
cd server
go clean -modcache
go mod download
go mod tidy
```

### 构建失败

```bash
# 完整清理和重建
cd server
make clean
make deps
make build
```

## 📚 常用操作

### 创建新的数据库迁移

```bash
cd server/migrations
# 创建迁移文件（手动）
touch 000017_your_migration.up.sql
touch 000017_your_migration.down.sql
```

### 生成密码哈希

```bash
cd server
./bin/luckdb util generate-password --password your-password
```

### 查看配置

```bash
cd server
./bin/luckdb util debug-config
```

### 启动 MCP 服务器

```bash
# HTTP 模式
cd server
./bin/luckdb mcp serve --transport=http

# stdio 模式（用于 AI 集成）
./bin/luckdb mcp serve --transport=stdio
```

## 🔐 默认凭据

### 开发数据库

```yaml
Host: localhost
Port: 5432
Database: luckdb_dev
Username: luckdb
Password: luckdb
```

### Redis

```yaml
Host: localhost
Port: 6379
Password: (空)
Database: 0
```

## 📖 下一步

1. **阅读文档**
   - [架构设计](./docs/architecture/overview.md)
   - [开发指南](./docs/development/getting-started.md)
   - [API 文档](./docs/api/rest-api.md)

2. **熟悉代码**
   - 前端：查看 `apps/web/src/app/page.tsx`
   - 后端：查看 `server/cmd/luckdb/main.go`

3. **创建第一个功能**
   - 查看 [贡献指南](./CONTRIBUTING.md)
   - 遵循项目编码规范

4. **加入社区**
   - GitHub：https://github.com/easyspace-ai/luckdb
   - Issues：提交问题和建议
   - Discussions：参与讨论

## 🎉 开始开发

现在你已经准备好了！运行：

```bash
pnpm dev:all
```

然后访问 http://localhost:3000 开始探索 LuckDB！

## 💡 提示

- 使用 `make help` 查看所有后端命令
- 前端支持热重载，修改代码后自动刷新
- 后端使用 Air 实现热重载（如果配置）
- 查看日志文件：`server/logs/app.log`

## 📞 获取帮助

- 查看 [FAQ](./docs/development/faq.md)
- 搜索现有 [Issues](https://github.com/easyspace-ai/luckdb/issues)
- 创建新 Issue
- 加入 [Discussions](https://github.com/easyspace-ai/luckdb/discussions)

---

**祝你开发愉快！** 🚀

如有问题，随时查看项目文档或提交 Issue。

