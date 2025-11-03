#!/bin/bash

# 汗蒸养生馆管理系统部署脚本
# 使用方法: ./deploy.sh [环境] [选项]
# 环境: dev, staging, production
# 选项: --build-only, --no-cache, --with-monitoring

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
ENVIRONMENT=${1:-production}
BUILD_ONLY=false
NO_CACHE=false
WITH_MONITORING=false
WITH_DATABASE=false
WITH_CACHE=false

# 解析命令行参数
for arg in "$@"; do
    case $arg in
        --build-only)
            BUILD_ONLY=true
            shift
            ;;
        --no-cache)
            NO_CACHE=true
            shift
            ;;
        --with-monitoring)
            WITH_MONITORING=true
            shift
            ;;
        --with-database)
            WITH_DATABASE=true
            shift
            ;;
        --with-cache)
            WITH_CACHE=true
            shift
            ;;
    esac
done

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."

    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装"
        exit 1
    fi

    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi

    log_success "依赖检查完成"
}

# 环境检查
check_environment() {
    log_info "检查环境配置..."

    if [ ! -f ".env.${ENVIRONMENT}" ]; then
        log_warning "环境配置文件 .env.${ENVIRONMENT} 不存在，使用默认配置"
        cp .env.production .env.${ENVIRONMENT}
    fi

    # 设置构建时间和Git提交
    export BUILD_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    export GIT_COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo "unknown")

    log_success "环境检查完成"
}

# 构建应用
build_application() {
    log_info "构建应用..."

    local build_args=""
    if [ "$NO_CACHE" = true ]; then
        build_args="--no-cache"
    fi

    # 构建Docker镜像
    docker build $build_args -t sauna-management:${ENVIRONMENT} .

    log_success "应用构建完成"
}

# 部署应用
deploy_application() {
    log_info "部署应用到 ${ENVIRONMENT} 环境..."

    # 构建Docker Compose profiles
    local profiles="frontend"

    if [ "$WITH_MONITORING" = true ]; then
        profiles="${profiles},monitoring"
    fi

    if [ "$WITH_DATABASE" = true ]; then
        profiles="${profiles},database"
    fi

    if [ "$WITH_CACHE" = true ]; then
        profiles="${profiles},cache"
    fi

    # 停止现有服务
    docker-compose --profile $profiles down

    # 启动服务
    docker-compose --profile $profiles up -d

    log_success "应用部署完成"
}

# 健康检查
health_check() {
    log_info "执行健康检查..."

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -f http://localhost/health &> /dev/null; then
            log_success "应用健康检查通过"
            return 0
        fi

        log_info "等待应用启动... (${attempt}/${max_attempts})"
        sleep 10
        ((attempt++))
    done

    log_error "应用健康检查失败"
    return 1
}

# 清理旧镜像
cleanup() {
    log_info "清理旧镜像..."

    # 删除未使用的镜像
    docker image prune -f

    # 删除未使用的容器
    docker container prune -f

    log_success "清理完成"
}

# 备份数据
backup_data() {
    if [ "$WITH_DATABASE" = true ]; then
        log_info "备份数据库..."

        local backup_dir="./backups"
        local backup_file="${backup_dir}/backup_$(date +%Y%m%d_%H%M%S).sql"

        mkdir -p $backup_dir

        docker-compose exec -T database pg_dump -U sauna_user sauna_management > $backup_file

        log_success "数据库备份完成: $backup_file"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_success "部署完成！"
    echo ""
    echo "=== 部署信息 ==="
    echo "环境: $ENVIRONMENT"
    echo "构建时间: $BUILD_TIME"
    echo "Git提交: $GIT_COMMIT"
    echo ""
    echo "=== 访问地址 ==="
    echo "应用: http://localhost"

    if [ "$WITH_MONITORING" = true ]; then
        echo "Grafana: http://localhost:3000"
        echo "Prometheus: http://localhost:9090"
    fi

    echo ""
    echo "=== 常用命令 ==="
    echo "查看日志: docker-compose logs -f"
    echo "重启服务: docker-compose restart"
    echo "停止服务: docker-compose down"
    echo ""
}

# 主函数
main() {
    log_info "开始部署汗蒸养生馆管理系统..."
    log_info "环境: $ENVIRONMENT"

    check_dependencies
    check_environment

    if [ "$BUILD_ONLY" = false ]; then
        backup_data
    fi

    build_application

    if [ "$BUILD_ONLY" = false ]; then
        deploy_application
        health_check
        cleanup
        show_deployment_info
    else
        log_success "仅构建模式完成"
    fi
}

# 错误处理
trap 'log_error "部署失败！"; exit 1' ERR

# 执行主函数
main