import React from 'react';
import { useNavigate } from 'react-router-dom';

function WeeklyEvalDetail() {
  const navigate = useNavigate();
  // 예시 데이터
  const weeklyEval = {
    score: 7,
    feedback: '이번 주 꾸준히 학습했어요! 다음 주엔 실전 문제에 도전해보세요.',
    subjects: [
      { name: '영어', score: 8, comment: '어휘 암기와 독해 모두 우수', color: '#667eea', trend: [6,7,7,8,8] },
      { name: '코딩', score: 6, comment: '기초 문법은 좋으나 실전 문제 풀이 필요', color: '#4caf50', trend: [4,5,6,6,6] },
      { name: '수학', score: 5, comment: '기본 개념 복습 필요', color: '#ff9800', trend: [3,4,5,5,5] }
    ],
    achievement: ['영어 단어 100개 암기', '파이썬 기초 문법 완주'],
    lack: ['수학 개념 복습 부족', '코딩 실전 문제 풀이 미흡'],
    recommend: ['수학 기초 복습', '코딩 실전 문제 더 풀기'],
    nextGoal: '수학 2단원 완독, 코딩 실전 3문제 풀기'
  };
  return (
    <div style={{ maxWidth: 800, margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 24, boxShadow: '0 8px 32px #ff980033', padding: '2.8rem 2.5rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 18, background: 'none', border: '1.5px solid #ff9800', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#ff9800', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
      <h2 style={{ fontWeight: 900, fontSize: 28, color: '#ff9800', marginBottom: 18 }}>주간 최종 평가 보고서</h2>
      {/* 점수 및 총평 */}
      <div style={{ fontSize: 18, marginBottom: 10 }}>이번 주 점수: <b style={{ color: '#667eea', fontSize: 22 }}>{weeklyEval.score} / 10</b></div>
      <div style={{ color: 'var(--color-text)', fontSize: 16, marginBottom: 18 }}>{weeklyEval.feedback}</div>
      {/* 분야별 평가 */}
      <div style={{ fontWeight: 800, fontSize: 17, marginBottom: 10, color: '#ff9800' }}>분야별 평가</div>
      {weeklyEval.subjects.map(subj => (
        <div key={subj.name} style={{ marginBottom: 18, background: 'var(--card-bg)', borderRadius: 12, padding: '1.1rem 1.2rem', boxShadow: '0 1px 4px var(--card-shadow)' }}>
          <div style={{ fontWeight: 700, color: subj.color, fontSize: 15, marginBottom: 2 }}>{subj.name} <span style={{ color: '#333', fontWeight: 600, fontSize: 14, marginLeft: 8 }}>({subj.score} / 10)</span></div>
          <div style={{ width: '100%', height: 10, background: '#e0e7ff', borderRadius: 6, margin: '4px 0 8px 0' }}>
            <div style={{ width: `${subj.score * 10}%`, height: '100%', background: subj.color, borderRadius: 6, transition: 'width 0.4s' }} />
          </div>
          <svg width="100%" height="32" viewBox="0 0 120 32" style={{ marginTop: 2 }}>
            <polyline
              fill="none"
              stroke={subj.color}
              strokeWidth="3"
              points={subj.trend.map((v, i) => `${i * 30},${32 - (v / 10) * 32}`).join(' ')}
            />
            {subj.trend.map((v, i) => (
              <circle key={i} cx={i * 30} cy={32 - (v / 10) * 32} r="3" fill={subj.color} />
            ))}
          </svg>
          <div style={{ color: 'var(--color-text)', fontSize: 14, marginTop: 6 }}>{subj.comment}</div>
        </div>
      ))}
      {/* 주요 성취 */}
      <div style={{ fontWeight: 800, fontSize: 17, margin: '22px 0 8px 0', color: '#1976d2' }}>주요 성취</div>
      <ul style={{ marginBottom: 12, color: '#1976d2', fontWeight: 600, fontSize: 15 }}>
        {weeklyEval.achievement.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
      {/* 부족한 점 */}
      <div style={{ fontWeight: 800, fontSize: 17, margin: '22px 0 8px 0', color: '#e74c3c' }}>부족한 점</div>
      <ul style={{ marginBottom: 12, color: '#e74c3c', fontWeight: 600, fontSize: 15 }}>
        {weeklyEval.lack.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
      {/* 추천 학습 */}
      <div style={{ fontWeight: 800, fontSize: 17, margin: '22px 0 8px 0', color: '#4caf50' }}>추천 학습</div>
      <ul style={{ marginBottom: 12, color: '#4caf50', fontWeight: 600, fontSize: 15 }}>
        {weeklyEval.recommend.map((a, i) => <li key={i}>{a}</li>)}
      </ul>
      {/* 다음 주 목표 */}
      <div style={{ fontWeight: 800, fontSize: 17, margin: '22px 0 8px 0', color: '#764ba2' }}>다음 주 목표</div>
      <div style={{ color: '#764ba2', fontWeight: 700, fontSize: 16, marginBottom: 8 }}>{weeklyEval.nextGoal}</div>
      <div style={{ marginTop: 18, color: 'var(--color-text)', fontSize: 14 }}>주간 평가를 바탕으로 강점은 더 발전시키고, 부족한 부분은 집중적으로 보완해보세요!</div>
    </div>
  );
}

export default WeeklyEvalDetail; 