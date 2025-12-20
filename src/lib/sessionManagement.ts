/**
 * 汗蒸次数管理核心业务逻辑
 * 处理次卡、购买、核销、调整等核心流程
 */

import { generateId, storage } from './utils';
import {
  UserPackage,
  PurchaseRecord,
  RedemptionRecord,
  SessionAdjustment,
  SessionBalance,
  MemberQueryResult,
  PackageConfig,
  AuditLog,
} from './types';
import { getMemberById } from './utils';

// ============ 次卡查询 ============

/**
 * 获取用户的所有次卡实例
 */
export const getUserPackages = (userId: string): UserPackage[] => {
  const packages = storage.get<UserPackage[]>('userPackages') || [];
  return packages.filter(pkg => pkg.userId === userId);
};

/**
 * 获取用户的活跃次卡（未过期、未作废）
 */
export const getUserActivePackages = (userId: string): UserPackage[] => {
  const packages = getUserPackages(userId);
  const now = new Date();
  return packages.filter(pkg => {
    if (pkg.status !== 'active') return false;
    return new Date(pkg.expiresAt) > now;
  });
};

/**
 * 计算用户的会话余额统计
 * 包括：可用次数、即将过期次数、已过期次数、历史核销次数等
 */
export const calculateSessionBalance = (userId: string): SessionBalance => {
  const allPackages = getUserPackages(userId);
  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let availableSessions = 0;
  let expiringSessions = 0;
  let expiredSessions = 0;
  let totalSessions = 0;

  // 遍历所有次卡
  allPackages.forEach(pkg => {
    const expiresAt = new Date(pkg.expiresAt);

    if (pkg.status === 'active' && expiresAt > now) {
      // 活跃且未过期
      availableSessions += pkg.remainingSessions;
      totalSessions += pkg.totalSessions;

      // 检查是否即将过期（7天内）
      if (expiresAt <= sevenDaysLater) {
        expiringSessions += pkg.remainingSessions;
      }
    } else if (pkg.status === 'active' && expiresAt <= now) {
      // 已过期
      expiredSessions += pkg.remainingSessions;
      totalSessions += pkg.totalSessions;
    } else {
      // void 或 refunded 的也计入总购买次数
      totalSessions += pkg.totalSessions;
    }
  });

  // 计算历史核销次数
  const redemptionRecords = storage.get<RedemptionRecord[]>('redemptionRecords') || [];
  const redeemedSessions = redemptionRecords
    .filter(record => record.userId === userId && record.status === 'confirmed')
    .reduce((sum, record) => sum + record.sessionsDeducted, 0);

  return {
    availableSessions,
    expiringSessions,
    expiredSessions,
    redeemedSessions,
    totalSessions,
  };
};

// ============ 购买流程 ============

/**
 * 创建购买记录并生成次卡实例
 * 流程：
 * 1. 创建 purchase_record
 * 2. 创建对应的 user_package
 * 3. 如果是被邀请用户，生成 commission_record
 */
