// src/components/Header.jsx
import React from 'react';
import { useUser } from '../context/UserContext';
import { useNavigate } from 'react-router-dom';

function Header() {
  const { user, logout } = useUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header style={{ padding: '1rem', background: 'var(--color-secondary)', display: 'flex', justifyContent: 'space-between' }}>
      <h3 style={{ color: 'var(--color-primary)' }}>EduMatrix</h3>
      {user && (
        <div>
          <span style={{ marginRight: '1rem', color: 'var(--color-text)' }}>{user.name}님 환영합니다</span>
          <button 
            onClick={handleLogout}
            style={{ background: 'var(--button-bg)', color: 'var(--button-text)', border: 'none', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}
          >
            로그아웃
          </button>
        </div>
      )}
    </header>
  );
}

export default Header;
