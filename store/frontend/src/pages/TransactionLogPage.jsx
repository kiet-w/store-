import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTransactions } from '../lib/api/inventory';
import { getWarehouses } from '../lib/api/warehouses';
import { getProducts } from '../lib/api/products';

const PAGE_SIZE = 25;

export default function TransactionLogPage() {
  // Filters state
  const [warehouseId, setWarehouseId] = useState('');
  const [productId, setProductId] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);

  // Query warehouses for filter and name mapping
  const { data: warehouses = [] } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  // Query products for filter
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  // Create warehouse name mapping
  const warehouseMap = React.useMemo(() => {
    const map = {};
    warehouses.forEach(w => {
      map[w.id] = w.name;
    });
    return map;
  }, [warehouses]);

  // Query transactions based on filters and pagination
  const skip = (page - 1) * PAGE_SIZE;
  const { data: transactions = [], isLoading, isError, error } = useQuery({
    queryKey: ['transactions', warehouseId, productId, type, PAGE_SIZE, skip],
    queryFn: () => getTransactions({
      warehouseId: warehouseId ? parseInt(warehouseId, 10) : undefined,
      productId: productId ? parseInt(productId, 10) : undefined,
      type: type || undefined,
      take: PAGE_SIZE,
      skip,
    }),
  });

  const handleResetFilters = () => {
    setWarehouseId('');
    setProductId('');
    setType('');
    setPage(1);
  };

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value);
    setPage(1); // Reset to first page when filter changes
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTransactionBadgeClass = (type) => {
    switch (type) {
      case 'IMPORT': return 'badge-import';
      case 'EXPORT': return 'badge-export';
      case 'ADJUSTMENT': return 'badge-adjustment';
      case 'RETURN': return 'badge-return';
      default: return 'badge-pending';
    }
  };

  const getTransactionTypeName = (type) => {
    switch (type) {
      case 'IMPORT': return 'Nhập kho';
      case 'EXPORT': return 'Xuất kho';
      case 'ADJUSTMENT': return 'Điều chỉnh';
      case 'RETURN': return 'Trả hàng';
      default: return type;
    }
  };

  return (
    <div className="page-container flex flex-col gap-lg">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
          📋 Nhật Ký Giao Dịch Kho
        </h1>
        <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: '4px' }}>
          Xem lịch sử các hoạt động nhập xuất, kiểm kê tồn kho và điều chỉnh chi tiết.
        </p>
      </div>

      {/* Filters Card */}
      <div className="card p-md">
        <h3 className="mb-sm" style={{ fontSize: 'var(--text-base)', fontWeight: '600' }}>Bộ lọc tìm kiếm</h3>
        <div className="grid grid-4 gap-md align-center">
          <div className="form-group mb-0">
            <label className="form-label">Nhà kho</label>
            <select
              className="form-input"
              value={warehouseId}
              onChange={handleFilterChange(setWarehouseId)}
            >
              <option value="">-- Tất cả nhà kho --</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Sản phẩm</label>
            <select
              className="form-input"
              value={productId}
              onChange={handleFilterChange(setProductId)}
            >
              <option value="">-- Tất cả sản phẩm --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>[{p.sku}] {p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Loại giao dịch</label>
            <select
              className="form-input"
              value={type}
              onChange={handleFilterChange(setType)}
            >
              <option value="">-- Tất cả loại --</option>
              <option value="IMPORT">Nhập kho (IMPORT)</option>
              <option value="EXPORT">Xuất kho (EXPORT)</option>
              <option value="ADJUSTMENT">Điều chỉnh (ADJUSTMENT)</option>
              <option value="RETURN">Trả hàng (RETURN)</option>
            </select>
          </div>

          <div className="flex gap-sm h-full align-center" style={{ paddingTop: '20px' }}>
            <button className="btn btn-secondary w-full" onClick={handleResetFilters}>
              Clear lọc
            </button>
          </div>
        </div>
      </div>

      {/* Log list grid/table */}
      {isLoading ? (
        <div className="flex justify-center align-center p-2xl w-full">
          <div className="loader"></div>
        </div>
      ) : isError ? (
        <div className="card p-lg text-center text-error">
          <p>Có lỗi xảy ra khi tải lịch sử giao dịch: {error?.message}</p>
        </div>
      ) : transactions.length === 0 ? (
        <div className="card p-2xl text-center text-secondary">
          <span style={{ fontSize: 'var(--text-3xl)' }}>📜</span>
          <p className="mt-md">Không tìm thấy giao dịch nào phù hợp với bộ lọc.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-md">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Mã GD</th>
                  <th>Thời gian</th>
                  <th>Nhà kho</th>
                  <th>Sản phẩm</th>
                  <th style={{ width: '130px' }}>Loại</th>
                  <th style={{ textAlign: 'right', width: '100px' }}>Thay đổi</th>
                  <th style={{ textAlign: 'right', width: '140px' }}>Số dư (Trước ➔ Sau)</th>
                  <th>Lý do & Tham chiếu</th>
                  <th>Người thực hiện</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>#{tx.id}</td>
                    <td style={{ fontSize: 'var(--text-xs)' }} className="text-secondary">
                      {formatDateTime(tx.createdAt)}
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      {warehouseMap[tx.warehouseId] || `Nhà kho #${tx.warehouseId}`}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                          {tx.product?.name}
                        </span>
                        <span className="text-tertiary" style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                          SKU: {tx.product?.sku}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getTransactionBadgeClass(tx.type)}`}>
                        {getTransactionTypeName(tx.type)}
                      </span>
                    </td>
                    <td style={{
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: '700',
                      color: tx.quantity > 0 ? 'var(--status-success)' : 'var(--status-error)'
                    }}>
                      {tx.quantity > 0 ? `+${tx.quantity}` : tx.quantity}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }} className="text-secondary">
                      {tx.balanceBefore} ➔ {tx.balanceAfter}
                    </td>
                    <td>
                      <div className="flex flex-col">
                        <span style={{ fontSize: 'var(--text-sm)' }}>{tx.reason || '-'}</span>
                        {tx.referenceId && (
                          <span className="text-info" style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)' }}>
                            Ref: {tx.referenceId}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                      👤 {tx.createdBy?.name || `User #${tx.createdById}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between align-center p-sm card">
            <button
              className="btn btn-secondary btn-sm"
              disabled={page === 1}
              onClick={() => setPage(prev => Math.max(1, prev - 1))}
            >
              ⬅️ Trang trước
            </button>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
              Trang <strong>{page}</strong>
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={transactions.length < PAGE_SIZE}
              onClick={() => setPage(prev => prev + 1)}
            >
              Trang sau ➡️
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
