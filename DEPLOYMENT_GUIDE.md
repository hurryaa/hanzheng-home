# 汗蒸会员管理系统 - 部署指南

## 📋 环境变量配置说明

本系统使用统一的 `.env` 文件进行配置，简化了部署流程。

### 关键配置项

```env
# 数据库配置
DB_HOST=127.0.0.1              # 数据库主机地址
DB_PORT=3306                   # 数据库端口
DB_USER=sauna_user             # 数据库用户名
DB_PASSWORD=your_password      # 数据库密码（生产环境必须修改）
DB_NAME=sauna_membership       # 数据库名称

# 安全配置
JWT_SECRET=your_secret_key     # JWT密钥（生产环境必须修改）
BCRYPT_SALT_ROUNDS=10          # 密码加密强度

# 服务配置
SERVER_PORT=4000               # 后端服务端口
CORS_ORIGIN=http://localhost:3000  # 允许的跨域来源

# 前端配置
VITE_API_URL=http://localhost:4000/api  # API地址

# Docker 配置
FRONTEND_PORT=8080             # 前端容器暴露的端口
```

## 🚀 快速部署（Docker）

**前置条件**: 确保 MySQL 已安装并运行在宿主机的 3306 端口

### 1. 一键启动

```bash
# 1. 复制环境变量文件
cp .env.example .env

# 2. 编辑 .env，填入宿主机 MySQL 信息
nano .env  # 重点配置：DB_USER, DB_PASSWORD, DB_NAME

# 3. 启动后端和前端容器
./start-docker.sh
```

### 2. 手动启动

```bash
# 构建并启动
docker compose up -d --build

# 查看服务状态
docker compose ps

# 查看后端日志
docker compose logs backend

# 停止服务
docker compose down
```

### 3. 访问系统

- **前端**: http://localhost:8080
- **后端**: http://localhost:4000
- **默认账号**: admin / admin123

## 🔧 本地开发

### 前置条件

- Node.js 18+
- pnpm 8+
- MySQL 5.7+ 或 8.0+

### 开发步骤

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env 配置数据库信息

# 2. 安装依赖
pnpm install
cd server && npm install && cd ..

# 3. 初始化数据库
cd server && npm run migrate && cd ..

# 4. 启动开发服务器
# 终端1：启动后端
cd server && npm run dev

# 终端2：启动前端
pnpm run dev
```

访问 http://localhost:3000

## 📦 生产环境部署

### 方案一：Docker Compose（推荐）

最简单的生产部署方式，包含 MySQL、后端和前端。

1. 准备服务器（Ubuntu 20.04+ 推荐）
2. 安装 Docker 和 Docker Compose
3. 上传代码到服务器
4. 配置 `.env` 文件（修改密码和域名）
5. 运行 `docker compose up -d --build`

### 方案二：分离部署

适合需要更灵活配置的场景。

#### 后端部署

```bash
# 1. 进入 server 目录
cd server

# 2. 安装依赖
npm ci --omit=dev

# 3. 运行数据库迁移
npm run migrate

# 4. 使用 PM2 启动
pm2 start src/index.js --name sauna-api

# 5. 配置 PM2 开机自启
pm2 startup
pm2 save
```

#### 前端部署

```bash
# 1. 构建前端
pnpm run build

# 2. 将 dist/static 目录部署到 Nginx
# 配置示例见 README.md
```

### 方案三：Vercel（仅前端）

适合只部署前端预览的场景。

```bash
# 1. 安装 Vercel CLI
npm install -g vercel

# 2. 在 Vercel Dashboard 配置环境变量
# VITE_API_URL=https://your-api-domain.com/api

# 3. 部署
vercel --prod
```

> **注意**: 后端需要单独部署到支持 Node.js 的服务器。

## 🔐 安全检查清单

部署到生产环境前，请确保：

- [ ] 修改了 `.env` 中的 `DB_PASSWORD`
- [ ] 修改了 `.env` 中的 `JWT_SECRET`（至少32位随机字符串）
- [ ] 首次登录后修改了 admin 账号密码
- [ ] 配置了防火墙，限制数据库端口只能本地访问
- [ ] 启用了 HTTPS（使用 Let's Encrypt 或其他证书）
- [ ] 配置了定期数据库备份
- [ ] 检查了 `CORS_ORIGIN` 配置，只允许可信来源

## 🐛 常见问题

### 数据库连接失败

**症状**: 后端无法启动，日志显示数据库连接错误

**解决方案**:
1. 检查 `.env` 中的数据库配置是否正确
2. 确认 MySQL 服务已启动: `systemctl status mysql`
3. 测试数据库连接: `mysql -h 127.0.0.1 -u sauna_user -p`
4. Docker 部署时，确保 `DB_HOST=mysql`（容器名）

### 前端无法连接后端

**症状**: 前端页面加载但显示"数据库连接失败"

**解决方案**:
1. 检查 `.env` 中的 `VITE_API_URL` 是否正确
2. 确认后端服务已启动并监听正确端口
3. 检查防火墙是否阻止了连接
4. 查看浏览器控制台的网络错误信息

### Docker 容器启动失败

**症状**: `docker compose up` 报错

**解决方案**:
1. 查看详细日志: `docker compose logs`
2. 检查端口是否被占用: `lsof -i :3306,4000,8080`
3. 确保 `.env` 文件存在且格式正确
4. 尝试重新构建: `docker compose build --no-cache`

### 数据迁移失败

**症状**: 后端启动时报 "Database migration failed"

**解决方案**:
1. 手动运行迁移: `cd server && npm run migrate`
2. 检查数据库用户权限: 需要 CREATE DATABASE 权限
3. 查看详细错误信息调试

## 📊 性能优化建议

1. **数据库索引**: 为常用查询字段添加索引
2. **连接池**: 调整 `DB_CONNECTION_LIMIT` 根据负载
3. **Nginx 缓存**: 为静态资源配置缓存
4. **CDN**: 将静态资源托管到 CDN
5. **监控**: 使用 PM2 或 Docker health checks 监控服务状态

## 📞 技术支持

如遇到问题，请：
1. 查看 README.md 的常见问题章节
2. 检查 GitHub Issues
3. 提交新的 Issue 并附上详细日志

---

最后更新: 2025-01-05
