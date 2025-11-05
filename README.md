# 汗蒸会员管理系统

基于 React + TypeScript + Vite + MySQL 的全栈会员管理系统，适用于汗蒸养生馆等服务行业的会员、充值、消费、次卡等业务管理。

## ✨ 功能特点

### 📊 核心功能
- **仪表盘分析**：数据统计、图表展示、营收趋势分析、时间范围筛选
- **会员管理**：会员信息CRUD、次卡分配、批量操作、快速查询
- **充值管理**：充值记录管理、多种支付方式、记录导出
- **消费管理**：消费记录跟踪、次卡使用统计、筛选导出
- **次卡管理**：次卡类型配置、有效期管理、价格设置
- **预约管理**：服务预约、状态跟踪
- **系统设置**：商家信息、服务类别、通知配置

### 🔐 权限管理
- **账号管理**：系统用户账号创建、角色分配、状态管理
- **成员控制**：员工信息管理、团队分组、职务配置
- **权限管理**：角色权限配置、细粒度权限控制
- **操作记录**：完整的操作日志、审计追踪

### 📁 数据管理
- **Excel导入导出**：支持会员、充值、消费数据批量导入导出
- **数据模板**：提供标准数据模板下载
- **数据备份**：一键备份所有数据到Excel文件
- **MySQL存储**：数据持久化存储到MySQL数据库

### ♿ 无障碍支持
- 完整的键盘导航
- 屏幕阅读器支持
- 主题切换（浅色/深色模式）
- 焦点管理和跳转链接

## 🚀 快速开始

> **新用户？** 查看 [快速开始指南 (QUICKSTART.md)](./QUICKSTART.md) - 5分钟快速部署！

### 环境要求

- Node.js 18+ 
- pnpm 8+
- MySQL 5.7+ 或 8.0+ (需提前安装并启动)

### 本地开发

1. **克隆项目**
```bash
git clone <repository-url>
cd <project-directory>
```

2. **配置环境变量**

复制环境变量文件：
```bash
cp .env.example .env
```

编辑 `.env` 配置数据库连接和其他参数：
```env
# 数据库配置
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=sauna_membership

# JWT密钥（请修改为随机字符串）
JWT_SECRET=your_random_secret_key_at_least_32_characters

# API地址
VITE_API_URL=http://localhost:4000/api
```

3. **安装依赖**

前端：
```bash
pnpm install
```

后端：
```bash
cd server
npm install
cd ..
```

4. **初始化数据库**

确保MySQL服务已启动，然后运行：
```bash
cd server
npm run migrate
cd ..
```

5. **启动开发服务器**

启动后端API服务（终端1）：
```bash
cd server
npm run dev
```

启动前端开发服务器（终端2）：
```bash
pnpm run dev
```

6. **访问应用**
```
前端: http://localhost:3000
后端API: http://localhost:4000
```

### 默认账号

- 用户名: `admin`
- 密码: `admin123`

⚠️ **首次登录后请立即修改默认密码！**

## 📦 生产部署

### Docker 部署

**前置条件**：确保 MySQL 已在宿主机安装并启动（端口 3306）

1. **准备 `.env` 文件**

复制并编辑环境变量文件，配置宿主机 MySQL 的连接信息：
```bash
cp .env.example .env
# 编辑 .env，填入宿主机 MySQL 的用户名和密码
```

示例配置：
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=sauna_membership
```

> Docker 后端容器将使用 `host` 网络模式直接连接宿主机的 MySQL。

2. **构建并启动服务**
```bash
docker compose up -d --build
```

或使用提供的脚本：
```bash
./start-docker.sh
```

容器说明：
- `backend`：Express + Node.js API 服务（通过 host 网络访问宿主机 MySQL）
- `frontend`：Nginx 托管的前端静态资源

3. **查看日志**
```bash
docker compose logs -f
```

4. **停止服务**
```bash
docker compose down
```

访问地址：
- 前端：`http://localhost:${FRONTEND_PORT:-8080}`（默认 `http://localhost:8080`）
- 后端：`http://localhost:${SERVER_PORT:-4000}`（默认 `http://localhost:4000`）
- 数据库：使用宿主机 `localhost:3306`

### 传统部署

1. **构建前端**
```bash
pnpm run build
```

2. **配置Nginx**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        root /path/to/dist/static;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

3. **启动后端服务**
```bash
cd server
npm start
```

### Vercel 部署

本项目支持部署到 Vercel 预览前端页面。

1. **安装 Vercel CLI**
```bash
npm install -g vercel
```

2. **配置环境变量**

在 Vercel Dashboard 中设置：
- `VITE_API_URL`: 后端API地址（例如：`https://api.yourdomain.com/api`）

