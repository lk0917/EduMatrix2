import React from 'react';
import { useNavigate } from 'react-router-dom';

function CalendarDetail() {
  const navigate = useNavigate();
  const week = ['일', '월', '화', '수', '목', '금', '토'];
  const calendar = [
    { day: '일', todo: '영어 단어 암기', done: true },
    { day: '월', todo: '문법 복습', done: true },
    { day: '화', todo: '코딩 실습', done: false },
    { day: '수', todo: '', done: false },
    { day: '목', todo: '', done: false },
    { day: '금', todo: '', done: false },
    { day: '토', todo: '', done: false },
  ];
  return (
    <div style={{ maxWidth: 600, margin: '3rem auto', background: 'white', borderRadius: 18, boxShadow: '0 8px 32px #667eea33', padding: '2.5rem 2rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 18, background: 'none', border: '1.5px solid #667eea', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
      <h2 style={{ fontWeight: 800, fontSize: 26, color: '#764ba2', marginBottom: 18 }}>학습 계획 캘린더 상세</h2>
      <ul style={{ paddingLeft: 18 }}>
        {calendar.map((item, idx) => (
          <li key={idx} style={{ marginBottom: 10, fontSize: 17 }}>
            <b>{item.day}</b>: {item.todo ? item.todo : '휴식'} {item.done ? '✅' : '⬜'}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 16, color: '#888', fontSize: 14 }}>캘린더에서 오늘의 할 일과 완료 여부를 한눈에 확인하세요.</div>
    </div>
  );
}

export default CalendarDetail; 