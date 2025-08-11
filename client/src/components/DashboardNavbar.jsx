import React from 'react';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import whiteLogo from '../assets/white logo.png';
import { FiMenu, FiSun, FiMoon, FiDroplet, FiMessageSquare } from 'react-icons/fi';

function DashboardNavbar({ onSidebarToggle, onChatbotToggle }) {
  const { theme, toggleTheme } = useTheme();
  const themes = ['light','dark','gradient'];
  const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 64, background: 'var(--card-bg)', boxShadow: '0 8px 24px #00000012', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.25rem 0 0.75rem', transition: 'box-shadow 0.2s', borderBottom: '1px solid var(--card-border)' }}>
      <button onClick={onSidebarToggle} style={{ background: 'var(--neutral-gradient)', border: '1px solid var(--card-border)', fontSize: 20, color: 'var(--color-text)', cursor: 'pointer', fontWeight: 700, marginRight: 12, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, boxShadow: '0 2px 8px #00000012' }} aria-label="메뉴 열기">
        <FiMenu />
      </button>
      <img src={theme === 'dark' ? whiteLogo : logo} alt="EduMatrix Logo" style={{ height: 34, objectFit: 'contain' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={() => toggleTheme(nextTheme)} title={`테마: ${theme} → ${nextTheme}`} style={{ background: 'var(--neutral-gradient)', border: '1px solid var(--card-border)', fontSize: 18, cursor: 'pointer', padding: 8, borderRadius: 12, color: 'var(--color-text)', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px #00000012' }} aria-label="테마 전환">
          {theme === 'light' && <FiSun />}
          {theme === 'dark' && <FiMoon />}
          {theme === 'gradient' && <FiDroplet />}
        </button>
        <button onClick={onChatbotToggle} style={{ background: 'var(--accent-gradient)', border: 'none', fontSize: 18, color: 'var(--button-text)', cursor: 'pointer', fontWeight: 700, marginLeft: 4, width: 44, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, boxShadow: '0 6px 18px rgba(99, 102, 241, 0.25)' }} aria-label="AI 챗봇 열기">
          <FiMessageSquare />
        </button>
      </div>
    </nav>
  );
}

export default DashboardNavbar; 