export const createPurchaseRecord = (
  userId: string,
  packageId: string | undefined,
  packageConfig: PackageConfig | undefined,
  storeId: string,
  staffId: string | undefined,
  adminId: string | undefined,
  customSessions?: number,
  customAmount?: number,
  remark?: string
): { purchaseRecord: PurchaseRecord; userPackage: UserPackage } => {
  const purchaseId = `PR${generateId()}`;
  const sessionsAdded = customSessions || packageConfig?.totalSessions || 0;
  const amount = customAmount || packageConfig?.priceAmount || 0;

  // 1. 创建购买记录
  const purchaseRecord: PurchaseRecord = {
    id: purchaseId,
    userId,
    storeId,
    staffId,
    adminId,
    packageId: packageId || undefined,
    sessionsAdded,
    amount,
    status: 'confirmed',
    occurredAt: new Date().toISOString(),
    remark,
  };

  const purchases = storage.get<PurchaseRecord[]>('purchaseRecords') || [];
  purchases.unshift(purchaseRecord);
  storage.set('purchaseRecords', purchases);

  // 2. 创建次卡实例
  const validDays = packageConfig?.validDays || 180;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + validDays);

  const userPackageId = `UP${generateId()}`;
  const userPackage: UserPackage = {
    id: userPackageId,
    userId,
    packageId: packageId || undefined,
    totalSessions: sessionsAdded,
    remainingSessions: sessionsAdded,
    priceAmount: amount,
    purchasedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    applicableStoreScope: packageConfig?.applicableStoreScope || 'all',
    status: 'active',
  };

  const userPackages = storage.get<UserPackage[]>('userPackages') || [];
  userPackages.unshift(userPackage);
  storage.set('userPackages', userPackages);

  // 3. 记录审计日志
  const operatorId = adminId || staffId || 'unknown';
  const operatorRole = adminId ? ('admin' as const) : ('staff' as const);
  createAuditLog(operatorId, operatorRole, 'create_purchase', 'purchase_record', purchaseId, {
    sessionsAdded,
    amount,
    packageId,
  });

  // 4. 尝试生成分销佣金
  tryGenerateCommission(userId, purchaseId, amount);

  return { purchaseRecord, userPackage };
};

/**
 * 尝试为邀请人生成佣金
 */
const tryGenerateCommission = (userId: string, purchaseId: string, amount: number) => {
  const inviteBindings = storage.get<any[]>('inviteBindings') || [];
  const commissionRecords = storage.get<any[]>('commissionRecords') || [];

  // 查找邀请关系
  const binding = inviteBindings.find(b => b.inviteeId === userId && b.status === 'active');
  if (!binding) return;

  // 获取分销商信息（此处假设distributorProfiles已配置）
  const distributors = storage.get<any[]>('distributorProfiles') || [];
  const distributor = distributors.find(d => d.userId === binding.inviterId);
  if (!distributor) return;

  // 简单佣金规则：按等级比例（此处需根据实际配置）
  const commissionRates: Record<string, number> = {
    bronze: 0.05,
    silver: 0.08,
    gold: 0.1,
    platinum: 0.15,
  };
  const rate = commissionRates[distributor.level] || 0.05;
  const commissionAmount = amount * rate;

  // 创建佣金记录
  const commissionRecord = {
    id: `CR${generateId()}`,
    distributorId: distributor.id,
    relatedPurchaseId: purchaseId,
    inviteeId: userId,
    amount: commissionAmount,
    commissionRate: rate,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  commissionRecords.unshift(commissionRecord);
  storage.set('commissionRecords', commissionRecords);
};

// ============ 核销流程（关键） ============

/**
 * 选择要扣次的卡
 * 规则：优先选择最早到期的卡（FEFO）
 * 如果指定了门店限制，则只从可用于该门店的卡中选择
 */
export const selectPackageToDeduct = (
  userId: string,
  sessionsToDeduct: number,
  storeId?: string
): UserPackage | null => {
  const activePackages = getUserActivePackages(userId);

  // 过滤符合门店要求的卡
  let availablePackages = activePackages;
  if (storeId) {
    const packageStoreMaps = storage.get<any[]>('userPackageStoreMaps') || [];
    availablePackages = activePackages.filter(pkg => {
      if (pkg.applicableStoreScope === 'all') return true;
      return packageStoreMaps.some(m => m.userPackageId === pkg.id && m.storeId === storeId);
    });
  }

  // 过滤有足够次数的卡
  availablePackages = availablePackages.filter(pkg => pkg.remainingSessions >= sessionsToDeduct);

  if (availablePackages.length === 0) return null;

  // 按到期时间排序，最早到期的排在前面
  availablePackages.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime());

  return availablePackages[0] || null;
};

/**
 * 执行核销：扣次并生成核销记录
 * 关键逻辑：
 * 1. 选择要扣的卡
 * 2. 更新卡的 remainingSessions
 * 3. 创建 redemption_record
 * 4. 记录审计日志
 */
