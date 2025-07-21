import React from 'react';
import { useTheme } from '../context/ThemeContext';
import logo from '../assets/logo.png';
import whiteLogo from '../assets/white logo.png';

function DashboardNavbar({ onSidebarToggle, onChatbotToggle }) {
  const { theme } = useTheme();
  return (
    <nav style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: 64, background: 'var(--color-bg)', boxShadow: '0 4px 18px #667eea33', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2.5rem', transition: 'box-shadow 0.2s' }}>
      <button onClick={onSidebarToggle} style={{ background: 'none', border: 'none', fontSize: 28, color: theme === 'dark' ? '#fff' : '#222', cursor: 'pointer', fontWeight: 800, marginRight: 12 }} aria-label="메뉴 열기">☰</button>
      <img src={theme === 'dark' ? whiteLogo : logo} alt="EduMatrix Logo" style={{ height: 40, objectFit: 'contain' }} />
      <button onClick={onChatbotToggle} style={{ background: 'none', border: 'none', fontSize: 28, color: theme === 'dark' ? '#fff' : '#222', cursor: 'pointer', fontWeight: 800, marginLeft: 12 }} aria-label="AI 챗봇 열기">⋯</button>
    </nav>
  );
}

export default DashboardNavbar; 