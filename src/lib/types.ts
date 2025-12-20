/**
 * 汗蒸系统核心数据类型定义
 */

// ============ 门店和员工 ============
export interface Store {
  id: string;
  name: string;
  address: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Staff {
  id: string;
  storeId: string;
  username: string;
  passwordHash: string;
  role: 'staff' | 'store_manager' | 'admin';
  status: 'active' | 'inactive';
  name: string;
  phone: string;
  createdAt: string;
}

// ============ 套餐配置 ============
export interface PackageConfig {
  id: string;
  name: string;
  totalSessions: number;
  priceAmount: number;
  validDays: number;
  applicableStoreScope: 'all' | 'specified';
  isStackable: boolean;
  isActive: boolean;
  createdAt: string;
  remarks?: string;
}

export interface PackageStoreMap {
  id: string;
  packageId: string;
  storeId: string;
}

// ============ 用户持有的次卡实例 ============
export interface UserPackage {
  id: string;
  userId: string;
  packageId?: string;
  totalSessions: number;
  remainingSessions: number;
  priceAmount: number;
  purchasedAt: string;
  expiresAt: string;
  applicableStoreScope: 'all' | 'specified';
  status: 'active' | 'expired' | 'void' | 'refunded';
}

export interface UserPackageStoreMap {
  id: string;
  userPackageId: string;
  storeId: string;
}

// ============ 购买记录（入次数凭证）============
export interface PurchaseRecord {
  id: string;
  userId: string;
  storeId: string;
  staffId?: string;
  adminId?: string;
  packageId?: string;
  sessionsAdded: number;
  amount: number;
  status: 'confirmed' | 'void' | 'refunded';
  occurredAt: string;
  remark?: string;
}

// ============ 核销记录（出次数凭证）============
export interface RedemptionRecord {
  id: string;
  userId: string;
  storeId: string;
  staffId: string;
  userPackageId: string;
  sessionsDeducted: number;
  occurredAt: string;
  remark?: string;
  status: 'confirmed' | 'void';
}

// ============ 次数调整（补次/扣错修正）============
export interface SessionAdjustment {
  id: string;
  userId: string;
  storeId: string;
  operatorAdminId: string;
  deltaSessions: number; // 正数为补次，负数为扣次
  reason: string;
  relatedRecordId?: string; // 关联的核销或购买记录
  createdAt: string;
}

// ============ 分销相关 ============
export interface DistributorProfile {
  id: string;
  userId: string;
  level: 'bronze' | 'silver' | 'gold' | 'platinum';
  totalCommission: number;
  availableCommission: number;
  inviteCode: string;
  inviteUrl: string;
  createdAt: string;
}

export interface InviteBinding {
  id: string;
  inviterId: string;
  inviteeId: string;
  bindingDate: string;
  status: 'active' | 'inactive';
}

export interface CommissionRecord {
  id: string;
  distributorId: string;
  relatedPurchaseId: string;
  inviteeId: string;
  amount: number;
  commissionRate: number;
  status: 'pending' | 'available' | 'paid' | 'reversed';
  createdAt: string;
  remarks?: string;
}

// ============ 用户端展示统计 ============
export interface SessionBalance {
  availableSessions: number; // 可用次数总计
  expiringSessions: number; // 即将过期的次数
  expiredSessions: number; // 已过期的次数
  redeemedSessions: number; // 历史核销次数
  totalSessions: number; // 总购买次数
}

export interface UserSessionOverview {
  userId: string;
  balance: SessionBalance;
  packages: UserPackage[];
  lastRedemption?: RedemptionRecord;
  nextExpiringPackage?: UserPackage;
}

// ============ 分销统计 ============
export interface CommissionOverview {
  distributorId: string;
  totalInvited: number;
  activeInvited: number;
  totalCommission: number;
  availableCommission: number;
  pendingCommission: number;
}

// ============ 员工端查询结果 ============
export interface MemberQueryResult {
  user: {
    id: string;
    name: string;
    phone: string;
    joinDate: string;
  };
  distributorInfo?: {
    level: string;
    inviteCode: string;
  };
  sessionBalance: SessionBalance;
  activePackages: UserPackage[];
}

// ============ 操作日志 ============
export interface AuditLog {
  id: string;
  operatorId: string;
  operatorRole: 'staff' | 'admin';
  action: string;
  resourceType: string;
  resourceId: string;
  changes: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}
