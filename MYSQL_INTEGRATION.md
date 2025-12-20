# MySQL 数据库集成指南

## 概述

系统已完全集成 MySQL 数据库支持。所有数据现在存储在 MySQL 而不是 localStorage。

### 系统架构

```
前端 (React) 
    ↓
API 客户端 (apiClient.ts)
    ↓
Express 服务器 (server.js)
    ↓
MySQL 数据库
```

---

## 数据库配置

### 环境变量

在 `.env` 或 `.env.local` 中配置以下变量：

```env
# MySQL 配置
DB_HOST=127.0.0.1          # 数据库主机
DB_PORT=3306               # 数据库端口
DB_USER=root               # 数据库用户
DB_PASSWORD=               # 数据库密码（如果有）
DB_NAME=sauna_membership   # 数据库名称

# Docker 部署
# DB_HOST=172.17.0.1      # Linux Docker
# DB_HOST=host.docker.internal  # Mac/Windows Docker

# 认证
JWT_SECRET=your-secret-key # JWT密钥，改为强密码
CORS_ORIGIN=*              # CORS 源

# 服务器
PORT=4000                  # 服务器端口
NODE_ENV=production        # 环境（development/production）
```

### 数据库初始化

服务器启动时会自动：
1. 连接到 MySQL 服务器
2. 创建数据库（如果不存在）
3. 创建 `collections` 表
4. 初始化所有必要的 collections
5. 创建默认管理员账号

**默认管理员**：
- 用户名：admin
- 密码：123456

---

## 数据库架构

### Collections 存储结构

所有数据存储在一个通用的 `collections` 表中：

```sql
CREATE TABLE collections (
  name VARCHAR(100) PRIMARY KEY,
  data LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### 初始化的 Collections

| Collection | 用途 | 数据格式 |
|-----------|------|--------|
| members | 会员信息 | JSON 数组 |
| packageConfigs | 套餐配置 | JSON 数组 |
| userPackages | 用户次卡 | JSON 数组 |
| purchaseRecords | 购买记录 | JSON 数组 |
| redemptionRecords | 核销记录 | JSON 数组 |
| sessionAdjustments | 次数调整 | JSON 数组 |
| distributorProfiles | 分销商信息 | JSON 数组 |
| inviteBindings | 邀请关系 | JSON 数组 |
| commissionRecords | 佣金记录 | JSON 数组 |
| auditLogs | 操作日志 | JSON 数组 |
| accounts | 用户账号 | JSON 数组 |
| staffMembers | 员工 | JSON 数组 |

---

## API 端点说明

### 认证 API

#### 用户登录
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "admin",
    "username": "admin",
    "role": "admin",
    "name": "系统管理员",
    "email": ""
  }
}
```

#### 员工登录
```
POST /api/auth/staff-login
Content-Type: application/json

{
  "username": "staff01",
  "password": "123456"
}

Response:
{
  "token": "eyJhbGc...",
  "user": {
    "id": "S001",
    "username": "staff01",
    "role": "staff",
    "name": "张三",
    "storeId": "STORE001"
  }
}
```

### 会员管理 API

#### 获取所有会员
```
GET /api/members
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "USER123",
      "name": "张三",
      "phone": "13800138000",
      ...
    }
  ]
}
```

#### 搜索会员
```
GET /api/members/search?keyword=张三
Authorization: Bearer {token}

Response:
{
  "data": [...]
}
```

#### 创建会员
```
POST /api/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "李四",
  "phone": "13900139000",
  "email": "li@example.com"
}

Response:
{
  "data": {
    "id": "USER124",
    "name": "李四",
    ...
  }
}
```

### 套餐管理 API

#### 获取所有套餐
```
GET /api/packages
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "PKG001",
      "name": "10次卡",
      "totalSessions": 10,
      "priceAmount": 99,
      "validDays": 180,
      ...
    }
  ]
}
```

#### 创建套餐
```
POST /api/packages
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "20次卡",
  "totalSessions": 20,
  "priceAmount": 189,
  "validDays": 180,
  "applicableStoreScope": "all",
  "isActive": true
}

Response:
{
  "data": {
    "id": "PKG002",
    ...
  }
}
```

#### 更新套餐
```
PUT /api/packages/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "20次卡（更新）",
  "priceAmount": 179
}

Response:
{
  "data": {...}
}
```

