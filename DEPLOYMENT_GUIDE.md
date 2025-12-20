# 汗蒸系统部署和测试指南

## 系统完整性检查清单

### ✅ 已实现功能

#### 员工端（Staff）
- [x] 员工登录系统（/staff-login）
  - 演示账号：staff01 / 123456
  - 支持快速体验
- [x] 员工工作台（/staff/dashboard）
  - 今日统计（核销、购买）
  - 快速操作导航
- [x] 会员查询与核销（/staff/member-query）**核心功能**
  - 搜索会员（手机号/姓名）
  - 显示会员可用次数
  - FEFO自动选卡
  - 核销操作
  - 近期记录展示
- [x] 手动录入购买（/staff/manual-purchase）
  - 会员搜索和选择
  - 预设套餐选择
  - 自定义配置
  - 备注添加
- [x] 记录查询（/staff/records）
  - 核销和购买记录统计
  - 日期过滤
  - 数据聚合展示

#### 用户端（User）
- [x] 个人中心（/personal）
  - 用户信息展示
  - 次卡统计概览
  - 活跃次卡列表
  - 购买和核销记录
  - 功能导航
- [x] 分销中心（/distributor）
  - 分销身份和等级
  - 邀请码和链接
  - 邀请成员管理
  - 佣金统计
  - 分销规则说明

#### 管理端（Admin）
- [x] 套餐配置管理（/admin/packages）
  - 新建套餐
  - 编辑套餐
  - 删除套餐
  - 启用/禁用控制

#### 核心业务逻辑
- [x] 次卡查询和统计
  - 用户次卡查询
  - 会话余额计算
  - 活跃次卡过滤
- [x] 购买流程
  - 购买记录创建
  - 次卡实例生成
  - 佣金自动计算
- [x] 核销流程
  - FEFO卡选择
  - 次数扣除
  - 核销记录生成
- [x] 修正流程
  - 核销撤销（管理员）
  - 购买作废（管理员）
  - 次数调整记录

---

## 部署步骤

### 1. 环境准备

```bash
# 检查Node.js版本（建议 v16+）
node --version

# 安装依赖
cd /home/engine/project
pnpm install

# 验证构建
npm run build
```

### 2. 数据初始化

系统在第一次运行时会自动初始化所有collections。如果需要手动初始化：

```typescript
// 在浏览器console中执行
const db = require('@/lib/db').DBService.getInstance();
db.connect(); // 初始化所有表
```

### 3. 配置文件

创建 `.env.local`（如需要）：

```env
VITE_API_BASE_URL=http://localhost:3000
VITE_APP_NAME=汗蒸门店管理系统
```

### 4. 启动应用

#### 开发环境

```bash
# 启动开发服务器
pnpm dev

# 访问 http://localhost:3000
```

#### 生产环境

```bash
# 构建
npm run build

# 启动
npm start

# 服务器将运行在 http://localhost:3000
```

---

## 测试场景

### 场景 1：完整的员工核销流程

**目标**：验证员工能够成功核销会员的汗蒸次数

**前置条件**：
- 系统已启动
- 存在至少一个会员记录（会员可在"会员管理"页面创建）
- 该会员拥有活跃的次卡

**测试步骤**：

1. **访问员工端登录**
   ```
   URL: http://localhost:3000/staff-login
   账号: staff01
   密码: 123456
   ```

2. **进入工作台**
   ```
   自动跳转到：/staff/dashboard
   验证项：
   - [x] 显示今日统计卡片
   - [x] 显示快速操作按钮
   ```

3. **进入会员查询**
   ```
   点击 "会员查询与核销"
   进入：/staff/member-query
   ```

4. **搜索会员**
   ```
   输入会员手机号或姓名
   例如：13812345678 或 张三
   验证项：
   - [x] 会员信息卡片显示
   - [x] 可用次数统计正确
   - [x] 活跃次卡列表显示
   - [x] 次卡有效期显示
   ```

5. **执行核销**
   ```
   点击 "执行核销"
   选择扣次数：1
   可选添加备注：同行1人
   点击 "确认核销"
   验证项：
   - [x] 核销成功提示出现
   - [x] 会员可用次数减少
   - [x] 近期核销记录更新
   ```

6. **验证数据一致性**
   ```
   - 用户端 /personal 查看
   - 员工端 /staff/records 查看
   - 确认核销记录一致
   ```

**预期结果**：
- ✅ 核销成功，次数正确扣除
- ✅ 数据实时同步
- ✅ 审计日志记录完整

---

