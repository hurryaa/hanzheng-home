# 项目精简说明

## 📝 精简内容

本次优化针对"MySQL已在宿主机部署"的场景进行了精简：

### 移除的内容

1. **移除 MySQL 容器**
   - 不再通过 Docker Compose 启动 MySQL
   - 直接使用宿主机的 MySQL（端口 3306）
   - 减少了一个容器，降低资源占用

2. **简化网络配置**
   - 后端使用 `host` 网络模式
   - 可直接访问宿主机的 `127.0.0.1:3306`
   - 无需复杂的容器网络配置

3. **移除数据卷**
   - 不再需要 `mysql_data` 卷
   - 数据存储在宿主机 MySQL 中
   - 备份和恢复更加灵活

### 保留的内容

1. **后端容器** (sauna-backend)
   - 运行 Express + Node.js
   - 端口: 4000
   - 网络: host 模式（可访问宿主机）

2. **前端容器** (sauna-frontend)
   - 运行 Nginx 托管静态资源
   - 端口: 8080（可配置）
   - 网络: bridge 模式

## 🔧 配置要求

### 宿主机 MySQL 配置

确保 MySQL 已安装并运行：

```bash
# 检查 MySQL 是否运行
systemctl status mysql
# 或
brew services list | grep mysql

# 测试连接
mysql -u root -p
```

### 环境变量配置

`.env` 文件中的数据库配置指向宿主机：

```env
DB_HOST=127.0.0.1      # 宿主机地址
DB_PORT=3306           # 宿主机 MySQL 端口
DB_USER=root           # MySQL 用户名
DB_PASSWORD=your_pass  # MySQL 密码
DB_NAME=sauna_membership
```

## 🚀 部署对比

### 之前（包含 MySQL 容器）

```
docker-compose.yml:
  - mysql (容器)
  - backend (容器)
  - frontend (容器)
  
启动时间: ~30秒
内存占用: ~800MB
配置复杂度: 中等
```

### 现在（使用宿主机 MySQL）

```
docker-compose.yml:
  - backend (容器, host 网络)
  - frontend (容器)
  
启动时间: ~10秒
内存占用: ~300MB
配置复杂度: 简单
```

## ✅ 优势

1. **启动速度更快** - 无需等待 MySQL 容器启动
2. **资源占用更低** - 减少一个容器的开销
3. **配置更简单** - 无需管理 MySQL 容器配置
4. **数据管理更灵活** - 直接使用宿主机工具备份/恢复
5. **开发调试更方便** - 可直接使用本地 MySQL 客户端

## ⚠️ 注意事项

1. **MySQL 必须先启动**
   - Docker 容器启动前确保 MySQL 运行
   - 可配置 MySQL 开机自启

2. **网络端口检查**
   - 确保 3306 端口未被占用
   - 确保 4000 和 8080 端口可用

3. **权限配置**
   - MySQL 用户需要有创建数据库的权限
   - 建议使用独立用户，不要直接用 root

4. **防火墙配置**
   - 本地开发：无需特殊配置
   - 生产环境：确保 3306 不对外开放

## 📊 文件变化

```
修改的文件:
  - docker-compose.yml (移除 mysql 服务，backend 使用 host 网络)
  - .env.example (更新数据库配置说明)
  - README.md (更新部署说明)
  - DEPLOYMENT_GUIDE.md (更新前置条件)
  - CHECKLIST.md (更新架构图)
  - start-docker.sh (更新提示信息)
```

## 🔄 如何回退到完整版

如果需要恢复 MySQL 容器，可以：

```bash
# 1. 恢复 docker-compose.yml
git checkout HEAD -- docker-compose.yml

# 2. 添加 MySQL 服务配置
# 参考之前的版本或 Docker Hub MySQL 文档

# 3. 调整后端网络模式
# 将 backend 的 network_mode: host 改回 bridge
# 并添加 depends_on: mysql
```

---

精简完成日期: 2025-01-05
优化版本: v1.1.0 (精简版)
