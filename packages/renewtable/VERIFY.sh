#!/bin/bash

# RenewTable 验证脚本

echo "🔍 RenewTable 项目验证..."
echo ""

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查函数
check() {
  if [ $1 -eq 0 ]; then
    echo -e "${GREEN}✅ $2${NC}"
    return 0
  else
    echo -e "${RED}❌ $2${NC}"
    return 1
  fi
}

# 1. 检查项目结构
echo "📁 检查项目结构..."
[ -d "table-core" ] && [ -d "react-table" ] && [ -d "demo" ]
check $? "项目目录结构"

# 2. 检查构建产物
echo ""
echo "📦 检查构建产物..."
[ -f "table-core/dist/index.js" ]
check $? "table-core 构建产物"

[ -f "react-table/dist/index.js" ]
check $? "react-table 构建产物"

# 3. 检查类型定义
echo ""
echo "📝 检查类型定义..."
[ -f "table-core/dist/index.d.ts" ]
check $? "table-core 类型定义"

[ -f "react-table/dist/index.d.ts" ]
check $? "react-table 类型定义"

# 4. 检查测试文件
echo ""
echo "🧪 检查测试文件..."
[ -f "table-core/src/core/__tests__/coordinate.test.ts" ]
check $? "测试文件存在"

# 5. 检查配置文件
echo ""
echo "⚙️ 检查配置文件..."
[ -f "pnpm-workspace.yaml" ]
check $? "pnpm workspace"

[ -f "table-core/tsconfig.json" ]
check $? "TypeScript 配置"

# 6. 检查演示页面
echo ""
echo "🌐 检查演示页面..."
if curl -s http://localhost:3100 > /dev/null 2>&1; then
  check 0 "演示页面运行中 (端口 3100)"
else
  check 1 "演示页面未运行 (可能需要启动)"
fi

# 7. 统计代码
echo ""
echo "📊 代码统计..."
FILE_COUNT=$(find . \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | grep -v "doc/table" | wc -l | tr -d ' ')
echo "文件数: $FILE_COUNT"

LINE_COUNT=$(find . \( -name "*.ts" -o -name "*.tsx" \) | grep -v node_modules | grep -v "doc/table" | xargs wc -l 2>/dev/null | tail -1 | awk '{print $1}')
echo "代码行数: $LINE_COUNT"

# 总结
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ 验证完成！"
echo ""
echo "📍 下一步:"
echo "   1. 打开 http://localhost:3100"
echo "   2. 测试表格功能"
echo "   3. 查看 START_HERE.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

