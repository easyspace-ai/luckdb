# Git 配置和 SSH 设置指南

## 🚀 快速开始（推荐）

### 使用自动配置脚本

```bash
cd /Users/leven/space/easy/luckdb
./scripts/setup-git.sh
```

这个脚本会自动完成所有配置！

## 📋 手动配置步骤

如果你想手动配置，请按照以下步骤操作：

### 1. 配置 Git 用户信息

```bash
# 配置用户名
git config --global user.name "你的用户名"

# 配置邮箱
git config --global user.email "your.email@example.com"

# 验证配置
git config --global user.name
git config --global user.email
```

### 2. 生成 SSH 密钥

```bash
# 使用 ed25519 算法生成密钥（推荐）
ssh-keygen -t ed25519 -C "your.email@example.com"

# 或使用传统的 RSA 算法
# ssh-keygen -t rsa -b 4096 -C "your.email@example.com"

# 按提示操作：
# - 保存位置：直接回车（使用默认路径 ~/.ssh/id_ed25519）
# - 密码：直接回车（不设置密码，实现无密码推送）
```

### 3. 启动 ssh-agent 并添加密钥

```bash
# 启动 ssh-agent
eval "$(ssh-agent -s)"

# 添加 SSH 私钥
ssh-add ~/.ssh/id_ed25519

# macOS 用户可以添加到钥匙串（可选）
ssh-add --apple-use-keychain ~/.ssh/id_ed25519
```

### 4. 配置 SSH config（macOS 推荐）

创建或编辑 `~/.ssh/config` 文件：

```bash
nano ~/.ssh/config
```

添加以下内容：

```
Host github.com
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile ~/.ssh/id_ed25519
```

### 5. 复制公钥到 GitHub

```bash
# 显示公钥内容
cat ~/.ssh/id_ed25519.pub

# macOS 用户可以直接复制到剪贴板
pbcopy < ~/.ssh/id_ed25519.pub

# Linux 用户
xclip -selection clipboard < ~/.ssh/id_ed25519.pub
```

然后：

1. 访问 https://github.com/settings/keys
2. 点击 **"New SSH key"**
3. **Title**: 输入描述性名称，如 "LuckDB Development"
4. **Key**: 粘贴刚才复制的公钥
5. 点击 **"Add SSH key"**

### 6. 测试 SSH 连接

```bash
ssh -T git@github.com
```

如果看到类似以下消息，说明配置成功：

```
Hi username! You've successfully authenticated, but GitHub does not provide shell access.
```

### 7. 更新项目远程仓库地址

#### 方法 1：如果还没有初始化 Git

```bash
cd /Users/leven/space/easy/luckdb
git init
git remote add origin git@github.com:easyspace-ai/luckdb.git
```

#### 方法 2：如果已有 HTTPS 地址

```bash
# 查看当前远程地址
git remote -v

# 更新为 SSH 地址
git remote set-url origin git@github.com:easyspace-ai/luckdb.git

# 验证更新
git remote -v
```

### 8. 测试推送

```bash
# 添加所有文件
git add .

# 提交
git commit -m "feat: initial LuckDB project setup"

# 推送到 GitHub（第一次需要设置上游分支）
git branch -M main
git push -u origin main

# 之后就可以直接推送了
git push
```

## 🔐 SSH vs HTTPS 对比

| 特性 | SSH | HTTPS |
|------|-----|-------|
| 配置复杂度 | 稍复杂 | 简单 |
| 安全性 | 更高 | 较高 |
| 无密码推送 | ✅ 是 | ❌ 需要 token 或密码 |
| 速度 | 稍快 | 正常 |
| 防火墙友好 | 可能被阻挡 | 更友好 |
| 推荐场景 | 日常开发 | CI/CD、临时使用 |

## 📝 常用 Git 命令

### 日常开发

