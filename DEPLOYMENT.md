# 汗蒸养生馆管理系统 - 生产环境部署指南

## 📋 目录

- [系统要求](#系统要求)
- [快速部署](#快速部署)
- [详细配置](#详细配置)
- [监控和维护](#监控和维护)
- [故障排除](#故障排除)
- [安全配置](#安全配置)

## 🔧 系统要求

### 最低配置
- **CPU**: 2核心
- **内存**: 4GB RAM
- **存储**: 20GB 可用空间
- **操作系统**: Ubuntu 20.04+ / CentOS 8+ / Docker支持的Linux发行版

### 推荐配置
- **CPU**: 4核心
- **内存**: 8GB RAM
- **存储**: 50GB SSD
- **网络**: 100Mbps带宽

### 软件依赖
- Docker 20.10+
- Docker Compose 2.0+
- Git 2.0+
- Nginx (如果不使用Docker)

## 🚀 快速部署

### 1. 克隆项目
```bash
git clone <repository-url>
cd sauna-management-system
```

### 2. 配置环境变量
```bash
# 复制环境配置文件
cp .env.production .env

# 编辑配置文件
nano .env
```

### 3. 一键部署
```bash
# 给部署脚本执行权限
chmod +x deploy.sh

# 部署到生产环境
./deploy.sh production
```

### 4. 验证部署
```bash
# 检查服务状态
docker-compose ps

# 查看应用日志
docker-compose logs -f frontend

# 访问应用
curl http://localhost/health
```

## ⚙️ 详细配置

### 环境变量配置

#### 基础配置
```env
# 应用信息
VITE_APP_TITLE=汗蒸养生馆管理系统
VITE_APP_VERSION=1.0.0

# API配置
VITE_API_BASE_URL=https://api.yourdomain.com
VITE_API_TIMEOUT=10000

# 功能开关
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true
```

#### 数据库配置（可选）
```env
DB_PASSWORD=your_secure_password
POSTGRES_DB=sauna_management
POSTGRES_USER=sauna_user
```

#### 缓存配置（可选）
```env
REDIS_PASSWORD=your_redis_password
```

### Docker Compose 配置

#### 基础部署
```bash
# 仅部署前端应用
docker-compose up -d
```

#### 完整部署（包含数据库和监控）
```bash
# 部署所有服务
./deploy.sh production --with-database --with-monitoring --with-cache
```

#### 自定义部署
```bash
# 仅构建不部署
./deploy.sh production --build-only

# 无缓存构建
./deploy.sh production --no-cache
```

### Nginx 配置

如果使用外部Nginx，参考以下配置：

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/sauna-management;
    index index.html;

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
}
```

## 📊 监控和维护

### 健康检查
```bash
# 应用健康检查
curl http://localhost/health

# 容器状态检查
docker-compose ps

# 资源使用情况
docker stats
```

### 日志管理
```bash
# 查看应用日志
docker-compose logs -f frontend

# 查看Nginx日志
docker-compose logs -f frontend | grep nginx

# 查看错误日志
docker-compose logs frontend | grep ERROR
```

### 备份和恢复
```bash
# 数据库备份
docker-compose exec database pg_dump -U sauna_user sauna_management > backup.sql

# 数据库恢复
docker-compose exec -T database psql -U sauna_user sauna_management < backup.sql

# 自动备份脚本
./deploy.sh production --backup-only
```

### 更新部署
```bash
# 拉取最新代码
git pull origin main

# 重新部署
./deploy.sh production

# 滚动更新（零停机）
docker-compose up -d --no-deps frontend
```

## 🔍 故障排除

### 常见问题

#### 1. 应用无法启动
```bash
# 检查容器状态
docker-compose ps

# 查看详细日志
docker-compose logs frontend

# 检查端口占用
netstat -tlnp | grep :80
```

#### 2. 数据库连接失败
```bash
# 检查数据库状态
docker-compose exec database pg_isready -U sauna_user

# 重启数据库
docker-compose restart database

# 检查网络连接
docker-compose exec frontend ping database
```

#### 3. 静态资源加载失败
```bash
# 检查Nginx配置
docker-compose exec frontend nginx -t

# 重新加载Nginx配置
docker-compose exec frontend nginx -s reload

# 检查文件权限
docker-compose exec frontend ls -la /usr/share/nginx/html
```

### 性能优化

#### 1. 内存优化
```bash
# 限制容器内存使用
docker-compose up -d --memory=512m frontend
```

#### 2. 缓存优化
```bash
# 启用Redis缓存
./deploy.sh production --with-cache

# 配置CDN（推荐）
# 将静态资源上传到CDN服务
```

#### 3. 数据库优化
```sql
-- 创建索引
CREATE INDEX idx_consumption_time ON consumption_records(time);
CREATE INDEX idx_member_phone ON members(phone);
```

## 🔒 安全配置

### SSL/TLS 配置
```bash
# 使用Let's Encrypt自动证书
./deploy.sh production --with-ssl

# 手动配置SSL证书
# 将证书文件放置在 ./ssl/ 目录下
```

### 防火墙配置
```bash
# Ubuntu/Debian
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable

# CentOS/RHEL
firewall-cmd --permanent --add-port=80/tcp
firewall-cmd --permanent --add-port=443/tcp
firewall-cmd --reload
```

### 安全更新
```bash
# 定期更新系统
apt update && apt upgrade -y  # Ubuntu/Debian
yum update -y                 # CentOS/RHEL

# 更新Docker镜像
docker-compose pull
docker-compose up -d
```

## 📈 监控配置

### Prometheus + Grafana
```bash
# 启用监控
./deploy.sh production --with-monitoring

# 访问监控面板
# Grafana: http://localhost:3000 (admin/admin)
# Prometheus: http://localhost:9090
```

### 日志聚合
```bash
# 使用ELK Stack（可选）
docker-compose -f docker-compose.monitoring.yml up -d
```

## 🔄 CI/CD 集成

### GitHub Actions 示例
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to server
        run: |
          ssh user@server 'cd /path/to/app && git pull && ./deploy.sh production'
```

### GitLab CI 示例
```yaml
deploy:
  stage: deploy
  script:
    - ./deploy.sh production
  only:
    - main
```

## 📞 支持和联系

如果在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查项目的 Issues 页面
3. 联系技术支持团队

---

**注意**: 在生产环境中，请确保：
- 定期备份数据
- 监控系统性能
- 及时更新安全补丁
- 配置适当的访问控制