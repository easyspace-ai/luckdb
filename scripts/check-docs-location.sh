#!/bin/bash

# 检查文档文件位置是否符合规范

echo "🔍 检查文档文件位置..."
echo ""

# 允许的根目录文件
ALLOWED_ROOT_FILES=(
    "README.md"
    "LICENSE.md"
    "CONTRIBUTING.md"
)

# 查找根目录的 .md 文件
found_violations=0

for file in *.md; do
    # 跳过不存在的文件（glob 未匹配）
    [ -f "$file" ] || continue
    
    # 检查是否在允许列表中
    is_allowed=false
    for allowed in "${ALLOWED_ROOT_FILES[@]}"; do
        if [ "$file" = "$allowed" ]; then
            is_allowed=true
            break
        fi
    done
    
    if [ "$is_allowed" = false ]; then
        echo "❌ 违规文件: $file"
        echo "   应该移动到: book/tasks/task-XXX/ 或其他 book/ 子目录"
        echo ""
        found_violations=$((found_violations + 1))
    fi
done

if [ $found_violations -eq 0 ]; then
    echo "✅ 所有文档文件位置正确！"
    exit 0
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "⚠️  发现 $found_violations 个违规文件"
    echo ""
    echo "请将这些文件移动到 book/ 目录下："
    echo "  - 任务文档 → book/tasks/task-XXX/"
    echo "  - 架构文档 → book/architecture/"
    echo "  - 功能文档 → book/features/"
    echo "  - 测试文档 → book/testing/"
    echo ""
    echo "或者运行清理脚本："
    echo "  ./scripts/move-docs-to-book.sh"
    exit 1
fi

