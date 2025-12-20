# 汗蒸系统快速开始指南

## 系统三端概览

本系统分为三个独立的应用端：

```
┌─────────────────────────────────────────────────────────┐
│                   汗蒸门店管理系统                      │
├─────────────────────────────────────────────────────────┤
│  用户端(User)      │  员工端(Staff)    │  管理端(Admin)  │
│  /login           │  /staff-login     │  (集成在用户端) │
│  /dashboard       │  /staff/dashboard │                 │
│  /personal ⭐      │  /staff/member... │                 │
└─────────────────────────────────────────────────────────┘
```

## 启动应用

### 开发环境

```bash
# 安装依赖
pnpm install

# 启动开发服务器（用户端/管理端）
pnpm dev

# 访问 http://localhost:3000
```

### 生产构建

```bash
npm run build
npm start
```

## 快速演示（员工端核销流程）

### 第一步：员工登录

```
访问：http://localhost:3000/staff-login

演示账号：
  账号：staff01
  密码：123456
```

### 第二步：进入员工工作台

```
登录后自动跳转到：/staff/dashboard

见到的内容：
  ✓ 今日核销统计
  ✓ 今日购买统计
  ✓ 快速操作按钮
    - 会员查询与核销 ⭐ 【关键功能】
    - 手动录入购买（未实现）
    - 核销记录查询（未实现）
```

### 第三步：会员查询与核销（核心功能）

```
点击 "会员查询与核销" → 进入 /staff/member-query

操作流程：
1. 在搜索框输入会员信息
   - 手机号（例如：13812345678）
   - 或姓名（例如：张三）
   - 点击"查询"按钮

2. 显示会员信息卡片：
   - 会员名称、手机号、加入时间
   - 【若为分销商】显示等级和邀请码
   - 可用次数、即将过期次数
   - 活跃次卡列表（每张卡的剩余次数、有效期）

3. 执行核销：
   - 点击"执行核销"按钮
   - 弹出核销对话框
   - 选择扣次数（默认1次，支持1-N次）
   - 可选：填写备注（例如"同行2人"）
   - 点击"确认核销"

4. 核销完成：
   - 显示成功提示
   - 会员信息自动刷新
   - 显示更新后的剩余次数
   - 核销记录出现在右侧"近期核销记录"列表

【效果演示】
核销前：可用次数 10次
核销1次后：可用次数 9次
```

## 快速演示（用户端个人中心）

### 第一步：用户登录

```
访问：http://localhost:3000/login

演示账号：
  username: user01 (通常注册时创建)
  password: (任意密码)

💡 首次使用可先创建测试会员
```

### 第二步：进入个人中心

```
登录后点击左侧菜单 或直接访问：/personal

见到的内容：
1. 【顶部信息卡片】
   - 会员名称
   - 手机号
   - 加入时间
   - 会员码（用于扫码）

2. 【次卡统计概览】
   ✓ 可用次数：100 次
   ✓ 即将过期：5 次（7天内）
   ✓ 已过期：2 次
   ✓ 历史核销：23 次

3. 【活跃次卡列表】
   │ 10次卡 | 剩余9次 | 购买于2024-1-15 | 有效期至2024-7-15 │
   │ 5次卡  | 剩余5次 | 购买于2024-2-20 | 有效期至2024-8-20 │

4. 【购买记录】最近5条
   时间 | 套餐 | 金额 | 状态
   2024-02-20 10:30 | 10次卡 | ¥99.00 | 已确认
   2024-01-15 14:20 | 10次卡 | ¥99.00 | 已确认

5. 【消费记录（核销）】最近5条
   时间 | 扣次 | 状态
   2024-02-28 10:30 | -1次 | ✓
   2024-02-27 09:15 | -1次 | ✓

6. 【功能快捷导航】
   [ 购买次卡 ] - 跳转到充值页面
   [ 消费记录 ] - 查看所有核销记录
   [ 分销中心 ] - 邀请好友赚佣金（未实现）
```

## 核心功能演示矩阵

### 员工端功能

| 功能 | 页面 | 路由 | 状态 | 说明 |
|------|------|------|------|------|
| 员工登录 | StaffLogin | `/staff-login` | ✅ 完成 | 演示账号：staff01/123456 |
| 工作台 | StaffDashboard | `/staff/dashboard` | ✅ 完成 | 统计、快捷操作 |
| **会员查询与核销** | StaffMemberQuery | `/staff/member-query` | ✅ 完成 | **核心功能** |
| 手动录入购买 | ManualPurchase | `/staff/manual-purchase` | ⏳ 未实现 | 为会员手动添加次卡 |
| 记录查询 | RecordQuery | `/staff/records` | ⏳ 未实现 | 本门店的记录查询 |

