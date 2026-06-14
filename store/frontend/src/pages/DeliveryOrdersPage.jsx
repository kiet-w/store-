import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getOrders } from '../lib/api/orders';
import { getWarehouses } from '../lib/api/warehouses';
import { getShippers } from '../lib/api/shippers';
import { useAuth } from '../contexts/AuthContext';
import { RoleGate } from '../components/RoleGate';

export default function DeliveryOrdersPage() {
  const { user } = useAuth();
  const isAdminOrManager = user && ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role);

  // Filter states
  const [status, setStatus] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [shipperId, setShipperId] = useState('');

  // Fetch orders with current filters
  const filters = {
    status: status || undefined,
    warehouseId: warehouseId || undefined,
    shipperId: shipperId || undefined,
  };

  const { data: orders = [], isLoading: ordersLoading, error: ordersError, refetch } = useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
  });

  // Fetch warehouses for filter dropdown
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
    enabled: isAdminOrManager,
  });

  // Fetch shippers for filter dropdown
  const { data: shippers = [] } = useQuery({
    queryKey: ['shippers'],
    queryFn: getShippers,
    enabled: isAdminOrManager,
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING': return 'badge-pending';
      case 'ASSIGNED': return 'badge-assigned';
      case 'PICKED_UP': return 'badge-picked_up';
      case 'IN_TRANSIT': return 'badge-in_transit';
      case 'DELIVERED': return 'badge-delivered';
      case 'FAILED': return 'badge-failed';
      case 'CANCELLED': return 'badge-cancelled';
      default: return 'badge-pending';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý';
      case 'ASSIGNED': return 'Đã gán shipper';
      case 'PICKED_UP': return 'Đã lấy hàng';
      case 'IN_TRANSIT': return 'Đang giao';
      case 'DELIVERED': return 'Đã giao';
      case 'FAILED': return 'Giao thất bại';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const handleResetFilters = () => {
    setStatus('');
    setWarehouseId('');
    setShipperId('');
  };

  return (
    <div className="flex flex-col gap-lg">
      <div className="flex justify-between align-center">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>📨 Quản lý Đơn Giao Hàng</h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
            Danh sách và trạng thái vận chuyển các đơn giao hàng
          </p>
        </div>
        <RoleGate roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
          <Link to="/delivery-orders/new" className="btn btn-primary">
            ➕ Tạo đơn mới
          </Link>
        </RoleGate>
      </div>

      {/* Filter Card */}
      <div className="card">
        <div className="flex align-center justify-between mb-md">
          <span style={{ fontWeight: '600', fontSize: 'var(--text-base)' }}>🔍 Bộ lọc tìm kiếm</span>
          {(status || warehouseId || shipperId) && (
            <button onClick={handleResetFilters} className="btn btn-secondary p-xs" style={{ minWidth: 'auto', fontSize: 'var(--text-xs)' }}>
              Xóa bộ lọc
            </button>
          )}
        </div>
        
        <div className="grid grid-3 gap-md">
          <div className="form-group mb-0">
            <label className="form-label">Trạng thái</label>
            <select
              className="form-input"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Tất cả trạng thái</option>
              <option value="PENDING">Chờ xử lý (PENDING)</option>
              <option value="ASSIGNED">Đã gán shipper (ASSIGNED)</option>
              <option value="PICKED_UP">Đã lấy hàng (PICKED_UP)</option>
              <option value="IN_TRANSIT">Đang giao (IN_TRANSIT)</option>
              <option value="DELIVERED">Đã giao thành công (DELIVERED)</option>
              <option value="FAILED">Giao thất bại (FAILED)</option>
              <option value="CANCELLED">Đã hủy (CANCELLED)</option>
            </select>
          </div>

          {isAdminOrManager && (
            <>
              <div className="form-group mb-0">
                <label className="form-label">Nhà kho xuất phát</label>
                <select
                  className="form-input"
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                >
                  <option value="">Tất cả nhà kho</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-0">
                <label className="form-label">Shipper đảm nhận</label>
                <select
                  className="form-input"
                  value={shipperId}
                  onChange={(e) => setShipperId(e.target.value)}
                >
                  <option value="">Tất cả shipper</option>
                  {shippers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.user?.name || `Shipper #${s.id}`} ({s.phone})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Orders Table */}
      {ordersLoading ? (
        <div className="flex justify-center p-2xl">
          <div className="loader"></div>
        </div>
      ) : ordersError ? (
        <div className="card text-center text-error p-xl">
          ⚠️ Có lỗi xảy ra khi tải dữ liệu đơn hàng: {ordersError.message}
        </div>
      ) : orders.length === 0 ? (
        <div className="card text-center text-secondary p-2xl">
          📭 Không có đơn giao hàng nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="table-container shadow-md">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Mã đơn</th>
                <th>Người nhận</th>
                <th>Địa chỉ giao</th>
                <th>Nhà kho</th>
                <th>Shipper</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const formattedDate = new Date(order.createdAt).toLocaleDateString('vi-VN', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: '600' }}>#{order.id}</td>
                    <td>
                      <div>{order.recipientName}</div>
                      <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>{order.recipientPhone}</div>
                    </td>
                    <td title={order.address}>
                      <div style={{ maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.address}
                      </div>
                    </td>
                    <td>{order.warehouse?.name}</td>
                    <td>
                      {order.shipper ? (
                        <div>
                          <div>{order.shipper.user?.name || `Shipper #${order.shipper.id}`}</div>
                          <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>{order.shipper.phone}</div>
                        </div>
                      ) : (
                        <span className="text-secondary" style={{ fontStyle: 'italic' }}>Chưa gán</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                      {formattedDate}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <Link to={`/delivery-orders/${order.id}`} className="btn btn-secondary p-xs" style={{ fontSize: 'var(--text-xs)' }}>
                        Xem chi tiết
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
