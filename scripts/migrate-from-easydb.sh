#!/bin/bash

# LuckDB 迁移脚本 - 从 EasyDB 迁移到 LuckDB
# 使用方法: ./scripts/migrate-from-easydb.sh /path/to/easydb

set -e

EASYDB_PATH=$1
LUCKDB_PATH="$(pwd)"

if [ -z "$EASYDB_PATH" ]; then
    echo "❌ 请提供 EasyDB 项目路径"
    echo "用法: ./scripts/migrate-from-easydb.sh /path/to/easydb"
    exit 1
fi

if [ ! -d "$EASYDB_PATH" ]; then
    echo "❌ EasyDB 路径不存在: $EASYDB_PATH"
    exit 1
fi

echo "🚀 开始迁移 EasyDB 到 LuckDB..."
echo "EasyDB 路径: $EASYDB_PATH"
echo "LuckDB 路径: $LUCKDB_PATH"
echo ""

# 1. 迁移后端代码
echo "📦 迁移后端代码..."
if [ -d "$EASYDB_PATH/server" ]; then
    # 创建备份
    if [ -d "$LUCKDB_PATH/server" ]; then
        echo "⚠️  LuckDB server 目录已存在，创建备份..."
        mv "$LUCKDB_PATH/server" "$LUCKDB_PATH/server.backup.$(date +%Y%m%d%H%M%S)"
    fi
    
    # 复制服务器代码
    cp -r "$EASYDB_PATH/server" "$LUCKDB_PATH/"
    echo "✅ 后端代码已复制"
    
    # 更新 go.mod
    echo "🔄 更新 go.mod..."
    cd "$LUCKDB_PATH/server"
    sed -i.bak 's/module easydb/module github.com\/your-org\/luckdb\/server/g' go.mod
    rm go.mod.bak
    
    # 更新 import 路径
    echo "🔄 更新 import 路径..."
    find . -type f -name "*.go" -exec sed -i.bak 's/"easydb\//"github.com\/your-org\/luckdb\/server\//g' {} \;
    find . -type f -name "*.bak" -delete
    
    # 重命名二进制文件
    if [ -f "easydb" ]; then
        mv easydb luckdb
    fi
    
    cd "$LUCKDB_PATH"
    echo "✅ 后端代码迁移完成"
else
    echo "⚠️  未找到 EasyDB server 目录"
fi

# 2. 品牌更新
echo ""
echo "🎨 更新品牌信息..."
cd "$LUCKDB_PATH/server"

# 更新配置文件
if [ -f "config.yaml" ]; then
    sed -i.bak 's/EasyDB/LuckDB/g' config.yaml
    sed -i.bak 's/easydb/luckdb/g' config.yaml
    rm config.yaml.bak
fi

# 更新 Makefile
if [ -f "Makefile" ]; then
    sed -i.bak 's/easydb/luckdb/g' Makefile
    rm Makefile.bak
fi

cd "$LUCKDB_PATH"
echo "✅ 品牌信息更新完成"

# 3. 清理临时文件
echo ""
echo "🧹 清理临时文件..."
cd "$LUCKDB_PATH/server"
rm -f *.log
rm -rf logs/*.log
rm -f easydb
echo "✅ 清理完成"

# 4. 重新构建
echo ""
echo "🔨 重新构建项目..."
cd "$LUCKDB_PATH/server"
go mod tidy
make build || echo "⚠️  构建失败，请检查错误并手动修复"

cd "$LUCKDB_PATH"

echo ""
echo "✅ 迁移完成！"
echo ""
echo "后续步骤:"
echo "1. 检查 server/go.mod 中的模块路径是否正确"
echo "2. 运行测试: cd server && make test"
echo "3. 检查配置文件: server/config.yaml"
echo "4. 启动服务: pnpm dev:all"
echo ""
echo "⚠️  注意: 如果有数据库数据需要迁移，请手动处理"

