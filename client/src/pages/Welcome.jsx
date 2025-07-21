import React from 'react';
import { useNavigate } from 'react-router-dom';

function Welcome() {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: '100vh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem', color: 'var(--text-main)' }}>
      <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '3rem 2.5rem', maxWidth: 480, width: '100%', textAlign: 'center', color: '#111' }}>
        <div style={{ fontSize: 32, fontWeight: 800, marginBottom: 16, WebkitBackgroundClip: 'text', color: '#111' }}>
          EduMatrix
        </div>
        <div style={{ fontSize: 20, color: '#111', fontWeight: 600, marginBottom: 24 }}>
          AI 기반 맞춤형 학습 관리 서비스
        </div>
        <div style={{ color: '#444', fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
          EduMatrix는 회원님의 학습 목표와 수준에 맞는<br />
          최적의 학습 계획을 AI가 추천해주는 서비스입니다.<br />
          <br />
          회원가입 후 관심 분야를 선택하고,<br />
          간단한 진단 테스트를 통해<br />
          나만의 맞춤 학습 플랜을 받아보세요!
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{
            padding: '1rem 2.5rem',
            fontSize: '1.15rem',
            fontWeight: 700,
            borderRadius: 12,
            background: '#111',
            color: '#fff',
            border: 'none',
            boxShadow: '0 2px 8px #0002',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          시작하기
        </button>
      </div>
    </div>
  );
}

export default Welcome; 