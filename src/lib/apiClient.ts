const DEFAULT_TIMEOUT = 15000;

const parseBaseUrl = () => {
  const url = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
  return url.endsWith('/') ? url.slice(0, -1) : url;
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
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
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
  })
};

export default apiClient;