export const executeRedemption = (
  userId: string,
  storeId: string,
  staffId: string,
  sessionsToDeduct: number = 1,
  remark?: string
): { redemptionRecord: RedemptionRecord; success: boolean; error?: string } => {
  // 选择要扣的卡
  const selectedPackage = selectPackageToDeduct(userId, sessionsToDeduct, storeId);
  if (!selectedPackage) {
    return {
      success: false,
      error: '用户可用次数不足或无符合条件的次卡',
      redemptionRecord: {} as RedemptionRecord,
    };
  }

  // 更新卡的剩余次数
  const userPackages = storage.get<UserPackage[]>('userPackages') || [];
  const packageIndex = userPackages.findIndex(p => p.id === selectedPackage.id);
  if (packageIndex === -1) {
    return {
      success: false,
      error: '次卡信息异常',
      redemptionRecord: {} as RedemptionRecord,
    };
  }

  userPackages[packageIndex].remainingSessions -= sessionsToDeduct;
  storage.set('userPackages', userPackages);

  // 创建核销记录
  const redemptionId = `RD${generateId()}`;
  const redemptionRecord: RedemptionRecord = {
    id: redemptionId,
    userId,
    storeId,
    staffId,
    userPackageId: selectedPackage.id,
    sessionsDeducted: sessionsToDeduct,
    occurredAt: new Date().toISOString(),
    remark,
    status: 'confirmed',
  };

  const redemptionRecords = storage.get<RedemptionRecord[]>('redemptionRecords') || [];
  redemptionRecords.unshift(redemptionRecord);
  storage.set('redemptionRecords', redemptionRecords);

  // 记录审计日志
  createAuditLog(staffId, 'staff', 'execute_redemption', 'redemption_record', redemptionId, {
    userId,
    sessionsDeducted: sessionsToDeduct,
    userPackageId: selectedPackage.id,
  });

  return {
    success: true,
    redemptionRecord,
  };
};

// ============ 核销撤销/修正 ============

/**
 * 撤销核销记录（需要管理员权限）
 * 流程：
 * 1. 将 redemption_record 标记为 void
 * 2. 回滚 user_package 的 remaining_sessions
 * 3. 记录审计日志
 */
export const voidRedemptionRecord = (redemptionId: string, adminId: string, reason: string): boolean => {
  const redemptionRecords = storage.get<RedemptionRecord[]>('redemptionRecords') || [];
  const recordIndex = redemptionRecords.findIndex(r => r.id === redemptionId);

  if (recordIndex === -1) {
    return false;
  }

  const record = redemptionRecords[recordIndex];
  if (record.status === 'void') {
    return false; // 已经是void状态
  }

  // 标记为void
  redemptionRecords[recordIndex].status = 'void';
  storage.set('redemptionRecords', redemptionRecords);

  // 回滚次数
  const userPackages = storage.get<UserPackage[]>('userPackages') || [];
  const pkgIndex = userPackages.findIndex(p => p.id === record.userPackageId);
  if (pkgIndex !== -1) {
    userPackages[pkgIndex].remainingSessions += record.sessionsDeducted;
    storage.set('userPackages', userPackages);
  }

  // 记录审计日志和调整单
  createAuditLog(adminId, 'admin', 'void_redemption', 'redemption_record', redemptionId, {
    previousStatus: 'confirmed',
    reason,
  });

  // 创建调整单记录
  const adjustment: SessionAdjustment = {
    id: `SA${generateId()}`,
    userId: record.userId,
    storeId: record.storeId,
    operatorAdminId: adminId,
    deltaSessions: record.sessionsDeducted,
    reason: `撤销核销：${reason}`,
    relatedRecordId: redemptionId,
    createdAt: new Date().toISOString(),
  };

  const adjustments = storage.get<SessionAdjustment[]>('sessionAdjustments') || [];
  adjustments.unshift(adjustment);
  storage.set('sessionAdjustments', adjustments);

  return true;
};

// ============ 退款/作废处理 ============

/**
 * 作废购买记录并回滚次数
 */