3. **部署**
```bash
vercel --prod
```

⚠️ **注意**: Vercel部署仅包含前端静态资源。后端API需要单独部署到支持Node.js的服务器。

## 📂 项目结构

```
.
├── .env.example          # 根环境变量示例
├── public/               # 静态资源
│   └── templates/       # Excel导入模板
├── server/              # 后端服务
│   ├── Dockerfile       # 后端镜像构建文件
│   ├── src/
│   │   ├── config.js   # 配置文件
│   │   ├── db/         # 数据库连接
│   │   ├── models/     # 数据模型
│   │   ├── routes/     # API路由
│   │   └── index.js    # 入口文件
│   ├── package.json
│   └── .env.example    # 后端环境变量示例（可选）
├── src/                 # 前端源码
│   ├── components/     # 通用组件
│   │   └── settings/  # 设置页面组件
│   ├── contexts/      # React Context
│   ├── hooks/         # 自定义Hooks
│   ├── lib/           # 工具库
│   │   ├── apiClient.ts # API客户端
│   │   ├── db.ts        # 数据库服务
│   │   └── utils.ts     # 工具函数
│   ├── pages/         # 页面组件
│   ├── stores/        # Zustand状态管理
│   └── main.tsx       # 应用入口
├── docker-compose.yml  # Docker 编排配置
├── Dockerfile         # 前端镜像构建文件
├── vercel.json        # Vercel 配置
└── README.md          # 项目文档
```

## 🔧 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI**: Tailwind CSS
- **路由**: React Router 7
- **状态管理**: Zustand
- **图表**: Recharts
- **表单验证**: Zod
- **Excel处理**: XLSX
- **通知**: Sonner
- **动画**: Framer Motion

### 后端
- **运行时**: Node.js
- **框架**: Express
- **数据库**: MySQL 8.0
- **安全**: Helmet, CORS
- **认证**: JWT, bcryptjs
- **日志**: Morgan

## 📊 数据模板

系统提供了标准的Excel导入模板，位于 `public/templates/` 目录：

### 会员导入模板
```
姓名,手机号,余额,入会日期,备注
张三,13800138000,500,2024-01-01,VIP会员
李四,13900139000,1000,2024-01-05,普通会员
```

导入时请确保：
- 手机号格式正确（11位数字）
- 日期格式为 YYYY-MM-DD
- 余额为数字类型

## 🔐 安全建议

1. **修改默认密码**: 首次登录后立即修改admin账号密码
2. **JWT密钥**: 在 `.env` 中设置强壮的 `JWT_SECRET`
3. **数据库密码**: 使用强密码保护数据库
4. **HTTPS**: 生产环境务必使用HTTPS
5. **防火墙**: 限制数据库端口只能本地访问
6. **定期备份**: 定期备份数据库数据

## 🤝 开发指南

### 添加新的数据集合

1. 在 `server/src/config.js` 中注册集合名称
2. 在前端 `src/lib/db.ts` 中添加类型定义
3. 创建对应的CRUD函数

### API开发

所有API路由位于 `server/src/routes/` 目录，遵循RESTful规范：
- GET `/api/collections/:name` - 获取集合数据
- PUT `/api/collections/:name` - 更新集合数据
- DELETE `/api/collections/:name` - 清空集合

### 前端状态管理

系统使用统一的 `DBService` 管理数据：
```typescript
import { DBService } from '@/lib/db';

const db = DBService.getInstance();
const members = db.getCollection('members');
db.saveCollection('members', updatedMembers);
```

## 📝 常见问题

### Q: 数据库连接失败？
A: 检查MySQL服务是否启动，确认 `.env` 配置正确（特别是 DB_HOST、DB_USER、DB_PASSWORD）。

### Q: 前端无法连接后端？
A: 确认后端服务已启动在4000端口，检查 `.env` 中的 `VITE_API_URL` 配置正确，以及 CORS 配置。

### Q: Docker 部署后无法访问？
A: 
1. 检查 `.env` 配置中的 `VITE_API_URL` 是否正确
2. 确保 MySQL 容器已启动：`docker compose ps`
3. 查看容器日志：`docker compose logs backend`、`docker compose logs mysql`

### Q: Excel导入失败？
A: 确保Excel文件格式与模板一致，检查数据类型正确性。

### Q: 如何重置管理员密码？
A: 直接连接MySQL执行：
```sql
UPDATE collections 
SET data = JSON_REPLACE(data, '$[0].password', '新密码哈希') 
WHERE name = 'accounts';
```

## 📄 许可证

项目编号: 7537996892644704512

本项目由 [网站开发专家](https://space.coze.cn/) 创建。

---

## 🆘 技术支持

如有问题或建议，请提交 Issue 或联系技术支持团队。
