# 贡献指南

感谢你考虑为 LuckDB 做出贡献！

## 行为准则

请阅读并遵守我们的 [行为准则](CODE_OF_CONDUCT.md)。

## 如何贡献

### 报告 Bug

如果你发现了 bug，请创建一个 Issue，包括：

- 清晰的标题和描述
- 重现步骤
- 预期行为和实际行为
- 截图（如果适用）
- 环境信息（操作系统、浏览器、版本等）

### 提出新功能

在提出新功能之前：

1. 检查是否已有类似的 Issue
2. 清晰描述功能的用途和价值
3. 提供使用场景和示例

### 提交 Pull Request

#### 开发流程

1. **Fork 项目**
   ```bash
   # Fork 后克隆你的仓库
   git clone https://github.com/your-username/luckdb.git
   cd luckdb
   ```

2. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **安装依赖**
   ```bash
   pnpm install
   cd server && go mod download
   ```

4. **开发和测试**
   ```bash
   # 启动开发服务器
   pnpm dev:all
   
   # 运行测试
   pnpm test
   pnpm test:server
   ```

5. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

6. **推送并创建 PR**
   ```bash
   git push origin feature/your-feature-name
   ```

#### PR 要求

- ✅ 遵循项目的编码规范
- ✅ 包含必要的测试
- ✅ 更新相关文档
- ✅ 通过所有 CI 检查
- ✅ 有清晰的提交信息
- ✅ PR 描述清晰，说明改动的目的和实现方式

## 编码规范

### Git 提交信息

我们使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type:**
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具链相关
- `ci`: CI 配置

**示例:**
```
feat(table): add column resizing feature

- Add resize handler to column headers
- Implement drag to resize
- Persist column widths to local storage

Closes #123
```

### TypeScript/JavaScript

```typescript
// ✅ 好的代码
export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  // Implementation
}

// ❌ 避免
export function formatDate(date, format) {
  // Implementation
}
```

- 使用 TypeScript 类型
- 使用函数式编程
- 避免使用 `any`
- 导出的函数必须有 JSDoc

### Go

```go
// ✅ 好的代码
func (h *TableHandler) CreateTable(c *gin.Context) {
    var req dto.CreateTableRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        response.Error(c, errors.ErrBadRequest.WithDetails(err.Error()))
        return
    }
    
    table, err := h.service.CreateTable(c.Request.Context(), req)
    if err != nil {
        response.Error(c, err)
        return
    }
    
    response.Success(c, table, "创建成功")
}
```

- 遵循 [Effective Go](https://golang.org/doc/effective_go)
- 使用项目定义的错误类型
- Handler 必须使用 `response.Success` 和 `response.Error`
- 所有导出的函数必须有注释

### 命名规范

#### 文件命名
- TypeScript/JavaScript: `camelCase.ts`, `PascalCase.tsx` (组件)
- Go: `snake_case.go`

#### 变量命名
- TypeScript/JavaScript: `camelCase`
- Go: `camelCase` (unexported), `PascalCase` (exported)

#### 组件命名
```typescript
// ✅ 好的命名
export function TableView() {}
export const Button: React.FC<ButtonProps> = () => {}

// ❌ 避免
export function table_view() {}
export const button = () => {}
```

## 测试

### 前端测试

```bash
# 运行所有测试
pnpm test

# 运行特定包的测试
pnpm --filter @luckdb/ui test

# 测试覆盖率
pnpm test -- --coverage
```

### 后端测试

```bash
cd server

# 运行所有测试
make test

# 测试覆盖率
make test-coverage

# 运行特定测试
go test ./internal/application/...
```

### 测试要求

- 新功能必须包含单元测试
- 测试覆盖率要求：
  - Service 层：≥ 80%
  - Repository 层：≥ 70%
  - Handler 层：≥ 60%
- 关键功能需要集成测试

## 文档

### 更新文档

当你的 PR 包含以下内容时，需要更新文档：

- 新的 API 端点
- 配置选项变更
- 新功能添加
- 破坏性变更

### 文档位置

- API 文档：`docs/api/`
- 架构文档：`docs/architecture/`
- 开发文档：`docs/development/`
- 用户文档：`docs/user-guide/`

## 发布流程

（仅限维护者）

1. 更新版本号
```bash
pnpm changeset
pnpm version-packages
```

2. 更新 CHANGELOG.md

3. 创建 release tag
```bash
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
```

4. GitHub Actions 会自动构建和发布

## 许可证

通过贡献代码，你同意你的贡献将在 [MIT License](LICENSE) 下许可。

## 问题？

如有任何问题，请：

- 查看 [开发文档](docs/development/getting-started.md)
- 查看现有的 [Issues](https://github.com/your-org/luckdb/issues)
- 在 [Discussions](https://github.com/your-org/luckdb/discussions) 中提问

---

再次感谢你的贡献！ 🎉

