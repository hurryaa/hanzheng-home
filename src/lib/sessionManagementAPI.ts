/**
 * 汗蒸次数管理 - API版本
 * 所有操作都通过API调用MySQL数据库
 */

import apiClient from './apiClient';
import { toast } from 'sonner';

// ============ 次卡查询接口 ============

/**
 * 获取用户的会话余额统计
 */
export const getSessionBalance = async (userId: string) => {
  try {
    const response = await apiClient.getUserPackageBalance(userId);
    return response.data || {
      availableSessions: 0,
      expiringSessions: 0,
      expiredSessions: 0,
      redeemedSessions: 0,
      totalSessions: 0,
    };
  } catch (error) {
    console.error('获取会话余额失败:', error);
    toast.error('获取次数统计失败');
    throw error;
  }
};

/**
 * 获取用户的活跃次卡
 */
export const getUserActivePackages = async (userId: string) => {
  try {
    const response = await apiClient.getUserPackages(userId);
    const packages = response.data || [];
    const now = new Date();
    
    return packages.filter((pkg: any) => {
      if (pkg.status !== 'active') return false;
      return new Date(pkg.expiresAt) > now;
    });
  } catch (error) {
    console.error('获取活跃次卡失败:', error);
    toast.error('获取活跃次卡失败');
    throw error;
  }
};

/**
 * 获取用户的所有次卡
 */
export const getUserPackages = async (userId: string) => {
  try {
    const response = await apiClient.getUserPackages(userId);
    return response.data || [];
  } catch (error) {
    console.error('获取用户次卡失败:', error);
    throw error;
  }
};

// ============ 购买流程 ============

/**
 * 创建购买记录并生成次卡实例
 */
export const createPurchaseRecord = async (
  userId: string,
  packageId: string | undefined,
  sessionsAdded: number,
  amount: number,
  storeId: string,
  staffId: string | undefined,
  remark?: string
) => {
  try {
    const purchaseData = {
      userId,
      packageId,
      sessionsAdded,
      amount,
      storeId,
      staffId,
      remark,
      status: 'confirmed',
      occurredAt: new Date().toISOString(),
    };

    const response = await apiClient.createPurchaseRecord(purchaseData);
    toast.success('购买记录已创建');
    return response.data;
  } catch (error) {
    console.error('创建购买记录失败:', error);
    toast.error('创建购买记录失败');
    throw error;
  }
};

// ============ 核销流程（关键） ============

/**
 * 自动选择要扣的卡（FEFO原则）
 */
export const selectPackageToDeduct = async (
  userId: string,
  sessionsToDeduct: number,
  storeId?: string
) => {
  try {
    const packages = await getUserActivePackages(userId);
    
    // 过滤有足够次数的卡
    let availablePackages = packages.filter(
      (pkg: any) => pkg.remainingSessions >= sessionsToDeduct
    );

    if (availablePackages.length === 0) {
      return null;
    }

    // 按到期时间排序，最早到期的排在前面（FEFO）
    availablePackages.sort(
      (a: any, b: any) =>
        new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
    );

    return availablePackages[0];
  } catch (error) {
    console.error('选择次卡失败:', error);
    throw error;
  }
};

/**
 * 执行核销操作
 */
export const executeRedemption = async (
  userId: string,
  storeId: string,
  staffId: string,
  sessionsToDeduct: number = 1,
  remark?: string
) => {
  try {
    // 选择要扣的卡
    const selectedPackage = await selectPackageToDeduct(userId, sessionsToDeduct, storeId);
    
    if (!selectedPackage) {
      toast.error('用户可用次数不足或无符合条件的次卡');
      return {
        success: false,
        error: '用户可用次数不足或无符合条件的次卡',
      };
    }

    // 创建核销记录
    const redemptionData = {
      userId,
      storeId,
      staffId,
      userPackageId: selectedPackage.id,
      sessionsDeducted: sessionsToDeduct,
      remark,
      status: 'confirmed',
      occurredAt: new Date().toISOString(),
    };

    const response = await apiClient.createRedemption(redemptionData);
    toast.success(`✓ 核销成功！已扣 ${sessionsToDeduct} 次`);
    
    return {
      success: true,
      redemptionRecord: response.data,
    };
  } catch (error) {
    console.error('核销失败:', error);
    toast.error('核销操作失败');
    return {
      success: false,
      error: error instanceof Error ? error.message : '核销失败',
    };
  }
};

// ============ 修正操作 ============

/**
 * 撤销核销记录
 */
export const voidRedemptionRecord = async (
  redemptionId: string,
  adminId: string,
  reason: string
) => {
  try {
    const response = await apiClient.voidRedemption(redemptionId, reason);
    
    // 创建审计日志
    await createAuditLog(adminId, 'admin', 'void_redemption', 'redemption_record', redemptionId, {
      reason,
      previousStatus: 'confirmed',
    });

    toast.success('核销记录已撤销，次数已恢复');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('撤销核销失败:', error);
    toast.error('撤销核销失败');
    return { success: false, error };
  }
};