### 用户端功能

| 功能 | 页面 | 路由 | 状态 | 说明 |
|------|------|------|------|------|
| 用户登录 | Login | `/login` | ✅ 完成 | 原有功能 |
| **个人中心** | PersonalCenter | `/personal` | ✅ 完成 | **新增，显示次卡和佣金** |
| 仪表盘 | Dashboard | `/dashboard` | ✅ 完成 | 原有功能 |
| 消费记录 | ConsumptionLogs | `/consumptions` | ✅ 完成 | 原有功能 |
| 充值购买 | Recharges | `/recharges` | ✅ 完成 | 原有功能 |
| 次卡目录 | MemberCards | `/member-cards` | ✅ 完成 | 原有功能 |
| 会员管理 | Members | `/members` | ✅ 完成 | 原有功能 |
| 设置 | Settings | `/settings` | ✅ 完成 | 原有功能 |

### 管理端功能

| 功能 | 位置 | 状态 | 说明 |
|------|------|------|------|
| 套餐配置 | Settings | ⏳ 待集成 | 配置次卡类型 |
| 购买记录管理 | Settings | ⏳ 待集成 | 查看、作废、退款 |
| 核销记录审计 | Settings | ⏳ 待集成 | 撤销核销、查看日志 |
| 佣金对账 | Settings | ⏳ 待集成 | 佣金统计、提现 |
| 门店管理 | Settings | ⏳ 待集成 | 配置门店和员工 |

## API和数据结构

### 核心API（lib/sessionManagement.ts）

```typescript
// 次卡查询
calculateSessionBalance(userId)        // 计算会话余额统计
getUserActivePackages(userId)           // 获取活跃次卡
getUserPackages(userId)                 // 获取所有次卡

// 购买流程
createPurchaseRecord(...)               // 创建购买并生成次卡实例

// 核销流程 ⭐ 关键
selectPackageToDeduct(userId, sessions, storeId)  // FEFO选卡
executeRedemption(userId, storeId, staffId, sessions, remark)  // 执行核销

// 修正操作
voidRedemptionRecord(redemptionId, adminId, reason)  // 撤销核销
voidPurchaseRecord(purchaseId, adminId, reason)      // 作废购买

// 查询接口
queryMemberForStaff(userId)             // 员工查询会员（包含统计）
getUserRedemptionRecords(userId, limit) // 获取核销记录
getUserPurchaseRecords(userId, limit)   // 获取购买记录
```

### 关键数据模型

```typescript
// 用户持有的次卡实例
interface UserPackage {
  id: string;                  // 卡实例ID
  userId: string;
  packageId?: string;          // 套餐模板ID
  totalSessions: number;       // 总次数
  remainingSessions: number;   // 剩余次数 ← 核销时更新这个
  priceAmount: number;         // 购买金额
  purchasedAt: string;
  expiresAt: string;          // 过期时间 ← FEFO使用这个
  status: 'active' | 'expired' | 'void' | 'refunded';
}

// 核销记录
interface RedemptionRecord {
  id: string;
  userId: string;
  storeId: string;
  staffId: string;            // 操作员工
  userPackageId: string;      // 扣自哪张卡
  sessionsDeducted: number;   // 扣了几次
  occurredAt: string;
  status: 'confirmed' | 'void';
}

// 购买记录
interface PurchaseRecord {
  id: string;
  userId: string;
  storeId: string;
  packageId?: string;
  sessionsAdded: number;
  amount: number;             // 佣金基数
  status: 'confirmed' | 'void' | 'refunded';
  occurredAt: string;
}

// 次数调整（补次/修正）
interface SessionAdjustment {
  id: string;
  userId: string;
  deltaSessions: number;      // 正数补次，负数扣次
  reason: string;
  relatedRecordId?: string;   // 关联的核销ID
}
```

## 数据流演示

### 场景1：员工为用户核销1次汗蒸

