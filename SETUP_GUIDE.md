# LuckDB 项目设置指南

恭喜！LuckDB 的基础项目结构已经创建完成。本指南将帮助你完成最后的设置步骤。

## 📁 项目结构

```
luckdb/
├── .github/              ✅ GitHub 配置和 CI/CD
├── .vscode/              ✅ VSCode 配置
├── apps/                 ✅ 应用层
│   └── web/             ✅ Next.js Web 应用
├── packages/            ✅ 共享包
│   ├── ui/              ✅ UI 组件库
│   ├── sdk/             ✅ API 客户端
│   ├── core/            ✅ 核心业务逻辑
│   └── utils/           ✅ 工具函数
├── server/              ⏳ 后端服务 (需要从 EasyDB 迁移)
├── docker/              ✅ Docker 配置
├── scripts/             ✅ 实用脚本
└── docs/                ✅ 项目文档
```

## 🎯 后续步骤

### 步骤 1: 迁移后端代码

我们已经为你准备了自动迁移脚本。运行以下命令：

```bash
# 从 EasyDB 迁移后端代码
./scripts/migrate-from-easydb.sh /Users/leven/space/easy/easydb

# 这个脚本会:
# - 复制 server 目录
# - 更新 Go 模块路径
# - 更新 import 语句
# - 更新品牌名称
# - 重命名二进制文件
```

**手动迁移步骤**（如果脚本失败）：

```bash
# 1. 复制后端代码
cp -r /Users/leven/space/easy/easydb/server /Users/leven/space/easy/luckdb/

# 2. 更新 Go 模块
cd /Users/leven/space/easy/luckdb/server
vim go.mod  # 修改 module 名称

# 3. 更新 import 路径
# 将所有 "easydb/" 替换为你的新模块路径

# 4. 更新品牌
# 将配置文件中的 EasyDB 替换为 LuckDB
```

### 步骤 2: 创建后端 Makefile

在 `server/` 目录创建 `Makefile`:

```makefile
.PHONY: help dev build test migrate clean

BINARY_NAME=luckdb
GO_FILES=$(shell find . -name '*.go' -type f)

help:
	@echo "LuckDB Server Commands:"
	@echo "  make dev       - 启动开发服务器"
	@echo "  make build     - 构建生产版本"
	@echo "  make test      - 运行测试"
	@echo "  make migrate   - 运行数据库迁移"
	@echo "  make clean     - 清理构建文件"

dev:
	@go run cmd/luckdb/main.go serve

build:
	@echo "Building $(BINARY_NAME)..."
	@CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o bin/$(BINARY_NAME) ./cmd/luckdb
	@echo "Build complete: bin/$(BINARY_NAME)"

test:
	@go test -v -race -coverprofile=coverage.out ./...

test-coverage: test
	@go tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report: coverage.html"

migrate:
	@go run cmd/luckdb/main.go migrate

migrate-down:
	@go run cmd/luckdb/main.go migrate-down

lint:
	@golangci-lint run

clean:
	@rm -rf bin/
	@rm -f coverage.out coverage.html
	@rm -f $(BINARY_NAME)
	@echo "Clean complete"

.PHONY: install-tools
install-tools:
	@go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
```

### 步骤 3: 安装依赖

```bash
# 回到项目根目录
cd /Users/leven/space/easy/luckdb

# 安装前端依赖
pnpm install

# 安装后端依赖
cd server
go mod tidy
go mod download
```

### 步骤 4: 配置环境

#### 4.1 后端配置

创建 `server/config.yaml`:

```yaml
server:
  port: 8080
  mode: development  # development, production
  
database:
  host: localhost
  port: 5432
  name: luckdb_dev
  user: luckdb
  password: luckdb
  
redis:
  host: localhost
  port: 6379
  password: ""
  db: 0
  
jwt:
  secret: "your-secret-key-change-in-production"
  expires: 168h  # 7 days
  
log:
  level: debug  # debug, info, warn, error
  output: stdout  # stdout, file
  file: logs/app.log
```