#### 删除套餐
```
DELETE /api/packages/{id}
Authorization: Bearer {token}

Response:
{
  "ok": true
}
```

### 用户次卡 API

#### 获取用户的所有次卡
```
GET /api/users/{userId}/packages
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "UP001",
      "userId": "USER123",
      "totalSessions": 10,
      "remainingSessions": 8,
      "expiresAt": "2024-12-31T23:59:59Z",
      "status": "active"
    }
  ]
}
```

#### 获取用户的次数统计
```
GET /api/users/{userId}/package-balance
Authorization: Bearer {token}

Response:
{
  "data": {
    "availableSessions": 28,
    "expiringSessions": 5,
    "expiredSessions": 0,
    "redeemedSessions": 12,
    "totalSessions": 50
  }
}
```

### 购买记录 API

#### 创建购买记录
```
POST /api/purchase-records
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "USER123",
  "packageId": "PKG001",
  "sessionsAdded": 10,
  "amount": 99,
  "storeId": "STORE001",
  "staffId": "S001",
  "validDays": 180,
  "remark": "活动购买"
}

Response:
{
  "data": {
    "id": "PR001",
    "userId": "USER123",
    ...
  }
}
```

### 核销记录 API

#### 创建核销记录
```
POST /api/redemption-records
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": "USER123",
  "storeId": "STORE001",
  "staffId": "S001",
  "userPackageId": "UP001",
  "sessionsDeducted": 1,
  "remark": "同行1人"
}

Response:
{
  "data": {
    "id": "RD001",
    "userId": "USER123",
    ...
  }
}
```

#### 撤销核销记录
```
POST /api/redemption-records/{id}/void
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "操作错误"
}

Response:
{
  "data": {
    "id": "RD001",
    "status": "void",
    ...
  }
}
```

#### 获取核销记录
```
GET /api/redemption-records
Authorization: Bearer {token}

Response:
{
  "data": [...]
}
```

### 审计日志 API

#### 获取审计日志
```
GET /api/audit-logs
Authorization: Bearer {token}

Response:
{
  "data": [
    {
      "id": "AL001",
      "operatorId": "S001",
      "operatorRole": "staff",
      "action": "redemption",
      "resourceType": "user_package",
      "resourceId": "UP001",
      "changes": {...},
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 创建审计日志
```
POST /api/audit-logs
Authorization: Bearer {token}
Content-Type: application/json

{
  "operatorId": "S001",
  "operatorRole": "staff",
  "action": "redemption",
  "resourceType": "user_package",
  "resourceId": "UP001",
  "changes": {
    "remainingSessions": { "from": 10, "to": 9 }
  }
}

Response:
{
  "data": {...}
}
```

---

## 前端集成

### API 客户端 (src/lib/apiClient.ts)

所有 API 调用都通过统一的 API 客户端进行。

**基础用法**：

```typescript
import apiClient from '@/lib/apiClient';

// 搜索会员
const result = await apiClient.searchMembers('13800138000');

// 创建套餐
const pkg = await apiClient.createPackage({
  name: '30次卡',
  totalSessions: 30,
  priceAmount: 299,
  validDays: 180
});

// 创建核销记录
const redemption = await apiClient.createRedemption({
  userId: 'USER123',
  storeId: 'STORE001',
  staffId: 'S001',
  userPackageId: 'UP001',
  sessionsDeducted: 1
});
```

### 会话管理适配层 (src/lib/sessionManagementAdapter.ts)

提供自动选择 API 或 localStorage 的适配器：

```typescript
import * as session from '@/lib/sessionManagementAdapter';

// 获取用户次数余额（自动使用API）
const balance = await session.getSessionBalance(userId);

// 执行核销操作
const result = await session.executeRedemption(
  userId,
  storeId,
  staffId,
  sessionsToDeduct,
  remark
);

