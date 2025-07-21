import React from 'react';
import { useNavigate } from 'react-router-dom';

function QuizDetail() {
  const navigate = useNavigate();
  const quizzes = [
    { title: '오늘의 퀴즈', desc: '영어 단어 10문제', icon: '❓' },
    { title: '코딩 로직 퀴즈', desc: '조건문/반복문 실전', icon: '💻' }
  ];
  return (
    <div style={{ maxWidth: 600, margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 18, boxShadow: '0 8px 32px #667eea33', padding: '2.5rem 2rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 18, background: 'none', border: '1.5px solid #e74c3c', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#e74c3c', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
      <h2 style={{ fontWeight: 800, fontSize: 26, color: '#e74c3c', marginBottom: 18 }}>퀴즈 상세</h2>
      {quizzes.map((quiz, idx) => (
        <div key={idx} style={{ background: 'var(--card-bg)', borderRadius: 10, padding: '1rem', marginBottom: 10, boxShadow: '0 1px 4px var(--card-shadow)',border: '1.5px solid var(--card-border)' }}>
          <div style={{ fontSize: 22 }}>{quiz.icon} <b>{quiz.title}</b></div>
          <div style={{ color: '#666', fontSize: 14 }}>{quiz.desc}</div>
          <button style={{ marginTop: 8, padding: '0.5rem 1.2rem', background: 'linear-gradient(90deg,#667eea,#764ba2)', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }} onClick={() => navigate('/quiz')}>퀴즈 풀기</button>
        </div>
      ))}
      <div style={{ marginTop: 16, color: '#888', fontSize: 14 }}>퀴즈를 풀고 실력을 점검해보세요!</div>
    </div>
  );
}

export default QuizDetail; 