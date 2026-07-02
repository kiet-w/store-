# Delivery Management System — Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin web dashboard for the Delivery Management System. Provides warehouse/inventory management UI, delivery order creation, batch route visualization on Mapbox, and admin reports. Maps 1:1 to the Backend API plan.

**Architecture:** Next.js 15 App Router with client-side data fetching. Vanilla CSS with CSS custom properties for a premium dark-mode design system. Mapbox GL JS for interactive route maps. JWT token stored in `localStorage` with an `AuthContext` provider.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vanilla CSS (dark mode), Mapbox GL JS, Google Fonts (Inter).

**Project Location:** `store/web/` (separate from backend at `store/`)

**Depends on:** [Backend Plan](file:///home/baudui/Downloads/project/docs/superpowers/plans/2026-06-14-delivery-management-system.md) — backend must be running at `http://localhost:3000` for API calls.

---

## File Structure

```
store/web/
├── .env.local
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout (fonts, metadata)
│   │   ├── page.tsx                # Redirect to /dashboard
│   │   ├── globals.css             # Design system tokens + global styles
│   │   ├── login/
│   │   │   ├── page.tsx
│   │   │   └── login.css
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx          # Sidebar + Header layout
│   │   │   ├── layout.css
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx
│   │   │   │   └── dashboard.css
│   │   │   ├── products/
│   │   │   │   ├── page.tsx
│   │   │   │   └── products.css
│   │   │   ├── warehouses/
│   │   │   │   ├── page.tsx
│   │   │   │   └── warehouses.css
│   │   │   ├── inventory/
│   │   │   │   ├── page.tsx
│   │   │   │   └── inventory.css
│   │   │   ├── shippers/
│   │   │   │   ├── page.tsx
│   │   │   │   └── shippers.css
│   │   │   ├── delivery-orders/
│   │   │   │   ├── page.tsx
│   │   │   │   └── delivery-orders.css
│   │   │   ├── delivery-batches/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── [id]/
│   │   │   │   │   └── page.tsx    # Batch detail with Mapbox route map
│   │   │   │   └── delivery-batches.css
│   │   │   └── reports/
│   │   │       ├── inventory/
│   │   │       │   └── page.tsx
│   │   │       ├── shippers/
│   │   │       │   └── page.tsx
│   │   │       └── reports.css
│   ├── lib/
│   │   ├── api.ts                  # Fetch wrapper with auth
│   │   ├── auth-context.tsx        # AuthContext provider
│   │   └── types.ts                # Shared TypeScript types
│   └── components/
│       ├── Sidebar.tsx
│       ├── Sidebar.css
│       ├── Header.tsx
│       ├── Header.css
│       ├── DataTable.tsx
│       ├── DataTable.css
│       ├── Modal.tsx
│       ├── Modal.css
│       ├── StatusBadge.tsx
│       ├── StatusBadge.css
│       ├── StatsCard.tsx
│       ├── StatsCard.css
│       ├── RouteMap.tsx            # Mapbox GL JS map component
│       └── RouteMap.css
├── next.config.ts
├── tsconfig.json
└── package.json
```

---

## Task 1: Scaffold Next.js Project

**Files:**
- Create: `store/web/` (entire Next.js scaffold via CLI)
- Create: `store/web/.env.local`

- [ ] **Step 1: Check `create-next-app` options**

```bash
npx -y create-next-app@latest --help
```

- [ ] **Step 2: Scaffold project**

```bash
cd /home/baudui/Downloads/project/store
npx -y create-next-app@latest web --typescript --eslint --app --src-dir --no-tailwind --import-alias "@/*" --use-npm
```

Expected: Next.js project created in `store/web/`.

- [ ] **Step 3: Install Mapbox GL JS**

```bash
cd /home/baudui/Downloads/project/store/web
npm install mapbox-gl
npm install -D @types/mapbox-gl
```

- [ ] **Step 4: Create `.env.local`**

Create `store/web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
```

- [ ] **Step 5: Verify scaffold works**

```bash
cd /home/baudui/Downloads/project/store/web
npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add .
git commit -m "chore: scaffold Next.js frontend for delivery management dashboard"
```

---

## Task 2: Design System (globals.css)

**Files:**
- Create: `store/web/src/app/globals.css` (overwrite default)

- [ ] **Step 1: Write the complete design system**

Replace `store/web/src/app/globals.css`:

```css
/* ─── Google Fonts ──────────────────────────────── */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

/* ─── Design Tokens ─────────────────────────────── */
:root {
  /* Colors — Dark theme */
  --bg-primary: #0a0a12;
  --bg-secondary: #111119;
  --bg-card: #1a1a26;
  --bg-card-hover: #22222f;
  --bg-input: #16161f;
  --bg-sidebar: #0d0d15;

  --border-color: #2a2a3a;
  --border-focus: #4f6ef7;

  --text-primary: #f0f0f5;
  --text-secondary: #9090a8;
  --text-muted: #606078;

  --accent-blue: #4f6ef7;
  --accent-blue-hover: #3d5ce5;
  --accent-blue-glow: rgba(79, 110, 247, 0.15);
  --accent-green: #34d399;
  --accent-green-bg: rgba(52, 211, 153, 0.12);
  --accent-amber: #fbbf24;
  --accent-amber-bg: rgba(251, 191, 36, 0.12);
  --accent-red: #f87171;
  --accent-red-bg: rgba(248, 113, 113, 0.12);
  --accent-purple: #a78bfa;
  --accent-purple-bg: rgba(167, 139, 250, 0.12);

  /* Typography */
  --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.8125rem;
  --font-size-base: 0.875rem;
  --font-size-lg: 1rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 2rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;

  /* Layout */
  --sidebar-width: 260px;
  --header-height: 64px;
  --border-radius: 8px;
  --border-radius-lg: 12px;
  --border-radius-xl: 16px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.5);
  --shadow-glow: 0 0 20px var(--accent-blue-glow);

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 200ms ease;
  --transition-slow: 300ms ease;
}

/* ─── Reset & Base ──────────────────────────────── */
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  line-height: 1.6;
  min-height: 100vh;
}

a {
  color: var(--accent-blue);
  text-decoration: none;
  transition: color var(--transition-fast);
}
a:hover {
  color: var(--accent-blue-hover);
}

/* ─── Shared Components ─────────────────────────── */

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  font-family: var(--font-family);
  font-size: var(--font-size-sm);
  font-weight: 500;
  border: 1px solid transparent;
  border-radius: var(--border-radius);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}
.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--accent-blue);
  color: #fff;
  border-color: var(--accent-blue);
}
.btn-primary:hover:not(:disabled) {
  background: var(--accent-blue-hover);
  box-shadow: var(--shadow-glow);
}

.btn-secondary {
  background: transparent;
  color: var(--text-primary);
  border-color: var(--border-color);
}
.btn-secondary:hover:not(:disabled) {
  background: var(--bg-card-hover);
  border-color: var(--text-muted);
}

.btn-danger {
  background: var(--accent-red);
  color: #fff;
}
.btn-danger:hover:not(:disabled) {
  background: #e64d4d;
}

.btn-sm {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
}

/* Inputs */
.input,
.select,
.textarea {
  width: 100%;
  padding: var(--space-2) var(--space-3);
  font-family: var(--font-family);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-input);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  outline: none;
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}
.input:focus,
.select:focus,
.textarea:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px var(--accent-blue-glow);
}
.input::placeholder {
  color: var(--text-muted);
}

.textarea {
  resize: vertical;
  min-height: 80px;
}

.select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%239090a8' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

/* Form groups */
.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}
.form-group label {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
}
.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
}

/* Page header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-header h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-primary), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--space-12);
  color: var(--text-muted);
}
.empty-state p {
  margin-top: var(--space-2);
}

/* Loading spinner */
.spinner {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

/* Toast / alert */
.alert {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-4);
  border: 1px solid;
}
.alert-error {
  background: var(--accent-red-bg);
  color: var(--accent-red);
  border-color: rgba(248, 113, 113, 0.3);
}
.alert-success {
  background: var(--accent-green-bg);
  color: var(--accent-green);
  border-color: rgba(52, 211, 153, 0.3);
}

/* Utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
}
```

- [ ] **Step 2: Update root layout with font + metadata**

Replace `store/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Delivery Management System',
  description: 'Quản lý giao hàng, kho hàng, và tối ưu tuyến đường',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Verify build & commit**

```bash
npm run build
git add src/app/globals.css src/app/layout.tsx
git commit -m "feat: add design system with dark mode tokens and shared component styles"
```

---

## Task 3: API Client & TypeScript Types

**Files:**
- Create: `store/web/src/lib/types.ts`
- Create: `store/web/src/lib/api.ts`

- [ ] **Step 1: Create shared types**

Create `store/web/src/lib/types.ts`:

```typescript
// ─── Auth ─────────────────────────────────────────
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  sub: number;
  role: 'ADMIN' | 'WAREHOUSE_MANAGER' | 'SHIPPER';
  iat: number;
  exp: number;
}

