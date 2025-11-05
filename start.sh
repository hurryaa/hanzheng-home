#!/bin/bash

echo "=========================================="
echo "🚀 汗蒸会员管理系统 - 一键启动"
echo "=========================================="
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