```
初始状态：
  用户A有10次卡，剩余10次，2024-7-15过期
  用户A有5次卡，剩余5次，2024-8-15过期

员工操作流程：
  1. 扫码或搜索 → 找到用户A
  2. 显示：可用次数 15次
        活跃次卡：10次（剩9）、5次（剩5）
  3. 点击"执行核销"
  4. 系统自动选择：10次卡（2024-7-15，最早过期）← FEFO
  5. 扣1次
  6. 确认

结果：
  - 10次卡：剩余从10→9
  - 5次卡：剩余保持5
  - 可用次数：15→14
  - 创建redemption_record（用户A, 扣自10次卡, -1次）
  - 创建audit_log（员工staff01操作）
```

### 场景2：管理员撤销核销

```
初始状态：
  redemption_record: id=RD001, 用户A, -1次, 10次卡, status=confirmed

管理员操作：
  1. 进入核销管理页面
  2. 找到RD001
  3. 点击"撤销"
  4. 输入原因："扣错了"
  5. 确认

处理流程：
  1. redemption_record.status = 'void'
  2. user_package(10次卡).remainingSessions += 1 (9→10)
  3. 创建session_adjustment (reason="撤销核销:扣错了", delta=+1)
  4. 创建audit_log (admin操作)

结果：
  - 用户可用次数恢复：14→15
  - 10次卡恢复：9→10
  - 保留完整的操作记录
```

### 场景3：用户购买次卡并触发分销佣金

```
初始状态：
  用户B被用户A邀请（邀请关系active）
  用户A是分销商，等级gold（佣金比例10%）

用户B购买流程：
  1. 购买10次卡，¥99
  2. 创建purchase_record (用户B, +10次, ¥99, status=confirmed)
  3. 创建user_package (用户B, 10次卡实例)
  4. 系统查找邀请关系 → 找到邀请人用户A
  5. 根据用户A的等级(gold)，计算佣金 = ¥99 × 10% = ¥9.9
  6. 创建commission_record (分销商A, 来自用户B的购买, ¥9.9, status=pending)

结果：
  - 用户B: 新增10次卡，剩余10次
  - 用户A: 新增待审核佣金¥9.9
  - 管理员审核后标记commission_record.status = available
  - 用户A可以在分销中心看到并提现
```

## 部署清单

### 本地开发
- [x] 项目构建成功
- [x] TypeScript编译通过（有linting警告但可运行）
- [x] 员工端核销功能完整
- [x] 用户端个人中心完整

### 测试必做项
- [ ] 员工登录和扫码核销流程
- [ ] 用户端查看次卡和记录
- [ ] 购买后佣金自动生成
- [ ] 撤销核销后次数恢复
- [ ] 多张卡的FEFO选择

### 上线前准备
- [ ] 配置真实的套餐数据（package_config）
- [ ] 配置门店和员工账号（store, staff）
- [ ] 实现管理端配置页面
- [ ] 数据迁移和备份
- [ ] 员工培训文档

## 故障排查

### 问题：员工登录不成功
```
检查：
1. 确认输入账号 staff01，密码 123456
2. 检查 src/pages/StaffLogin.tsx 中的 DEMO_STAFF 配置
3. 清除浏览器缓存和localStorage
```

### 问题：核销后次数不减少
```
检查：
1. 确认user_package存在且status=active
2. 确认user_package.remainingSessions > 0
3. 查看浏览器console是否有错误
4. 检查localStorage中redemptionRecords是否被保存
```

### 问题：搜索会员找不到
```
检查：
1. 确认会员已创建（进入Members页面查看）
2. 确认搜索内容与会员名称或手机号匹配
3. 搜索时不要有多余的空格
4. 会员状态确保active
```

## 相关文档

- `IMPLEMENTATION_NOTES.md` - 详细实现说明
- `README.md` - 项目概述
- 源代码注释 - 每个核心函数都有详细注释

## 常见问题速查

| 问题 | 答案 |
|------|------|
| 员工端是什么？ | 为汗蒸门店员工设计的独立系统，用于核销（扣次）|
| 如何核销？ | 员工登录 → 搜索会员 → 执行核销 |
| 什么是FEFO？ | 优先扣最早到期的卡，避免用户因过期损失 |
| 佣金何时产生？ | 被邀请用户购买时自动生成 |
| 购买记录有什么用？ | 作为佣金、对账、退款的凭证 |
| 能同时持有多张卡吗？ | 可以，每张卡独立管理 |

---

**快速开始到此！更多详情见 IMPLEMENTATION_NOTES.md**
