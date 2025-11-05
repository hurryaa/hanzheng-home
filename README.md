# 汗蒸会员管理系统

一键部署的全栈会员管理系统，专为汗蒸养生馆等服务行业设计。前后端一体化，极简部署。

## 📚 文档导航

- 🚀 [快速开始](#-快速开始3-步) - 3步完成部署
- 🐳 [Docker部署](./DOCKER_DEPLOYMENT.md) - 容器化部署详细教程
- 🔧 [故障排除](./TROUBLESHOOTING.md) - 常见问题解决方案
- 📖 [功能说明](#-核心功能) - 系统功能介绍

## ✨ 特点

- 🚀 **一键启动** - 单个命令即可运行
- 📦 **前后端一体** - 无需分别部署
- 🔐 **自动初始化** - 自动创建数据库和管理员账户
- 🐳 **Docker支持** - 支持容器化部署
- 💾 **MySQL存储** - 数据安全可靠

## 🎯 核心功能

- 会员管理（CRUD、次卡、批量操作）
- 充值管理（多种支付方式、记录导出）
- 消费记录（次卡使用统计、筛选导出）
- 次卡管理（类型配置、有效期管理）
- 预约管理
- 数据分析（仪表盘、图表、营收趋势）
- 账号管理（用户、角色、权限）
- 操作日志（审计追踪）
- Excel 导入导出

## 🚀 快速开始（3 步）

### 前置条件

- **Node.js 18.0 或更高版本** （必须！低版本无法运行）
- MySQL 8.0（需提前安装）
- pnpm 8+

> ⚠️ **重要**: 如果 Node.js 版本低于 18，会出现语法错误（`SyntaxError: Unexpected token '||='`）。请使用 `node -v` 检查版本。

### 方式一：直接运行

```bash
# 1. 配置环境变量
cp .env.example .env
nano .env  # 填入 MySQL 账号密码

# 2. 一键启动
./start.sh

# 或手动启动
pnpm install
pnpm run build
pnpm start
```

### 方式二：Docker（推荐）

```bash
# 1. 配置环境变量
cp .env.example .env
nano .env  # 填入 MySQL 账号密码（并根据操作系统设置 DB_HOST）
#            - Linux:   DB_HOST=172.17.0.1
#            - Mac/Win: DB_HOST=host.docker.internal

# 2. 启动容器
docker compose up -d --build
# （或使用一键脚本）
./docker-start.sh
```

> 📘 **详细教程**：请参考 [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

### 访问系统

打开浏览器访问：**http://localhost:4000**

**默认账号**：
- 用户名：`admin`
- 密码：`123456`

⚠️ **首次登录后请立即修改密码！**

## 📝 环境变量配置

编辑 `.env` 文件：

```env
# 数据库配置（必填）
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sauna_membership

# 可选: 自定义回退主机（逗号分隔）
# DB_HOST_FALLBACKS=host.docker.internal,172.17.0.1
# DB_CONNECT_TIMEOUT=5000

# 服务端口
PORT=4000

# JWT 密钥（必改）
JWT_SECRET=your_random_secret_key_at_least_32_characters
```

## 📂 项目结构

```
.
├── src/              # React 前端源码
├── public/           # 静态资源
├── dist/             # 构建产物
├── server.js         # 统一服务器（API + 静态文件）
├── start.sh          # 一键启动脚本
├── Dockerfile        # Docker 镜像
├── docker-compose.yml # Docker 编排
├── package.json      # 依赖配置
└── .env.example      # 环境变量模板
```

## 🛠️ 开发模式

```bash
# 前端开发服务器（带热重载）
pnpm run dev

# 后端开发服务器（在另一个终端）
pnpm run dev:server
```

访问 http://localhost:3000 （前端） + http://localhost:4000 （后端）

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t sauna-management .
```

### 运行容器

```bash
docker run -d \
  --name sauna-app \
  -p 4000:4000 \
  --env-file .env \
  sauna-management
```

### 使用 Docker Compose

```bash
# 启动
docker compose up -d

# 查看日志
docker compose logs -f

# 停止
docker compose down
```

## 📊 数据管理

### 备份数据

在系统"设置"页面点击"创建备份"，会导出所有数据到 Excel 文件。

或直接备份 MySQL 数据库：

```bash
mysqldump -u root -p sauna_membership > backup.sql
```

### 恢复数据

```bash
mysql -u root -p sauna_membership < backup.sql
```

## 🔧 常见问题

> 💡 **完整故障排除指南**: 请阅读 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 获取详细的排查步骤。

### Q: 启动失败，提示数据库连接错误？

**A**: 
1. 确认 MySQL 已启动：`systemctl status mysql`
2. 检查 `.env` 中的数据库配置
3. 测试连接：`mysql -u root -p`

### Q: 启动时提示 "SyntaxError: Unexpected token '||='"？

**A**: 这是因为 Node.js 版本过低（< 18）。解决方法：
1. 运行 `node -v` 检查版本
2. 升级 Node.js 至 18 或更高版本（推荐使用 [nvm](https://github.com/nvm-sh/nvm)）
3. 升级后重新运行 `./start.sh`

### Q: 启动时提示 "ENOENT: no such file or directory, stat dist/static/index.html"？

**A**: 这是因为前端未构建或构建失败。解决方法：
1. 手动运行构建：`pnpm run build`
2. 确认 `dist/static/index.html` 文件存在
3. 使用 `./start.sh` 脚本启动，它会自动检测并构建

**注意**：如果部署到生产服务器，必须确保：
- 运行过 `pnpm run build`
- `dist/` 目录已复制到服务器
- 或使用 `./start.sh` 自动构建

### Q: 端口 4000 被占用？

**A**: 修改 `.env` 中的 `PORT=4000` 为其他端口，如 `PORT=5000`

### Q: 忘记管理员密码？

**A**: 重新初始化数据库即可重置为默认密码 `123456`

### Q: Docker 容器无法连接宿主机 MySQL？

**A**: 
- Linux: 使用 `DB_HOST=172.17.0.1`（Docker 网桥地址）
- Mac/Windows: 使用 `DB_HOST=host.docker.internal`

## 🔐 安全建议

1. ✅ 修改默认管理员密码
2. ✅ 设置强壮的 JWT_SECRET
3. ✅ 使用复杂的 MySQL 密码
4. ✅ 生产环境启用 HTTPS
5. ✅ 限制 MySQL 端口访问
6. ✅ 定期备份数据

## 📈 性能优化

- 数据库索引已优化
- 前端资源已压缩（Gzip）
- 使用数据库连接池
- Docker 多阶段构建减小镜像体积

## 🆕 版本历史

- **v1.0.0** (2025-01-05)
  - 前后端一体化架构
  - 自动初始化数据库
  - 自动创建管理员账户
  - 简化部署流程

## 📄 许可证

项目编号: 7537996892644704512

---

## 🙋 技术支持

如遇问题：
1. 查看上方常见问题
2. 检查日志：`docker compose logs` 或查看终端输出
3. 提交 Issue

**祝使用愉快！** 🎉
