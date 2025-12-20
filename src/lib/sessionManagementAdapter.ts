/**
 * 会话管理适配层
 * 自动选择使用localStorage或API（根据API可用性）
 */

import * as storageVersion from './sessionManagement';
import * as apiVersion from './sessionManagementAPI';

// 检查API是否可用的标志
let apiAvailable = true;

/**
 * 初始化适配器，检查API连接
 */
export const initAdapter = async () => {
  try {
    const response = await fetch('/api/health');
    apiAvailable = response.ok;
  } catch (error) {
    apiAvailable = false;
  }
};

// ============ 导出所有函数，自动选择实现版本 ============

// 次卡查询
export const getSessionBalance = async (userId: string) => {
  return apiAvailable
    ? apiVersion.getSessionBalance(userId)
    : storageVersion.calculateSessionBalance(userId);
};

export const getUserActivePackages = async (userId: string) => {
  return apiAvailable
    ? apiVersion.getUserActivePackages(userId)
    : storageVersion.getUserActivePackages(userId);
};

export const getUserPackages = async (userId: string) => {
  return apiAvailable
    ? apiVersion.getUserPackages(userId)
    : storageVersion.getUserPackages(userId);
};

// 购买流程
export const createPurchaseRecord = async (
  userId: string,
  packageId: string | undefined,
  packageConfig: any,
  storeId: string,
  staffId: string | undefined,
  adminId?: string,
  customSessions?: number,
  customAmount?: number,
  remark?: string
) => {
  if (apiAvailable) {
    return apiVersion.createPurchaseRecord(
      userId,
      packageId,
      customSessions || packageConfig?.totalSessions || 0,
      customAmount || packageConfig?.priceAmount || 0,
      storeId,
      staffId,
      remark
    );
  } else {
    return storageVersion.createPurchaseRecord(
      userId,
      packageId,
      packageConfig,
      storeId,
      staffId,
      adminId,
      customSessions,
      customAmount,
      remark
    );
  }
};

// 核销流程
export const selectPackageToDeduct = async (
  userId: string,
  sessionsToDeduct: number,
  storeId?: string
) => {
  return apiAvailable
    ? apiVersion.selectPackageToDeduct(userId, sessionsToDeduct, storeId)
    : storageVersion.selectPackageToDeduct(userId, sessionsToDeduct, storeId);
};

export const executeRedemption = async (
  userId: string,
  storeId: string,
  staffId: string,
  sessionsToDeduct: number = 1,
  remark?: string
) => {
  return apiAvailable
    ? apiVersion.executeRedemption(userId, storeId, staffId, sessionsToDeduct, remark)
    : storageVersion.executeRedemption(userId, storeId, staffId, sessionsToDeduct, remark);
};

// 修正操作
export const voidRedemptionRecord = async (
  redemptionId: string,
  adminId: string,
  reason: string
) => {
  return apiAvailable
    ? apiVersion.voidRedemptionRecord(redemptionId, adminId, reason)
    : { success: storageVersion.voidRedemptionRecord(redemptionId, adminId, reason) };
};

export const voidPurchaseRecord = async (
  purchaseId: string,
  adminId: string,
  reason: string
) => {
  return apiAvailable
    ? apiVersion.voidPurchaseRecord(purchaseId, adminId, reason)
    : { success: storageVersion.voidPurchaseRecord(purchaseId, adminId, reason) };
};

// 查询接口
export const queryMemberForStaff = async (userId: string) => {
  return apiAvailable
    ? apiVersion.queryMemberForStaff(userId)
    : storageVersion.queryMemberForStaff(userId);
};

export const getUserRedemptionRecords = async (userId: string, limit?: number) => {
  return apiAvailable
    ? apiVersion.getUserRedemptionRecords(userId, limit)
    : storageVersion.getUserRedemptionRecords(userId, limit);
};

export const getUserPurchaseRecords = async (userId: string, limit?: number) => {
  return apiAvailable
    ? apiVersion.getUserPurchaseRecords(userId, limit)
    : storageVersion.getUserPurchaseRecords(userId, limit);
};

// 分销相关
export const getDistributorProfile = async (userId: string) => {
  return apiAvailable
    ? apiVersion.getDistributorProfile(userId)
    : null;
};

export const getInvitedMembers = async (distributorId: string) => {
  return apiAvailable
    ? apiVersion.getInvitedMembers(distributorId)
    : [];
};

export const getDistributorCommissions = async (distributorId: string) => {
  return apiAvailable
    ? apiVersion.getDistributorCommissions(distributorId)
    : [];
};

// 审计日志
export const createAuditLog = async (
  operatorId: string,
  operatorRole: 'staff' | 'admin',
  action: string,
  resourceType: string,
  resourceId: string,
  changes: Record<string, any>
) => {
  if (apiAvailable) {
    return apiVersion.createAuditLog(
      operatorId,
      operatorRole,
      action,
      resourceType,
      resourceId,
      changes
    );
  } else {
    return storageVersion.createAuditLog(
      operatorId,
      operatorRole,
      action,
      resourceType,
      resourceId,
      changes
    );
  }
};

// 套餐管理
export const getPackages = async () => {
  return apiAvailable
    ? apiVersion.getPackages()
    : [];
};

export const createPackage = async (data: any) => {
  return apiAvailable
    ? apiVersion.createPackage(data)
    : null;
};

export const updatePackage = async (id: string, data: any) => {
  return apiAvailable
    ? apiVersion.updatePackage(id, data)
    : null;
};

export const deletePackage = async (id: string) => {
  return apiAvailable
    ? apiVersion.deletePackage(id)
    : false;
};
