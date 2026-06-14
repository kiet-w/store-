const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ message: res.statusText }));
    throw new ApiError(res.status, body.message || res.statusText);
  }

  // Handle 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ─── Auth ───────────────────────────────────────────
export const auth = {
  login: (email: string, password: string) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  register: (data: { email: string; password: string; name: string; phone?: string; role?: string }) =>
    request<{ accessToken: string; refreshToken: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── Products ───────────────────────────────────────
export const products = {
  list: () => request<any[]>('/products'),
  get: (id: number) => request<any>(`/products/${id}`),
  create: (data: any) => request<any>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => request<any>(`/products/${id}`, { method: 'DELETE' }),
};

// ─── Warehouses ─────────────────────────────────────
export const warehouses = {
  list: () => request<any[]>('/warehouses'),
  get: (id: number) => request<any>(`/warehouses/${id}`),
  create: (data: any) => request<any>('/warehouses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id: number) => request<any>(`/warehouses/${id}`, { method: 'DELETE' }),
};

// ─── Inventory ──────────────────────────────────────
export const inventory = {
  getStock: (warehouseId: number) => request<any[]>(`/inventory/warehouse/${warehouseId}`),
  getProductStock: (productId: number) => request<any[]>(`/inventory/product/${productId}`),
  importStock: (data: any) => request<any>('/inventory/import', { method: 'POST', body: JSON.stringify(data) }),
  adjustStock: (data: any) => request<any>('/inventory/adjust', { method: 'POST', body: JSON.stringify(data) }),
  getTransactions: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/inventory/transactions${qs}`);
  },
};

// ─── Shippers ───────────────────────────────────────
export const shippers = {
  list: () => request<any[]>('/shippers'),
  listAvailable: () => request<any[]>('/shippers/available'),
  get: (id: number) => request<any>(`/shippers/${id}`),
  create: (data: any) => request<any>('/shippers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/shippers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Delivery Orders ────────────────────────────────
export const deliveryOrders = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/delivery-orders${qs}`);
  },
  get: (id: number) => request<any>(`/delivery-orders/${id}`),
  create: (data: any) => request<any>('/delivery-orders', { method: 'POST', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<any>(`/delivery-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  assignShipper: (orderId: number, shipperId: number) =>
    request<any>(`/delivery-orders/${orderId}/assign/${shipperId}`, { method: 'PATCH' }),
};

// ─── Delivery Batches ───────────────────────────────
export const deliveryBatches = {
  list: (shipperId?: number) => {
    const qs = shipperId ? `?shipperId=${shipperId}` : '';
    return request<any[]>(`/delivery-batches${qs}`);
  },
  get: (id: number) => request<any>(`/delivery-batches/${id}`),
  create: (data: { shipperId: number; orderIds: number[] }) =>
    request<any>('/delivery-batches', { method: 'POST', body: JSON.stringify(data) }),
  optimize: (id: number) => request<any>(`/delivery-batches/${id}/optimize`, { method: 'PATCH' }),
  start: (id: number) => request<any>(`/delivery-batches/${id}/start`, { method: 'PATCH' }),
  complete: (id: number) => request<any>(`/delivery-batches/${id}/complete`, { method: 'PATCH' }),
};

// ─── Admin ──────────────────────────────────────────
export const admin = {
  dashboardSummary: () => request<any>('/admin/dashboard/summary'),
  todaySummary: () => request<any>('/admin/dashboard/today'),
  inventoryReport: (warehouseId: number) => request<any[]>(`/admin/reports/inventory/${warehouseId}`),
  shipperReport: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any[]>(`/admin/reports/shippers${qs}`);
  },
};