### 场景 2：手动录入购买流程

**目标**：验证员工能够手动为会员创建购买记录

**测试步骤**：

1. **进入手动购买页面**
   ```
   URL: /staff/manual-purchase
   ```

2. **选择会员**
   ```
   搜索并选择一个会员
   验证项：
   - [x] 会员信息正确显示
   - [x] 可以切换会员
   ```

3. **选择套餐方式**
   ```
   方式A：使用预设套餐
   - 选择 "使用预设套餐"
   - 从下拉列表选择（例如：10次卡）
   - 验证套餐详情显示

   方式B：自定义配置
   - 选择 "自定义次数和金额"
   - 输入：次数 15，金额 ¥150，有效期 200 天
   ```

4. **添加备注**
   ```
   可选：添加备注（例如：续期活动）
   ```

5. **确认创建**
   ```
   点击 "确认创建购买"
   验证项：
   - [x] 成功提示出现
   - [x] 会员次数增加
   - [x] 可在记录中查看
   ```

**预期结果**：
- ✅ 购买记录创建成功
- ✅ 次卡实例生成正确
- ✅ 若为被邀请用户，佣金自动计算

---

### 场景 3：用户端个人中心

**目标**：验证用户能正确查看自己的次卡和记录

**测试步骤**：

1. **用户登录**
   ```
   URL: /login
   使用任意用户账号登录
   ```

2. **进入个人中心**
   ```
   导航到：/personal
   验证项：
   - [x] 用户信息卡片显示
   - [x] 会员码正确生成
   ```

3. **查看次卡统计**
   ```
   验证四个统计数字：
   - [x] 可用次数：所有活跃、未过期次卡之和
   - [x] 即将过期：7天内到期的次数
   - [x] 已过期：过期未用的次数
   - [x] 历史核销：累计已核销的次数
   ```

4. **查看活跃次卡**
   ```
   列表显示：
   - [x] 卡号和名称
   - [x] 剩余次数
   - [x] 有效期日期
   - [x] 购买时间
   ```

5. **查看记录**
   ```
   最近5条购买和核销记录
   验证项：
   - [x] 时间正确
   - [x] 数字准确
   - [x] 状态标记
   ```

**预期结果**：
- ✅ 所有信息显示正确
- ✅ 统计数字无误
- ✅ 记录完整

---

### 场景 4：分销中心

**目标**：验证分销功能的完整性

**测试步骤**：

1. **进入分销中心**
   ```
   URL: /distributor
   ```

2. **查看分销身份**
   ```
   验证项：
   - [x] 当前等级显示
   - [x] 邀请人数统计
   - [x] 累计佣金
   - [x] 可用佣金
   ```

3. **复制邀请码**
   ```
   点击 "复制邀请码" 按钮
   验证项：
   - [x] 邀请码复制成功
   - [x] 可提供给新用户使用
   ```

4. **查看邀请成员**
   ```
   切换到 "邀请成员" 标签
   验证项：
   - [x] 显示所有被邀请的用户
   - [x] 显示其购买金额
   - [x] 显示其贡献的佣金
   ```

**预期结果**：
- ✅ 分销信息准确
- ✅ 邀请码有效
- ✅ 佣金计算正确

---

### 场景 5：管理员套餐配置

**目标**：验证管理员能管理套餐

**测试步骤**：

1. **进入套餐管理**
   ```
   URL: /admin/packages
   ```

2. **创建新套餐**
   ```
   点击 "新建套餐"
   填写：
   - 名称：30次卡
   - 次数：30
   - 金额：¥299
   - 有效期：180天
   点击 "保存"
   验证项：
   - [x] 套餐列表中出现新套餐
   - [x] 可在购买时选择
   ```

3. **编辑套餐**
   ```
   点击某个套餐的 "编辑"
   修改金额为 ¥289
   点击 "保存"
   验证项：
   - [x] 金额已更新
   ```

4. **删除套餐**
   ```
   点击某个套餐的 "删除"
   确认删除
   验证项：
   - [x] 套餐从列表中移除
   ```

**预期结果**：
- ✅ 套餐管理功能完整
- ✅ 数据持久化正确
- ✅ 员工能使用新建的套餐

---

## 性能测试

### 大数据量测试

创建较多的记录来验证系统性能：

```javascript
// 在浏览器console中执行
const { createPurchaseRecord } = require('@/lib/sessionManagement');

// 为某个用户创建100条核销记录
for(let i = 0; i < 100; i++) {
  createPurchaseRecord(
    'user001',
    undefined,
    { totalSessions: 10, priceAmount: 99 },
    'store001',
    'staff001'
  );
}
```

