import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../lib/api/orders';
import { getWarehouses } from '../lib/api/warehouses';
import { getProducts } from '../lib/api/products';
import { getAvailableShippers } from '../lib/api/shippers';
import { getStockByWarehouse } from '../lib/api/inventory';
import { useToast } from '../contexts/ToastContext';

export default function CreateOrderPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Form Fields State
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [address, setAddress] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [shipperId, setShipperId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ productId: '', quantity: 1 }]);

  // Fetch static data
  const { data: warehouses = [], isLoading: warehousesLoading } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const { data: shippers = [], isLoading: shippersLoading } = useQuery({
    queryKey: ['available-shippers'],
    queryFn: getAvailableShippers,
  });

  // Fetch warehouse stocks if a warehouse is selected
  const { data: warehouseStock = [], isLoading: stockLoading } = useQuery({
    queryKey: ['warehouse-stock', warehouseId],
    queryFn: () => getStockByWarehouse(Number(warehouseId)),
    enabled: !!warehouseId,
  });

  // Map stocks for fast lookup: { productId: quantity }
  const stockMap = useMemo(() => {
    const map = {};
    warehouseStock.forEach((stock) => {
      map[stock.productId] = stock.quantity;
    });
    return map;
  }, [warehouseStock]);

  // Handle items array changes
  const handleAddItem = () => {
    setItems((prev) => [...prev, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) => {
        if (idx !== index) return item;
        return {
          ...item,
          [field]: field === 'productId' ? (value ? Number(value) : '') : Number(value),
        };
      })
    );
  };

  // Mutation to create order
  const createOrderMutation = useMutation({
    mutationFn: createOrder,
    onSuccess: () => {
      showToast('Tạo đơn hàng thành công!', 'success');
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      navigate('/delivery-orders');
    },
    onError: (error) => {
      console.error(error);
      const msg = error.response?.data?.message || 'Có lỗi xảy ra khi tạo đơn hàng';
      showToast(msg, 'error');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validations
    if (!recipientName.trim()) {
      showToast('Vui lòng nhập tên người nhận', 'warning');
      return;
    }
    if (!recipientPhone.trim()) {
      showToast('Vui lòng nhập số điện thoại người nhận', 'warning');
      return;
    }
    if (!address.trim()) {
      showToast('Vui lòng nhập địa chỉ giao hàng', 'warning');
      return;
    }
    if (!warehouseId) {
      showToast('Vui lòng chọn nhà kho xuất phát', 'warning');
      return;
    }
    if (items.length === 0) {
      showToast('Vui lòng thêm ít nhất một sản phẩm', 'warning');
      return;
    }

    // Validate product items
    const formattedItems = [];
    const seenProducts = new Set();

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.productId) {
        showToast(`Dòng #${i + 1}: Vui lòng chọn sản phẩm`, 'warning');
        return;
      }
      if (item.quantity <= 0) {
        showToast(`Dòng #${i + 1}: Số lượng phải lớn hơn 0`, 'warning');
        return;
      }
      if (seenProducts.has(item.productId)) {
        showToast(`Sản phẩm dòng #${i + 1} bị trùng lặp`, 'warning');
        return;
      }

      // Check stock availability
      const available = stockMap[item.productId] || 0;
      if (item.quantity > available) {
        const productObj = products.find((p) => p.id === item.productId);
        showToast(
          `Dòng #${i + 1}: ${productObj?.name || 'Sản phẩm'} không đủ tồn kho (Yêu cầu: ${item.quantity}, Hiện có: ${available})`,
          'error'
        );
        return;
      }

      seenProducts.add(item.productId);
      formattedItems.push({
        productId: item.productId,
        quantity: item.quantity,
      });
    }

    const payload = {
      recipientName,
      recipientPhone,
      address,
      warehouseId: Number(warehouseId),
      notes: notes.trim() || undefined,
      shipperId: shipperId ? Number(shipperId) : undefined,
      items: formattedItems,
    };

    createOrderMutation.mutate(payload);
  };

  return (
    <div className="flex flex-col gap-lg" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex justify-between align-center">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>➕ Tạo Đơn Giao Hàng Mới</h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
            Nhập thông tin người nhận, kho hàng và danh sách sản phẩm cần giao
          </p>
        </div>
        <button onClick={() => navigate('/delivery-orders')} className="btn btn-secondary">
          Quay lại
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-lg">
        {/* Recipient Details */}
        <div className="card">
          <h3 className="mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
            👤 Thông tin người nhận & Địa điểm
          </h3>
          
          <div className="grid grid-2 gap-md">
            <div className="form-group">
              <label className="form-label">Tên người nhận *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Nguyễn Văn A"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Số điện thoại *</label>
              <input
                type="text"
                className="form-input"
                placeholder="0901234567"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Địa chỉ giao hàng *</label>
            <input
              type="text"
              className="form-input"
              placeholder="123 Đường ABC, Quận 1, TP. Hồ Chí Minh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
            />
            <small className="text-secondary" style={{ fontSize: 'var(--text-xs)', marginTop: '4px', display: 'block' }}>
              Hệ thống sẽ tự động chuyển đổi địa chỉ sang tọa độ địa lý.
            </small>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Ghi chú giao hàng</label>
            <textarea
              className="form-input"
              rows="3"
              placeholder="Ghi chú thêm: giao giờ hành chính, gọi trước khi đến..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Warehouse & Shipper Settings */}
        <div className="card">
          <h3 className="mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
            🏭 Kho xuất phát & Shipper
          </h3>

          <div className="grid grid-2 gap-md">
            <div className="form-group mb-0">
              <label className="form-label">Chọn nhà kho xuất phát *</label>
              <select
                className="form-input"
                value={warehouseId}
                onChange={(e) => {
                  setWarehouseId(e.target.value);
                  // Reset items if warehouse changes to prevent incorrect stock validation
                  setItems([{ productId: '', quantity: 1 }]);
                }}
                required
              >
                <option value="">-- Chọn nhà kho --</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Gán shipper ngay (Không bắt buộc)</label>
              <select
                className="form-input"
                value={shipperId}
                onChange={(e) => setShipperId(e.target.value)}
              >
                <option value="">-- Không gán shipper --</option>
                {shippers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user?.name || `Shipper #${s.id}`} ({s.phone} - {s.vehicleType || 'Chưa rõ xe'})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="card">
          <div className="flex justify-between align-center mb-md" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-xs)' }}>
            <h3>📦 Danh sách sản phẩm</h3>
            <button
              type="button"
              onClick={handleAddItem}
              className="btn btn-secondary p-xs"
              style={{ fontSize: 'var(--text-xs)' }}
              disabled={!warehouseId}
            >
              ➕ Thêm dòng
            </button>
          </div>

          {!warehouseId ? (
            <div className="text-center text-secondary p-md" style={{ fontStyle: 'italic' }}>
              Vui lòng chọn nhà kho trước khi chọn sản phẩm để hiển thị tồn kho chính xác.
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-secondary p-md">
              Chưa có sản phẩm nào. Vui lòng thêm sản phẩm bằng nút bên trên.
            </div>
          ) : (
            <div className="flex flex-col gap-sm">
              {items.map((item, index) => {
                const selectedProductStock = stockMap[item.productId] || 0;
                const selectedProduct = products.find((p) => p.id === item.productId);

                return (
                  <div key={index} className="flex gap-md align-center">
                    <div style={{ flexGrow: 1 }}>
                      <select
                        className="form-input"
                        value={item.productId}
                        onChange={(e) => handleUpdateItem(index, 'productId', e.target.value)}
                        required
                      >
                        <option value="">-- Chọn sản phẩm --</option>
                        {products.map((p) => {
                          const availableQty = stockMap[p.id] || 0;
                          return (
                            <option key={p.id} value={p.id} disabled={availableQty <= 0}>
                              {p.name} ({p.sku}) {availableQty <= 0 ? '[Hết hàng]' : `[Tồn kho: ${availableQty} ${p.unit}]`}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div style={{ width: '150px' }}>
                      <input
                        type="number"
                        className="form-input"
                        placeholder="Số lượng"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                        required
                        disabled={!item.productId}
                      />
                    </div>

                    {item.productId && (
                      <div className="text-secondary" style={{ width: '150px', fontSize: 'var(--text-xs)' }}>
                        Đơn giá: {Number(selectedProduct?.price || 0).toLocaleString('vi-VN')}đ
                        <div style={{ color: item.quantity > selectedProductStock ? 'var(--status-error)' : 'var(--status-success)' }}>
                          Khả dụng: {selectedProductStock}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="btn btn-danger p-xs"
                      style={{ minWidth: 'auto' }}
                      title="Xóa dòng"
                    >
                      🗑️
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Submit & Cancel */}
        <div className="flex gap-md justify-end mt-md">
          <button
            type="button"
            onClick={() => navigate('/delivery-orders')}
            className="btn btn-secondary"
            disabled={createOrderMutation.isPending}
          >
            Hủy bỏ
          </button>
          
          <button
            type="submit"
            className="btn btn-primary"
            disabled={createOrderMutation.isPending || !warehouseId}
          >
            {createOrderMutation.isPending ? 'Đang tạo đơn...' : 'Tạo đơn hàng'}
          </button>
        </div>
      </form>
    </div>
  );
}
