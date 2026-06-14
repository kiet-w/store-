'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Sidebar.css';

const navItems = [
  { section: 'Tổng quan', items: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  ]},
  { section: 'Quản lý kho', items: [
    { href: '/products', label: 'Sản phẩm', icon: '📦' },
    { href: '/warehouses', label: 'Kho hàng', icon: '🏭' },
    { href: '/inventory', label: 'Tồn kho', icon: '📋' },
  ]},
  { section: 'Giao hàng', items: [
    { href: '/shippers', label: 'Shipper', icon: '🚚' },
    { href: '/delivery-orders', label: 'Đơn giao', icon: '📬' },
    { href: '/delivery-batches', label: 'Đơn ghép', icon: '🗺️' },
  ]},
  { section: 'Báo cáo', items: [
    { href: '/reports/inventory', label: 'Bù trừ kho', icon: '📈' },
    { href: '/reports/shippers', label: 'Hiệu suất shipper', icon: '⚡' },
  ]},
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <h2>Delivery MS</h2>
        <span>Quản lý giao hàng</span>
      </div>
      <nav className="sidebar-nav">
        {navItems.map((section) => (
          <div className="nav-section" key={section.section}>
            <div className="nav-section-title">{section.section}</div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link ${pathname === item.href ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
    </aside>
  );
}