// ─── Products ─────────────────────────────────────
export interface Product {
  id: number;
  name: string;
  sku: string;
  unit: string;
  description: string | null;
  price: string; // Decimal as string
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── Warehouses ───────────────────────────────────
export interface Warehouse {
  id: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  isActive: boolean;
  stocks?: WarehouseStock[];
}

export interface WarehouseStock {
  id: number;
  warehouseId: number;
  productId: number;
  quantity: number;
  product: Product;
}

// ─── Inventory ────────────────────────────────────
export type TransactionType = 'IMPORT' | 'EXPORT' | 'ADJUSTMENT' | 'RETURN';

export interface InventoryTransaction {
  id: number;
  warehouseId: number;
  productId: number;
  type: TransactionType;
  quantity: number;
  balanceBefore: number;
  balanceAfter: number;
  reason: string | null;
  referenceId: string | null;
  createdAt: string;
  product: Product;
  createdBy: { id: number; name: string };
}

// ─── Shippers ─────────────────────────────────────
export interface Shipper {
  id: number;
  userId: number;
  phone: string;
  vehicleType: string | null;
  isAvailable: boolean;
  user: { id: number; name: string; email?: string };
}

// ─── Delivery Orders ──────────────────────────────
export type DeliveryOrderStatus =
  | 'PENDING' | 'ASSIGNED' | 'PICKED_UP'
  | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';

export interface DeliveryOrderItem {
  id: number;
  productId: number;
  quantity: number;
  product: Product;
}

export interface DeliveryOrder {
  id: number;
  recipientName: string;
  recipientPhone: string;
  address: string;
  lat: number | null;
  lng: number | null;
  warehouseId: number;
  shipperId: number | null;
  status: DeliveryOrderStatus;
  notes: string | null;
  createdAt: string;
  items: DeliveryOrderItem[];
  warehouse: Warehouse;
  shipper?: Shipper | null;
}

// ─── Delivery Batches ─────────────────────────────
export type BatchStatus = 'PLANNING' | 'OPTIMIZED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface DeliveryBatchOrder {
  id: number;
  batchId: number;
  orderId: number;
  sequenceOrder: number;
  order: DeliveryOrder;
}

export interface DeliveryBatch {
  id: number;
  shipperId: number;
  status: BatchStatus;
  optimizedRoute: any | null;
  totalDistanceM: number | null;
  estimatedDurationS: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  orders: DeliveryBatchOrder[];
  shipper: Shipper;
}

// ─── Dashboard ────────────────────────────────────
export interface DashboardSummary {
  orders: { total: number; pending: number; inTransit: number; delivered: number };
  batches: { total: number; active: number };
  products: { total: number };
  shippers: { available: number };
}

export interface TodaySummary {
  ordersToday: number;
  deliveredToday: number;
  batchesToday: number;
}

// ─── Reports ──────────────────────────────────────
export interface InventoryReconciliation {
  productId: number;
  productName: string;
  sku: string;
  currentStock: number;
  totalImport: number;
  totalExport: number;
  totalAdjustment: number;
  totalReturn: number;
  expectedBalance: number;
  discrepancy: number;
}

export interface ShipperPerformance {
  shipperId: number;
  name: string;
  totalBatches: number;
  totalOrders: number;
  completedBatches: number;
  totalDistanceKm: number;
}
```

- [ ] **Step 2: Create API client with auth**

Create `store/web/src/lib/api.ts`:

```typescript
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
```

- [ ] **Step 3: Verify build & commit**

```bash
npm run build
git add src/lib/
git commit -m "feat: add API client and TypeScript types"
```

---

## Task 4: Auth Context & Login Page

**Files:**
- Create: `store/web/src/lib/auth-context.tsx`
- Create: `store/web/src/app/login/page.tsx`
- Create: `store/web/src/app/login/login.css`
- Modify: `store/web/src/app/layout.tsx`
- Modify: `store/web/src/app/page.tsx`

- [ ] **Step 1: Create AuthContext**

Create `store/web/src/lib/auth-context.tsx`:

```tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { auth as authApi } from './api';
import type { User } from './types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseJwt(token: string): User | null {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const parsed = parseJwt(token);
      if (parsed && parsed.exp * 1000 > Date.now()) {
        setUser(parsed);
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const tokens = await authApi.login(email, password);
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
    const parsed = parseJwt(tokens.accessToken);
    setUser(parsed);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

- [ ] **Step 2: Update root layout to include AuthProvider**

Replace `store/web/src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata: Metadata = {
  title: 'Delivery Management System',
  description: 'Quản lý giao hàng, kho hàng, và tối ưu tuyến đường',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create Login page**

Create `store/web/src/app/login/login.css`:

```css
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--bg-primary);
  background-image:
    radial-gradient(ellipse at 20% 50%, var(--accent-blue-glow), transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(167, 139, 250, 0.08), transparent 50%);
}

.login-card {
  width: 100%;
  max-width: 400px;
  padding: var(--space-8);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
}

.login-card h1 {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--space-1);
  background: linear-gradient(135deg, var(--text-primary), var(--accent-blue));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.login-card .subtitle {
  text-align: center;
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  margin-bottom: var(--space-6);
}

.login-card .form-group {
  margin-bottom: var(--space-4);
}

.login-card .btn-primary {
  width: 100%;
  padding: var(--space-3);
  font-size: var(--font-size-base);
  justify-content: center;
  margin-top: var(--space-2);
}
```

Create `store/web/src/app/login/page.tsx`:

```tsx
'use client';

import { useState, FormEvent } from 'react';
import { useAuth } from '@/lib/auth-context';
import './login.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>Delivery MS</h1>
        <p className="subtitle">Hệ thống quản lý giao hàng</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="admin@store.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Đăng nhập'}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Root page redirects to /dashboard**

Replace `store/web/src/app/page.tsx`:

```tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

- [ ] **Step 5: Verify build & commit**

```bash
npm run build
git add src/
git commit -m "feat: add auth context, login page, and root redirect"
```

---

## Task 5: Dashboard Layout (Sidebar + Header)

**Files:**
- Create: `store/web/src/components/Sidebar.tsx`
- Create: `store/web/src/components/Sidebar.css`
- Create: `store/web/src/components/Header.tsx`
- Create: `store/web/src/components/Header.css`
- Create: `store/web/src/app/(dashboard)/layout.tsx`
- Create: `store/web/src/app/(dashboard)/layout.css`

- [ ] **Step 1: Create Sidebar**

Create `store/web/src/components/Sidebar.css`:

```css
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  z-index: 100;
  overflow-y: auto;
}

