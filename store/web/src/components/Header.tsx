'use client';

import { useAuth } from '@/lib/auth-context';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="header-user">
        <span className="role-badge">{user?.role}</span>
        <button className="logout-btn" onClick={logout}>
          Đăng xuất
        </button>
      </div>
    </header>
  );
}
