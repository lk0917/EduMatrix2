import React from 'react';
import { useNavigate } from 'react-router-dom';

function RecommendDetail() {
  const navigate = useNavigate();
  const recommendations = [
    { title: '파이썬 기초 문법', desc: '초보자를 위한 Python 입문 강의', icon: '🐍' },
    { title: '영어 회화 실전', desc: '실생활 영어 표현 익히기', icon: '🗣️' },
    { title: 'HTML/CSS 실습', desc: '웹 페이지 직접 만들어보기', icon: '🌐' }
  ];
  return (
    <div style={{ maxWidth: 600, margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 18, boxShadow: '0 8px 32px #667eea33', padding: '2.5rem 2rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 18, background: 'none', border: '1.5px solid #2196f3', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#2196f3', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
      <h2 style={{ fontWeight: 800, fontSize: 26, color: '#2196f3', marginBottom: 18 }}>추천 학습 상세</h2>
      {recommendations.map((rec, idx) => (
        <div key={idx} style={{ background: 'var(--card-bg)', borderRadius: 10, padding: '1rem', marginBottom: 10, boxShadow: '0 1px 4px var(--card-shadow)' }}>
          <div style={{ fontSize: 22 }}>{rec.icon} <b>{rec.title}</b></div>
          <div style={{ color: '#666', fontSize: 14 }}>{rec.desc}</div>
        </div>
      ))}
      <div style={{ marginTop: 16, color: '#888', fontSize: 14 }}>AI가 추천하는 학습 목록을 참고해보세요!</div>
    </div>
  );
}

export default RecommendDetail; 