/**
 * 作废购买记录
 */
export const voidPurchaseRecord = async (
  purchaseId: string,
  adminId: string,
  reason: string
) => {
  try {
    const response = await apiClient.voidPurchaseRecord(purchaseId, reason);
    
    // 创建审计日志
    await createAuditLog(adminId, 'admin', 'void_purchase', 'purchase_record', purchaseId, {
      reason,
    });

    toast.success('购买记录已作废');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('作废购买失败:', error);
    toast.error('作废购买失败');
    return { success: false, error };
  }
};

// ============ 查询接口 ============

/**
 * 员工查询会员信息
 */
export const queryMemberForStaff = async (userId: string) => {
  try {
    const [memberData, packagesData, balanceData] = await Promise.all([
      apiClient.getMember(userId),
      apiClient.getUserPackages(userId),
      apiClient.getUserPackageBalance(userId),
    ]);

    return {
      user: memberData.data,
      activePackages: (packagesData.data || []).filter((pkg: any) => {
        const now = new Date();
        return pkg.status === 'active' && new Date(pkg.expiresAt) > now;
      }),
      sessionBalance: balanceData.data,
    };
  } catch (error) {
    console.error('查询会员信息失败:', error);
    toast.error('查询会员信息失败');
    throw error;
  }
};

/**
 * 获取用户的核销记录
 */
export const getUserRedemptionRecords = async (userId: string, limit: number = 50) => {
  try {
    const response = await apiClient.getRedemptionRecords({
      userId,
      status: 'confirmed',
      limit,
    });
    return response.data || [];
  } catch (error) {
    console.error('获取核销记录失败:', error);
    return [];
  }
};

/**
 * 获取用户的购买记录
 */
export const getUserPurchaseRecords = async (userId: string, limit: number = 50) => {
  try {
    const response = await apiClient.getPurchaseRecords({
      userId,
      status: 'confirmed',
      limit,
    });
    return response.data || [];
  } catch (error) {
    console.error('获取购买记录失败:', error);
    return [];
  }
};

// ============ 分销相关 ============

/**
 * 获取分销商信息
 */
export const getDistributorProfile = async (userId: string) => {
  try {
    const response = await apiClient.getDistributorProfile(userId);
    return response.data;
  } catch (error) {
    console.error('获取分销商信息失败:', error);
    return null;
  }
};

/**
 * 获取邀请的成员
 */
export const getInvitedMembers = async (distributorId: string) => {
  try {
    const response = await apiClient.getInviteBindings(distributorId);
    return response.data || [];
  } catch (error) {
    console.error('获取邀请成员失败:', error);
    return [];
  }
};

/**
 * 获取佣金记录
 */
export const getDistributorCommissions = async (distributorId: string) => {
  try {
    const response = await apiClient.getCommissionRecords(distributorId);
    return response.data || [];
  } catch (error) {
    console.error('获取佣金记录失败:', error);
    return [];
  }
};

// ============ 审计日志 ============

/**
 * 创建审计日志
 */
export const createAuditLog = async (
  operatorId: string,
  operatorRole: 'staff' | 'admin',
  action: string,
  resourceType: string,
  resourceId: string,
  changes: Record<string, any>
) => {
  try {
    await apiClient.createAuditLog({
      operatorId,
      operatorRole,
      action,
      resourceType,
      resourceId,
      changes,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建审计日志失败:', error);
    // 不中断主流程
  }
};

// ============ 套餐管理 ============

/**
 * 获取所有套餐
 */
export const getPackages = async () => {
  try {
    const response = await apiClient.getPackages();
    return response.data || [];
  } catch (error) {
    console.error('获取套餐列表失败:', error);
    toast.error('获取套餐列表失败');
    return [];
  }
};

/**
 * 创建套餐
 */
export const createPackage = async (data: any) => {
  try {
    const response = await apiClient.createPackage(data);
    toast.success('套餐已创建');
    return response.data;
  } catch (error) {
    console.error('创建套餐失败:', error);
    toast.error('创建套餐失败');
    throw error;
  }
};

/**
 * 更新套餐
 */
export const updatePackage = async (id: string, data: any) => {
  try {
    const response = await apiClient.updatePackage(id, data);
    toast.success('套餐已更新');
    return response.data;
  } catch (error) {
    console.error('更新套餐失败:', error);
    toast.error('更新套餐失败');
    throw error;
  }
};

/**
 * 删除套餐
 */
export const deletePackage = async (id: string) => {
  try {
    await apiClient.deletePackage(id);
    toast.success('套餐已删除');
    return true;
  } catch (error) {
    console.error('删除套餐失败:', error);
    toast.error('删除套餐失败');
    throw error;
  }
};
