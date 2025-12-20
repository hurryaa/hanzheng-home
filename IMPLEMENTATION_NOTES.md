# 汗蒸系统重构实现文档

## 概览

本次重构将原有的简单会员管理系统升级为完整的汗蒸门店管理系统，包括：
- **用户端H5**：查看次卡、消费记录、分销佣金
- **员工端（Staff）**：扫码核销、会员查询、购买录入（新增）
- **管理端（Admin）**：规则配置、记录管理、对账（现有）

## 核心改进

### 1. 新增数据结构（lib/types.ts）

**门店和员工管理**：
- `Store`：门店信息
- `Staff`：员工账号，包含店铺关联

**次卡体系**：
- `PackageConfig`：套餐配置（次数、售价、有效期、适用门店）
- `UserPackage`：用户持有的次卡实例（可视为一张卡，有独立的剩余次数和过期时间）
- `PackageStoreMap` / `UserPackageStoreMap`：门店适用范围关系表

**核销和购买记录**：
- `PurchaseRecord`：购买记录（入次）
- `RedemptionRecord`：核销记录（出次）
- `SessionAdjustment`：次数调整单（补次/扣错修正）

**分销体系**：
- `DistributorProfile`：分销商信息
- `InviteBinding`：邀请关系
- `CommissionRecord`：佣金记录

**审计**：
- `AuditLog`：操作日志

### 2. 核心业务逻辑（lib/sessionManagement.ts）

**次卡查询**：
- `getUserPackages()`：获取用户所有次卡
- `getUserActivePackages()`：获取未过期的活跃次卡
- `calculateSessionBalance()`：计算用户的会话余额统计
  - 可用次数：所有活跃、未过期次卡的剩余次数合计
  - 即将过期：7天内到期的次卡剩余次数
  - 已过期：过期次卡的剩余次数
  - 历史核销：已确认的核销记录累计

**购买流程**（关键）：
- `createPurchaseRecord()`：创建购买记录并生成次卡实例
  - 创建 purchase_record
  - 创建对应的 user_package（每次购买创建独立卡实例，便于追溯）
  - 自动触发分销佣金计算

**核销流程**（MVP关键）：
- `selectPackageToDeduct()`：选择要扣的卡
  - FEFO原则：优先扣最早到期的卡
  - 考虑门店适用范围限制
- `executeRedemption()`：执行核销
  - 选择目标次卡
  - 更新剩余次数
  - 创建核销记录
  - 记录审计日志

**核销撤销和修正**：
- `voidRedemptionRecord()`：撤销核销（管理员权限）
  - 标记记录为void
  - 回滚次卡的剩余次数
  - 创建调整单记录

**退款处理**：
- `voidPurchaseRecord()`：作废购买
  - 标记购买记录为void
  - 标记对应次卡为void（若已核销需人工处理）
  - 冲销相关佣金

### 3. 员工端实现（新增）

#### 员工登录（StaffLogin.tsx）
- 独立的员工登录界面
- 演示账号：staff01 / 123456
- 支持快速体验

#### 员工工作台（StaffDashboard.tsx）
- 今日统计：核销次数、购买次数
- 快速操作入口
- 使用提示

#### 会员查询与核销（StaffMemberQuery.tsx）**关键页面**
- **搜索会员**：支持手机号/姓名搜索
- **会员信息展示**：
  - 基本信息（姓名、手机号、加入时间）
  - 分销身份（若为分销商显示等级和邀请码）
  - 会话余额统计（可用、即将过期、已过期）
  - 活跃次卡列表（剩余次数、有效期）
- **核销操作**：
  - 选择扣次数（支持1-N次）
  - 自动选择最早到期的卡
  - 可选添加备注（体验/服务）
  - 核销确认提示

**流程演示**：
1. 会员到店扫会员码或提供手机号
2. 员工搜索会员信息
3. 显示该会员的可用次数和次卡详情
4. 员工选择扣次数（通常1次）
5. 系统自动选择最早到期的卡
6. 确认核销→记录生成→次数扣除→显示更新后的余额

### 4. 用户端新增页面