export const voidPurchaseRecord = (purchaseId: string, adminId: string, reason: string): boolean => {
  const purchaseRecords = storage.get<PurchaseRecord[]>('purchaseRecords') || [];
  const recordIndex = purchaseRecords.findIndex(r => r.id === purchaseId);

  if (recordIndex === -1) {
    return false;
  }

  const record = purchaseRecords[recordIndex];
  if (record.status !== 'confirmed') {
    return false;
  }

  // 标记为void
  purchaseRecords[recordIndex].status = 'void';
  storage.set('purchaseRecords', purchaseRecords);

  // 如果该purchase对应独立的user_package，标记为void
  const userPackages = storage.get<UserPackage[]>('userPackages') || [];
  const affectedPackages = userPackages.filter(
    p => p.purchasedAt === record.occurredAt && p.userId === record.userId && p.priceAmount === record.amount
  );

  affectedPackages.forEach(pkg => {
    const idx = userPackages.findIndex(p => p.id === pkg.id);
    if (idx !== -1) {
      userPackages[idx].status = 'void';
    }
  });
  storage.set('userPackages', userPackages);

  // 记录审计日志
  createAuditLog(adminId, 'admin', 'void_purchase', 'purchase_record', purchaseId, {
    reason,
    sessionsAffected: record.sessionsAdded,
  });

  // 如果已产生佣金，生成冲正
  reversalCommissionsForPurchase(purchaseId, adminId);

  return true;
};

/**
 * 冲销与购买相关的所有佣金
 */
const reversalCommissionsForPurchase = (purchaseId: string, adminId: string) => {
  const commissionRecords = storage.get<any[]>('commissionRecords') || [];

  // 查找相关的佣金记录
  const relatedRecords = commissionRecords.filter(c => c.relatedPurchaseId === purchaseId && c.status !== 'reversed');

  relatedRecords.forEach(record => {
    const idx = commissionRecords.findIndex(c => c.id === record.id);
    if (idx !== -1) {
      commissionRecords[idx].status = 'reversed';
    }
  });

  storage.set('commissionRecords', commissionRecords);
};

// ============ 查询接口 ============

/**
 * 员工扫码查询会员信息
 * 返回会员基本信息、分销身份、会话余额、活跃次卡
 */
export const queryMemberForStaff = (userId: string): MemberQueryResult | null => {
  const user = getMemberById(userId);
  if (!user) return null;

  const distributors = storage.get<any[]>('distributorProfiles') || [];
  const distributor = distributors.find(d => d.userId === userId);

  return {
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      joinDate: user.joinDate,
    },
    distributorInfo: distributor
      ? {
          level: distributor.level,
          inviteCode: distributor.inviteCode,
        }
      : undefined,
    sessionBalance: calculateSessionBalance(userId),
    activePackages: getUserActivePackages(userId),
  };
};

/**
 * 获取用户的消费记录
 */
export const getUserRedemptionRecords = (userId: string, limit: number = 50): RedemptionRecord[] => {
  const records = storage.get<RedemptionRecord[]>('redemptionRecords') || [];
  return records
    .filter(r => r.userId === userId && r.status === 'confirmed')
    .slice(0, limit);
};

/**
 * 获取用户的购买记录
 */
export const getUserPurchaseRecords = (userId: string, limit: number = 50): PurchaseRecord[] => {
  const records = storage.get<PurchaseRecord[]>('purchaseRecords') || [];
  return records
    .filter(r => r.userId === userId && r.status === 'confirmed')
    .slice(0, limit);
};

// ============ 审计日志 ============

/**
 * 创建审计日志
 */
export const createAuditLog = (
  operatorId: string,
  operatorRole: 'staff' | 'admin',
  action: string,
  resourceType: string,
  resourceId: string,
  changes: Record<string, any>
): void => {
  const auditLog: AuditLog = {
    id: `AL${generateId()}`,
    operatorId,
    operatorRole,
    action,
    resourceType,
    resourceId,
    changes,
    createdAt: new Date().toISOString(),
  };

  const logs = storage.get<AuditLog[]>('auditLogs') || [];
  logs.unshift(auditLog);
  storage.set('auditLogs', logs);
};
