// src/components/Header.jsx
import React from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';

function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{ padding: '0.75rem 1.25rem', background: 'var(--card-bg)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--card-border)' }}>
      <h3 style={{ color: 'var(--color-primary)', letterSpacing: -0.5, fontWeight: 800 }}>EduMatrix</h3>
      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{user.name}님 환영합니다</span>
          <button
            onClick={handleLogout}
            style={{ background: 'var(--neutral-gradient)', color: 'var(--color-text)', border: '1px solid var(--card-border)', borderRadius: 10, padding: '6px 12px', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}
            aria-label="로그아웃"
          >
            <FiLogOut />
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
