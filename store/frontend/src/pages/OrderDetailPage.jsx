import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOrderById, updateOrderStatus, assignShipper } from '../lib/api/orders';
import { getAvailableShippers } from '../lib/api/shippers';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { RoleGate } from '../components/RoleGate';

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const { user } = useAuth();

  const isAdminOrManager = user && ['ADMIN', 'WAREHOUSE_MANAGER'].includes(user.role);

  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedShipperId, setSelectedShipperId] = useState('');

  // Fetch order detail
  const { data: order, isLoading: orderLoading, error: orderError } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrderById(Number(id)),
  });

  // Fetch available shippers
  const { data: availableShippers = [], isLoading: shippersLoading } = useQuery({
    queryKey: ['available-shippers'],
    queryFn: getAvailableShippers,
    enabled: isAdminOrManager && isAssignModalOpen,
  });

  // Status transitions mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ status }) => updateOrderStatus(Number(id), status),
    onSuccess: (data) => {
      showToast(`Chuyển trạng thái đơn hàng thành công sang ${getStatusLabel(data.status)}`, 'success');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error(error);
      const msg = error.response?.data?.message || 'Không thể cập nhật trạng thái đơn hàng';
      showToast(msg, 'error');
    },
  });

  // Assign Shipper mutation
  const assignShipperMutation = useMutation({
    mutationFn: ({ shipperId }) => assignShipper(Number(id), shipperId),
    onSuccess: () => {
      showToast('Gán shipper thành công!', 'success');
      setIsAssignModalOpen(false);
      setSelectedShipperId('');
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error) => {
      console.error(error);
      const msg = error.response?.data?.message || 'Không thể gán shipper';
      showToast(msg, 'error');
    },
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

  const handleUpdateStatus = (targetStatus) => {
    if (window.confirm(`Bạn có chắc chắn muốn chuyển trạng thái đơn hàng sang "${getStatusLabel(targetStatus)}"?`)) {
      updateStatusMutation.mutate({ status: targetStatus });
    }
  };

  const handleAssignShipperSubmit = (e) => {
    e.preventDefault();
    if (!selectedShipperId) {
      showToast('Vui lòng chọn shipper', 'warning');
      return;
    }
    assignShipperMutation.mutate({ shipperId: Number(selectedShipperId) });
  };

  // State Machine helper to find next valid transitions
  const getNextTransitions = (currentStatus) => {
    switch (currentStatus) {
      case 'PENDING':
        return [
          { status: 'CANCELLED', label: '❌ Hủy đơn', btnClass: 'btn-danger' }
        ];
      case 'ASSIGNED':
        return [
          { status: 'PICKED_UP', label: '📦 Đã lấy hàng', btnClass: 'btn-primary' },
          { status: 'CANCELLED', label: '❌ Hủy đơn', btnClass: 'btn-danger' }
        ];
      case 'PICKED_UP':
        return [
          { status: 'IN_TRANSIT', label: '🚚 Bắt đầu giao hàng', btnClass: 'btn-primary' }
        ];
      case 'IN_TRANSIT':
        return [
          { status: 'DELIVERED', label: '✓ Giao thành công', btnClass: 'btn-primary' },
          { status: 'FAILED', label: '⚠ Giao thất bại', btnClass: 'btn-danger' }
        ];
      case 'FAILED':
        return [
          { status: 'PENDING', label: '🔄 Yêu cầu giao lại (Chờ xử lý)', btnClass: 'btn-secondary' }
        ];
      case 'DELIVERED':
      case 'CANCELLED':
      default:
        return [];
    }
  };

  if (orderLoading) {
    return (
      <div className="flex justify-center p-2xl">
        <div className="loader"></div>
      </div>
    );
  }

  if (orderError || !order) {
    return (
      <div className="card text-center text-error p-xl">
        ⚠️ Không thể tải thông tin đơn hàng: {orderError?.message || 'Đơn hàng không tồn tại'}
        <div className="mt-md">
          <Link to="/delivery-orders" className="btn btn-secondary">Quay lại danh sách</Link>
        </div>
      </div>
    );
  }

  // Calculate order metrics
  const totalValue = order.items.reduce((sum, item) => {
    const price = Number(item.product?.price || 0);
    return sum + price * item.quantity;
  }, 0);

  const nextTransitions = getNextTransitions(order.status);

  return (
    <div className="flex flex-col gap-lg">
      {/* Header */}
      <div className="flex justify-between align-center">
        <div>
          <div className="flex align-center gap-sm mb-xs">
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
              Đơn hàng #{order.id}
            </h1>
            <span className={`badge ${getStatusBadgeClass(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
            Ngày tạo: {new Date(order.createdAt).toLocaleString('vi-VN')}
          </p>
        </div>
        <div className="flex gap-sm">
          <Link to="/delivery-orders" className="btn btn-secondary">
            Quay lại danh sách
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-3 gap-lg" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        
        {/* Column 1 & 2: Main info & Items */}
        <div className="flex flex-col gap-lg" style={{ gridColumn: 'span 2' }}>
          
          {/* Recipient Card */}
          <div className="card">
            <h3 className="mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
              👤 Thông tin người nhận & Địa điểm
            </h3>
            
            <div className="grid grid-2 gap-md mb-md">
              <div>
                <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Họ và tên</span>
                <div style={{ fontWeight: '500' }}>{order.recipientName}</div>
              </div>
              <div>
                <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Số điện thoại</span>
                <div style={{ fontWeight: '500' }}>{order.recipientPhone}</div>
              </div>
            </div>

            <div className="mb-md">
              <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Địa chỉ giao hàng</span>
              <div style={{ fontWeight: '500' }}>{order.address}</div>
              {order.lat && order.lng && (
                <div className="text-secondary" style={{ fontSize: 'var(--text-xs)', marginTop: '4px' }}>
                  📍 Tọa độ GPS: {order.lat.toFixed(6)}, {order.lng.toFixed(6)}
                </div>
              )}
            </div>

            <div>
              <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Ghi chú</span>
              <div style={{ fontStyle: 'italic', color: order.notes ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                {order.notes || 'Không có ghi chú'}
              </div>
            </div>
          </div>

          {/* Items Card */}
          <div className="card">
            <h3 className="mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
              📦 Danh sách sản phẩm
            </h3>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Mã SKU</th>
                    <th>Tên sản phẩm</th>
                    <th style={{ textAlign: 'right' }}>Số lượng</th>
                    <th style={{ textAlign: 'right' }}>Đơn giá</th>
                    <th style={{ textAlign: 'right' }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item) => {
                    const price = Number(item.product?.price || 0);
                    const itemTotal = price * item.quantity;
                    return (
                      <tr key={item.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                          {item.product?.sku}
                        </td>
                        <td>{item.product?.name}</td>
                        <td style={{ textAlign: 'right' }}>
                          {item.quantity} {item.product?.unit}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {price.toLocaleString('vi-VN')}đ
                        </td>
                        <td style={{ textAlign: 'right', fontWeight: '500' }}>
                          {itemTotal.toLocaleString('vi-VN')}đ
                        </td>
                      </tr>
                    );
                  })}
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'right', fontWeight: 'bold' }}>
                      Tổng cộng:
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: 'var(--text-lg)', color: 'var(--accent-secondary)' }}>
                      {totalValue.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Column 3: Status state machine & Warehouse/Shipper */}
        <div className="flex flex-col gap-lg">
          
          {/* Status Transitions Card */}
          <div className="card">
            <h3 className="mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
              ⚙️ Cập nhật trạng thái
            </h3>

            <div className="mb-lg">
              <div className="text-secondary mb-xs" style={{ fontSize: 'var(--text-xs)' }}>Trạng thái hiện tại</div>
              <div className="flex align-center gap-sm">
                <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
              </div>
            </div>

            {nextTransitions.length > 0 ? (
              <div className="flex flex-col gap-sm">
                <div className="text-secondary mb-xs" style={{ fontSize: 'var(--text-xs)' }}>Các bước xử lý tiếp theo</div>
                {nextTransitions.map((t) => (
                  <button
                    key={t.status}
                    onClick={() => handleUpdateStatus(t.status)}
                    className={`btn ${t.btnClass} w-full`}
                    disabled={updateStatusMutation.isPending}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-secondary text-center p-md" style={{ fontStyle: 'italic', fontSize: 'var(--text-sm)' }}>
                Đơn hàng đã ở trạng thái cuối cùng, không thể chuyển đổi thêm.
              </div>
            )}
          </div>

          {/* Logistics Assignment Card */}
          <div className="card">
            <h3 className="mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
              🚚 Điều phối vận chuyển
            </h3>

            {/* Warehouse Info */}
            <div className="mb-md">
              <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Nhà kho xuất phát</span>
              <div style={{ fontWeight: '500' }}>{order.warehouse?.name}</div>
              <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                🏠 {order.warehouse?.address}
              </div>
            </div>

            {/* Shipper Info */}
            <div className="mb-md">
              <span className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>Shipper đảm nhận</span>
              {order.shipper ? (
                <div>
                  <div style={{ fontWeight: '500' }}>
                    {order.shipper.user?.name || `Shipper #${order.shipper.id}`}
                  </div>
                  <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                    📞 SĐT: {order.shipper.phone}
                  </div>
                  {order.shipper.vehicleType && (
                    <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                      🛵 Phương tiện: {order.shipper.vehicleType}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }} className="mb-sm">
                  Chưa gán shipper
                </div>
              )}
            </div>

            {/* Assign Shipper Button (For Admins/Managers and only if order is PENDING) */}
            <RoleGate roles={['ADMIN', 'WAREHOUSE_MANAGER']}>
              {order.status === 'PENDING' && (
                <button
                  onClick={() => setIsAssignModalOpen(true)}
                  className="btn btn-primary w-full"
                >
                  🚚 Gán Shipper
                </button>
              )}
            </RoleGate>
          </div>
        </div>
      </div>

      {/* Assign Shipper Modal */}
      {isAssignModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAssignModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between align-center mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
              <h3 style={{ fontSize: 'var(--text-lg)' }}>🚚 Gán Shipper Cho Đơn #{order.id}</h3>
              <button onClick={() => setIsAssignModalOpen(false)} className="btn btn-secondary p-xs" style={{ minWidth: 'auto', border: 'none', background: 'none' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleAssignShipperSubmit}>
              <div className="form-group">
                <label className="form-label">Chọn shipper đang sẵn sàng</label>
                {shippersLoading ? (
                  <div>Đang tìm shipper...</div>
                ) : availableShippers.length === 0 ? (
                  <div className="text-error" style={{ fontSize: 'var(--text-sm)' }}>
                    ⚠️ Không có shipper nào đang rảnh hoạt động!
                  </div>
                ) : (
                  <select
                    className="form-input"
                    value={selectedShipperId}
                    onChange={(e) => setSelectedShipperId(e.target.value)}
                    required
                  >
                    <option value="">-- Chọn shipper --</option>
                    {availableShippers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.user?.name || `Shipper #${s.id}`} ({s.phone} - {s.vehicleType || 'Chưa rõ xe'})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex gap-md justify-end mt-lg">
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={assignShipperMutation.isPending}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={assignShipperMutation.isPending || !selectedShipperId}
                >
                  {assignShipperMutation.isPending ? 'Đang gán...' : 'Xác nhận gán'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
