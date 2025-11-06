import { AuthUser } from '@/contexts/authContext';

// 角色权限定义
export enum Role {
  ADMIN = 'admin',
  MANAGER = 'manager',
  STAFF = 'staff',
  VIEWER = 'viewer'
}

// 权限定义
export enum Permission {
  // 会员管理
  MEMBER_VIEW = 'member:view',
  MEMBER_CREATE = 'member:create',
  MEMBER_EDIT = 'member:edit',
  MEMBER_DELETE = 'member:delete',
  
  // 充值消费
  RECHARGE_VIEW = 'recharge:view',
  RECHARGE_CREATE = 'recharge:create',
  CONSUMPTION_VIEW = 'consumption:view',
  CONSUMPTION_CREATE = 'consumption:create',
  CONSUMPTION_EDIT = 'consumption:edit',
  
  // 次卡管理
  CARD_VIEW = 'card:view',
  CARD_MANAGE = 'card:manage',
  
  // 数据导出导入
  DATA_EXPORT = 'data:export',
  DATA_IMPORT = 'data:import',
  
  // 系统设置
  SETTINGS_VIEW = 'settings:view',
  SETTINGS_EDIT = 'settings:edit',
  
  // 账户管理
  ACCOUNT_MANAGE = 'account:manage',
  
  // 报表查看
  REPORT_VIEW = 'report:view',
}

// 角色权限映射
const rolePermissions: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // 管理员拥有所有权限
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_EDIT,
    Permission.MEMBER_DELETE,
    Permission.RECHARGE_VIEW,
    Permission.RECHARGE_CREATE,
    Permission.CONSUMPTION_VIEW,
    Permission.CONSUMPTION_CREATE,
    Permission.CONSUMPTION_EDIT,
    Permission.CARD_VIEW,
    Permission.CARD_MANAGE,
    Permission.DATA_EXPORT,
    Permission.DATA_IMPORT,
    Permission.SETTINGS_VIEW,
    Permission.SETTINGS_EDIT,
    Permission.ACCOUNT_MANAGE,
    Permission.REPORT_VIEW,
  ],
  [Role.MANAGER]: [
    // 经理权限
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.MEMBER_EDIT,
    Permission.RECHARGE_VIEW,
    Permission.RECHARGE_CREATE,
    Permission.CONSUMPTION_VIEW,
    Permission.CONSUMPTION_CREATE,
    Permission.CONSUMPTION_EDIT,
    Permission.CARD_VIEW,
    Permission.CARD_MANAGE,
    Permission.DATA_EXPORT, // 经理可以导出
    Permission.SETTINGS_VIEW,
    Permission.REPORT_VIEW,
  ],
  [Role.STAFF]: [
    // 员工权限
    Permission.MEMBER_VIEW,
    Permission.MEMBER_CREATE,
    Permission.RECHARGE_VIEW,
    Permission.RECHARGE_CREATE,
    Permission.CONSUMPTION_VIEW,
    Permission.CONSUMPTION_CREATE,
    Permission.CARD_VIEW,
  ],
  [Role.VIEWER]: [
    // 查看者权限
    Permission.MEMBER_VIEW,
    Permission.RECHARGE_VIEW,
    Permission.CONSUMPTION_VIEW,
    Permission.CARD_VIEW,
    Permission.REPORT_VIEW,
  ],
};

/**
 * 检查用户是否有指定权限
 */
export function hasPermission(user: AuthUser | null, permission: Permission): boolean {
  if (!user) return false;
  
  const userRole = user.role as Role;
  const permissions = rolePermissions[userRole] || [];
  
  return permissions.includes(permission);
}

/**
 * 检查用户是否是管理员
 */
export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === Role.ADMIN;
}

/**
 * 检查用户是否是管理员或经理
 */
export function isAdminOrManager(user: AuthUser | null): boolean {
  return user?.role === Role.ADMIN || user?.role === Role.MANAGER;
}

/**
 * 检查用户是否可以导出数据
 */
export function canExportData(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.DATA_EXPORT);
}

/**
 * 检查用户是否可以导入数据
 */
export function canImportData(user: AuthUser | null): boolean {
  return hasPermission(user, Permission.DATA_IMPORT);
}

/**
 * 获取用户的所有权限
 */
export function getUserPermissions(user: AuthUser | null): Permission[] {
  if (!user) return [];
  
  const userRole = user.role as Role;
  return rolePermissions[userRole] || [];
}

/**
 * 获取角色的显示名称
 */
export function getRoleDisplayName(role: string): string {
  const roleNames: Record<string, string> = {
    [Role.ADMIN]: '管理员',
    [Role.MANAGER]: '经理',
    [Role.STAFF]: '员工',
    [Role.VIEWER]: '查看者',
  };
  
  return roleNames[role] || '未知';
}
