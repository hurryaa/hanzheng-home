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
if [ ! -d "dist" ]; then
    echo "🔨 正在构建前端..."
    pnpm run build
    echo ""
fi

echo "🚀 启动服务器..."
echo ""

NODE_ENV=production node server.js
