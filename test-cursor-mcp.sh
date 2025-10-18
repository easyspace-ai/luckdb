#!/bin/bash

# 测试 Cursor MCP 配置
echo "🧪 测试 Cursor MCP 配置..."

# 检查必要文件
echo "📁 检查配置文件..."

if [ -f ".cursor/mcp.json" ]; then
    echo "✅ .cursor/mcp.json 存在"
else
    echo "❌ .cursor/mcp.json 不存在"
    exit 1
fi

if [ -f "server/bin/mcp-server" ]; then
    echo "✅ MCP 服务器二进制文件存在"
else
    echo "❌ MCP 服务器二进制文件不存在，正在构建..."
    cd server
    go build -o bin/mcp-server ./cmd/mcp-server
    if [ $? -eq 0 ]; then
        echo "✅ MCP 服务器构建成功"
        cd ..
    else
        echo "❌ MCP 服务器构建失败"
        exit 1
    fi
fi

if [ -f "server/config.yaml" ]; then
    echo "✅ 服务器配置文件存在"
else
    echo "❌ 服务器配置文件不存在"
    exit 1
fi

if [ -f "mcp-manifest.json" ]; then
    echo "✅ MCP 清单文件存在"
else
    echo "❌ MCP 清单文件不存在"
    exit 1
fi

# 测试 MCP 服务器启动
echo "🚀 测试 MCP 服务器启动..."

# 测试 HTTP 模式
echo "📡 测试 HTTP 模式..."
timeout 5s ./server/bin/mcp-server > /dev/null 2>&1 &
HTTP_PID=$!
sleep 2

if kill -0 $HTTP_PID 2>/dev/null; then
    echo "✅ HTTP 模式启动成功"
    kill $HTTP_PID 2>/dev/null
else
    echo "❌ HTTP 模式启动失败"
fi

# 测试 stdio 模式
echo "📡 测试 stdio 模式..."
timeout 3s ./server/bin/mcp-server --stdio > /dev/null 2>&1 &
STDIO_PID=$!
sleep 1

if kill -0 $STDIO_PID 2>/dev/null; then
    echo "✅ stdio 模式启动成功"
    kill $STDIO_PID 2>/dev/null
else
    echo "❌ stdio 模式启动失败"
fi

# 显示配置信息
echo "📋 配置信息:"
echo "   - 项目根目录: $(pwd)"
echo "   - MCP 服务器: ./server/bin/mcp-server"
echo "   - 配置文件: .cursor/mcp.json"
echo "   - 服务器配置: server/config.yaml"

echo ""
echo "🎉 Cursor MCP 配置测试完成！"
echo ""
echo "📝 下一步:"
echo "   1. 重启 Cursor 编辑器"
echo "   2. 在 Cursor 中应该能看到 LuckDB MCP 服务器"
echo "   3. 开始使用 MCP 工具进行数据操作"
echo ""
echo "📖 详细说明请查看: CURSOR_MCP_SETUP.md"

