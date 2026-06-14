import { useState, useEffect, useCallback } from 'react';
import { getShipperPerformanceReport } from '../lib/api/admin';
import { useToast } from '../contexts/ToastContext';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function ShipperPerformancePage() {
  const [reportData, setReportData] = useState([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const start = startDate ? new Date(startDate).toISOString() : undefined;
      const end = endDate ? new Date(endDate).toISOString() : undefined;
      const data = await getShipperPerformanceReport(start, end);
      setReportData(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải báo cáo hiệu suất shipper', 'error');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, showToast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReport();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchReport]);

  const handleFilter = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setTimeout(() => {
      setLoading(true);
      getShipperPerformanceReport()
        .then((data) => setReportData(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 0);
  };

  // Format Recharts data
  const chartData = reportData.map(item => ({
    name: item.name,
    'Tổng chuyến': item.totalBatches,
    'Hoàn thành': item.completedBatches,
    'Quãng đường (km)': item.totalDistanceKm,
  }));

  return (
    <div className="page-container">
      <div className="flex justify-between align-center mb-lg">
        <div>
          <h1 className="m-0 mb-xs" style={{ fontSize: 'var(--text-2xl)', fontWeight: 'bold' }}>Hiệu suất Tài xế (Shipper Performance)</h1>
          <p className="text-secondary m-0">Đánh giá số lượng chuyến hàng, tỷ lệ giao thành công và quãng đường di chuyển.</p>
        </div>
      </div>

      {/* Date filter form */}
      <div className="card mb-xl">
        <form onSubmit={handleFilter} className="flex align-center gap-md" style={{ flexWrap: 'wrap' }}>
          <div className="form-group m-0" style={{ minWidth: '180px' }}>
            <label className="form-label">Từ ngày</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group m-0" style={{ minWidth: '180px' }}>
            <label className="form-label">Đến ngày</label>
            <input
              type="date"
              className="form-input"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="flex gap-sm align-end" style={{ marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary">
              🔍 Lọc báo cáo
            </button>
            <button type="button" onClick={handleReset} className="btn btn-secondary">
              Đặt lại
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center align-center" style={{ minHeight: '300px' }}>
          <div className="loader"></div>
        </div>
      ) : (
        <div className="flex flex-col gap-lg">
          {/* Chart Section */}
          {reportData.length > 0 && (
            <div className="grid grid-2" style={{ gap: 'var(--space-lg)' }}>
              {/* Batches Chart */}
              <div className="card">
                <h3 className="m-0 mb-md">Số chuyến gom vs Số chuyến hoàn thành</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface-popover)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Legend wrapperStyle={{ color: '#94a3b8' }} />
                      <Bar dataKey="Tổng chuyến" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Hoàn thành" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Distance Chart */}
              <div className="card">
                <h3 className="m-0 mb-md">Quãng đường đã di chuyển (km)</h3>
                <div style={{ width: '100%', height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2f3e" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'var(--surface-popover)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                        itemStyle={{ color: 'var(--text-primary)' }}
                      />
                      <Legend wrapperStyle={{ color: '#94a3b8' }} />
                      <Bar dataKey="Quãng đường (km)" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Table list */}
          <div className="card">
            <h3 className="m-0 mb-md">Bảng số liệu chi tiết hiệu suất shipper</h3>
            {reportData.length === 0 ? (
              <div className="text-center p-lg text-secondary">Không có dữ liệu trong khoảng thời gian đã chọn.</div>
            ) : (
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Shipper ID</th>
                      <th>Họ và tên</th>
                      <th>Tổng số chuyến gom</th>
                      <th>Chuyến hoàn thành</th>
                      <th>Số đơn hàng đã giao</th>
                      <th>Tổng quãng đường (km)</th>
                      <th>Tỷ lệ hoàn thành chuyến</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((row) => {
                      const completionRate = row.totalBatches > 0
                        ? Math.round((row.completedBatches / row.totalBatches) * 100)
                        : 0;

                      return (
                        <tr key={row.shipperId}>
                          <td><strong>#{row.shipperId}</strong></td>
                          <td>{row.name}</td>
                          <td>{row.totalBatches}</td>
                          <td className="text-success">{row.completedBatches}</td>
                          <td>{row.totalOrders}</td>
                          <td style={{ color: 'var(--accent-primary)', fontWeight: '500' }}>{row.totalDistanceKm} km</td>
                          <td>
                            <div className="flex align-center gap-xs">
                              <span style={{ fontWeight: 'bold', marginRight: '6px' }}>{completionRate}%</span>
                              <div
                                style={{
                                  width: '60px',
                                  height: '6px',
                                  backgroundColor: 'var(--bg-tertiary)',
                                  borderRadius: '3px',
                                  overflow: 'hidden',
                                  display: 'inline-block',
                                }}
                              >
                                <div
                                  style={{
                                    height: '100%',
                                    width: `${completionRate}%`,
                                    backgroundColor: completionRate >= 80 ? 'var(--status-success)' : completionRate >= 50 ? 'var(--status-warning)' : 'var(--status-error)',
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
