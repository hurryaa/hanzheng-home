const DEFAULT_TIMEOUT = 15000;

const parseBaseUrl = () => {
  // 优先使用环境变量
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
  }
  
  // 生产环境使用相对路径（前后端一体化部署）
  if (import.meta.env.PROD) {
    return '/api';
  }
  
  // 开发环境使用绝对路径
  return 'http://localhost:4000/api';
};

const API_BASE_URL = parseBaseUrl();

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions extends RequestInit {
  timeout?: number;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const token = localStorage.getItem('authToken');

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || response.statusText);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json() as Promise<T>;
    }

    return undefined as T;
  } finally {
    clearTimeout(timer);
  }
}

export const apiClient = {
  // ========== 原有API（集合管理）==========
  health: () => request<{ status: string }>('/health', { method: 'GET' }),
  bootstrap: () => request<{ data: Record<string, unknown> }>('/bootstrap', { method: 'GET' }),
  getCollection: (name: string) => request<{ data: unknown }>(`/collections/${name}`, { method: 'GET' }),
  setCollection: (name: string, data: unknown) => request<{ ok: boolean }>(`/collections/${name}`, {
    method: 'PUT',
    body: JSON.stringify({ data })
  }),
  clearCollection: (name: string) => request<{ ok: boolean }>(`/collections/${name}`, { method: 'DELETE' }),
  importCollections: (collections: Record<string, unknown>) => request<{ ok: boolean }>(`/import`, {
    method: 'POST',
    body: JSON.stringify({ collections })
  }),
  
  // ========== 认证 API ==========
  login: (username: string, password: string) => request<{ token: string; user: { id: string; username: string; role: string; name: string; email: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  staffLogin: (username: string, password: string) => request<{ token: string; user: { id: string; username: string; role: string; name: string; storeId: string } }>('/auth/staff-login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),

  // ========== 会员 API ==========
  getMembers: () => request<{ data: any[] }>('/members', { method: 'GET' }),
  getMember: (id: string) => request<{ data: any }>(`/members/${id}`, { method: 'GET' }),
  createMember: (data: any) => request<{ data: any }>('/members', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateMember: (id: string, data: any) => request<{ data: any }>(`/members/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  searchMembers: (keyword: string) => request<{ data: any[] }>(`/members/search?keyword=${keyword}`, { method: 'GET' }),

  // ========== 套餐配置 API ==========
  getPackages: () => request<{ data: any[] }>('/packages', { method: 'GET' }),
  getPackage: (id: string) => request<{ data: any }>(`/packages/${id}`, { method: 'GET' }),
  createPackage: (data: any) => request<{ data: any }>('/packages', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updatePackage: (id: string, data: any) => request<{ data: any }>(`/packages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deletePackage: (id: string) => request<{ ok: boolean }>(`/packages/${id}`, { method: 'DELETE' }),

  // ========== 用户次卡 API ==========
  getUserPackages: (userId: string) => request<{ data: any[] }>(`/users/${userId}/packages`, { method: 'GET' }),
  getUserPackageBalance: (userId: string) => request<{ data: any }>(`/users/${userId}/package-balance`, { method: 'GET' }),
  createUserPackage: (data: any) => request<{ data: any }>('/user-packages', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // ========== 购买记录 API ==========
  getPurchaseRecords: (filters?: any) => request<{ data: any[] }>('/purchase-records', {
    method: 'GET',
    body: filters ? JSON.stringify(filters) : undefined
  }),
  getPurchaseRecord: (id: string) => request<{ data: any }>(`/purchase-records/${id}`, { method: 'GET' }),
  createPurchaseRecord: (data: any) => request<{ data: any }>('/purchase-records', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  voidPurchaseRecord: (id: string, reason: string) => request<{ data: any }>(`/purchase-records/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),

  // ========== 核销记录 API ==========
  getRedemptionRecords: (filters?: any) => request<{ data: any[] }>('/redemption-records', {
    method: 'GET',
    body: filters ? JSON.stringify(filters) : undefined
  }),
  getRedemptionRecord: (id: string) => request<{ data: any }>(`/redemption-records/${id}`, { method: 'GET' }),
  createRedemption: (data: any) => request<{ data: any }>('/redemption-records', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  voidRedemption: (id: string, reason: string) => request<{ data: any }>(`/redemption-records/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  }),

  // ========== 分销 API ==========
  getDistributorProfile: (userId: string) => request<{ data: any }>(`/distributors/${userId}`, { method: 'GET' }),
  createDistributorProfile: (data: any) => request<{ data: any }>('/distributors', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getInviteBindings: (userId: string) => request<{ data: any[] }>(`/distributors/${userId}/invites`, { method: 'GET' }),
  createInviteBinding: (data: any) => request<{ data: any }>('/invite-bindings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getCommissionRecords: (distributorId: string) => request<{ data: any[] }>(`/distributors/${distributorId}/commissions`, { method: 'GET' }),

  // ========== 门店和员工 API ==========
  getStores: () => request<{ data: any[] }>('/stores', { method: 'GET' }),
  getStore: (id: string) => request<{ data: any }>(`/stores/${id}`, { method: 'GET' }),
  createStore: (data: any) => request<{ data: any }>('/stores', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  getStaffMembers: (storeId?: string) => request<{ data: any[] }>(`/staff${storeId ? `?storeId=${storeId}` : ''}`, { method: 'GET' }),
  getStaffMember: (id: string) => request<{ data: any }>(`/staff/${id}`, { method: 'GET' }),
  createStaffMember: (data: any) => request<{ data: any }>('/staff', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // ========== 操作日志 API ==========
  getAuditLogs: (filters?: any) => request<{ data: any[] }>('/audit-logs', {
    method: 'GET',
    body: filters ? JSON.stringify(filters) : undefined
  }),
  createAuditLog: (data: any) => request<{ data: any }>('/audit-logs', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // ========== 次数调整 API ==========
  getSessionAdjustments: (filters?: any) => request<{ data: any[] }>('/session-adjustments', {
    method: 'GET',
    body: filters ? JSON.stringify(filters) : undefined
  }),
  createSessionAdjustment: (data: any) => request<{ data: any }>('/session-adjustments', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};

export default apiClient;
