#!/bin/bash

# 前端打包和 Go 服务端编译脚本
# 这个脚本会：
# 1. 打包前端应用 (manage)
# 2. 复制打包文件到 server/internal/interfaces/http/web
# 3. 编译 Go 服务端（嵌入前端文件）

set -e  # 遇到错误立即退出

# 颜色输出
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  LuckDB 全栈构建脚本${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 获取项目根目录
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo -e "${GREEN}项目根目录:${NC} $PROJECT_ROOT"
echo ""

# 1. 打包前端应用
echo -e "${BLUE}[1/3] 打包前端应用 (manage)...${NC}"
cd "$PROJECT_ROOT/apps/manage"

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}首次构建，安装依赖...${NC}"
    npm install
fi

echo -e "${GREEN}开始打包...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}错误: 前端打包失败，dist 目录不存在${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 前端打包完成${NC}"
echo ""

# 2. 复制前端文件到 Go 项目
echo -e "${BLUE}[2/3] 复制前端文件到 Go 项目...${NC}"
WEB_DIR="$PROJECT_ROOT/server/internal/interfaces/http/web"

# 删除旧文件
if [ -d "$WEB_DIR" ]; then
    echo -e "${GREEN}清理旧文件...${NC}"
    rm -rf "$WEB_DIR"
fi

# 创建目录并复制
mkdir -p "$WEB_DIR"
cp -r "$PROJECT_ROOT/apps/manage/dist/"* "$WEB_DIR/"

# 检查文件数量
FILE_COUNT=$(find "$WEB_DIR" -type f | wc -l)
echo -e "${GREEN}✓ 已复制 $FILE_COUNT 个文件${NC}"
echo ""

# 3. 编译 Go 服务端
echo -e "${BLUE}[3/3] 编译 Go 服务端...${NC}"
cd "$PROJECT_ROOT/server"

# 清理旧的二进制文件
if [ -f "bin/luckdb" ]; then
    rm bin/luckdb
fi

# 获取版本信息
VERSION=$(git describe --tags --always --dirty 2>/dev/null || echo "dev")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(date -u '+%Y-%m-%d_%H:%M:%S')

echo -e "${GREEN}版本: ${NC}$VERSION"
echo -e "${GREEN}提交: ${NC}$COMMIT"
echo -e "${GREEN}时间: ${NC}$BUILD_TIME"
echo ""

# 编译（带版本信息）
echo -e "${GREEN}编译中...${NC}"
go build -ldflags "\
    -X main.Version=$VERSION \
    -X main.GitCommit=$COMMIT \
    -X main.BuildTime=$BUILD_TIME" \
    -o bin/luckdb \
    ./cmd/luckdb

if [ ! -f "bin/luckdb" ]; then
    echo -e "${RED}错误: Go 编译失败${NC}"
    exit 1
fi

# 显示二进制文件信息
BINARY_SIZE=$(du -h bin/luckdb | cut -f1)
echo -e "${GREEN}✓ 编译完成，二进制文件大小: ${NC}$BINARY_SIZE"
echo ""

# 完成
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✓ 构建完成！${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${GREEN}运行服务器:${NC}"
echo -e "  cd server && ./bin/luckdb serve"
echo ""
echo -e "${GREEN}访问应用:${NC}"
echo -e "  http://localhost:8080"
echo ""

