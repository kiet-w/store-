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
