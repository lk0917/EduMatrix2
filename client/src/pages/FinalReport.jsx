import React from 'react';
import { useNavigate } from 'react-router-dom';

function FinalReport() {
  const navigate = useNavigate();

  const reportData = {
    subject: '프로그래밍 (Python)',
    duration: '6주',
    progress: 85,
    strengths: ['논리적 사고', '문제 해결 능력', '코딩 실습'],
    weaknesses: ['알고리즘 복잡도', '메모리 관리'],
    recommendations: [
      '알고리즘 문제 풀이 연습 강화',
      '메모리 효율성 개선 학습',
      '실무 프로젝트 참여 권장'
    ]
  };

  return (
    <div className="container" style={{ padding: '2rem' }}>
      <h1>학습 최종 리포트</h1>
      <p>AI가 분석한 학습 결과를 확인해보세요.</p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '2rem',
        marginTop: '2rem'
      }}>
        {/* 기본 정보 */}
        <div style={{
          padding: '2rem',
          border: '1px solid #ddd',
          borderRadius: '12px',
          backgroundColor: 'white'
        }}>
          <h3>기본 정보</h3>
          <div style={{ marginTop: '1rem' }}>
            <p><strong>학습 과목:</strong> {reportData.subject}</p>
            <p><strong>학습 기간:</strong> {reportData.duration}</p>
            <p><strong>진행률:</strong> {reportData.progress}%</p>
          </div>
          
          {/* 진행률 바 */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{
              width: '100%',
              height: '20px',
              backgroundColor: '#f0f0f0',
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${reportData.progress}%`,
                height: '100%',
                backgroundColor: '#4caf50',
                transition: 'width 0.3s ease'
              }}></div>
            </div>
          </div>
        </div>

        {/* 강점 분석 */}
        <div style={{
          padding: '2rem',
          border: '1px solid #ddd',
          borderRadius: '12px',
          backgroundColor: 'white'
        }}>
          <h3>강점 분석</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            {reportData.strengths.map((strength, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', color: '#4caf50' }}>
                {strength}
              </li>
            ))}
          </ul>
        </div>

        {/* 개선점 */}
        <div style={{
          padding: '2rem',
          border: '1px solid #ddd',
          borderRadius: '12px',
          backgroundColor: 'white'
        }}>
          <h3>개선이 필요한 영역</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            {reportData.weaknesses.map((weakness, index) => (
              <li key={index} style={{ marginBottom: '0.5rem', color: '#f44336' }}>
                {weakness}
              </li>
            ))}
          </ul>
        </div>

        {/* 추천사항 */}
        <div style={{
          padding: '2rem',
          border: '1px solid #ddd',
          borderRadius: '12px',
          backgroundColor: 'white'
        }}>
          <h3>AI 추천사항</h3>
          <ul style={{ marginTop: '1rem', paddingLeft: '1.5rem' }}>
            {reportData.recommendations.map((rec, index) => (
              <li key={index} style={{ marginBottom: '0.5rem' }}>
                {rec}
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <button
          onClick={() => navigate('/dashboard')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2196f3',
            color: 'white',
            borderRadius: '6px',
            marginRight: '1rem'
          }}
        >
          대시보드로 돌아가기
        </button>
        
        <button
          onClick={() => navigate('/subject')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#4caf50',
            color: 'white',
            borderRadius: '6px'
          }}
        >
          새로운 학습 시작하기
        </button>
      </div>
    </div>
  );
}

export default FinalReport;
