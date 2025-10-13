#!/bin/bash

# 自动将根目录的文档文件移动到 book/ 目录

set -e

echo "📦 自动整理文档文件..."
echo ""

# 允许的根目录文件
ALLOWED_ROOT_FILES=(
    "README.md"
    "LICENSE.md"
    "CONTRIBUTING.md"
)

# 创建必要的目录
mkdir -p book/tasks
mkdir -p book/architecture
mkdir -p book/features
mkdir -p book/guides
mkdir -p book/analysis
mkdir -p book/testing

moved_count=0

for file in *.md; do
    # 跳过不存在的文件
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
        # 根据文件名判断应该放在哪个目录
        target_dir=""
        filename=$(basename "$file" .md)
        
        # 智能分类
        if [[ $file == *"TEST"* ]] || [[ $file == *"test"* ]]; then
            target_dir="book/testing"
        elif [[ $file == *"SETUP"* ]] || [[ $file == *"setup"* ]]; then
            target_dir="book/guides"
        elif [[ $file == *"ARCHITECTURE"* ]] || [[ $file == *"DESIGN"* ]]; then
            target_dir="book/architecture"
        elif [[ $file == *"REPORT"* ]] || [[ $file == *"report"* ]]; then
            target_dir="book/analysis"
        elif [[ $file == *"COMPLETE"* ]] || [[ $file == *"complete"* ]]; then
            # 完成报告通常与最近的任务相关
            latest_task=$(ls -d book/tasks/task-* 2>/dev/null | sort -r | head -1)
            if [ -n "$latest_task" ]; then
                target_dir="$latest_task"
            else
                target_dir="book/tasks"
            fi
        else
            # 默认放在 analysis 目录
            target_dir="book/analysis"
        fi
        
        # 生成新的文件名（转为小写，用短横线连接）
        new_filename=$(echo "$filename" | tr '[:upper:]' '[:lower:]' | tr '_' '-')
        new_path="$target_dir/${new_filename}.md"
        
        echo "📄 移动: $file"
        echo "   → $new_path"
        
        mv "$file" "$new_path"
        moved_count=$((moved_count + 1))
        echo ""
    fi
done

if [ $moved_count -eq 0 ]; then
    echo "✅ 没有需要移动的文件"
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "✅ 成功移动 $moved_count 个文件到 book/ 目录"
    echo ""
    echo "📋 文件分类规则："
    echo "  - 测试文档 → book/testing/"
    echo "  - 设置指南 → book/guides/"
    echo "  - 架构设计 → book/architecture/"
    echo "  - 报告分析 → book/analysis/"
    echo "  - 完成报告 → book/tasks/task-XXX/"
    echo "  - 其他文档 → book/analysis/"
fi

echo ""
echo "💡 提示：查看 .cursorrules-documentation 了解文档规范"