.sidebar-brand {
  padding: var(--space-5) var(--space-5);
  border-bottom: 1px solid var(--border-color);
}
.sidebar-brand h2 {
  font-size: var(--font-size-lg);
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.sidebar-brand span {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.sidebar-nav {
  flex: 1;
  padding: var(--space-4) var(--space-3);
}

.nav-section {
  margin-bottom: var(--space-5);
}
.nav-section-title {
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 var(--space-3);
  margin-bottom: var(--space-2);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  text-decoration: none;
  margin-bottom: 2px;
}
.nav-link:hover {
  background: var(--bg-card);
  color: var(--text-primary);
}
.nav-link.active {
  background: var(--accent-blue-glow);
  color: var(--accent-blue);
}
.nav-link .nav-icon {
  width: 18px;
  text-align: center;
  font-size: var(--font-size-base);
}
```

Create `store/web/src/components/Sidebar.tsx`:

```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Sidebar.css';

const navItems = [
  { section: 'Tổng quan', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ]},
  { section: 'Quản lý kho', items: [
    { href: '/products', label: 'Sản phẩm', icon: '📦' },
    { href: '/warehouses', label: 'Kho hàng', icon: '🏭' },
    { href: '/inventory', label: 'Tồn kho', icon: '📋' },
  ]},
  { section: 'Giao hàng', items: [
    { href: '/shippers', label: 'Shipper', icon: '🚚' },
    { href: '/delivery-orders', label: 'Đơn giao', icon: '📬' },
    { href: '/delivery-batches', label: 'Đơn ghép', icon: '🗺️' },
  ]},
  { section: 'Báo cáo', items: [
    { href: '/reports/inventory', label: 'Bù trừ kho', icon: '📈' },
    { href: '/reports/shippers', label: 'Hiệu suất shipper', icon: '⚡' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Delivery MS</h2>
        <span>Quản lý giao hàng</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create Header**

Create `store/web/src/components/Header.css`:

```css
.header {
  position: fixed;
  top: 0;
  left: var(--sidebar-width);
  right: 0;
  height: var(--header-height);
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 var(--space-6);
  z-index: 90;
  backdrop-filter: blur(8px);
}

.header-user {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.header-user .role-badge {
  padding: var(--space-1) var(--space-2);
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: 999px;
  background: var(--accent-blue-glow);
  color: var(--accent-blue);
  border: 1px solid rgba(79, 110, 247, 0.3);
}

.header-user .logout-btn {
  padding: var(--space-1) var(--space-3);
  font-size: var(--font-size-xs);
  background: transparent;
  color: var(--text-muted);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: var(--font-family);
  transition: all var(--transition-fast);
}
.header-user .logout-btn:hover {
  color: var(--accent-red);
  border-color: var(--accent-red);
}
```

Create `store/web/src/components/Header.tsx`:

```tsx
'use client';

import { useAuth } from '@/lib/auth-context';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-user">
        <span className="role-badge">{user?.role}</span>
        <button className="logout-btn" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create dashboard layout**

Create `store/web/src/app/(dashboard)/layout.css`:

```css
.dashboard-layout {
  display: flex;
  min-height: 100vh;
}

.dashboard-main {
  flex: 1;
  margin-left: var(--sidebar-width);
  margin-top: var(--header-height);
  padding: var(--space-6);
  min-height: calc(100vh - var(--header-height));
}
```

Create `store/web/src/app/(dashboard)/layout.tsx`:

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import './layout.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="loading-center" style={{ minHeight: '100vh' }}>
        <span className="spinner" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <Header />
      <main className="dashboard-main">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Verify build & commit**

```bash
npm run build
git add src/components/ src/app/\(dashboard\)/
git commit -m "feat: add sidebar, header, and dashboard layout with auth protection"
```

---

## Task 6: Dashboard Page (Summary Stats)

**Files:**
- Create: `store/web/src/components/StatsCard.tsx`
- Create: `store/web/src/components/StatsCard.css`
- Create: `store/web/src/app/(dashboard)/dashboard/page.tsx`
- Create: `store/web/src/app/(dashboard)/dashboard/dashboard.css`

- [ ] **Step 1: Create StatsCard component**

Create `store/web/src/components/StatsCard.css`:

```css
.stats-card {
  padding: var(--space-5);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  transition: all var(--transition-base);
}
.stats-card:hover {
  border-color: var(--text-muted);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
.stats-card .card-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}
.stats-card .card-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
}
.stats-card .card-sub {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin-top: var(--space-1);
}
```

Create `store/web/src/components/StatsCard.tsx`:

```tsx
import './StatsCard.css';

interface StatsCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}

export default function StatsCard({ label, value, sub, color }: StatsCardProps) {
  return (
    <div className="stats-card">
      <div className="card-label">{label}</div>
      <div className="card-value" style={color ? { color } : {}}>
        {value}
      </div>
      {sub && <div className="card-sub">{sub}</div>}
    </div>
  );
}
```

- [ ] **Step 2: Create Dashboard page**

Create `store/web/src/app/(dashboard)/dashboard/dashboard.css`:

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.dashboard-section-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}
```

Create `store/web/src/app/(dashboard)/dashboard/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { DashboardSummary, TodaySummary } from '@/lib/types';
import StatsCard from '@/components/StatsCard';
import './dashboard.css';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [today, setToday] = useState<TodaySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([admin.dashboardSummary(), admin.todaySummary()])
      .then(([s, t]) => { setSummary(s); setToday(t); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading-center"><span className="spinner" /></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      <div className="dashboard-section-title">Hôm nay</div>
      <div className="dashboard-grid">
        <StatsCard label="Đơn mới" value={today?.ordersToday ?? 0} color="var(--accent-blue)" />
        <StatsCard label="Đã giao" value={today?.deliveredToday ?? 0} color="var(--accent-green)" />
        <StatsCard label="Batch mới" value={today?.batchesToday ?? 0} color="var(--accent-purple)" />
      </div>

      <div className="dashboard-section-title">Tổng quan</div>
      <div className="dashboard-grid">
        <StatsCard label="Tổng đơn" value={summary?.orders.total ?? 0} sub={`${summary?.orders.pending ?? 0} đang chờ`} />
        <StatsCard label="Đang giao" value={summary?.orders.inTransit ?? 0} color="var(--accent-amber)" />
        <StatsCard label="Đã giao" value={summary?.orders.delivered ?? 0} color="var(--accent-green)" />
        <StatsCard label="Batch đang chạy" value={summary?.batches.active ?? 0} color="var(--accent-blue)" />
        <StatsCard label="Sản phẩm" value={summary?.products.total ?? 0} />
        <StatsCard label="Shipper sẵn sàng" value={summary?.shippers.available ?? 0} color="var(--accent-green)" />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build & commit**

```bash
npm run build
git add src/
git commit -m "feat: add dashboard page with summary stats cards"
```

---

## Task 7: Reusable DataTable & Modal Components

**Files:**
- Create: `store/web/src/components/DataTable.tsx`
- Create: `store/web/src/components/DataTable.css`
- Create: `store/web/src/components/Modal.tsx`
- Create: `store/web/src/components/Modal.css`
- Create: `store/web/src/components/StatusBadge.tsx`
- Create: `store/web/src/components/StatusBadge.css`

- [ ] **Step 1: Create DataTable**

Create `store/web/src/components/DataTable.css`:

```css
.data-table-wrapper {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}
.data-table th {
  text-align: left;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-xs);
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}
.data-table td {
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-sm);
  border-bottom: 1px solid var(--border-color);
  color: var(--text-primary);
}
.data-table tr:last-child td {
  border-bottom: none;
}
.data-table tr:hover td {
  background: var(--bg-card-hover);
}
.data-table .actions-cell {
  display: flex;
  gap: var(--space-2);
}
```

Create `store/web/src/components/DataTable.tsx`:

```tsx
import './DataTable.css';

export interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: string;
}

export default function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyField = 'id',
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="data-table-wrapper">
        <div className="empty-state">
          <p>Không có dữ liệu</p>
        </div>
      </div>
    );
  }

  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item[keyField]}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(item) : item[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: Create Modal**

Create `store/web/src/components/Modal.css`:

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  animation: fadeIn 150ms ease;
  backdrop-filter: blur(4px);
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  width: 100%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-xl);
  box-shadow: var(--shadow-lg);
  animation: slideUp 200ms ease;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-5) var(--space-6);
  border-bottom: 1px solid var(--border-color);
}
.modal-header h2 {
  font-size: var(--font-size-lg);
  font-weight: 600;
}
.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: var(--font-size-xl);
  cursor: pointer;
  padding: var(--space-1);
  line-height: 1;
  transition: color var(--transition-fast);
}
.modal-close:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: var(--space-6);
}
.modal-body .form-group {
  margin-bottom: var(--space-4);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--space-3);
  padding: var(--space-4) var(--space-6);
  border-top: 1px solid var(--border-color);
}
```

Create `store/web/src/components/Modal.tsx`:

```tsx
'use client';