// 搜索会员
const memberData = await session.queryMemberForStaff(userId);
```

### 页面集成

页面已更新为使用 API：

- **StaffLogin.tsx** - 员工登录
- **StaffMemberQuery.tsx** - 会员查询与核销
- **StaffManualPurchase.tsx** - 手动录入购买
- **StaffRecords.tsx** - 记录查询
- **AdminPackageManagement.tsx** - 套餐管理
- **PersonalCenter.tsx** - 个人中心
- **DistributorCenter.tsx** - 分销中心

---

## 故障排查

### MySQL 连接失败

**症状**：服务器无法连接到 MySQL

**解决步骤**：

1. 检查 MySQL 是否运行：
```bash
mysql -u root -p -e "SELECT 1;"
```

2. 检查环境变量：
```bash
echo $DB_HOST
echo $DB_USER
```

3. Docker 环境下，使用正确的主机：
```bash
# Linux
DB_HOST=172.17.0.1

# Mac/Windows
DB_HOST=host.docker.internal
```

### API 响应 500 错误

**症状**：API 调用返回 500 错误

**排查步骤**：

1. 检查服务器日志：
```bash
npm run dev 2>&1 | grep -i error
```

2. 验证请求数据格式
3. 检查 MySQL 中的数据有效性

### 数据不一致

**症状**：前端显示的数据与数据库不符

**解决方法**：

1. 刷新浏览器页面
2. 清除浏览器缓存
3. 检查 collections 表的数据

---

## 性能优化

### 数据库查询优化

- 使用索引加速查询
- 限制结果数量
- 缓存频繁查询的数据

### 改进建议

1. **添加真正的关系表**而不是 JSON 存储：
```sql
CREATE TABLE members (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  created_at TIMESTAMP
);

CREATE TABLE user_packages (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  package_id VARCHAR(50),
  total_sessions INT,
  remaining_sessions INT,
  expires_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES members(id)
);
```

2. **添加数据库索引**：
```sql
CREATE INDEX idx_members_phone ON members(phone);
CREATE INDEX idx_user_packages_user_id ON user_packages(user_id);
CREATE INDEX idx_redemption_records_user_id ON redemption_records(user_id);
```

3. **定期数据库维护**：
```sql
-- 备份数据
mysqldump -u root sauna_membership > backup.sql

-- 优化表
OPTIMIZE TABLE collections;
```

---

## 安全建议

### 生产环境

1. **更改默认密码**：
```bash
# 登录后立即修改密码
UPDATE collections SET data = JSON_SET(data, 
  '$[0].password', 'bcrypt_hashed_password'
) WHERE name = 'accounts';
```

2. **启用 HTTPS**：
在生产环境中必须使用 HTTPS

3. **安全的 JWT Secret**：
```bash
export JWT_SECRET="$(openssl rand -hex 32)"
```

4. **数据库备份**：
```bash
# 定期备份
mysqldump -u root -p sauna_membership > backup-$(date +%Y%m%d).sql
```

---

## 监控和维护

### 健康检查

```bash
curl http://localhost:4000/api/health
```

### 查看数据库状态

```sql
SELECT name, LENGTH(data) as data_size 
FROM collections 
ORDER BY data_size DESC;
```

### 清理过期数据

```sql
-- 查看某个collection的数据量
SELECT name, LENGTH(data) FROM collections;

-- 定期清理旧日志
UPDATE collections SET data = '[]' WHERE name = 'auditLogs';
```

---

## 迁移指南

### 从 localStorage 到 MySQL

系统已支持自动迁移：

1. 启动服务器，MySQL 会自动初始化
2. 第一次登录时，系统会从 localStorage 迁移数据（如果存在）
3. 后续所有操作都使用 MySQL

### 数据导出

```bash
# 导出为 SQL
mysqldump -u root sauna_membership > backup.sql

# 导出为 JSON
curl http://localhost:4000/api/bootstrap > data.json
```

### 数据导入

```bash
# 从 SQL 恢复
mysql -u root sauna_membership < backup.sql

# 从 JSON 导入（通过 API）
curl -X POST http://localhost:4000/api/import \
  -H "Content-Type: application/json" \
  -d @data.json
```

---

## 常见问题

### Q: 如何重置数据？
A: 删除 `sauna_membership` 数据库，重启服务器将重新初始化。

### Q: 如何备份和恢复？
A: 使用 `mysqldump` 工具备份，使用 `mysql` 命令恢复。

### Q: 支持多用户并发吗？
A: 是的，MySQL 支持多并发连接。建议配置连接池大小。

### Q: 如何扩展数据库？
A: 在 server.js 中添加新的 API 端点和 collections。

---

*最后更新：2024年*
*MySQL 集成状态：✅ 完成*
