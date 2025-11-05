# 快速开始指南

## 🎯 5分钟部署指南

### 前置条件

- ✅ MySQL 已安装并运行在宿主机（端口 3306）
- ✅ Docker 和 Docker Compose 已安装

### 步骤 1: 克隆项目

```bash
git clone <repository-url>
cd <project-directory>
```

### 步骤 2: 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件，填入你的 MySQL 信息
nano .env  # 或使用 vim/vscode
```

**必填配置**：
```env
DB_USER=root                    # 你的 MySQL 用户名
DB_PASSWORD=your_mysql_password # 你的 MySQL 密码
DB_NAME=sauna_membership        # 数据库名（会自动创建）
JWT_SECRET=your_random_32_char_secret  # 随机密钥
```

### 步骤 3: 启动服务

```bash
# 方式一：使用启动脚本（推荐）
./start-docker.sh

# 方式二：手动启动
docker compose up -d --build
```

等待约 10-20 秒，容器启动完成。

### 步骤 4: 访问系统

- **前端**: http://localhost:8080
- **后端**: http://localhost:4000
- **默认账号**: admin / admin123

**首次登录后请立即修改密码！**

---

## 🔧 本地开发模式

如果你想本地开发而不用 Docker：

```bash
# 1. 配置环境变量（同上）
cp .env.example .env

# 2. 安装依赖
pnpm install
cd server && npm install && cd ..

# 3. 初始化数据库
cd server && npm run migrate && cd ..

# 4. 启动后端（终端1）
cd server && npm run dev

# 5. 启动前端（终端2）
pnpm run dev
```

访问 http://localhost:3000

---

## 📝 常见问题

### Q1: 启动失败，提示"数据库连接失败"？

**解决方案**：
1. 确认 MySQL 正在运行：`systemctl status mysql` (Linux) 或 `brew services list | grep mysql` (macOS)
2. 检查 `.env` 中的 `DB_USER` 和 `DB_PASSWORD` 是否正确
3. 测试数据库连接：`mysql -u root -p`
4. 查看后端日志：`docker compose logs backend`

### Q2: 前端显示"无法连接到服务器"？

**解决方案**：
1. 确认后端已启动：`docker compose ps`
2. 检查后端健康状态：`curl http://localhost:4000/api/health`
3. 查看浏览器控制台的网络错误

### Q3: 端口冲突？

如果 8080 或 4000 端口被占用，可在 `.env` 中修改：

```env
FRONTEND_PORT=3000   # 修改前端端口
SERVER_PORT=5000     # 修改后端端口
```

然后重启：`docker compose down && docker compose up -d --build`

### Q4: 如何查看日志？

```bash
# 查看所有日志
docker compose logs -f

# 只看后端
docker compose logs -f backend

# 只看前端
docker compose logs -f frontend
```

### Q5: 如何停止服务？

```bash
# 停止容器
docker compose down

# 停止并删除数据（谨慎）
docker compose down -v
```

---

## 🛠️ 管理命令

### 数据库管理

```bash
# 进入 MySQL
mysql -u root -p sauna_membership

# 查看所有表
SHOW TABLES;

# 查看会员数据
SELECT * FROM collections WHERE name='members';

# 备份数据库
mysqldump -u root -p sauna_membership > backup.sql

# 恢复数据库
mysql -u root -p sauna_membership < backup.sql
```

### Docker 管理

```bash
# 重启服务
docker compose restart

# 重建容器
docker compose up -d --build --force-recreate

# 查看容器状态
docker compose ps

# 进入后端容器
docker exec -it sauna-backend sh

# 清理未使用的 Docker 资源
docker system prune -a
```

### 应用管理

```bash
# 查看系统状态
curl http://localhost:4000/api/health

# 重新初始化数据库
cd server && npm run migrate

# 构建前端
pnpm run build

# 查看构建产物
ls -lh dist/static
```

---

## 📚 下一步

1. 阅读 [README.md](./README.md) 了解详细功能
2. 查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) 了解生产部署
3. 参考 [SIMPLIFIED.md](./SIMPLIFIED.md) 了解架构精简说明

---

## 🆘 获取帮助

- 查看完整文档：README.md
- 检查问题列表：CHECKLIST.md
- 部署指南：DEPLOYMENT_GUIDE.md
- 架构说明：SIMPLIFIED.md

如遇问题，请查看日志并参考上述常见问题，或提交 Issue。
