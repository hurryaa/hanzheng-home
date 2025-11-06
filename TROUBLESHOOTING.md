# 故障排除指南 (Troubleshooting Guide)

本文档提供常见问题的解决方案，帮助您快速排查和修复启动问题。

## 📋 目录

1. [Node.js 版本问题](#nodejs-版本问题)
2. [构建失败问题](#构建失败问题)
3. [数据库连接问题](#数据库连接问题)
4. [其他常见问题](#其他常见问题)

---

## Node.js 版本问题

### 症状: `SyntaxError: Unexpected token '||='`

```
(node:5117) UnhandledPromiseRejectionWarning: SyntaxError: Unexpected token '||='
at Loader.moduleStrategy (internal/modules/esm/translators.js:145:18)
```

### 原因
您的 Node.js 版本过低（< 18）。此项目使用了 ES2021 语法特性（如 `||=` 运算符），需要 Node.js 18 或更高版本。

### 解决方案

#### 方式一: 使用 nvm (推荐)

nvm (Node Version Manager) 可以让您轻松管理多个 Node.js 版本。

```bash
# 1. 安装 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 2. 重新加载终端配置
source ~/.bashrc  # 或 source ~/.zshrc

# 3. 安装 Node.js 18
nvm install 18

# 4. 使用 Node.js 18
nvm use 18

# 5. 设置默认版本
nvm alias default 18

# 6. 验证版本
node -v  # 应显示 v18.x.x
```

#### 方式二: 使用官方包管理器

**CentOS / RHEL / AlmaLinux:**
```bash
# 1. 添加 NodeSource 仓库
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -

# 2. 安装 Node.js
sudo yum install -y nodejs

# 3. 验证版本
node -v
```

**Ubuntu / Debian:**
```bash
# 1. 添加 NodeSource 仓库
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -

# 2. 安装 Node.js
sudo apt-get install -y nodejs

# 3. 验证版本
node -v
```

#### 方式三: 从官方下载

访问 [Node.js 官网](https://nodejs.org/en/download/) 下载并安装 LTS 版本（18.x 或更高）。

### 验证修复

```bash
# 检查 Node.js 版本
node -v

# 应该显示 v18.x.x 或更高
# 然后重新运行启动脚本
./start.sh
```

---

## 构建失败问题

### 症状: `ENOENT: no such file or directory, stat dist/static/index.html`

```
Error: ENOENT: no such file or directory, stat '/path/to/dist/static/index.html'
```

### 原因
前端代码未构建或构建失败。

### 解决方案

#### 1. 手动构建
```bash
pnpm run build
```

如果构建成功，应该看到：
```
✓ 693 modules transformed.
dist/static/index.html                         1.09 kB │ gzip:   0.52 kB
dist/static/assets/...
```

#### 2. 检查构建产物
```bash
ls -la dist/static/index.html
```

应该看到该文件存在。

#### 3. 使用启动脚本（推荐）
```bash
./start.sh
```

启动脚本会自动检测并构建。

### 生产服务器部署注意事项

如果您在生产服务器上部署，有两种方式：

**方式一：在服务器上构建**
```bash
# 1. 上传代码到服务器
# 2. 运行启动脚本（自动构建）
./start.sh
```

**方式二：本地构建后上传**
```bash
# 本地机器:
pnpm install
pnpm run build

# 上传以下文件/目录到服务器:
# - dist/
# - server.js
# - node_modules/
# - package.json
# - .env

# 服务器:
NODE_ENV=production node server.js
```

---

## 数据库连接问题

### 症状: `Error: connect ECONNREFUSED 127.0.0.1:3306`

### 原因
1. MySQL 未启动
2. MySQL 连接配置错误
3. MySQL 不允许远程连接（Docker）

### 解决方案

#### 1. 检查 MySQL 状态
```bash
# CentOS/RHEL
sudo systemctl status mysql
# 或
sudo systemctl status mysqld

# 如果未启动，启动它
sudo systemctl start mysql
sudo systemctl enable mysql  # 开机自启
```

#### 2. 检查 .env 配置
```bash
cat .env

# 确保以下配置正确:
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密码
DB_NAME=sauna_membership
```

#### 3. 测试 MySQL 连接
```bash
mysql -h 127.0.0.1 -u root -p
# 输入密码
```

如果无法连接，检查密码是否正确。

#### 4. Docker 连接宿主机 MySQL

**⚠️ 重要**: Docker 部署时，**不能使用 `127.0.0.1` 或 `localhost`**

如果使用 Docker 部署，需要特殊配置：

**Linux:**
```env
DB_HOST=172.17.0.1
```

**Mac / Windows:**
```env
DB_HOST=host.docker.internal
```

> 💡 **快速修复**: 使用 `./docker-start.sh` 脚本会自动检测并配置正确的 DB_HOST

#### 5. 检查 MySQL 绑定地址

Docker 需要 MySQL 允许外部连接：

```bash
# 编辑 MySQL 配置
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf

# 确保 bind-address 为:
bind-address = 0.0.0.0

# 重启 MySQL
sudo systemctl restart mysql

# 验证监听
sudo netstat -tuln | grep 3306
# 应该看到: 0.0.0.0:3306
```

#### 6. 测试 Docker 网络连接

```bash
# Linux: 测试到宿主机的连接
docker run --rm mysql:8.0 mysql -h 172.17.0.1 -u root -p

# Mac/Windows: 测试到宿主机的连接  
docker run --rm mysql:8.0 mysql -h host.docker.internal -u root -p
```

---

## 其他常见问题

### Q: 端口 4000 被占用

**症状:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**解决方案:**
```bash
# 1. 查找占用端口的进程
lsof -i :4000
# 或
netstat -tuln | grep 4000

# 2. 杀死进程
kill -9 <PID>

# 3. 或修改端口
nano .env
# 修改 PORT=5000

# 4. 重启服务
./start.sh
```

### Q: pnpm 未安装

**症状:**
```
❌ 错误: 未检测到 pnpm
```

**解决方案:**
```bash
# 方式一: 使用 npm
npm install -g pnpm

# 方式二: 使用官方脚本
curl -fsSL https://get.pnpm.io/install.sh | sh -

# 验证
pnpm -v
```

### Q: 权限错误 (Permission denied)

**症状:**
```
bash: ./start.sh: Permission denied
```

**解决方案:**
```bash
chmod +x start.sh
./start.sh
```

### Q: 忘记管理员密码

**解决方案:**

删除数据库中的账户数据，系统会重新创建默认管理员账户：

```bash
# 连接 MySQL
mysql -u root -p

# 删除账户数据
USE sauna_membership;
UPDATE collections SET data = '[]' WHERE name = 'accounts';
exit;

# 重启服务
./start.sh

# 默认账户:
# 用户名: admin
# 密码: 123456
```

### Q: 构建速度慢

**解决方案:**
```bash
# 使用国内镜像源
pnpm config set registry https://registry.npmmirror.com
pnpm install
pnpm run build
```

---

## 🔍 调试技巧

### 查看详细日志
```bash
# 开发模式运行（更多日志）
NODE_ENV=development node server.js
```

### 检查系统要求
```bash
# 检查 Node.js 版本
node -v  # 应该 >= 18

# 检查 pnpm 版本
pnpm -v  # 应该 >= 8

# 检查 MySQL 版本
mysql --version  # 应该 >= 8.0
```

### 清理重建
```bash
# 1. 删除依赖和构建
rm -rf node_modules dist

# 2. 重新安装和构建
pnpm install
pnpm run build

# 3. 启动
./start.sh
```

---

## 📞 获取帮助

如果以上方法都无法解决问题：

1. 检查完整的错误日志
2. 确认系统环境符合要求
3. 查看 [README.md](./README.md) 中的详细说明
4. 提交 Issue，包含：
   - 操作系统版本
   - Node.js 版本 (`node -v`)
   - 错误的完整日志
   - 您已尝试的解决方法

---

**祝使用顺利！** 🎉
