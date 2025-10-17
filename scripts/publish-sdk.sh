#!/bin/bash

# LuckDB SDK 发布脚本
# 自动化发布流程，包含检查、构建、测试和发布

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 获取当前版本
get_version() {
    node -p "require('./packages/sdk/package.json').version"
}

# 主函数
main() {
    print_info "开始 @luckdb/sdk 发布流程..."
    echo ""

    # 1. 检查是否在项目根目录
    if [ ! -f "package.json" ] || [ ! -d "packages/sdk" ]; then
        print_error "请在项目根目录运行此脚本"
        exit 1
    fi

    # 2. 检查 npm registry（必须使用官方源）
    print_info "检查 npm registry..."
    CURRENT_REGISTRY=$(npm config get registry)
    OFFICIAL_REGISTRY="https://registry.npmjs.org/"
    
    if [[ "$CURRENT_REGISTRY" != "$OFFICIAL_REGISTRY" ]]; then
        print_warning "当前使用的不是官方源"
        print_info "当前源: $CURRENT_REGISTRY"
        print_info "官方源: $OFFICIAL_REGISTRY"
        read -p "是否切换到官方源？(Y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            npm config set registry $OFFICIAL_REGISTRY
            print_success "已切换到官方源"
        else
            print_warning "继续使用当前源，可能导致发布失败"
        fi
    else
        print_success "使用官方源: $OFFICIAL_REGISTRY"
    fi
    echo ""

    # 3. 检查是否已登录 npm
    print_info "检查 npm 登录状态..."
    if ! npm whoami &> /dev/null; then
        print_error "未登录 npm，请先运行: npm login"
        exit 1
    fi
    print_success "npm 已登录: $(npm whoami)"
    echo ""

    # 4. 检查 Git 状态
    print_info "检查 Git 状态..."
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "工作区有未提交的更改"
        read -p "是否继续？(y/N) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_error "发布已取消"
            exit 1
        fi
    else
        print_success "工作区干净"
    fi
    echo ""

    # 5. 进入 SDK 目录
    cd packages/sdk
    print_info "当前目录: $(pwd)"
    echo ""

    # 6. 显示当前版本
    CURRENT_VERSION=$(get_version)
    print_info "当前版本: v${CURRENT_VERSION}"
    echo ""

    # 7. 询问新版本号
    print_info "请选择版本更新类型:"
    echo "  1) patch   - Bug 修复 (${CURRENT_VERSION} -> $(npm version patch --no-git-tag-version && npm version patch --preid --no-git-tag-version 2>/dev/null || echo 'N/A'))"
    echo "  2) minor   - 新功能，向后兼容"
    echo "  3) major   - 破坏性变更"
    echo "  4) custom  - 自定义版本号"
    echo "  5) skip    - 跳过版本更新"
    read -p "请选择 (1-5): " -n 1 -r VERSION_TYPE
    echo ""

    case $VERSION_TYPE in
        1)
            NEW_VERSION=$(npm version patch --no-git-tag-version 2>&1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sed 's/v//')
            ;;
        2)
            NEW_VERSION=$(npm version minor --no-git-tag-version 2>&1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sed 's/v//')
            ;;
        3)
            NEW_VERSION=$(npm version major --no-git-tag-version 2>&1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+' | sed 's/v//')
            ;;
        4)
            read -p "请输入新版本号: " NEW_VERSION
            npm version $NEW_VERSION --no-git-tag-version
            ;;
        5)
            NEW_VERSION=$CURRENT_VERSION
            print_info "跳过版本更新，使用当前版本: v${NEW_VERSION}"
            ;;
        *)
            print_error "无效选择"
            exit 1
            ;;
    esac

    print_success "版本已更新: v${NEW_VERSION}"
    echo ""

    # 8. 运行 linter
    print_info "运行 linter..."
    if pnpm lint; then
        print_success "Linter 检查通过"
    else
        print_warning "Linter 检查失败，但继续..."
    fi
    echo ""

    # 9. 构建项目
    print_info "构建项目..."
    if pnpm build; then
        print_success "构建成功"
    else
        print_error "构建失败"
        exit 1
    fi
    echo ""

    # 10. 预览发布内容
    print_info "预览发布内容..."
    npm pack --dry-run
    echo ""

    # 11. 确认发布
    print_warning "即将发布 @luckdb/sdk@${NEW_VERSION}"
    read -p "确认发布？(y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "发布已取消"
        # 恢复版本号
        npm version $CURRENT_VERSION --no-git-tag-version --allow-same-version
        exit 1
    fi

    # 12. 发布到 npm
    print_info "发布到 npm..."
    if npm publish --access public; then
        print_success "发布成功！"
    else
        print_error "发布失败"
        # 恢复版本号
        npm version $CURRENT_VERSION --no-git-tag-version --allow-same-version
        exit 1
    fi
    echo ""

    # 13. 创建 Git 标签
    cd ../..
    print_info "创建 Git 标签..."
    git add packages/sdk/package.json
    git commit -m "chore(sdk): release v${NEW_VERSION}"
    git tag "sdk-v${NEW_VERSION}"
    print_success "Git 标签已创建: sdk-v${NEW_VERSION}"
    echo ""

    # 14. 推送到远程
    print_info "是否推送到远程仓库？"
    read -p "推送 Git 提交和标签？(y/N) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push && git push --tags
        print_success "已推送到远程仓库"
    else
        print_warning "未推送到远程，请手动执行:"
        echo "  git push"
        echo "  git push --tags"
    fi
    echo ""

    # 15. 验证发布
    print_info "验证发布..."
    sleep 3  # 等待 npm 更新
    if npm view @luckdb/sdk@${NEW_VERSION} version &> /dev/null; then
        print_success "验证成功：包已在 npm 上可用"
        print_info "查看包信息: https://www.npmjs.com/package/@luckdb/sdk"
    else
        print_warning "验证失败：可能需要等待 npm 索引更新"
    fi
    echo ""

    # 16. 完成
    print_success "🎉 发布完成！"
    echo ""
    print_info "安装新版本:"
    echo "  npm install @luckdb/sdk@${NEW_VERSION}"
    echo ""
    print_info "或更新到最新版本:"
    echo "  npm install @luckdb/sdk@latest"
}

# 运行主函数
main "$@"

