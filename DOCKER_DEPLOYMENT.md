# Docker 部署指南

本文档提供 Docker 容器化部署的详细说明。

## 📋 前置条件

- Docker 20.10+
- Docker Compose 2.0+
- MySQL 8.0 (运行在宿主机)

## 🚀 快速部署

### 步骤 1: 配置环境变量

```bash
# 复制配置模板
cp .env.example .env

# 编辑配置文件
nano .env
```

**重要**：修改以下配置：

```env
# ⚠️ Docker 部署时，DB_HOST 不能使用 127.0.0.1
# Linux 系统使用:
DB_HOST=172.17.0.1

# Mac 或 Windows 系统使用:
DB_HOST=host.docker.internal

# 其他必填项
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=sauna_membership

# JWT 密钥（必须修改！）
JWT_SECRET=your_random_secret_key_at_least_32_characters_long

# 服务端口
PORT=4000
```

### 步骤 2: 配置 MySQL

Docker 容器需要连接宿主机的 MySQL，需要确保 MySQL 允许远程连接。

#### 2.1 修改 MySQL 配置

```bash
# 编辑 MySQL 配置文件
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 找到 bind-address 行，修改为:
bind-address = 0.0.0.0

# 保存后重启 MySQL
sudo systemctl restart mysql
```

#### 2.2 验证 MySQL 状态

```bash
# 检查 MySQL 是否运行
sudo systemctl status mysql

# 检查监听端口
sudo netstat -tuln | grep 3306
# 应该看到: 0.0.0.0:3306
```

#### 2.3 测试连接

```bash
# 从 Docker 网络测试连接 (Linux)
docker run --rm mysql:8.0 mysql -h 172.17.0.1 -u root -p

# 或 (Mac/Windows)
docker run --rm mysql:8.0 mysql -h host.docker.internal -u root -p
```

### 步骤 3: 构建和启动

```bash
# 构建并启动容器
docker compose up -d --build

# 查看日志
docker compose logs -f

# 查看容器状态
docker compose ps
```

### 步骤 4: 访问应用

打开浏览器访问：**http://localhost:4000**

默认账号：
- 用户名：`admin`
- 密码：`123456`

## 🔍 故障排查

### 错误: ECONNREFUSED 127.0.0.1:3306

**原因**：.env 文件中 DB_HOST 配置错误，使用了 127.0.0.1

**解决方案**：

1. **确认系统类型**
   ```bash
   # 查看 Docker 版本和系统
   docker version
   ```

2. **修改 .env 文件**
   ```bash
   # Linux 系统
   DB_HOST=172.17.0.1
   
   # Mac 或 Windows 系统
   DB_HOST=host.docker.internal
   ```

3. **重启容器**
   ```bash
   docker compose down
   docker compose up -d
   ```

### 错误: no route to host

**原因**：防火墙阻止了连接

**解决方案**：

```bash
# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=3306/tcp
sudo firewall-cmd --reload

# Ubuntu/Debian
sudo ufw allow 3306/tcp
sudo ufw reload
```

### 错误: Access denied for user

**原因**：MySQL 用户权限不足

**解决方案**：

```bash
# 登录 MySQL
mysql -u root -p

# 授予权限
GRANT ALL PRIVILEGES ON sauna_membership.* TO 'root'@'%' IDENTIFIED BY '密码';
FLUSH PRIVILEGES;
exit;

# 重启 MySQL
sudo systemctl restart mysql
```

## 🛠️ 常用命令

### 查看日志
```bash
# 实时日志
docker compose logs -f

# 最近 100 行
docker compose logs --tail=100

# 只看错误
docker compose logs | grep -i error
```

### 重启服务
```bash
# 重启容器
docker compose restart

# 完全重建
docker compose down
docker compose up -d --build
```

### 进入容器
```bash
# 进入容器 shell
docker compose exec app sh

# 查看容器内环境变量
docker compose exec app env | grep DB_

# 测试容器内网络
docker compose exec app ping -c 3 172.17.0.1
```

### 清理
```bash
# 停止并删除容器
docker compose down

# 删除容器和镜像
docker compose down --rmi all

# 删除容器、镜像和数据卷
docker compose down --rmi all -v
```

## 📊 性能优化

### 健康检查

docker-compose.yml 已配置健康检查：

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

查看健康状态：
```bash
docker compose ps
# STATUS 列应显示 "healthy"
```

### 资源限制

如需限制资源使用，编辑 docker-compose.yml：

```yaml
services:
  app:
    # ... 其他配置 ...
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

## 🔒 生产环境建议

1. **使用独立的 MySQL 容器**
   ```yaml
   services:
     db:
       image: mysql:8.0
       environment:
         MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
         MYSQL_DATABASE: ${DB_NAME}
       volumes:
         - mysql-data:/var/lib/mysql
     
     app:
       depends_on:
         - db
       environment:
         DB_HOST: db
   
   volumes:
     mysql-data:
   ```

2. **使用外部网络**
   ```bash
   # 创建网络
   docker network create sauna-network
   
   # 修改 docker-compose.yml
   networks:
     default:
       external: true
       name: sauna-network
   ```

3. **配置日志驱动**
   ```yaml
   services:
     app:
       logging:
         driver: "json-file"
         options:
           max-size: "10m"
           max-file: "3"
   ```

4. **启用 HTTPS**
   - 使用 Nginx 反向代理
   - 配置 SSL 证书（Let's Encrypt）
   - 强制 HTTPS 重定向

## 📈 监控

### 查看资源使用
```bash
# 实时监控
docker stats sauna-app

# 查看容器详情
docker inspect sauna-app
```

### 导出日志
```bash
# 导出到文件
docker compose logs > logs.txt

# 按时间导出
docker compose logs --since 1h > recent-logs.txt
```

## 🆘 获取帮助

如遇问题：
1. 查看 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. 检查容器日志：`docker compose logs`
3. 验证配置：`docker compose config`
4. 测试网络连接：`docker compose exec app ping DB_HOST`

---

**祝部署顺利！** 🎉