#### 个人中心（PersonalCenter.tsx）
- **用户信息卡片**：显示会员等级、会员码
- **次卡统计概览**：可用/即将过期/已过期/历史核销次数
- **活跃次卡列表**：每张卡的总次数、剩余、购买时间、有效期
- **购买记录**：最近5条（时间、数量、金额、状态）
- **核销记录**：最近5条核销历史
- **功能快捷导航**：购买、消费记录、分销中心

### 5. 新的数据库表（db.ts扩展）

```typescript
// 新增collections
'stores'                  // 门店
'staff'                   // 员工
'packageConfigs'          // 套餐配置
'packageStoreMaps'        // 套餐门店映射
'userPackages'            // 用户持有的次卡实例（关键）
'userPackageStoreMaps'    // 用户次卡门店适用范围
'purchaseRecords'         // 购买记录
'redemptionRecords'       // 核销记录
'sessionAdjustments'      // 次数调整单
'distributorProfiles'     // 分销商信息
'inviteBindings'          // 邀请关系
'commissionRecords'       // 佣金记录
'auditLogs'               // 审计日志
```

## 认证系统升级（AuthContext）

**新增角色支持**：
```typescript
role: 'user' | 'staff' | 'admin'
```

**新增检查方法**：
- `isStaff()`：检查是否为员工
- `isUser()`：检查是否为普通用户
- `isAdmin()`：检查是否为管理员

**新增字段**：
- `storeId`：员工所属门店
- `phone`：联系电话

## 路由结构

### 用户端路由
```
/login                    - 用户登录
/dashboard                - 用户仪表盘
/personal                 - 个人中心（新）
/consumptions             - 消费记录
/recharges                - 购买充值
/member-cards             - 次卡目录
/members                  - 会员管理
/settings                 - 设置
/home                     - 首页
```

### 员工端路由（新增）
```
/staff-login              - 员工登录
/staff/dashboard          - 员工工作台
/staff/member-query       - 会员查询与核销（关键）
/staff/manual-purchase    - 手动录入购买（未实现）
/staff/records            - 记录查询（未实现）
```

## 关键概念说明

### 次卡实例 vs 套餐配置

**PackageConfig**（套餐配置）：
- 系统级配置
- 例如"10次卡，¥99，180天有效"
- 管理员配置

**UserPackage**（用户次卡实例）：
- 用户级记录
- 每次购买生成一条新的user_package记录
- 有独立的剩余次数和过期时间
- 便于核销追溯和退款处理

**为什么这样设计**？
- 支持同时购买多张卡（叠加）
- 便于单张卡的核销和过期管理
- 便于退款时的精确处理
- 便于统计分析

### FEFO原则（先进先出 - First Expired First Out）

在扣次时，优先选择最早到期的卡扣，确保：
- 用户不会因为过期而损失次数
- 系统自动化处理，用户体验好

### 佣金基数选择

**为什么选择购买金额而非核销次数**？
- 购买是有价值的交易，应该触发佣金
- 核销是消费行为，不产生新的收入
- 便于财务对账（佣金与金额对应）

**佣金流程**：
1. 被邀请用户发生购买（创建purchase_record）
2. 系统自动查找邀请关系（invite_binding）
3. 根据邀请人等级，计算佣金比例
4. 创建commission_record（status=pending）
5. 管理员审核后标记为available
6. 用户提现时转为paid

## 实现状态

### ✅ 已实现（MVP）
- [x] 新增数据类型定义（lib/types.ts）
- [x] 数据库扩展（collections）
- [x] 核心业务逻辑（lib/sessionManagement.ts）
  - [x] 次卡查询
  - [x] 购买流程
  - [x] 核销流程（关键）
  - [x] 撤销和修正
  - [x] 佣金触发
- [x] 认证系统升级（AuthContext）
- [x] 员工端
  - [x] 员工登录（StaffLogin）
  - [x] 员工工作台（StaffDashboard）
  - [x] 会员查询与核销（StaffMemberQuery）**核心**
- [x] 用户端
  - [x] 个人中心（PersonalCenter）
