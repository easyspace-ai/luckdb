#!/bin/bash

# RenewTable 快速启动脚本

echo "🚀 RenewTable 快速启动..."
echo ""

# 检查演示页面是否运行
if curl -s http://localhost:3100 > /dev/null 2>&1; then
  echo "✅ 演示页面已运行在 http://localhost:3100"
  echo ""
  echo "📖 快速测试："
  echo "1. 打开浏览器访问 http://localhost:3100"
  echo "2. 点击 '100,000 行' 按钮"
  echo "3. 滚动测试性能"
  echo ""
  
  # 打开浏览器
  open http://localhost:3100 2>/dev/null || xdg-open http://localhost:3100 2>/dev/null || echo "请手动打开: http://localhost:3100"
else
  echo "⚠️ 演示页面未运行，正在启动..."
  echo ""
  cd demo && pnpm dev
fi

