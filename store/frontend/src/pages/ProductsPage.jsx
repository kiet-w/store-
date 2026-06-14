import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../lib/api/products';

export default function ProductsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Pagination states
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add/Edit Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    unit: '',
    price: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  // Delete Confirmation states
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = user?.role === 'ADMIN';

  // Fetch products
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải danh sách sản phẩm:', err);
      setError('Không thể kết nối API sản phẩm. Vui lòng thử lại sau.');
      showToast('Tải danh sách sản phẩm thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filtered products
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.name?.toLowerCase().includes(query) ||
        p.sku?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Open modal for Create
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      name: '',
      sku: '',
      unit: '',
      price: '',
      description: '',
    });
    setEditingProductId(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (product) => {
    setModalMode('edit');
    setFormData({
      name: product.name,
      sku: product.sku,
      unit: product.unit,
      price: product.price,
      description: product.description || '',
    });
    setEditingProductId(product.id);
    setIsModalOpen(true);
  };

  // Handle modal submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.sku || !formData.unit || formData.price === '') {
      showToast('Vui lòng nhập đầy đủ các thông tin bắt buộc', 'warning');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Giá bán phải là số lớn hơn hoặc bằng 0', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        name: formData.name,
        sku: formData.sku.toUpperCase(),
        unit: formData.unit,
        price: priceNum,
        description: formData.description || null,
      };

      if (modalMode === 'create') {
        await createProduct(payload);
        showToast('Thêm sản phẩm mới thành công', 'success');
      } else {
        await updateProduct(editingProductId, payload);
        showToast('Cập nhật sản phẩm thành công', 'success');
      }
      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Lỗi khi lưu sản phẩm:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu sản phẩm';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Delete confirmation
  const handleOpenDelete = (product) => {
    if (!isAdmin) {
      showToast('Chỉ quản trị viên mới có quyền xóa sản phẩm', 'warning');
      return;
    }
    setProductToDelete(product);
    setIsDeleteOpen(true);
  };

  // Handle delete execution
  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    setDeleting(true);
    try {
      await deleteProduct(productToDelete.id);
      showToast(`Đã xóa sản phẩm ${productToDelete.name} thành công`, 'success');
      setIsDeleteOpen(false);
      setProductToDelete(null);
      fetchProducts();
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      const msg = err.response?.data?.message || 'Xóa sản phẩm thất bại';
      showToast(msg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Format currency
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Header section */}
      <div className="flex justify-between align-center card p-md">
        <div>
          <h2 className="m-0" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
            📦 Quản lý Sản phẩm
          </h2>
          <p className="text-secondary m-0 mt-xs" style={{ fontSize: 'var(--text-sm)' }}>
            Xem, thêm mới, cập nhật và xóa các sản phẩm trong hệ thống Logistics.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ Thêm Sản phẩm
        </button>
      </div>

      {/* Control section (Search & Filters) */}
      <div className="card p-md flex align-center justify-between gap-md flex-col md:flex-row">
        <div className="flex align-center gap-sm w-full md:w-auto" style={{ flexGrow: 1, maxWidth: '500px' }}>
          <span style={{ fontSize: 'var(--text-lg)' }}>🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Tìm kiếm theo tên sản phẩm hoặc SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="btn btn-secondary p-xs" onClick={() => setSearchQuery('')}>
              Xóa
            </button>
          )}
        </div>
        <div className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
          Hiển thị <strong>{filteredProducts.length}</strong> sản phẩm
        </div>
      </div>

      {/* Table grid */}
      <div className="table-container shadow-md">
        {loading ? (
          <div className="flex flex-col align-center justify-center p-xl gap-md" style={{ minHeight: '300px' }}>
            <div className="loader"></div>
            <span className="text-secondary">Đang tải dữ liệu sản phẩm...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col align-center justify-center p-xl gap-md text-center" style={{ minHeight: '300px' }}>
            <span style={{ fontSize: 'var(--text-3xl)' }}>⚠️</span>
            <span className="text-error" style={{ fontWeight: '500' }}>{error}</span>
            <button className="btn btn-secondary" onClick={fetchProducts}>
              Tải lại trang
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col align-center justify-center p-xl gap-md text-center" style={{ minHeight: '300px' }}>
            <span style={{ fontSize: 'var(--text-3xl)' }}>📭</span>
            <span className="text-secondary">Không tìm thấy sản phẩm nào phù hợp</span>
          </div>
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>ID</th>
                  <th style={{ width: '15%' }}>SKU</th>
                  <th style={{ width: '30%' }}>Tên Sản Phẩm</th>
                  <th style={{ width: '10%' }}>Đơn Vị</th>
                  <th style={{ width: '15%' }}>Giá Bán</th>
                  <th style={{ width: '20%' }}>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <span className="text-secondary" style={{ fontFamily: 'monospace' }}>
                        #{product.id}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge-planning" style={{ letterSpacing: '0.5px' }}>
                        {product.sku}
                      </span>
                    </td>
                    <td>
                      <div>
                        <strong className="text-primary">{product.name}</strong>
                        {product.description && (
                          <div className="text-secondary mt-xs" style={{ fontSize: 'var(--text-xs)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                            {product.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-secondary">{product.unit}</span>
                    </td>
                    <td>
                      <strong className="text-success">{formatCurrency(product.price)}</strong>
                    </td>
                    <td>
                      <div className="flex gap-sm">
                        <button className="btn btn-secondary p-xs" onClick={() => handleOpenEdit(product)}>
                          ✏️ Sửa
                        </button>
                        {isAdmin && (
                          <button className="btn btn-danger p-xs" onClick={() => handleOpenDelete(product)}>
                            🗑️ Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex align-center justify-between p-md" style={{ borderTop: '1px solid var(--border-primary)' }}>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  ◀ Trước
                </button>
                <span className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
                  Trang <strong>{currentPage}</strong> / {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                >
                  Sau ▶
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="flex justify-between align-center mb-lg">
              <h3 className="m-0" style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>
                {modalMode === 'create' ? '➕ Thêm sản phẩm mới' : '✏️ Chỉnh sửa sản phẩm'}
              </h3>
              <button
                className="btn btn-secondary p-xs"
                style={{ minWidth: 'auto', borderRadius: '50%' }}
                onClick={() => setIsModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Tên sản phẩm <span className="text-error">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: Nước xả vải Comfort 1.8L"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">SKU <span className="text-error">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: COMFORT-18L"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    disabled={modalMode === 'edit'}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Đơn vị tính <span className="text-error">*</span></label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="VD: cái, túi, kg, thùng"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Giá bán (VND) <span className="text-error">*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="VD: 120000"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả sản phẩm</label>
                <textarea
                  className="form-input"
                  style={{ minHeight: '100px', resize: 'vertical' }}
                  placeholder="Mô tả chi tiết sản phẩm, quy cách đóng gói..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>

              <div className="flex justify-end gap-md mt-lg">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                >
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu sản phẩm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && productToDelete && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '450px' }}>
            <h3 className="text-error mb-md" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              ⚠️ Xác nhận xóa sản phẩm
            </h3>
            <p className="text-primary mb-lg">
              Bạn có chắc chắn muốn xóa sản phẩm <strong>{productToDelete.name}</strong> (SKU: <code>{productToDelete.sku}</code>) khỏi hệ thống?
            </p>
            <div className="p-sm rounded-md bg-hover text-warning mb-lg" style={{ fontSize: 'var(--text-xs)' }}>
              Lưu ý: Sản phẩm sẽ bị ngừng kích hoạt (soft delete) và không hiển thị trong danh sách bán hàng, nhưng thông tin lịch sử giao dịch vẫn được lưu giữ.
            </div>
            <div className="flex justify-end gap-md">
              <button className="btn btn-secondary" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
                Hủy
              </button>
              <button className="btn btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? 'Đang xóa...' : 'Đồng ý Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