#### 4.2 前端配置

创建 `apps/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

### 步骤 5: 启动数据库

```bash
# 启动 PostgreSQL 和 Redis
docker-compose -f docker/docker-compose.dev.yml up -d

# 等待数据库就绪
sleep 5

# 运行迁移
cd server
make migrate
```

### 步骤 6: 启动开发服务器

```bash
# 方式1: 启动所有服务
cd /Users/leven/space/easy/luckdb
pnpm dev:all

# 方式2: 分别启动
# 终端 1 - 后端
cd server
make dev

# 终端 2 - 前端
cd ..
pnpm dev:web
```

访问：
- **前端**: http://localhost:3000
- **后端 API**: http://localhost:8080

### 步骤 7: 验证安装

```bash
# 测试前端
pnpm test

# 测试后端
cd server
make test
```

## 🔧 开发工具设置

### VSCode

项目已包含 VSCode 配置（`.vscode/`），打开项目时会自动应用。

推荐安装的扩展：
- ESLint
- Prettier
- Go
- Tailwind CSS IntelliSense

### Git Hooks

```bash
# 安装 Husky
pnpm prepare

# 现在每次提交时会自动:
# - 格式化代码
# - 运行 lint
# - 验证提交信息格式
```

## 📚 重要文档

- [README.md](./README.md) - 项目概述
- [快速开始](./docs/development/getting-started.md) - 详细开发指南
- [架构设计](./docs/architecture/overview.md) - 系统架构
- [贡献指南](./CONTRIBUTING.md) - 如何贡献代码

## 🚀 下一步

### 1. 定制化品牌

- 更新 logo 和图标
- 修改主题颜色
- 更新文档中的项目信息

### 2. 配置 GitHub

```bash
# 初始化 Git
git init
git add .
git commit -m "feat: initial LuckDB project structure"

# 添加远程仓库
git remote add origin https://github.com/your-org/luckdb.git
git push -u origin main
```

### 3. 设置 CI/CD

GitHub Actions 配置已就绪（`.github/workflows/ci.yml`），推送代码后会自动运行：
- 代码检查
- 测试
- 构建

### 4. 部署

#### 开发环境
```bash
docker-compose -f docker/docker-compose.dev.yml up -d
```

#### 生产环境
```bash
# 构建镜像
docker-compose -f docker/docker-compose.yml build

# 启动服务
docker-compose -f docker/docker-compose.yml up -d
```

## ⚠️ 注意事项

### 迁移检查清单

- [ ] 后端代码已复制到 `server/` 目录
- [ ] Go 模块路径已更新
- [ ] Import 路径已更新
- [ ] 配置文件已更新（EasyDB → LuckDB）
- [ ] 数据库迁移文件已复制
- [ ] 测试通过
- [ ] 品牌信息已更新

### 常见问题

**Q: 端口被占用怎么办？**

```bash
# 查找并杀死占用端口的进程
lsof -ti:3000 | xargs kill -9
lsof -ti:8080 | xargs kill -9
```

**Q: 数据库连接失败？**

1. 检查 Docker 容器是否运行：
```bash
docker-compose -f docker/docker-compose.dev.yml ps
```

2. 检查配置文件中的数据库连接信息

**Q: 前端包之间的依赖问题？**

```bash
# 清理并重新安装
pnpm clean
rm -rf node_modules
pnpm install
```

## 🎉 完成！

现在你已经有了一个完整的 LuckDB 开发环境！

开始开发：
```bash
pnpm dev:all
```

查看项目：
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080

## 📞 获取帮助

- 查看 [文档](./docs/)
- 提交 [Issue](https://github.com/your-org/luckdb/issues)
- 参与 [讨论](https://github.com/your-org/luckdb/discussions)

---

祝你开发愉快！ 🚀

