#!/bin/bash

echo "🔧 Git 配置和 SSH 密钥设置脚本"
echo "================================"
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. 配置 Git 用户信息
echo "📝 第一步：配置 Git 用户信息"
echo "--------------------------------"
read -p "请输入你的 Git 用户名: " GIT_USERNAME
read -p "请输入你的 Git 邮箱: " GIT_EMAIL

echo ""
echo "配置 Git 全局用户信息..."
git config --global user.name "$GIT_USERNAME"
git config --global user.email "$GIT_EMAIL"

echo -e "${GREEN}✅ Git 用户信息已配置${NC}"
echo "   用户名: $(git config --global user.name)"
echo "   邮箱: $(git config --global user.email)"
echo ""

# 2. 检查现有 SSH 密钥
echo "🔑 第二步：检查 SSH 密钥"
echo "--------------------------------"
SSH_KEY_PATH="$HOME/.ssh/id_ed25519"

if [ -f "$SSH_KEY_PATH" ]; then
    echo -e "${YELLOW}⚠️  检测到已存在 SSH 密钥${NC}"
    echo "密钥路径: $SSH_KEY_PATH"
    read -p "是否要创建新的密钥？(y/n): " CREATE_NEW
    
    if [ "$CREATE_NEW" != "y" ]; then
        echo "使用现有密钥..."
        USE_EXISTING=true
    else
        USE_EXISTING=false
    fi
else
    USE_EXISTING=false
fi

# 3. 生成新的 SSH 密钥
if [ "$USE_EXISTING" = false ]; then
    echo ""
    echo "生成新的 SSH 密钥..."
    
    # 使用 ed25519 算法（更安全，更快）
    ssh-keygen -t ed25519 -C "$GIT_EMAIL" -f "$SSH_KEY_PATH" -N ""
    
    echo -e "${GREEN}✅ SSH 密钥已生成${NC}"
    echo "   私钥: $SSH_KEY_PATH"
    echo "   公钥: ${SSH_KEY_PATH}.pub"
fi

# 4. 启动 ssh-agent 并添加密钥
echo ""
echo "🔐 第三步：添加 SSH 密钥到 ssh-agent"
echo "--------------------------------"
eval "$(ssh-agent -s)"
ssh-add "$SSH_KEY_PATH"
echo -e "${GREEN}✅ SSH 密钥已添加到 ssh-agent${NC}"

# 5. 配置 SSH config（可选，用于 macOS 自动加载密钥）
echo ""
echo "📄 第四步：配置 SSH config"
echo "--------------------------------"
SSH_CONFIG="$HOME/.ssh/config"

if [ ! -f "$SSH_CONFIG" ]; then
    touch "$SSH_CONFIG"
fi

# 检查是否已配置
if ! grep -q "Host github.com" "$SSH_CONFIG"; then
    cat >> "$SSH_CONFIG" << EOF

# GitHub Configuration
Host github.com
    AddKeysToAgent yes
    UseKeychain yes
    IdentityFile $SSH_KEY_PATH
EOF
    echo -e "${GREEN}✅ SSH config 已配置${NC}"
else
    echo -e "${YELLOW}⚠️  SSH config 中已存在 GitHub 配置${NC}"
fi

# 6. 显示公钥
echo ""
echo "🔑 第五步：复制 SSH 公钥到 GitHub"
echo "--------------------------------"
echo -e "${YELLOW}请复制下面的公钥，并添加到 GitHub：${NC}"
echo ""
echo "----------------------------------------"
cat "${SSH_KEY_PATH}.pub"
echo "----------------------------------------"
echo ""
echo "添加步骤："
echo "1. 访问: https://github.com/settings/keys"
echo "2. 点击 'New SSH key'"
echo "3. 标题输入: LuckDB Development ($(hostname))"
echo "4. 粘贴上面的公钥"
echo "5. 点击 'Add SSH key'"
echo ""

# 复制到剪贴板（如果可用）
if command -v pbcopy &> /dev/null; then
    cat "${SSH_KEY_PATH}.pub" | pbcopy
    echo -e "${GREEN}✅ 公钥已自动复制到剪贴板！${NC}"
elif command -v xclip &> /dev/null; then
    cat "${SSH_KEY_PATH}.pub" | xclip -selection clipboard
    echo -e "${GREEN}✅ 公钥已自动复制到剪贴板！${NC}"
fi

read -p "按回车键继续，完成添加公钥到 GitHub 后..." 

# 7. 测试 SSH 连接
echo ""
echo "🧪 第六步：测试 SSH 连接"
echo "--------------------------------"
echo "测试连接到 GitHub..."
ssh -T git@github.com

if [ $? -eq 1 ]; then
    echo -e "${GREEN}✅ SSH 连接成功！${NC}"
else
    echo -e "${RED}❌ SSH 连接失败，请检查配置${NC}"
    exit 1
fi

# 8. 更新项目远程仓库地址
echo ""
echo "🔄 第七步：更新项目远程仓库地址"
echo "--------------------------------"

if [ -d ".git" ]; then
    CURRENT_REMOTE=$(git remote get-url origin 2>/dev/null)
    
    if [ -n "$CURRENT_REMOTE" ]; then
        echo "当前远程地址: $CURRENT_REMOTE"
        
        # 如果是 HTTPS 地址，转换为 SSH
        if [[ "$CURRENT_REMOTE" == https://github.com/* ]]; then
            SSH_REMOTE=$(echo "$CURRENT_REMOTE" | sed 's|https://github.com/|git@github.com:|')
            echo "转换为 SSH 地址: $SSH_REMOTE"
            
            read -p "是否要更新远程地址为 SSH？(y/n): " UPDATE_REMOTE
            
            if [ "$UPDATE_REMOTE" = "y" ]; then
                git remote set-url origin "$SSH_REMOTE"
                echo -e "${GREEN}✅ 远程地址已更新${NC}"
                echo "新地址: $(git remote get-url origin)"
            fi
        else
            echo -e "${GREEN}✅ 远程地址已是 SSH 格式${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  未找到远程仓库，请手动添加：${NC}"
        echo "git remote add origin git@github.com:easyspace-ai/luckdb.git"
    fi
else
    echo -e "${YELLOW}⚠️  当前目录不是 Git 仓库${NC}"
fi

# 9. 完成
echo ""
echo "🎉 完成！"
echo "================================"
echo ""
echo "配置摘要："
echo "  Git 用户名: $(git config --global user.name)"
echo "  Git 邮箱: $(git config --global user.email)"
echo "  SSH 密钥: $SSH_KEY_PATH"
echo ""
echo "现在你可以无密码推送代码了："
echo "  git add ."
echo "  git commit -m 'your message'"
echo "  git push origin main"
echo ""
echo -e "${GREEN}✅ 所有配置已完成！${NC}"