import { ReactNode, useEffect } from 'react';
import './Modal.css';

interface ModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}

export default function Modal({ title, open, onClose, children, footer }: ModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create StatusBadge**

Create `store/web/src/components/StatusBadge.css`:

```css
.status-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: var(--font-size-xs);
  font-weight: 600;
  border-radius: 999px;
  border: 1px solid;
}
.status-badge.pending    { background: var(--accent-amber-bg); color: var(--accent-amber); border-color: rgba(251, 191, 36, 0.3); }
.status-badge.assigned   { background: var(--accent-blue-glow); color: var(--accent-blue); border-color: rgba(79, 110, 247, 0.3); }
.status-badge.in_transit,
.status-badge.picked_up,
.status-badge.in_progress,
.status-badge.optimized  { background: var(--accent-purple-bg); color: var(--accent-purple); border-color: rgba(167, 139, 250, 0.3); }
.status-badge.delivered,
.status-badge.completed  { background: var(--accent-green-bg); color: var(--accent-green); border-color: rgba(52, 211, 153, 0.3); }
.status-badge.failed,
.status-badge.cancelled  { background: var(--accent-red-bg); color: var(--accent-red); border-color: rgba(248, 113, 113, 0.3); }
.status-badge.planning   { background: var(--accent-amber-bg); color: var(--accent-amber); border-color: rgba(251, 191, 36, 0.3); }
```

Create `store/web/src/components/StatusBadge.tsx`:

```tsx
import './StatusBadge.css';

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge ${status.toLowerCase()}`}>
      {status}
    </span>
  );
}
```

- [ ] **Step 4: Verify build & commit**

```bash
npm run build
git add src/components/
git commit -m "feat: add reusable DataTable, Modal, and StatusBadge components"
```

---

## Task 8: Products CRUD Page

> **This is the reference CRUD page.** Tasks 9 (Warehouses), 10 (Shippers) follow the same pattern — only the fields and API calls differ.

**Files:**
- Create: `store/web/src/app/(dashboard)/products/page.tsx`
- Create: `store/web/src/app/(dashboard)/products/products.css`

- [ ] **Step 1: Create Products page with full CRUD**

Create `store/web/src/app/(dashboard)/products/products.css`:

```css
.products-filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
}
.products-filters .input {
  max-width: 300px;
}
```

Create `store/web/src/app/(dashboard)/products/page.tsx`:

```tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { products as api } from '@/lib/api';
import type { Product } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import './products.css';