```bash
# 查看状态
git status

# 查看修改
git diff

# 添加文件
git add .                    # 添加所有文件
git add path/to/file        # 添加特定文件

# 提交
git commit -m "feat: your message"

# 推送
git push                    # 推送当前分支
git push origin main        # 推送到 main 分支

# 拉取
git pull                    # 拉取并合并
git fetch                   # 只拉取，不合并
```

### 分支管理

```bash
# 创建分支
git branch feature-name

# 切换分支
git checkout feature-name

# 创建并切换分支
git checkout -b feature-name

# 查看所有分支
git branch -a

# 删除分支
git branch -d feature-name

# 合并分支
git merge feature-name
```

### 查看历史

```bash
# 查看提交历史
git log
git log --oneline          # 简洁模式
git log --graph --all      # 图形化显示

# 查看某个文件的历史
git log path/to/file
```

## 🛠️ 故障排除

### SSH 连接失败

#### 问题 1: Permission denied (publickey)

```bash
# 检查 ssh-agent 是否运行
ssh-add -l

# 如果提示 "Could not open a connection to your authentication agent"
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519

# 验证密钥是否正确添加
ssh-add -l
```

#### 问题 2: 密钥权限问题

```bash
# 修正密钥文件权限
chmod 700 ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 644 ~/.ssh/id_ed25519.pub
```

#### 问题 3: Host key verification failed

```bash
# 清除已知主机记录
ssh-keygen -R github.com

# 重新连接
ssh -T git@github.com
```

### Git 推送问题

#### 问题 1: Updates were rejected

```bash
# 拉取远程更改
git pull origin main --rebase

# 或使用 merge
git pull origin main

# 然后再推送
git push origin main
```

#### 问题 2: Remote origin already exists

```bash
# 删除现有远程
git remote remove origin

# 重新添加
git remote add origin git@github.com:easyspace-ai/luckdb.git
```

## 🔄 切换账号

### 临时使用不同账号（针对单个项目）

```bash
cd /Users/leven/space/easy/luckdb

# 设置项目级别的用户信息（不影响全局）
git config user.name "项目用户名"
git config user.email "project@example.com"

# 验证
git config user.name
git config user.email
```

### 多账号管理（使用不同的 SSH 密钥）

编辑 `~/.ssh/config`：

```
# 工作账号
Host github-work
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_work

# 个人账号
Host github-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_personal
```

然后使用不同的 Host：

```bash
# 工作项目
git remote set-url origin git@github-work:company/repo.git

# 个人项目
git remote set-url origin git@github-personal:username/repo.git
```

## 📚 推荐的 Git 配置

```bash
# 设置默认编辑器
git config --global core.editor "code --wait"  # VS Code
# git config --global core.editor "nano"       # Nano
# git config --global core.editor "vim"        # Vim

# 设置默认分支名
git config --global init.defaultBranch main

# 启用颜色输出
git config --global color.ui auto

# 设置推送行为
git config --global push.default simple

# 启用自动换行转换
git config --global core.autocrlf input  # macOS/Linux
# git config --global core.autocrlf true # Windows

# 忽略文件权限变化
git config --global core.filemode false

# 设置合并工具
git config --global merge.tool vimdiff

# 查看所有配置
git config --global --list
```

## 🎯 Git 提交规范

遵循 [Conventional Commits](https://www.conventionalcommits.org/)：

```bash
# 格式
<type>(<scope>): <subject>

# 类型
feat:     新功能
fix:      Bug 修复
docs:     文档更新
style:    代码格式（不影响功能）
refactor: 重构
perf:     性能优化
test:     测试相关
chore:    构建/工具链

# 示例
git commit -m "feat(auth): add login functionality"
git commit -m "fix(api): resolve database connection issue"
git commit -m "docs: update README with setup instructions"
```

## 🔗 有用的链接

- [GitHub SSH 文档](https://docs.github.com/en/authentication/connecting-to-github-with-ssh)
- [Git 官方文档](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [LuckDB 贡献指南](./CONTRIBUTING.md)

---

**提示**：建议使用自动配置脚本 `./scripts/setup-git.sh` 来快速完成所有配置！

