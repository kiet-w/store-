import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getWarehouses, createWarehouse, updateWarehouse, deleteWarehouse } from '../lib/api/warehouses';
import { useToast } from '../contexts/ToastContext';

export default function WarehousesPage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const navigate = useNavigate();

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWarehouse, setCurrentWarehouse] = useState(null); // null means adding new
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: '',
    lng: '',
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});

  // Query warehouses list
  const { data: warehouses = [], isLoading, isError, error } = useQuery({
    queryKey: ['warehouses'],
    queryFn: getWarehouses,
  });

  // Create warehouse mutation
  const createMutation = useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      showToast('Thêm nhà kho thành công!', 'success');
      closeModal();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi tạo nhà kho';
      showToast(msg, 'error');
    },
  });

  // Update warehouse mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateWarehouse(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      showToast('Cập nhật thông tin nhà kho thành công!', 'success');
      closeModal();
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật nhà kho';
      showToast(msg, 'error');
    },
  });

  // Delete warehouse mutation
  const deleteMutation = useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      showToast('Xóa nhà kho thành công!', 'success');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || 'Không thể xóa nhà kho này (có thể có dữ liệu liên quan)';
      showToast(msg, 'error');
    },
  });

  // Filtered warehouses
  const filteredWarehouses = warehouses.filter(w =>
    w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = (warehouse = null) => {
    if (warehouse) {
      setCurrentWarehouse(warehouse);
      setFormData({
        name: warehouse.name,
        address: warehouse.address,
        lat: warehouse.lat !== null && warehouse.lat !== undefined ? warehouse.lat.toString() : '',
        lng: warehouse.lng !== null && warehouse.lng !== undefined ? warehouse.lng.toString() : '',
        isActive: warehouse.isActive,
      });
    } else {
      setCurrentWarehouse(null);
      setFormData({
        name: '',
        address: '',
        lat: '',
        lng: '',
        isActive: true,
      });
    }
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentWarehouse(null);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Tên nhà kho là bắt buộc';
    if (!formData.address.trim()) errors.address = 'Địa chỉ nhà kho là bắt buộc';
    
    if (formData.lat && isNaN(parseFloat(formData.lat))) {
      errors.lat = 'Vĩ độ phải là một số hợp lệ';
    }
    if (formData.lng && isNaN(parseFloat(formData.lng))) {
      errors.lng = 'Kinh độ phải là một số hợp lệ';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      name: formData.name.trim(),
      address: formData.address.trim(),
      lat: formData.lat ? parseFloat(formData.lat) : null,
      lng: formData.lng ? parseFloat(formData.lng) : null,
      isActive: formData.isActive,
    };

    if (currentWarehouse) {
      updateMutation.mutate({ id: currentWarehouse.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa nhà kho "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="page-container flex flex-col gap-lg">
      {/* Top Header */}
      <div className="flex align-center justify-between w-full">
        <div>
          <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>
            🏭 Quản Lý Nhà Kho
          </h1>
          <p className="text-secondary" style={{ fontSize: 'var(--text-sm)', marginTop: '4px' }}>
            Xem danh sách, thêm mới, chỉnh sửa thông tin các nhà kho trong hệ thống logistics.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => openModal(null)}>
          ➕ Thêm Nhà Kho Mới
        </button>
      </div>

      {/* Toolbar & Filter */}
      <div className="card p-md flex align-center justify-between gap-md">
        <div className="flex align-center gap-sm w-full" style={{ maxWidth: '400px' }}>
          <span style={{ fontSize: 'var(--text-lg)' }}>🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm nhà kho theo tên, địa chỉ..."
            className="form-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-secondary" style={{ fontSize: 'var(--text-sm)' }}>
          Tổng số: <strong>{filteredWarehouses.length}</strong> / {warehouses.length}
        </div>
      </div>

      {/* Warehouses Grid / List */}
      {isLoading ? (
        <div className="flex justify-center align-center p-2xl w-full">
          <div className="loader"></div>
        </div>
      ) : isError ? (
        <div className="card p-lg text-center text-error">
          <p>Có lỗi xảy ra khi tải danh sách nhà kho: {error?.message}</p>
        </div>
      ) : filteredWarehouses.length === 0 ? (
        <div className="card p-2xl text-center text-secondary">
          <span style={{ fontSize: 'var(--text-3xl)' }}>🤷‍♂️</span>
          <p className="mt-md">Không tìm thấy nhà kho nào phù hợp.</p>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>ID</th>
                <th>Tên nhà kho</th>
                <th>Địa chỉ</th>
                <th>Tọa độ (Lat, Lng)</th>
                <th style={{ width: '150px' }}>Trạng thái</th>
                <th style={{ width: '280px', textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarehouses.map((warehouse) => (
                <tr key={warehouse.id}>
                  <td><strong>#{warehouse.id}</strong></td>
                  <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {warehouse.name}
                  </td>
                  <td className="text-secondary">{warehouse.address}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)' }}>
                    {warehouse.lat !== null && warehouse.lng !== null
                      ? `${warehouse.lat.toFixed(5)}, ${warehouse.lng.toFixed(5)}`
                      : <span className="text-tertiary">Chưa cập nhật</span>}
                  </td>
                  <td>
                    {warehouse.isActive ? (
                      <span className="badge badge-delivered">Đang hoạt động</span>
                    ) : (
                      <span className="badge badge-failed">Tạm dừng</span>
                    )}
                  </td>
                  <td>
                    <div className="flex justify-center gap-sm">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/warehouses/${warehouse.id}/stock`)}
                        title="Xem và quản lý tồn kho"
                      >
                        📦 Kho hàng
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openModal(warehouse)}
                        title="Chỉnh sửa thông tin"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(warehouse.id, warehouse.name)}
                        title="Xóa nhà kho"
                      >
                        🗑️ Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="flex align-center justify-between mb-lg" style={{ borderBottom: '1px solid var(--border-primary)', paddingBottom: 'var(--space-sm)' }}>
              <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: '700', margin: 0 }}>
                {currentWarehouse ? '✏️ Chỉnh Sửa Nhà Kho' : '➕ Thêm Nhà Kho Mới'}
              </h3>
              <button className="btn btn-secondary p-xs" onClick={closeModal} style={{ minWidth: 'auto', border: 'none', background: 'transparent', fontSize: 'var(--text-lg)' }}>
                ✖
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-md">
              <div className="form-group">
                <label className="form-label">Tên nhà kho <span className="text-error">*</span></label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  placeholder="Ví dụ: Nhà kho Quận 1"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.name && <div className="form-error">{formErrors.name}</div>}
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ <span className="text-error">*</span></label>
                <input
                  type="text"
                  name="address"
                  className="form-input"
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TPHCM"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
                {formErrors.address && <div className="form-error">{formErrors.address}</div>}
              </div>

              <div className="grid grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Vĩ độ (Latitude)</label>
                  <input
                    type="text"
                    name="lat"
                    className="form-input"
                    placeholder="Ví dụ: 10.7769"
                    value={formData.lat}
                    onChange={handleInputChange}
                  />
                  {formErrors.lat && <div className="form-error">{formErrors.lat}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label">Kinh độ (Longitude)</label>
                  <input
                    type="text"
                    name="lng"
                    className="form-input"
                    placeholder="Ví dụ: 106.7009"
                    value={formData.lng}
                    onChange={handleInputChange}
                  />
                  {formErrors.lng && <div className="form-error">{formErrors.lng}</div>}
                </div>
              </div>

              <div className="form-group flex align-center gap-sm mt-xs">
                <input
                  type="checkbox"
                  name="isActive"
                  id="isActive"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={formData.isActive}
                  onChange={handleInputChange}
                />
                <label htmlFor="isActive" className="form-label mb-0" style={{ cursor: 'pointer', userSelect: 'none' }}>
                  Kích hoạt hoạt động (Cho phép sử dụng trong hệ thống)
                </label>
              </div>

              <div className="flex justify-between mt-lg gap-md" style={{ borderTop: '1px solid var(--border-primary)', paddingTop: 'var(--space-md)' }}>
                <button type="button" className="btn btn-secondary w-full" onClick={closeModal}>
                  Hủy
                </button>
                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={createMutation.isLoading || updateMutation.isLoading}
                >
                  {createMutation.isLoading || updateMutation.isLoading
                    ? 'Đang lưu...'
                    : currentWarehouse ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
