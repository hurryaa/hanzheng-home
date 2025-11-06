#!/bin/bash

echo "=========================================="
echo "🚀 汗蒸会员管理系统 - 一键启动"
echo "=========================================="
echo ""

# 检查 Node.js 版本
NODE_VERSION_STR=$(node -v 2>/dev/null)
NODE_VERSION_MAJOR=$(echo "$NODE_VERSION_STR" | cut -d'v' -f2 | cut -d'.' -f1)

if [ -z "$NODE_VERSION_STR" ]; then
    echo "❌ 错误: 未检测到 Node.js"
    echo ""
    echo "💡 请先安装 Node.js 18 或更高版本"
    echo "   官方下载: https://nodejs.org/en/download/"
    exit 1
fi

if [ "$NODE_VERSION_MAJOR" -lt 18 ]; then
    echo "❌ 错误: Node.js 版本过低"
    echo ""
    echo "   当前版本: $NODE_VERSION_STR"
    echo "   要求版本: v18.0.0 或更高"
    echo ""
    echo "💡 请升级 Node.js:"
    echo "   方式一: 使用 nvm (推荐)"
    echo "     curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "     source ~/.bashrc"
    echo "     nvm install 18"
    echo "     nvm use 18"
    echo ""
    echo "   方式二: 使用官方包管理器"
    echo "     - CentOS/RHEL: https://rpm.nodesource.com/"
    echo "     - Ubuntu/Debian: https://deb.nodesource.com/"
    echo ""
    exit 1
fi

echo "✅ Node.js 版本: $NODE_VERSION_STR"
echo ""

# 检查 pnpm 是否安装
if ! command -v pnpm &> /dev/null; then
    echo "❌ 错误: 未检测到 pnpm"
    echo ""
    echo "💡 请先安装 pnpm:"
    echo "   npm install -g pnpm"
    echo ""
    echo "   或使用官方脚本:"
    echo "   curl -fsSL https://get.pnpm.io/install.sh | sh -"
    echo ""
    exit 1
fi

echo "✅ pnpm 版本: $(pnpm -v)"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，正在创建..."
    cp .env.example .env
    echo "✅ .env 文件已创建"
    echo ""
    echo "📝 请编辑 .env 文件，配置数据库信息："
    echo "   - DB_USER: MySQL 用户名"
    echo "   - DB_PASSWORD: MySQL 密码"
    echo "   - JWT_SECRET: 随机密钥（32位以上）"
    echo ""
    echo "然后重新运行此脚本"
    exit 1
fi

echo "✅ 配置文件已找到"
echo ""

# 检查是否安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 正在安装依赖..."
    pnpm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 依赖安装失败，请检查错误信息"
        exit 1
    fi
    echo ""
fi

# 检查是否已构建
BUILD_TARGETS=("dist/static/index.html" "dist/index.html")
build_output=""

for target in "${BUILD_TARGETS[@]}"; do
    if [ -f "$target" ]; then
        build_output="$target"
        break
    fi
done

if [ -z "$build_output" ]; then
    echo "🔨 正在构建前端..."
    pnpm run build
    if [ $? -ne 0 ]; then
        echo ""
        echo "❌ 构建失败，请检查错误信息"
        exit 1
    fi
    echo ""

    for target in "${BUILD_TARGETS[@]}"; do
        if [ -f "$target" ]; then
            build_output="$target"
            break
        fi
    done

    if [ -z "$build_output" ]; then
        echo "❌ 构建失败: 未找到 dist/static/index.html 或 dist/index.html"
        echo "💡 请手动运行构建命令并检查错误:"
        echo "   pnpm run build"
        exit 1
    fi

    echo "✅ 构建成功: $build_output"
    echo ""
else
    echo "✅ 检测到前端构建文件: $build_output"
    echo ""
fi

echo "🚀 启动服务器..."
echo ""

NODE_ENV=production node server.js
