#!/bin/bash

echo "=========================================="
echo "🐳 汗蒸会员管理系统 - Docker 部署"
echo "=========================================="
echo ""

# 检查 Docker 是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: 未检测到 Docker"
    echo ""
    echo "💡 请先安装 Docker:"
    echo "   官方安装: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查 Docker Compose 是否安装
if ! docker compose version &> /dev/null; then
    echo "❌ 错误: 未检测到 Docker Compose"
    echo ""
    echo "💡 请先安装 Docker Compose:"
    echo "   官方安装: https://docs.docker.com/compose/install/"
    exit 1
fi

echo "✅ Docker 版本: $(docker --version)"
echo "✅ Docker Compose 版本: $(docker compose version --short)"
echo ""

# 检测操作系统
OS_TYPE="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS_TYPE="linux"
    RECOMMENDED_DB_HOST="172.17.0.1"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS_TYPE="mac"
    RECOMMENDED_DB_HOST="host.docker.internal"
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    OS_TYPE="windows"
    RECOMMENDED_DB_HOST="host.docker.internal"
else
    RECOMMENDED_DB_HOST="172.17.0.1"
fi

echo "🖥️  检测到操作系统: $OS_TYPE"
echo "📌 推荐 DB_HOST: $RECOMMENDED_DB_HOST"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "⚠️  未找到 .env 文件，正在创建..."
    cp .env.example .env
    
    # 自动设置推荐的 DB_HOST
    if [[ "$OS_TYPE" != "unknown" ]]; then
        sed -i.bak "s/DB_HOST=127.0.0.1/DB_HOST=$RECOMMENDED_DB_HOST/" .env
        rm .env.bak 2>/dev/null || true
        echo "✅ 已自动设置 DB_HOST=$RECOMMENDED_DB_HOST"
    fi
    
    echo ""
    echo "📝 请编辑 .env 文件，配置以下信息："
    echo "   - DB_PASSWORD: MySQL 密码"
    echo "   - JWT_SECRET: 随机密钥（32位以上）"
    echo ""
    echo "然后重新运行此脚本"
    exit 1
fi

echo "✅ 配置文件已找到"
echo ""

# 读取并验证 .env 配置
source .env

# 检查 DB_HOST 配置
if [ "$DB_HOST" == "127.0.0.1" ] || [ "$DB_HOST" == "localhost" ]; then
    echo "⚠️  警告: 检测到 DB_HOST=$DB_HOST"
    echo ""
    echo "   Docker 容器无法使用 127.0.0.1 连接宿主机 MySQL"
    echo ""
    echo "   建议修改为: $RECOMMENDED_DB_HOST"
    echo ""
    read -p "   是否自动修改？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sed -i.bak "s/DB_HOST=.*/DB_HOST=$RECOMMENDED_DB_HOST/" .env
        rm .env.bak 2>/dev/null || true
        echo "   ✅ 已修改 DB_HOST=$RECOMMENDED_DB_HOST"
        source .env
    else
        echo "   ⚠️  请手动修改 .env 文件中的 DB_HOST"
        exit 1
    fi
    echo ""
fi

echo "📋 当前配置:"
echo "   DB_HOST: $DB_HOST"
echo "   DB_PORT: $DB_PORT"
echo "   DB_USER: $DB_USER"
echo "   DB_NAME: $DB_NAME"
echo "   PORT: ${PORT:-4000}"
echo ""

# 检查 MySQL 是否可访问
echo "🔍 检查 MySQL 连接..."
if command -v mysql &> /dev/null; then
    if mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1" &> /dev/null; then
        echo "✅ MySQL 连接成功"
    else
        echo "⚠️  警告: 无法连接到 MySQL"
        echo ""
        echo "   请确保:"
        echo "   1. MySQL 已启动: systemctl status mysql"
        echo "   2. MySQL 允许远程连接 (bind-address = 0.0.0.0)"
        echo "   3. 防火墙允许 3306 端口"
        echo ""
        echo "   详细说明: DOCKER_DEPLOYMENT.md"
        echo ""
        read -p "   是否继续部署？(y/n) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "⚠️  未安装 mysql 客户端，跳过连接测试"
fi
echo ""

# 停止旧容器
if docker ps -a | grep -q sauna-app; then
    echo "🛑 停止旧容器..."
    docker compose down
    echo ""
fi

# 构建并启动
echo "🔨 构建 Docker 镜像..."
docker compose build

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Docker 镜像构建失败"
    exit 1
fi

echo ""
echo "🚀 启动容器..."
docker compose up -d

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ 容器启动失败"
    echo ""
    echo "💡 查看日志: docker compose logs"
    exit 1
fi

echo ""
echo "⏳ 等待服务启动..."
sleep 5

# 检查容器状态
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "=========================================="
    echo "✅ 部署成功！"
    echo "=========================================="
    echo ""
    echo "📍 访问地址: http://localhost:${PORT:-4000}"
    echo ""
    echo "👤 默认账号: admin"
    echo "🔑 默认密码: 123456"
    echo ""
    echo "⚠️  首次登录后请立即修改密码！"
    echo ""
    echo "📊 查看日志: docker compose logs -f"
    echo "🛑 停止服务: docker compose down"
    echo ""
    echo "=========================================="
else
    echo ""
    echo "❌ 容器启动异常"
    echo ""
    echo "📋 容器状态:"
    docker compose ps
    echo ""
    echo "📋 最近日志:"
    docker compose logs --tail=50
    echo ""
    echo "💡 完整日志: docker compose logs"
    exit 1
fi
