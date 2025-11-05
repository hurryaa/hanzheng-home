#!/bin/bash

# 启动脚本
echo "=========================================="
echo "汗蒸会员管理系统 - Docker 启动脚本"
echo "=========================================="
echo ""

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件"
    echo "📝 正在从 .env.example 复制..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "❗ 请编辑 .env 文件，配置数据库密码、JWT密钥等信息"
    echo "   然后重新运行此脚本"
    echo ""
    exit 1
fi

echo "✅ 找到 .env 配置文件"
echo ""

# 启动 Docker Compose
echo "🚀 启动 Docker 容器 (后台 + 前端)..."
docker compose up -d --build

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ 启动成功！"
    echo "=========================================="
    echo ""
    echo "访问地址："
    echo "  前端: http://localhost:${FRONTEND_PORT:-8080}"
    echo "  后端: http://localhost:${SERVER_PORT:-4000}"
    echo "  数据库: mysql://$DB_USER:******@${DB_HOST}:${DB_PORT}/${DB_NAME}"
    echo ""
    echo "查看日志: docker compose logs -f"
    echo "停止服务: docker compose down"
    echo ""
else
    echo ""
    echo "❌ 启动失败，请检查错误信息"
    echo ""
fi