export default function ProductsPage() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [unit, setUnit] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');

  const load = () => {
    setLoading(true);
    api.list().then(setData).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setName(''); setSku(''); setUnit(''); setPrice(''); setDescription('');
    setError('');
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setName(p.name); setSku(p.sku); setUnit(p.unit);
    setPrice(p.price); setDescription(p.description ?? '');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const body = { name, sku, unit, price: parseFloat(price), description: description || undefined };
    try {
      if (editing) {
        await api.update(editing.id, body);
      } else {
        await api.create(body);
      }
      setModalOpen(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Xác nhận xóa sản phẩm?')) return;
    await api.remove(id);
    load();
  };

  const columns: Column<Product>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên' },
    { key: 'sku', label: 'SKU' },
    { key: 'unit', label: 'Đơn vị' },
    { key: 'price', label: 'Giá', render: (p) => `${Number(p.price).toLocaleString('vi-VN')}₫` },
    {
      key: 'actions',
      label: '',
      render: (p) => (
        <div className="actions-cell">
          <button className="btn btn-sm btn-secondary" onClick={() => openEdit(p)}>Sửa</button>
          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(p.id)}>Xóa</button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Sản phẩm</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm sản phẩm</button>
      </div>

      <DataTable columns={columns} data={data} />

      <Modal
        title={editing ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Hủy</button>
            <button className="btn btn-primary" onClick={handleSubmit}>
              {editing ? 'Lưu' : 'Tạo'}
            </button>
          </>
        }
      >
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên sản phẩm</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>SKU</label>
              <input className="input" value={sku} onChange={(e) => setSku(e.target.value)} required disabled={!!editing} />
            </div>
            <div className="form-group">
              <label>Đơn vị</label>
              <input className="input" value={unit} onChange={(e) => setUnit(e.target.value)} required placeholder="thùng, kg, chai..." />
            </div>
          </div>
          <div className="form-group">
            <label>Giá</label>
            <input className="input" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Mô tả</label>
            <textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Verify build & commit**

```bash
npm run build
git add src/app/\(dashboard\)/products/
git commit -m "feat: add products CRUD page with modal form"
```

---

## Task 9: Warehouses & Inventory Pages

> Same CRUD pattern as Products but with stock view and import/adjust forms.

**Files:**
- Create: `store/web/src/app/(dashboard)/warehouses/page.tsx`
- Create: `store/web/src/app/(dashboard)/warehouses/warehouses.css`
- Create: `store/web/src/app/(dashboard)/inventory/page.tsx`
- Create: `store/web/src/app/(dashboard)/inventory/inventory.css`

- [ ] **Step 1: Create Warehouses page**

Create `store/web/src/app/(dashboard)/warehouses/warehouses.css`:

```css
.stock-list {
  margin-top: var(--space-4);
}
.stock-item {
  display: flex;
  justify-content: space-between;
  padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--border-color);
  font-size: var(--font-size-sm);
}
.stock-item:last-child { border-bottom: none; }
.stock-item .qty {
  font-weight: 600;
  color: var(--accent-green);
}
.stock-item .qty.low {
  color: var(--accent-red);
}
```

Create `store/web/src/app/(dashboard)/warehouses/page.tsx`:

```tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { warehouses as api, inventory as invApi } from '@/lib/api';
import type { Warehouse, WarehouseStock } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import './warehouses.css';

export default function WarehousesPage() {
  const [data, setData] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<WarehouseStock[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [editing, setEditing] = useState<Warehouse | null>(null);

  const load = () => {
    setLoading(true);
    api.list().then(setData).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditing(null); setName(''); setAddress(''); setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await api.update(editing.id, { name, address });
      } else {
        await api.create({ name, address });
      }
      setModalOpen(false);
      load();
    } catch (err: any) { setError(err.message); }
  };

  const viewStock = async (w: Warehouse) => {
    const stock = await invApi.getStock(w.id);
    setSelectedStock(stock);
    setSelectedName(w.name);
    setStockModalOpen(true);
  };

  const columns: Column<Warehouse>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên kho' },
    { key: 'address', label: 'Địa chỉ' },
    { key: 'coords', label: 'Tọa độ', render: (w) => w.lat ? `${w.lat.toFixed(4)}, ${w.lng?.toFixed(4)}` : '—' },
    {
      key: 'actions', label: '', render: (w) => (
        <div className="actions-cell">
          <button className="btn btn-sm btn-secondary" onClick={() => viewStock(w)}>Tồn kho</button>
          <button className="btn btn-sm btn-secondary" onClick={() => { setEditing(w); setName(w.name); setAddress(w.address); setModalOpen(true); }}>Sửa</button>
        </div>
      ),
    },
  ];

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Kho hàng</h1>
        <button className="btn btn-primary" onClick={openCreate}>+ Thêm kho</button>
      </div>
      <DataTable columns={columns} data={data} />

      {/* Create/Edit Modal */}
      <Modal title={editing ? 'Sửa kho' : 'Thêm kho'} open={modalOpen} onClose={() => setModalOpen(false)}
        footer={<><button className="btn btn-secondary" onClick={() => setModalOpen(false)}>Hủy</button><button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Lưu' : 'Tạo'}</button></>}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group"><label>Tên kho</label><input className="input" value={name} onChange={e => setName(e.target.value)} required /></div>
          <div className="form-group"><label>Địa chỉ</label><input className="input" value={address} onChange={e => setAddress(e.target.value)} required /></div>
        </form>
      </Modal>

      {/* Stock View Modal */}
      <Modal title={`Tồn kho — ${selectedName}`} open={stockModalOpen} onClose={() => setStockModalOpen(false)}>
        <div className="stock-list">
          {selectedStock.length === 0 && <p className="empty-state">Chưa có tồn kho</p>}
          {selectedStock.map(s => (
            <div className="stock-item" key={s.id}>
              <span>{s.product.name} ({s.product.sku})</span>
              <span className={`qty ${s.quantity < 10 ? 'low' : ''}`}>{s.quantity} {s.product.unit}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Create Inventory page (import/adjust + transaction log)**

Create `store/web/src/app/(dashboard)/inventory/inventory.css`:

```css
.inventory-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.action-card {
  padding: var(--space-5);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-lg);
}
.action-card h3 {
  font-size: var(--font-size-base);
  font-weight: 600;
  margin-bottom: var(--space-4);
}

.inventory-filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.inventory-filters .select {
  max-width: 200px;
}
```

Create `store/web/src/app/(dashboard)/inventory/page.tsx`:

```tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { inventory as api, warehouses as whApi, products as pApi } from '@/lib/api';
import type { InventoryTransaction, Warehouse, Product } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import StatusBadge from '@/components/StatusBadge';
import './inventory.css';

export default function InventoryPage() {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [warehouses_, setWarehouses] = useState<Warehouse[]>([]);
  const [products_, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Import form
  const [impWarehouse, setImpWarehouse] = useState('');
  const [impProduct, setImpProduct] = useState('');
  const [impQty, setImpQty] = useState('');
  const [impReason, setImpReason] = useState('');

  // Filter
  const [filterWarehouse, setFilterWarehouse] = useState('');

  const loadAll = async () => {
    setLoading(true);
    try {
      const [wh, pr, tx] = await Promise.all([
        whApi.list(), pApi.list(),
        api.getTransactions(filterWarehouse ? { warehouseId: filterWarehouse } : {}),
      ]);
      setWarehouses(wh); setProducts(pr); setTransactions(tx);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { loadAll(); }, [filterWarehouse]);

  const handleImport = async (e: FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
      await api.importStock({
        warehouseId: +impWarehouse,
        productId: +impProduct,
        quantity: +impQty,
        reason: impReason || undefined,
      });
      setSuccess('Nhập kho thành công!');
      setImpQty(''); setImpReason('');
      loadAll();
    } catch (err: any) { setError(err.message); }
  };

  const txColumns: Column<InventoryTransaction>[] = [
    { key: 'id', label: 'ID' },
    { key: 'type', label: 'Loại', render: (t) => <StatusBadge status={t.type} /> },
    { key: 'product', label: 'Sản phẩm', render: (t) => t.product?.name ?? '—' },
    { key: 'quantity', label: 'SL', render: (t) => (
      <span style={{ color: t.quantity > 0 ? 'var(--accent-green)' : 'var(--accent-red)', fontWeight: 600 }}>
        {t.quantity > 0 ? '+' : ''}{t.quantity}
      </span>
    )},
    { key: 'balance', label: 'Tồn', render: (t) => `${t.balanceBefore} → ${t.balanceAfter}` },
    { key: 'reason', label: 'Lý do', render: (t) => t.reason ?? '—' },
    { key: 'createdBy', label: 'Người tạo', render: (t) => t.createdBy?.name ?? '—' },
    { key: 'createdAt', label: 'Thời gian', render: (t) => new Date(t.createdAt).toLocaleString('vi-VN') },
  ];

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Quản lý tồn kho</h1></div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="inventory-actions">
        <div className="action-card">
          <h3>📥 Nhập kho từ tổng kho</h3>
          <form onSubmit={handleImport}>
            <div className="form-group">
              <label>Kho</label>
              <select className="select" value={impWarehouse} onChange={e => setImpWarehouse(e.target.value)} required>
                <option value="">Chọn kho</option>
                {warehouses_.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Sản phẩm</label>
              <select className="select" value={impProduct} onChange={e => setImpProduct(e.target.value)} required>
                <option value="">Chọn sản phẩm</option>
                {products_.map(p => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Số lượng</label>
                <input className="input" type="number" min="1" value={impQty} onChange={e => setImpQty(e.target.value)} required />
              </div>
            </div>
            <div className="form-group">
              <label>Lý do</label>
              <input className="input" value={impReason} onChange={e => setImpReason(e.target.value)} placeholder="PO#, ghi chú..." />
            </div>
            <button type="submit" className="btn btn-primary" style={{ marginTop: 'var(--space-2)' }}>Nhập kho</button>
          </form>
        </div>

        <div className="action-card">
          <h3>📊 Tồn kho nhanh</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--font-size-sm)' }}>
            Chọn kho ở bộ lọc bên dưới để xem tồn kho chi tiết, hoặc vào trang Kho hàng → Tồn kho.
          </p>
        </div>
      </div>

      <h2 style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-4)' }}>Lịch sử giao dịch</h2>
      <div className="inventory-filters">
        <select className="select" value={filterWarehouse} onChange={e => setFilterWarehouse(e.target.value)}>
          <option value="">Tất cả kho</option>
          {warehouses_.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <DataTable columns={txColumns} data={transactions} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build & commit**

```bash
npm run build
git add src/app/\(dashboard\)/warehouses/ src/app/\(dashboard\)/inventory/
git commit -m "feat: add warehouses page with stock view and inventory page with import/transaction log"
```

---

## Task 10: Shippers & Delivery Orders Pages

**Files:**
- Create: `store/web/src/app/(dashboard)/shippers/page.tsx`
- Create: `store/web/src/app/(dashboard)/delivery-orders/page.tsx`
- Create: `store/web/src/app/(dashboard)/delivery-orders/delivery-orders.css`

- [ ] **Step 1: Create Shippers page (simple CRUD table)**

Create `store/web/src/app/(dashboard)/shippers/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { shippers as api } from '@/lib/api';
import type { Shipper } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';

export default function ShippersPage() {
  const [data, setData] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.list().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggleAvailability = async (s: Shipper) => {
    await api.update(s.id, { isAvailable: !s.isAvailable });
    const updated = await api.list();
    setData(updated);
  };

  const columns: Column<Shipper>[] = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Tên', render: (s) => s.user.name },
    { key: 'phone', label: 'SĐT' },
    { key: 'vehicleType', label: 'Phương tiện', render: (s) => s.vehicleType ?? '—' },
    {
      key: 'isAvailable', label: 'Trạng thái', render: (s) => (
        <button
          className={`btn btn-sm ${s.isAvailable ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => toggleAvailability(s)}
        >
          {s.isAvailable ? '✅ Sẵn sàng' : '⏸️ Nghỉ'}
        </button>
      ),
    },
  ];

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Shipper</h1></div>
      <DataTable columns={columns} data={data} />
    </div>
  );
}
```

- [ ] **Step 2: Create Delivery Orders page**

Create `store/web/src/app/(dashboard)/delivery-orders/delivery-orders.css`:

```css
.order-filters {
  display: flex;
  gap: var(--space-3);
  margin-bottom: var(--space-4);
  flex-wrap: wrap;
}
.order-filters .select { max-width: 180px; }
```

Create `store/web/src/app/(dashboard)/delivery-orders/page.tsx`:

```tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { deliveryOrders as api, warehouses as whApi, products as pApi, shippers as sApi } from '@/lib/api';
import type { DeliveryOrder, Warehouse, Product, Shipper, DeliveryOrderStatus } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import './delivery-orders.css';

export default function DeliveryOrdersPage() {
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [warehouses_, setWarehouses] = useState<Warehouse[]>([]);
  const [products_, setProducts] = useState<Product[]>([]);
  const [shippers_, setShippers] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Create form
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [items, setItems] = useState<{ productId: string; quantity: string }[]>([{ productId: '', quantity: '1' }]);

  const load = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      const [o, wh, pr, sh] = await Promise.all([
        api.list(Object.keys(params).length ? params : undefined),
        whApi.list(), pApi.list(), sApi.listAvailable(),
      ]);
      setOrders(o); setWarehouses(wh); setProducts(pr); setShippers(sh);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, [filterStatus]);

  const addItem = () => setItems([...items, { productId: '', quantity: '1' }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string) => {
    const copy = [...items];
    (copy[i] as any)[field] = value;
    setItems(copy);
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.create({
        recipientName,
        recipientPhone,
        address,
        warehouseId: +warehouseId,
        items: items.map(i => ({ productId: +i.productId, quantity: +i.quantity })),
      });
      setCreateOpen(false);
      load();
    } catch (err: any) { setError(err.message); }
  };

  const columns: Column<DeliveryOrder>[] = [
    { key: 'id', label: '#' },
    { key: 'recipientName', label: 'Người nhận' },
    { key: 'address', label: 'Địa chỉ', render: (o) => <span title={o.address}>{o.address.slice(0, 40)}{o.address.length > 40 ? '...' : ''}</span> },
    { key: 'status', label: 'Trạng thái', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'items', label: 'SP', render: (o) => o.items.length },
    { key: 'shipper', label: 'Shipper', render: (o) => o.shipper?.user?.name ?? '—' },
    { key: 'coords', label: 'GPS', render: (o) => o.lat ? '✅' : '❌' },
    { key: 'createdAt', label: 'Ngày tạo', render: (o) => new Date(o.createdAt).toLocaleDateString('vi-VN') },
  ];

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Đơn giao hàng</h1>
        <button className="btn btn-primary" onClick={() => { setCreateOpen(true); setError(''); }}>+ Tạo đơn</button>
      </div>

      <div className="order-filters">
        <select className="select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Tất cả trạng thái</option>
          {['PENDING','ASSIGNED','PICKED_UP','IN_TRANSIT','DELIVERED','FAILED','CANCELLED'].map(s =>
            <option key={s} value={s}>{s}</option>
          )}
        </select>
      </div>

      <DataTable columns={columns} data={orders} />

      <Modal title="Tạo đơn giao hàng" open={createOpen} onClose={() => setCreateOpen(false)}
        footer={<><button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Hủy</button><button className="btn btn-primary" onClick={handleCreate}>Tạo đơn</button></>}>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleCreate}>
          <div className="form-row">
            <div className="form-group"><label>Người nhận</label><input className="input" value={recipientName} onChange={e => setRecipientName(e.target.value)} required /></div>
            <div className="form-group"><label>SĐT</label><input className="input" value={recipientPhone} onChange={e => setRecipientPhone(e.target.value)} required /></div>
          </div>
          <div className="form-group"><label>Địa chỉ giao</label><input className="input" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Hệ thống sẽ tự geocode → tọa độ" /></div>
          <div className="form-group">
            <label>Kho xuất</label>
            <select className="select" value={warehouseId} onChange={e => setWarehouseId(e.target.value)} required>
              <option value="">Chọn kho</option>
              {warehouses_.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Sản phẩm</label>
            {items.map((item, i) => (
              <div key={i} className="form-row" style={{ marginBottom: 'var(--space-2)' }}>
                <select className="select" value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                  <option value="">Chọn SP</option>
                  {products_.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input className="input" type="number" min="1" value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} style={{ maxWidth: 80 }} />
                {items.length > 1 && <button type="button" className="btn btn-sm btn-danger" onClick={() => removeItem(i)}>✕</button>}
              </div>
            ))}
            <button type="button" className="btn btn-sm btn-secondary" onClick={addItem}>+ Thêm SP</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 3: Verify build & commit**

```bash
npm run build
git add src/app/\(dashboard\)/shippers/ src/app/\(dashboard\)/delivery-orders/
git commit -m "feat: add shippers page and delivery orders page with create form"
```

---

## Task 11: Mapbox Route Map Component

**Files:**
- Create: `store/web/src/components/RouteMap.tsx`
- Create: `store/web/src/components/RouteMap.css`

- [ ] **Step 1: Create RouteMap component**

Create `store/web/src/components/RouteMap.css`:

```css
.route-map-container {
  width: 100%;
  height: 500px;
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  border: 1px solid var(--border-color);
}
.route-map-container .mapboxgl-map {
  width: 100%;
  height: 100%;
}

.map-marker {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
.map-marker.warehouse {
  background: var(--accent-blue);
  width: 36px;
  height: 36px;
}
.map-marker.stop {
  background: var(--accent-purple);
}
```

Create `store/web/src/components/RouteMap.tsx`:

```tsx
'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './RouteMap.css';

interface Waypoint {
  lat: number;
  lng: number;
  label: string;
  isWarehouse?: boolean;
}

interface RouteMapProps {
  waypoints: Waypoint[];
  encodedPolyline?: string; // Mapbox encoded polyline
}

// Decode Mapbox polyline (Google polyline encoding algorithm)
function decodePolyline(encoded: string): [number, number][] {
  const coords: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push([lng / 1e5, lat / 1e5]);
  }

  return coords;
}

export default function RouteMap({ waypoints, encodedPolyline }: RouteMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || waypoints.length === 0) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [waypoints[0].lng, waypoints[0].lat],
      zoom: 12,
    });
    mapRef.current = map;

    map.on('load', () => {
      // Add markers
      waypoints.forEach((wp, i) => {
        const el = document.createElement('div');
        el.className = `map-marker ${wp.isWarehouse ? 'warehouse' : 'stop'}`;
        el.textContent = wp.isWarehouse ? '🏭' : String(i);

        new mapboxgl.Marker({ element: el })
          .setLngLat([wp.lng, wp.lat])
          .setPopup(new mapboxgl.Popup({ offset: 25 }).setText(wp.label))
          .addTo(map);
      });

      // Draw route line if polyline provided
      if (encodedPolyline) {
        const coords = decodePolyline(encodedPolyline);
        map.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: coords },
          },
        });
        map.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': '#a78bfa',
            'line-width': 4,
            'line-opacity': 0.8,
          },
        });
      }

      // Fit bounds
      const bounds = new mapboxgl.LngLatBounds();
      waypoints.forEach(wp => bounds.extend([wp.lng, wp.lat]));
      map.fitBounds(bounds, { padding: 60 });
    });

    return () => map.remove();
  }, [waypoints, encodedPolyline]);

  return <div className="route-map-container" ref={mapContainer} />;
}
```

- [ ] **Step 2: Verify build & commit**

```bash
npm run build
git add src/components/RouteMap.tsx src/components/RouteMap.css
git commit -m "feat: add RouteMap component with Mapbox GL JS, polyline decoding, and waypoint markers"
```

---

## Task 12: Delivery Batches Page (Đơn Ghép + Route Map)

> **Core frontend feature.** Create batches from pending orders, view optimized route on Mapbox map.

**Files:**
- Create: `store/web/src/app/(dashboard)/delivery-batches/page.tsx`
- Create: `store/web/src/app/(dashboard)/delivery-batches/delivery-batches.css`
- Create: `store/web/src/app/(dashboard)/delivery-batches/[id]/page.tsx`

- [ ] **Step 1: Create Batch list page with create form**

Create `store/web/src/app/(dashboard)/delivery-batches/delivery-batches.css`:

```css
.batch-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

.order-select-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}
.order-select-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-color);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: background var(--transition-fast);
}
.order-select-item:hover { background: var(--bg-card-hover); }
.order-select-item:last-child { border-bottom: none; }
.order-select-item input[type="checkbox"] { accent-color: var(--accent-blue); }
.order-select-item .order-addr {
  color: var(--text-secondary);
  font-size: var(--font-size-xs);
}
.order-select-item .no-gps {
  color: var(--accent-red);
  font-size: var(--font-size-xs);
}

.batch-route-section {
  margin-top: var(--space-6);
}
.batch-route-section h2 {
  font-size: var(--font-size-lg);
  margin-bottom: var(--space-4);
}

.batch-stops {
  margin-top: var(--space-4);
}
.batch-stop {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  margin-bottom: var(--space-2);
}
.batch-stop .stop-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent-purple);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}
```

Create `store/web/src/app/(dashboard)/delivery-batches/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { deliveryBatches as api, deliveryOrders as orderApi, shippers as sApi } from '@/lib/api';
import type { DeliveryBatch, DeliveryOrder, Shipper } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import Modal from '@/components/Modal';
import StatusBadge from '@/components/StatusBadge';
import './delivery-batches.css';

export default function DeliveryBatchesPage() {
  const [batches, setBatches] = useState<DeliveryBatch[]>([]);
  const [pendingOrders, setPendingOrders] = useState<DeliveryOrder[]>([]);
  const [shippers_, setShippers] = useState<Shipper[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  // Create form
  const [selectedOrders, setSelectedOrders] = useState<Set<number>>(new Set());
  const [shipperId, setShipperId] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [b, o, s] = await Promise.all([
        api.list(), orderApi.list({ status: 'PENDING' }), sApi.listAvailable(),
      ]);
      setBatches(b); setPendingOrders(o); setShippers(s);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const toggleOrder = (id: number) => {
    const next = new Set(selectedOrders);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedOrders(next);
  };

  const handleCreate = async () => {
    if (selectedOrders.size < 2) { setError('Cần ít nhất 2 đơn để ghép'); return; }
    if (!shipperId) { setError('Chọn shipper'); return; }
    setError(''); setCreating(true);
    try {
      await api.create({ shipperId: +shipperId, orderIds: Array.from(selectedOrders) });
      setCreateOpen(false);
      setSelectedOrders(new Set());
      load();
    } catch (err: any) { setError(err.message); }
    setCreating(false);
  };

  const columns: Column<DeliveryBatch>[] = [
    { key: 'id', label: '#' },
    { key: 'shipper', label: 'Shipper', render: (b) => b.shipper?.user?.name ?? '—' },
    { key: 'status', label: 'Trạng thái', render: (b) => <StatusBadge status={b.status} /> },
    { key: 'orders', label: 'Số đơn', render: (b) => b.orders.length },
    { key: 'distance', label: 'Khoảng cách', render: (b) => b.totalDistanceM ? `${(b.totalDistanceM / 1000).toFixed(1)} km` : '—' },
    { key: 'duration', label: 'Thời gian', render: (b) => b.estimatedDurationS ? `${Math.round(b.estimatedDurationS / 60)} phút` : '—' },
    { key: 'createdAt', label: 'Ngày tạo', render: (b) => new Date(b.createdAt).toLocaleDateString('vi-VN') },
    {
      key: 'actions', label: '', render: (b) => (
        <Link href={`/delivery-batches/${b.id}`} className="btn btn-sm btn-primary">Xem tuyến</Link>
      ),
    },
  ];

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1>Đơn ghép</h1>
        <button className="btn btn-primary" onClick={() => { setCreateOpen(true); setError(''); }}>+ Tạo đơn ghép</button>
      </div>

      <DataTable columns={columns} data={batches} />

      <Modal title="Tạo đơn ghép — chọn đơn để ghép tuyến" open={createOpen} onClose={() => setCreateOpen(false)}
        footer={<>
          <button className="btn btn-secondary" onClick={() => setCreateOpen(false)}>Hủy</button>
          <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? <span className="spinner" /> : `Ghép ${selectedOrders.size} đơn`}
          </button>
        </>}>
        {error && <div className="alert alert-error">{error}</div>}
        <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
          <label>Shipper</label>
          <select className="select" value={shipperId} onChange={e => setShipperId(e.target.value)}>
            <option value="">Chọn shipper</option>
            {shippers_.map(s => <option key={s.id} value={s.id}>{s.user.name} — {s.vehicleType ?? 'N/A'}</option>)}
          </select>
        </div>
        <label style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-2)', display: 'block' }}>
          Đơn đang chờ ({pendingOrders.length})
        </label>
        <div className="order-select-list">
          {pendingOrders.map(o => (
            <label key={o.id} className="order-select-item">
              <input type="checkbox" checked={selectedOrders.has(o.id)} onChange={() => toggleOrder(o.id)} />
              <div>
                <strong>#{o.id}</strong> — {o.recipientName}
                <div className="order-addr">{o.address}</div>
                {!o.lat && <div className="no-gps">⚠ Chưa có tọa độ</div>}
              </div>
            </label>
          ))}
          {pendingOrders.length === 0 && <div className="empty-state">Không có đơn nào đang chờ</div>}
        </div>
      </Modal>
    </div>
  );
}
```

- [ ] **Step 2: Create Batch detail page (with route map)**

Create `store/web/src/app/(dashboard)/delivery-batches/[id]/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { deliveryBatches as api } from '@/lib/api';
import type { DeliveryBatch } from '@/lib/types';
import StatusBadge from '@/components/StatusBadge';
import StatsCard from '@/components/StatsCard';
import RouteMap from '@/components/RouteMap';
import '../delivery-batches.css';

export default function BatchDetailPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState<DeliveryBatch | null>(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get(+id).then(setBatch).catch(console.error).finally(() => setLoading(false));
  };
  useEffect(load, [id]);

  const handleStart = async () => {
    await api.start(+id);
    load();
  };
  const handleComplete = async () => {
    await api.complete(+id);
    load();
  };
  const handleReOptimize = async () => {
    await api.optimize(+id);
    load();
  };

  if (loading || !batch) return <div className="loading-center"><span className="spinner" /></div>;

  // Build waypoints for map
  const warehouse = batch.orders[0]?.order.warehouse;
  const waypoints = [];
  if (warehouse?.lat && warehouse?.lng) {
    waypoints.push({ lat: warehouse.lat, lng: warehouse.lng, label: warehouse.name, isWarehouse: true });
  }
  const sortedOrders = [...batch.orders].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  for (const bo of sortedOrders) {
    if (bo.order.lat && bo.order.lng) {
      waypoints.push({ lat: bo.order.lat, lng: bo.order.lng, label: `#${bo.order.id} — ${bo.order.recipientName}` });
    }
  }

  const polyline = batch.optimizedRoute?.geometry;

  return (
    <div>
      <div className="page-header">
        <h1>Đơn ghép #{batch.id}</h1>
        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          {batch.status === 'OPTIMIZED' && <button className="btn btn-primary" onClick={handleStart}>🚀 Bắt đầu giao</button>}
          {batch.status === 'IN_PROGRESS' && <button className="btn btn-primary" onClick={handleComplete}>✅ Hoàn thành</button>}
          {['PLANNING', 'OPTIMIZED'].includes(batch.status) && <button className="btn btn-secondary" onClick={handleReOptimize}>🔄 Tối ưu lại</button>}
        </div>
      </div>

      <div className="batch-meta">
        <StatsCard label="Trạng thái" value={batch.status} />
        <StatsCard label="Shipper" value={batch.shipper?.user?.name ?? '—'} />
        <StatsCard label="Khoảng cách" value={batch.totalDistanceM ? `${(batch.totalDistanceM / 1000).toFixed(1)} km` : '—'} color="var(--accent-blue)" />
        <StatsCard label="Thời gian ước tính" value={batch.estimatedDurationS ? `${Math.round(batch.estimatedDurationS / 60)} phút` : '—'} color="var(--accent-purple)" />
        <StatsCard label="Số đơn" value={batch.orders.length} />
      </div>

      {waypoints.length >= 2 && (
        <div className="batch-route-section">
          <h2>🗺️ Tuyến đường tối ưu</h2>
          <RouteMap waypoints={waypoints} encodedPolyline={polyline} />
        </div>
      )}

      <div className="batch-stops">
        <h2 style={{ fontSize: 'var(--font-size-lg)', margin: 'var(--space-6) 0 var(--space-4)' }}>Thứ tự giao hàng</h2>
        {sortedOrders.map((bo, i) => (
          <div className="batch-stop" key={bo.id}>
            <div className="stop-number">{i + 1}</div>
            <div>
              <strong>#{bo.order.id}</strong> — {bo.order.recipientName} ({bo.order.recipientPhone})
              <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-xs)' }}>
                {bo.order.address}
              </div>
            </div>
            <StatusBadge status={bo.order.status} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Verify build & commit**

```bash
npm run build
git add src/app/\(dashboard\)/delivery-batches/
git commit -m "feat: add delivery batches page with order selection and route map visualization"
```

---

## Task 13: Reports Pages

**Files:**
- Create: `store/web/src/app/(dashboard)/reports/inventory/page.tsx`
- Create: `store/web/src/app/(dashboard)/reports/shippers/page.tsx`
- Create: `store/web/src/app/(dashboard)/reports/reports.css`

- [ ] **Step 1: Create shared reports CSS**

Create `store/web/src/app/(dashboard)/reports/reports.css`:

```css
.report-filter {
  margin-bottom: var(--space-4);
}
.report-filter .select {
  max-width: 250px;
}
.discrepancy-cell {
  font-weight: 700;
}
.discrepancy-cell.ok { color: var(--accent-green); }
.discrepancy-cell.warn { color: var(--accent-red); }
```

- [ ] **Step 2: Create Inventory Reconciliation report**

Create `store/web/src/app/(dashboard)/reports/inventory/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { admin, warehouses as whApi } from '@/lib/api';
import type { InventoryReconciliation, Warehouse } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import '../reports.css';

export default function InventoryReportPage() {
  const [data, setData] = useState<InventoryReconciliation[]>([]);
  const [warehouses_, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { whApi.list().then(setWarehouses).catch(console.error); }, []);

  useEffect(() => {
    if (!selectedWarehouse) return;
    setLoading(true);
    admin.inventoryReport(+selectedWarehouse).then(setData).catch(console.error).finally(() => setLoading(false));
  }, [selectedWarehouse]);

  const columns: Column<InventoryReconciliation>[] = [
    { key: 'sku', label: 'SKU' },
    { key: 'productName', label: 'Sản phẩm' },
    { key: 'totalImport', label: 'Tổng nhập', render: (r) => <span style={{ color: 'var(--accent-green)' }}>+{r.totalImport}</span> },
    { key: 'totalExport', label: 'Tổng xuất', render: (r) => <span style={{ color: 'var(--accent-red)' }}>-{r.totalExport}</span> },
    { key: 'totalAdjustment', label: 'Điều chỉnh' },
    { key: 'totalReturn', label: 'Trả về' },
    { key: 'expectedBalance', label: 'Kỳ vọng' },
    { key: 'currentStock', label: 'Thực tế', render: (r) => <strong>{r.currentStock}</strong> },
    {
      key: 'discrepancy', label: 'Chênh lệch', render: (r) => (
        <span className={`discrepancy-cell ${r.discrepancy === 0 ? 'ok' : 'warn'}`}>
          {r.discrepancy === 0 ? '✓ Khớp' : r.discrepancy}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header"><h1>Báo cáo bù trừ kho</h1></div>
      <div className="report-filter">
        <select className="select" value={selectedWarehouse} onChange={e => setSelectedWarehouse(e.target.value)}>
          <option value="">Chọn kho để xem báo cáo</option>
          {warehouses_.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      {loading ? <div className="loading-center"><span className="spinner" /></div> :
        selectedWarehouse ? <DataTable columns={columns} data={data} keyField="productId" /> :
        <div className="empty-state"><p>Chọn kho để xem báo cáo bù trừ</p></div>}
    </div>
  );
}
```

- [ ] **Step 3: Create Shipper Performance report**

Create `store/web/src/app/(dashboard)/reports/shippers/page.tsx`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { admin } from '@/lib/api';
import type { ShipperPerformance } from '@/lib/types';
import DataTable, { Column } from '@/components/DataTable';
import '../reports.css';

export default function ShipperReportPage() {
  const [data, setData] = useState<ShipperPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    admin.shipperReport().then(setData).catch(console.error).finally(() => setLoading(false));
  }, []);

  const columns: Column<ShipperPerformance>[] = [
    { key: 'shipperId', label: 'ID' },
    { key: 'name', label: 'Tên shipper' },
    { key: 'totalBatches', label: 'Tổng batch' },
    { key: 'totalOrders', label: 'Tổng đơn' },
    { key: 'completedBatches', label: 'Hoàn thành' },
    { key: 'totalDistanceKm', label: 'Tổng km', render: (s) => `${s.totalDistanceKm} km` },
    {
      key: 'rate', label: 'Tỷ lệ', render: (s) => {
        const rate = s.totalBatches > 0 ? Math.round((s.completedBatches / s.totalBatches) * 100) : 0;
        return <span style={{ color: rate >= 80 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>{rate}%</span>;
      },
    },
  ];

  if (loading) return <div className="loading-center"><span className="spinner" /></div>;

  return (
    <div>
      <div className="page-header"><h1>Hiệu suất Shipper</h1></div>
      <DataTable columns={columns} data={data} keyField="shipperId" />
    </div>
  );
}
```

- [ ] **Step 4: Verify build & commit**

```bash
npm run build
git add src/app/\(dashboard\)/reports/
git commit -m "feat: add inventory reconciliation and shipper performance report pages"
```

---

## Task 14: Final Integration Test

- [ ] **Step 1: Start backend** (in terminal 1)

```bash
cd /home/baudui/Downloads/project/store
npm run start:dev
```

- [ ] **Step 2: Start frontend** (in terminal 2)

```bash
cd /home/baudui/Downloads/project/store/web
npm run dev
```

Expected: Frontend runs at `http://localhost:3001` (or 3000 if backend port differs).

- [ ] **Step 3: Test login flow**

1. Open `http://localhost:3001/login`
2. Login with `admin@store.vn` / `admin123`
3. Should redirect to `/dashboard` with stats cards

- [ ] **Step 4: Test full workflow**

1. **Products** → Create a product, verify it appears in table
2. **Warehouses** → View warehouse, click "Tồn kho" to see stock
3. **Inventory** → Import stock, verify transaction log updates
4. **Delivery Orders** → Create order with address, verify GPS shows ✅
5. **Delivery Batches** → Select 2+ orders → Create batch → View route on map
6. Batch detail → Verify Mapbox map shows optimized route with numbered stops

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: frontend integration test verification complete"
```

---

## API ↔ Page Mapping

| Backend API | Frontend Page | Notes |
|-------------|--------------|-------|
| `POST /auth/login` | `/login` | JWT stored in localStorage |
| `GET /admin/dashboard/summary` | `/dashboard` | Stats cards |
| `GET/POST/PATCH/DELETE /products` | `/products` | Full CRUD with modal |
| `GET/POST/PATCH/DELETE /warehouses` | `/warehouses` | CRUD + stock view modal |
| `POST /inventory/import` | `/inventory` | Import form |
| `POST /inventory/adjust` | `/inventory` | Adjust form |
| `GET /inventory/transactions` | `/inventory` | Transaction log table |
| `GET/PATCH /shippers` | `/shippers` | Table with availability toggle |
| `GET/POST /delivery-orders` | `/delivery-orders` | List + create with items |
| `PATCH /delivery-orders/:id/status` | `/delivery-orders` | Status dropdown |
| `POST /delivery-batches` | `/delivery-batches` | Create with order selection |
| `GET /delivery-batches/:id` | `/delivery-batches/[id]` | Detail with Mapbox route map |
| `PATCH /delivery-batches/:id/start` | `/delivery-batches/[id]` | Start button |
| `GET /admin/reports/inventory/:id` | `/reports/inventory` | Reconciliation table |
| `GET /admin/reports/shippers` | `/reports/shippers` | Performance table |
