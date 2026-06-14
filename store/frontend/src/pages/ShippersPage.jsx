import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '../contexts/ToastContext';
import {
  getShippers,
  createShipper,
  updateShipper,
} from '../lib/api/shippers';

export default function ShippersPage() {
  const { showToast } = useToast();

  const [shippers, setShippers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'AVAILABLE' | 'UNAVAILABLE'

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [editingShipperId, setEditingShipperId] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    phone: '',
    vehicleType: 'xe máy',
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch shippers
  const fetchShippers = async () => {
    setLoading(true);
    try {
      const data = await getShippers();
      setShippers(data || []);
      setError(null);
    } catch (err) {
      console.error('Lỗi khi tải danh sách tài xế:', err);
      setError('Không thể kết nối API tài xế. Vui lòng thử lại sau.');
      showToast('Tải danh sách tài xế thất bại', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShippers();
  }, []);

  // Filtered shippers
  const filteredShippers = useMemo(() => {
    return shippers.filter((shipper) => {
      // Search query filter
      const query = searchQuery.toLowerCase().trim();
      const userName = shipper.user?.name?.toLowerCase() || '';
      const userEmail = shipper.user?.email?.toLowerCase() || '';
      const phone = shipper.phone?.toLowerCase() || '';
      const vehicle = shipper.vehicleType?.toLowerCase() || '';

      const matchesSearch =
        !query ||
        userName.includes(query) ||
        userEmail.includes(query) ||
        phone.includes(query) ||
        vehicle.includes(query);

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'AVAILABLE') {
        matchesStatus = shipper.isAvailable === true;
      } else if (statusFilter === 'UNAVAILABLE') {
        matchesStatus = shipper.isAvailable === false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [shippers, searchQuery, statusFilter]);

  // Toggle availability status
  const handleToggleAvailability = async (shipper) => {
    const newStatus = !shipper.isAvailable;
    try {
      // Optimistic update
      setShippers((prev) =>
        prev.map((s) => (s.id === shipper.id ? { ...s, isAvailable: newStatus } : s))
      );

      await updateShipper(shipper.id, { isAvailable: newStatus });
      showToast(
        `Đã chuyển trạng thái tài xế ${shipper.user?.name || ''} sang ${
          newStatus ? 'Sẵn sàng hoạt động' : 'Tạm nghỉ'
        }`,
        'success'
      );
    } catch (err) {
      console.error('Lỗi khi cập nhật trạng thái hoạt động:', err);
      // Revert optimistic update
      setShippers((prev) =>
        prev.map((s) => (s.id === shipper.id ? { ...s, isAvailable: shipper.isAvailable } : s))
      );
      const msg = err.response?.data?.message || 'Không thể cập nhật trạng thái';
      showToast(msg, 'error');
    }
  };

  // Open modal for Create
  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      userId: '',
      phone: '',
      vehicleType: 'xe máy',
    });
    setEditingShipperId(null);
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEdit = (shipper) => {
    setModalMode('edit');
    setFormData({
      userId: shipper.userId,
      phone: shipper.phone,
      vehicleType: shipper.vehicleType || 'xe máy',
    });
    setEditingShipperId(shipper.id);
    setIsModalOpen(true);
  };

  // Form Submit handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.phone) {
      showToast('Vui lòng điền số điện thoại', 'warning');
      return;
    }

    if (modalMode === 'create' && !formData.userId) {
      showToast('Vui lòng nhập User ID của tài xế', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      if (modalMode === 'create') {
        const payload = {
          userId: parseInt(formData.userId, 10),
          phone: formData.phone,
          vehicleType: formData.vehicleType,
        };
        await createShipper(payload);
        showToast('Khai báo tài xế mới thành công', 'success');
      } else {
        const payload = {
          phone: formData.phone,
          vehicleType: formData.vehicleType,
        };
        await updateShipper(editingShipperId, payload);
        showToast('Cập nhật thông tin tài xế thành công', 'success');
      }
      setIsModalOpen(false);
      fetchShippers();
    } catch (err) {
      console.error('Lỗi khi lưu tài xế:', err);
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi lưu thông tin tài xế';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-lg">
      {/* Header section */}
      <div className="flex justify-between align-center card p-md">
        <div>
          <h2 className="m-0" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>
            🚚 Quản lý Tài xế (Shippers)
          </h2>
          <p className="text-secondary m-0 mt-xs" style={{ fontSize: 'var(--text-sm)' }}>
            Xem danh sách shipper, thay đổi phương tiện vận chuyển và toggle trạng thái sẵn sàng giao nhận đơn hàng.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          ➕ Đăng ký Shipper
        </button>
      </div>

      {/* Control Filters */}
      <div className="card p-md flex align-center justify-between gap-md flex-col md:flex-row">
        {/* Search */}
        <div className="flex align-center gap-sm w-full md:w-auto" style={{ flexGrow: 1, maxWidth: '450px' }}>
          <span>🔍</span>
          <input
            type="text"
            className="form-input"
            placeholder="Tìm theo tên, email, SĐT, xe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filter status */}
        <div className="flex align-center gap-sm w-full md:w-auto">
          <span className="text-secondary" style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>Trạng thái:</span>
          <div className="flex gap-xs">
            <button
              className={`btn p-xs px-sm ${statusFilter === 'ALL' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('ALL')}
            >
              Tất cả
            </button>
            <button
              className={`btn p-xs px-sm ${statusFilter === 'AVAILABLE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('AVAILABLE')}
            >
              🟢 Sẵn sàng
            </button>
            <button
              className={`btn p-xs px-sm ${statusFilter === 'UNAVAILABLE' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter('UNAVAILABLE')}
            >
              🔴 Tạm nghỉ
            </button>
          </div>
        </div>
      </div>

      {/* Shippers Table */}
      <div className="table-container shadow-md">
        {loading ? (
          <div className="flex flex-col align-center justify-center p-xl gap-md" style={{ minHeight: '300px' }}>
            <div className="loader"></div>
            <span className="text-secondary">Đang tải danh sách shipper...</span>
          </div>
        ) : error ? (
          <div className="flex flex-col align-center justify-center p-xl gap-md text-center" style={{ minHeight: '300px' }}>
            <span style={{ fontSize: 'var(--text-3xl)' }}>⚠️</span>
            <span className="text-error" style={{ fontWeight: '500' }}>{error}</span>
            <button className="btn btn-secondary" onClick={fetchShippers}>
              Tải lại trang
            </button>
          </div>
        ) : filteredShippers.length === 0 ? (
          <div className="flex flex-col align-center justify-center p-xl gap-md text-center" style={{ minHeight: '300px' }}>
            <span style={{ fontSize: 'var(--text-3xl)' }}>📭</span>
            <span className="text-secondary">Không tìm thấy tài xế giao hàng nào</span>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '10%' }}>ID</th>
                <th style={{ width: '25%' }}>Tài Xế</th>
                <th style={{ width: '20%' }}>Số Điện Thoại</th>
                <th style={{ width: '15%' }}>Phương Tiện</th>
                <th style={{ width: '15%' }}>Trạng Thái</th>
                <th style={{ width: '15%' }}>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredShippers.map((shipper) => (
                <tr key={shipper.id}>
                  <td>
                    <span className="text-secondary" style={{ fontFamily: 'monospace' }}>
                      #{shipper.id}
                    </span>
                  </td>
                  <td>
                    <div>
                      <strong className="text-primary">{shipper.user?.name || `Tài xế #${shipper.id}`}</strong>
                      {shipper.user?.email && (
                        <div className="text-secondary" style={{ fontSize: 'var(--text-xs)' }}>
                          {shipper.user.email}
                        </div>
                      )}
                      <div className="text-tertiary" style={{ fontSize: 'var(--text-2xs)' }}>
                        User ID: {shipper.userId}
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-secondary">{shipper.phone}</span>
                  </td>
                  <td>
                    <span className="badge badge-planning" style={{ textTransform: 'capitalize' }}>
                      {shipper.vehicleType || 'Chưa cập nhật'}
                    </span>
                  </td>
                  <td>
                    <div className="flex align-center gap-xs">
                      {shipper.isAvailable ? (
                        <span className="badge badge-delivered">Sẵn sàng</span>
                      ) : (
                        <span className="badge badge-failed">Tạm nghỉ</span>
                      )}
                      {/* Checkbox Toggle Switch */}
                      <label className="switch-toggle" style={{ display: 'inline-block', position: 'relative', width: '36px', height: '20px', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          style={{ opacity: 0, width: 0, height: 0 }}
                          checked={shipper.isAvailable}
                          onChange={() => handleToggleAvailability(shipper)}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: shipper.isAvailable ? 'var(--status-success)' : 'var(--bg-tertiary)',
                            borderRadius: '20px',
                            transition: '0.3s'
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              content: '""',
                              height: '14px', width: '14px',
                              left: shipper.isAvailable ? '18px' : '4px',
                              bottom: '3px',
                              backgroundColor: '#fff',
                              borderRadius: '50%',
                              transition: '0.3s'
                            }}
                          />
                        </span>
                      </label>
                    </div>
                  </td>
                  <td>
                    <div className="flex gap-sm">
                      <button className="btn btn-secondary p-xs" onClick={() => handleOpenEdit(shipper)}>
                        ✏️ Sửa
                      </button>
                      <button
                        className={`btn p-xs ${shipper.isAvailable ? 'btn-danger' : 'btn-primary'}`}
                        onClick={() => handleToggleAvailability(shipper)}
                        style={{ minWidth: '100px' }}
                      >
                        {shipper.isAvailable ? '🔴 Tạm nghỉ' : '🟢 Sẵn sàng'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Shipper Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <div className="flex justify-between align-center mb-lg">
              <h3 className="m-0" style={{ fontSize: 'var(--text-xl)', fontWeight: 'bold' }}>
                {modalMode === 'create' ? '➕ Đăng ký Shipper mới' : '✏️ Chỉnh sửa thông tin tài xế'}
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
              {modalMode === 'create' && (
                <div className="form-group">
                  <label className="form-label">User ID <span className="text-error">*</span></label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="VD: 5"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                  />
                  <small className="text-secondary mt-xs" style={{ display: 'block', fontSize: 'var(--text-xs)' }}>
                    ID của người dùng đã có tài khoản SHIPPER trong hệ thống.
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Số điện thoại liên hệ <span className="text-error">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: 0912345678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phương tiện vận chuyển</label>
                <select
                  className="form-input"
                  style={{ textTransform: 'capitalize' }}
                  value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                >
                  <option value="xe máy">Xe máy 🛵</option>
                  <option value="ô tô">Ô tô 🚗</option>
                  <option value="xe tải nhỏ">Xe tải nhỏ 🚚</option>
                </select>
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
                  {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