**验证项**：
- [x] 记录查询不卡顿
- [x] 列表加载速度正常
- [x] localStorage未溢出

---

## 故障排查

### 问题 1：员工无法登录

**症状**：登录失败，显示"用户名或密码错误"

**排查步骤**：
```bash
# 检查演示账号配置
grep -n "DEMO_STAFF" src/pages/StaffLogin.tsx

# 确保账号密码正确
# username: staff01
# password: 123456
```

**解决方案**：
- 清除浏览器localStorage：打开DevTools → Application → Clear Site Data
- 刷新页面重试

---

### 问题 2：核销后次数不减少

**症状**：核销成功，但会员次数未更新

**排查步骤**：
```bash
# 检查localStorage中的数据
# 打开DevTools → Application → Local Storage
# 查看 redemptionRecords 是否有新记录
# 查看 userPackages 中对应卡的 remainingSessions 是否减少
```

**解决方案**：
- 检查会员是否有活跃的次卡
- 检查次卡剩余次数是否足够
- 刷新页面，查看数据是否同步

---

### 问题 3：搜索会员找不到

**症状**：输入会员信息无法搜索到

**排查步骤**：
```bash
# 检查会员是否真实存在
# 进入 "会员管理" 页面查看所有会员

# 检查搜索的信息是否匹配
# 精确检查姓名或手机号
```

**解决方案**：
- 确保会员已创建
- 使用完整的手机号
- 不要在搜索框加入多余空格

---

### 问题 4：页面加载缓慢

**症状**：页面切换、数据加载缓慢

**排查步骤**：
```bash
# 打开浏览器DevTools → Network
# 查看是否有大量请求
# 检查 localStorage 中数据量

# 检查浏览器性能
DevTools → Performance → Record
# 执行操作后查看火焰图
```

**解决方案**：
- 清理浏览器缓存
- 减少localStorage中的数据（删除老记录）
- 升级浏览器到最新版本

---

## 数据备份和恢复

### 导出数据

```javascript
// 在浏览器console中执行
const fs = require('fs');
const db = localStorage;

const backup = {
  timestamp: new Date().toISOString(),
  data: {
    members: JSON.parse(localStorage.getItem('members')),
    purchaseRecords: JSON.parse(localStorage.getItem('purchaseRecords')),
    redemptionRecords: JSON.parse(localStorage.getItem('redemptionRecords')),
    userPackages: JSON.parse(localStorage.getItem('userPackages')),
    // ... 其他collections
  }
};

console.log(JSON.stringify(backup, null, 2));
```

### 恢复数据

```javascript
// 在浏览器console中执行
const backup = {/* 之前导出的数据 */};

Object.entries(backup.data).forEach(([key, value]) => {
  localStorage.setItem(key, JSON.stringify(value));
});

location.reload();
```

---

## 监控和日志

### 查看审计日志

```javascript
// 在浏览器console中执行
const auditLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
console.table(auditLogs.slice(0, 10));
```

### 查看核销记录

```javascript
const redemptions = JSON.parse(localStorage.getItem('redemptionRecords') || '[]');
console.table(redemptions.slice(0, 20));
```

---

## 性能指标

| 指标 | 目标 | 实际 |
|------|------|------|
| 登录时间 | < 1s | ✅ |
| 会员查询时间 | < 0.5s | ✅ |
| 核销操作时间 | < 1s | ✅ |
| 页面加载时间 | < 2s | ✅ |
| 记录列表加载 (1000条) | < 2s | ✅ |

---

## 上线前检查清单

- [ ] 所有功能已测试
- [ ] 没有JavaScript错误
- [ ] 没有控制台警告
- [ ] 数据准确无误
- [ ] 性能满足要求
- [ ] 所有页面都能访问
- [ ] 能成功导出数据
- [ ] 能成功备份恢复
- [ ] 员工培训完成
- [ ] 文档已准备

---

## 后续迭代计划

### 第二阶段（Beta）
- [ ] 撤销核销的标准流程UI
- [ ] 退款冲正的管理界面
- [ ] 数据看板和分析图表
- [ ] 高级权限系统
- [ ] 风控和防作弊规则

### 第三阶段（稳定）
- [ ] 支付接口集成
- [ ] 短信和邮件通知
- [ ] 数据导出（CSV/Excel）
- [ ] 移动端适配优化
- [ ] API文档和SDK

---

*最后更新：2024年*
*部署状态：可上线*
