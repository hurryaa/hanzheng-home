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
  login: (username: string, password: string) => request<{ token: string; user: { id: string; username: string; role: string; name: string; email: string } }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  })
};

export default apiClient;
