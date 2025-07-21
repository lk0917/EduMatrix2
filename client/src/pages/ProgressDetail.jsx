import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ProgressDetail() {
const [progress, setProgress] = useState(null);
const navigate = useNavigate();

  useEffect(() => {
    const fetchProgress = async () => {
      const user_id = localStorage.getItem('user_id');
      if (!user_id) return;
      const res = await axios.get(`/api/progress/${user_id}`);
      setProgress(res.data);
    };
    fetchProgress();
  }, []);

  if (!progress) return <div>불러오는 중...</div>;

  return (
    <div style={{ maxWidth: 700, margin: '3rem auto', background: 'var(--card-bg)', borderRadius: 22, boxShadow: '0 8px 32px var(--card-shadow)', border: '1.5px solid var(--card-border)', padding: '2.5rem 2.2rem' }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 18, background: 'none', border: '1.5px solid #667eea', borderRadius: 8, padding: '0.4rem 1.2rem', color: '#667eea', fontWeight: 700, cursor: 'pointer' }}>← 돌아가기</button>
      <h2 style={{ fontWeight: 900, fontSize: 28, color: '#667eea', marginBottom: 18 }}>학습 진행률 상세</h2>
      <div style={{ fontWeight: 700, marginBottom: 10, fontSize: 18 }}>주간/분야별 상세 진행률</div>
      {/* 전체 진행률 */}
      <div style={{ marginBottom: 18, fontSize: 16 }}>
        전체 달성률: <b style={{ color: '#667eea', fontSize: 20 }}>{progress.total}%</b>
    {typeof progress.last_week === 'number' ? (
    <span style={{ color: '#4caf50', fontWeight: 700, fontSize: 15, marginLeft: 10 }}>
    ({progress.total - progress.last_week >= 0 ? '+' : ''}{progress.total - progress.last_week}% ↑)
    </span>) : (
    <span style={{ color: '#888', fontSize: 14, marginLeft: 10 }}>
    (지난주 데이터 없음)
    </span>
    )} 
     </div>
      {/* 분야별 진행률 바 */}
      {progress.subject_stats.map(item => (
        <div key={item.name} style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 700, color: item.color, fontSize: 15, marginBottom: 2 }}>{item.name}: {item.percent}%</div>
          <div style={{ width: '100%', height: 12, background: '#f0f0f0', borderRadius: 7, margin: '4px 0' }}>
            <div style={{ width: `${item.percent}%`, height: '100%', background: item.color, borderRadius: 7, transition: 'width 0.4s' }} />
          </div>
          {/* 트렌드 라인 차트 (SVG) */}
          <svg width="100%" height="38" viewBox="0 0 120 38" style={{ marginTop: 2 }}>
            <polyline
              fill="none"
              stroke={item.color}
              strokeWidth="3"
              points={item.trend.map((v, i) => `${i * 30},${38 - (v / 100) * 38}`).join(' ')}
            />
            {item.trend.map((v, i) => (
              <circle key={i} cx={i * 30} cy={38 - (v / 100) * 38} r="3.5" fill={item.color} />
            ))}
          </svg>
        </div>
      ))}
      {/* 목표 대비, 예상 달성일 */}
      <div style={{ margin: '18px 0', fontSize: 15, color: '#888' }}>
        목표 대비 실제 학습량: <b>72%</b> / 예상 달성일: <b>{progress.expected_date}</b>
      </div>
      {/* 강점/약점 분석 */}
      <div style={{ margin: '18px 0', fontSize: 15 }}>
        <span style={{ color: '#4caf50', fontWeight: 700 }}>강점</span>: {progress.strong} / <span style={{ color: '#e74c3c', fontWeight: 700 }}>약점</span>: {progress.weak}
      </div>
      {/* 추천 학습 */}
      <div style={{ margin: '18px 0', fontSize: 15, color: '#1976d2', fontWeight: 700 }}>
        추천 학습: 수학 기초 복습, 코딩 실전 문제 더 풀기
      </div>
      <div style={{ marginTop: 16, color: '#888', fontSize: 14 }}>분야별 트렌드와 강약점을 참고해 부족한 부분을 집중적으로 학습해보세요!</div>
    </div>
  );
}

export default ProgressDetail; 