- [x] 路由配置（用户端和员工端分离）

### 🔄 可选实现（第二阶段）
- [ ] 手动录入购买页面（Staff）
- [ ] 记录查询页面（Staff）
- [ ] 套餐配置管理（Admin）
- [ ] 购买记录管理（Admin）
- [ ] 核销记录审计（Admin）
- [ ] 佣金对账（Admin）
- [ ] 分销中心页面（User）
- [ ] 数据看板和图表
- [ ] 风控和防作弊

## 使用演示

### 员工端核销流程演示
1. 访问 `/staff-login`
2. 使用演示账号：`staff01` / `123456` 登录
3. 进入 `/staff/dashboard`
4. 点击"会员查询与核销"进入 `/staff/member-query`
5. 输入会员手机号或姓名搜索（需要先创建会员）
6. 查看会员信息和可用次数
7. 点击"执行核销"
8. 选择扣次数，可选添加备注
9. 点击"确认核销"完成操作

### 用户端个人中心演示
1. 访问 `/login`
2. 使用用户账号登录
3. 访问 `/personal` 查看个人中心
4. 显示：次卡总览、活跃次卡、购买和核销记录

## 数据流示意

```
购买流程：
用户 → 购买套餐 → purchase_record + user_package → 更新会话余额
       ↓
       [若为被邀请用户] → commission_record (pending)

核销流程：
员工扫码 → 查询会员 → 显示可用次数和次卡列表
        ↓
选择扣次数 → 自动选FEFO → execute_redemption
        ↓
更新 user_package.remaining_sessions → 创建 redemption_record
        ↓
审计日志 → 实时显示更新结果

修正流程：
redemption_record (void) ← 管理员撤销
        ↓
回滚 user_package.remaining_sessions
        ↓
创建 session_adjustment (记录)
        ↓
审计日志
```

## 技术栈总结

- **前端**：React 18 + TypeScript + Tailwind CSS
- **路由**：React Router v7
- **状态管理**：Zustand
- **数据存储**：localStorage (通过 DBService)
- **UI组件**：Font Awesome icons
- **通知**：Sonner toast
- **图表**：Recharts
- **导出**：XLSX

## 下一步建议

1. **测试完整流程**：确保员工核销、用户查询正常工作
2. **实现管理端配置页面**：套餐管理、规则配置
3. **添加分销中心**：邀请码、二维码、佣金提现
4. **数据可视化**：门店核销、销售排行
5. **权限细化**：店长、财务等多级权限
6. **风控**：异常检测、操作限制

## 文件清单

### 新增文件
- `src/lib/types.ts` - 数据类型定义
- `src/lib/sessionManagement.ts` - 核心业务逻辑
- `src/components/layout/StaffLayout.tsx` - 员工端布局
- `src/pages/StaffLogin.tsx` - 员工登录
- `src/pages/StaffDashboard.tsx` - 员工工作台
- `src/pages/StaffMemberQuery.tsx` - 会员查询与核销
- `src/pages/PersonalCenter.tsx` - 用户个人中心

### 修改文件
- `src/contexts/authContext.ts` - 新增staff角色和检查方法
- `src/App.tsx` - 新增员工端路由和staff保护路由
- `src/lib/db.ts` - 新增collections定义

## 常见问题

**Q: 为什么每次购买都创建新的user_package？**
A: 这样可以独立追溯每张卡的使用情况，便于退款和财务对账。如果叠加到同一张卡，退款时难以处理。

**Q: 如何处理购买后的退款？**
A: 将purchase_record标记为void，对应的user_package也标记为void。如果已有核销，则通过管理员手动创建session_adjustment进行补差。

**Q: 佣金什么时候清算？**
A: 当被邀请用户的purchase_record确认后，自动创建commission_record（pending）。管理员审核后标记为available，分销商可提现时标记为paid。

**Q: 支持同时使用多张卡吗？**
A: 支持。系统会自动根据FEFO原则选择最早到期的卡扣。

---

*文档更新时间：2024*
*实现状态：MVP完成，第二阶段进行中*
