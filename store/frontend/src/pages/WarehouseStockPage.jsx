import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWarehouseById } from '../lib/api/warehouses';
import { getStockByWarehouse, importStock, adjustStock } from '../lib/api/inventory';
import { getProducts } from '../lib/api/products';
import { useToast } from '../contexts/ToastContext';

export default function WarehouseStockPage() {
  const { id } = useParams();
  const warehouseId = parseInt(id, 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);

  // Form states
  const [importForm, setImportForm] = useState({
    productId: '',
    quantity: '',
    referenceId: '',
    reason: '',
  });
  const [adjustForm, setAdjustForm] = useState({
    productId: '',
    actionType: 'add', // 'add' or 'subtract'
    quantity: '',
    reason: '',
  });

  const [formErrors, setFormErrors] = useState({});

  // Query warehouse info
  const { data: warehouse, isLoading: isLoadingWarehouse } = useQuery({
    queryKey: ['warehouse', warehouseId],
    queryFn: () => getWarehouseById(warehouseId),
    enabled: !isNaN(warehouseId),
  });

  // Query stocks list
  const { data: stocks = [], isLoading: isLoadingStocks, isError, error } = useQuery({
    queryKey: ['warehouseStocks', warehouseId],
    queryFn: () => getStockByWarehouse(warehouseId),
    enabled: !isNaN(warehouseId),
  });

  // Query products for select dropdowns
  const { data: products = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Import stock mutation
  const importMutation = useMutation({
    mutationFn: importStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseStocks', warehouseId] });
      showToast('Nhập kho thành công!', 'success');
      closeImportModal();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi nhập kho';
      showToast(msg, 'error');
    },
  });

  // Adjust stock mutation
  const adjustMutation = useMutation({
    mutationFn: adjustStock,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouseStocks', warehouseId] });
      showToast('Điều chỉnh tồn kho thành công!', 'success');
      closeAdjustModal();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi điều chỉnh tồn kho';
      showToast(msg, 'error');
    },
  });

  // Filter stocks
  const filteredStocks = stocks.filter(stock => {
    const pName = stock.product?.name || '';
    const pSku = stock.product?.sku || '';
    return (
      pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pSku.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // Modal handlers
  const openImportModal = () => {
    setImportForm({
      productId: '',
      quantity: '',
      referenceId: '',
      reason: '',
    });
    setFormErrors({});
    setIsImportModalOpen(true);
  };

  const closeImportModal = () => {
    setIsImportModalOpen(false);
  };

  const openAdjustModal = (stockItem = null) => {
    setAdjustForm({
      productId: stockItem ? stockItem.productId.toString() : '',
      actionType: 'add',
      quantity: '',
      reason: '',
    });
    setFormErrors({});
    setIsAdjustModalOpen(true);
  };

  const closeAdjustModal = () => {
    setIsAdjustModalOpen(false);
  };

  const handleImportSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!importForm.productId) errors.productId = 'Vui lòng chọn sản phẩm';
    
    const qty = parseInt(importForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Số lượng nhập phải lớn hơn 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    importMutation.mutate({
      warehouseId,
      productId: parseInt(importForm.productId, 10),
      quantity: qty,
      reason: importForm.reason || undefined,
      referenceId: importForm.referenceId || undefined,
    });
  };

  const handleAdjustSubmit = (e) => {
    e.preventDefault();
    const errors = {};
    if (!adjustForm.productId) errors.productId = 'Vui lòng chọn sản phẩm';
    if (!adjustForm.reason.trim()) errors.reason = 'Lý do điều chỉnh là bắt buộc';
    
    const qty = parseInt(adjustForm.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      errors.quantity = 'Số lượng điều chỉnh phải lớn hơn 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // Determine final signed quantity
    const signedQty = adjustForm.actionType === 'add' ? qty : -qty;

    adjustMutation.mutate({
      warehouseId,
      productId: parseInt(adjustForm.productId, 10),
      quantity: signedQty,
      reason: adjustForm.reason.trim(),
    });
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const isLowStock = (qty) => qty <= 5;
  const isOutOfStock = (qty) => qty === 0;

  return (
    <div className="page-container flex flex-col gap-lg">
      {/* Back button & Heading */}
      <div className="flex flex-col gap-sm">
        <div>
          <button className="btn btn-secondary btn-sm mb-xs" onClick={() => navigate('/warehouses')}>
            ⬅️ Quay lại danh sách nhà kho
          </button>
        </div>
        <div className="flex align-center justify-between w-full">
          <div>
            <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
              📦 Quản Lý Tồn Kho: {warehouse?.name || `Nhà kho #${warehouseId}`}
            </h1>
            <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: '4px' }}>
              📍 Địa chỉ: {warehouse?.address || 'Đang tải...'}
            </p>
          </div>
          <div className="flex gap-sm">
            <button className="btn btn-secondary" onClick={() => openAdjustModal(null)}>
              ⚙️ Điều Chỉnh Kho (Kiểm Kê)
            </button>
            <button className="btn btn-primary" onClick={openImportModal}>
              📥 Nhập Hàng Từ Tổng Kho
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-3 gap-md">
        <div className="card p-md flex flex-col justify-center">
          <span className="text-secondary" style={{ fontSize: 'var(--text-xs)', fontWeight: '600', textTransform: 'uppercase' }}>
            Tổng số mặt hàng
          </span>
          <span style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', marginTop: 'var(--space-xs)' }}>
            {stocks.length}
          </span>
        </div>
        <div className="card p-md flex flex-col justify-center">
          <span className="text-secondary" style={{ fontSize: 'var(--text-xs)', fontWeight: '600', textTransform: 'uppercase' }}>
            Tổng số lượng tồn
          </span>
          <span style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--accent-primary)', marginTop: 'var(--space-xs)' }}>
            {stocks.reduce((acc, curr) => acc + curr.quantity, 0)}
          </span>
        </div>
        <div className="card p-md flex flex-col justify-center">
          <span className="text-secondary" style={{ fontSize: 'var(--text-xs)', fontWeight: '600', textTransform: 'uppercase' }}>
            Cảnh báo hết/sắp hết hàng
          </span>
          <span style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', color: 'var(--status-error)', marginTop: 'var(--space-xs)' }}>
            {stocks.filter(s => isLowStock(s.quantity)).length}
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="card p-md flex align-center justify-between gap-md">
        <div className="flex align-center gap-sm w-full" style={{ maxWidth: '400px' }}>
          <span style={{ fontSize: 'var(--text-lg)' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm theo tên sản phẩm, SKU..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
          Đang hiển thị: <strong>{filteredStocks.length}</strong> / {stocks.length} mặt hàng
        </div>
      </div>

      {/* Stock Table */}
      {isLoadingStocks || isLoadingWarehouse ? (
        <div className="flex justify-center align-center p-2xl w-full">
          <div className="loader"></div>
        </div>
      ) : isError ? (
        <div className="card p-lg text-center text-error">
          <p>Có lỗi xảy ra khi tải danh sách tồn kho: {error?.message}</p>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="card p-2xl text-center text-secondary">
          <span style={{ fontSize: 'var(--text-3xl)' }}>📦</span>
          <p className="mt-md">Nhà kho chưa có sản phẩm nào hoặc không khớp bộ lọc.</p>
          <p className="text-xs text-tertiary">Bấm nút "Nhập hàng từ tổng kho" hoặc "Điều chỉnh kho" để thêm mặt hàng.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Tên sản phẩm</th>
                <th>Đơn vị</th>
                <th style={{ textAlign: 'right' }}>Đơn giá</th>
                <th style={{ textAlign: 'right', width: '150px' }}>Tồn kho</th>
                <th style={{ width: '180px' }}>Trạng thái</th>
                <th style={{ width: '150px', textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => (
                <tr key={stock.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>
                    {stock.product?.sku}
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {stock.product?.name}
                  </td>
                  <td className="text-secondary">{stock.product?.unit}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {formatPrice(stock.product?.price)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', fontSize: 'var(--text-base)', fontFamily: 'var(--font-mono)' }}>
                    {stock.quantity}
                  </td>
                  <td>
                    {isOutOfStock(stock.quantity) ? (
                      <span className="badge badge-failed">Hết hàng</span>
                    ) : isLowStock(stock.quantity) ? (
                      <span className="badge badge-pending">Sắp hết hàng</span>
                    ) : (
                      <span className="badge badge-delivered">Đầy đủ</span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-center gap-sm">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openAdjustModal(stock)}
                        title="Điều chỉnh nhanh tồn kho sản phẩm này"
                      >
                        ⚙️ Cân đối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Import Stock Modal */}
      {isImportModalOpen && (
        <div className="modal-overlay" onClick={closeImportModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="flex align-center justify-between mb-lg" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-sm)' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '700', margin: 0 }}>
                📥 Nhập Hàng Từ Tổng Kho
              </h3>
              <button className="btn btn-secondary p-xs" onClick={closeImportModal} style={{ minWidth: 'auto', border: 'none', background: 'transparent', fontSize: 'var(--text-lg)' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleImportSubmit} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Chọn sản phẩm <span className="text-error">*</span></label>
                {isLoadingProducts ? (
                  <p className="text-secondary text-xs">Đang tải danh sách sản phẩm...</p>
                ) : (
                  <select
                    className="form-input"
                    value={importForm.productId}
                    onChange={(e) => setImportForm(prev => ({ ...prev, productId: e.target.value }))}
                    required
                  >
                    <option value="">-- Chọn sản phẩm cần nhập --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} ({p.unit})
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.productId && <div className="form-error">{formErrors.productId}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Số lượng nhập <span className="text-error">*</span></label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  placeholder="Ví dụ: 100"
                  value={importForm.quantity}
                  onChange={(e) => setImportForm(prev => ({ ...prev, quantity: e.target.value }))}
                  required
                />
                {formErrors.quantity && <div className="form-error">{formErrors.quantity}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Mã tham chiếu (Reference ID)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: PO-2026-001 (Mã đơn nhập hàng từ tổng kho)"
                  value={importForm.referenceId}
                  onChange={(e) => setImportForm(prev => ({ ...prev, referenceId: e.target.value }))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ghi chú lý do</label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Ví dụ: Nhập hàng bổ sung cho quý 2..."
                  style={{ resize: 'vertical' }}
                  value={importForm.reason}
                  onChange={(e) => setImportForm(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div className="flex justify-between mt-lg gap-md" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={closeImportModal}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={importMutation.isLoading}
                >
                  {importMutation.isLoading ? 'Đang thực hiện...' : 'Nhập Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustModalOpen && (
        <div className="modal-overlay" onClick={closeAdjustModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="flex align-center justify-between mb-lg" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-sm)' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '700', margin: 0 }}>
                ⚙️ Điều Chỉnh Tồn Kho (Kiểm Kê)
              </h3>
              <button className="btn btn-secondary p-xs" onClick={closeAdjustModal} style={{ minWidth: 'auto', border: 'none', background: 'transparent', fontSize: 'var(--text-lg)' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Chọn sản phẩm <span className="text-error">*</span></label>
                {isLoadingProducts ? (
                  <p className="text-secondary text-xs">Đang tải danh sách sản phẩm...</p>
                ) : (
                  <select
                    className="form-input"
                    value={adjustForm.productId}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, productId: e.target.value }))}
                    required
                  >
                    <option value="">-- Chọn sản phẩm cần điều chỉnh --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        [{p.sku}] {p.name} ({p.unit})
                      </option>
                    ))}
                  </select>
                )}
                {formErrors.productId && <div className="form-error">{formErrors.productId}</div>}
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Loại điều chỉnh <span className="text-error">*</span></label>
                  <select
                    className="form-input"
                    value={adjustForm.actionType}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, actionType: e.target.value }))}
                    required
                  >
                    <option value="add">➕ Tăng số lượng (+)</option>
                    <option value="subtract">➖ Giảm số lượng (-)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Số lượng điều chỉnh <span className="text-error">*</span></label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="Ví dụ: 5"
                    value={adjustForm.quantity}
                    onChange={(e) => setAdjustForm(prev => ({ ...prev, quantity: e.target.value }))}
                    required
                  />
                  {formErrors.quantity && <div className="form-error">{formErrors.quantity}</div>}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Lý do điều chỉnh <span className="text-error">*</span></label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Ví dụ: Điều chỉnh sau kiểm kê định kỳ ngày 14/06. Phát hiện lệch 2 cái do hư hỏng..."
                  style={{ resize: 'vertical' }}
                  value={adjustForm.reason}
                  onChange={(e) => setAdjustForm(prev => ({ ...prev, reason: e.target.value }))}
                  required
                />
                {formErrors.reason && <div className="form-error">{formErrors.reason}</div>}
              </div>

              <div className="flex justify-between mt-lg gap-md" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={closeAdjustModal}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={adjustMutation.isLoading}
                >
                  {adjustMutation.isLoading ? 'Đang thực hiện...' : 'Cập Nhật Tồn Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
