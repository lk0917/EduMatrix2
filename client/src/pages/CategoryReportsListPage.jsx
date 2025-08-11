import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { getAllCategoryReports } from '../services/quizService';

function CategoryReportsListPage() {
  const { user } = useUser();
  const navigate = useNavigate();
  
  const [categoryReports, setCategoryReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategoryReports = async () => {
      if (!user?.user_id) return;

      try {
        setLoading(true);
        const response = await getAllCategoryReports(user.user_id);
        if (response.success) {
          setCategoryReports(response.data);
        } else {
          setError('보고서 목록을 불러올 수 없습니다.');
        }
      } catch (err) {
        console.error('카테고리 보고서 목록 로드 실패:', err);
        setError('보고서 목록 로드에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadCategoryReports();
  }, [user]);

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return '#28a745';
    if (percentage >= 60) return '#ffc107';
    return '#dc3545';
  };

  const getProgressLabel = (percentage) => {
    if (percentage >= 80) return '우수';
    if (percentage >= 60) return '양호';
    return '개선 필요';
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>보고서 목록을 불러오는 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, marginBottom: 16 }}>{error}</div>
          <button 
            onClick={() => navigate(-1)}
            style={{ 
              padding: '0.8rem 1.5rem', 
              borderRadius: 10, 
              border: 'none', 
              fontWeight: 700, 
              cursor: 'pointer', 
              background: 'var(--accent-gradient)', 
              color: '#fff' 
            }}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '1rem' }}>
        {/* 헤더 */}
        <div style={{ marginBottom: 24 }}>
          <button 
            onClick={() => navigate(-1)} 
            style={{ 
              background: 'none', 
              border: '1.5px solid #667eea', 
              borderRadius: 8, 
              padding: '0.4rem 1.2rem', 
              color: '#667eea', 
              fontWeight: 700, 
              cursor: 'pointer',
              marginBottom: 16
            }}
          >
            ← 돌아가기
          </button>
          <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>
            📊 카테고리별 보고서
          </h2>
          <p style={{ color: '#666', marginBottom: 0 }}>
            각 학습 카테고리별 상세 분석 보고서를 확인하세요.
          </p>
        </div>

        {categoryReports.length === 0 ? (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '2rem', textAlign: 'center' }}>
            <div style={{ fontSize: 18, marginBottom: 16, color: '#666' }}>
              아직 카테고리별 퀴즈 기록이 없습니다.
            </div>
            <button
              onClick={() => navigate('/category-quiz')}
              style={{
                padding: '0.8rem 1.5rem',
                borderRadius: 10,
                border: 'none',
                fontWeight: 700,
                cursor: 'pointer',
                background: 'var(--accent-gradient)',
                color: '#fff'
              }}
            >
              카테고리별 퀴즈 시작하기
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 16 }}>
            {categoryReports.map((report, index) => (
              <div 
                key={index}
                style={{ 
                  background: 'var(--card-bg)', 
                  borderRadius: 16, 
                  boxShadow: '0 8px 24px var(--card-shadow)', 
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
                onClick={() => navigate(`/category-report/${encodeURIComponent(report.category)}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 32px var(--card-shadow)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 24px var(--card-shadow)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#333' }}>
                      📚 {report.category}
                    </h3>
                    <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>
                      마지막 테스트: {new Date(report.lastTestDate).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: 14, color: '#666' }}>
                      총 {report.quizCount}회 테스트 완료
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ 
                      fontSize: 24, 
                      fontWeight: 900, 
                      color: getProgressColor(report.progressPercentage),
                      marginBottom: 4
                    }}>
                      {report.progressPercentage}%
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      padding: '0.2rem 0.6rem', 
                      borderRadius: 12, 
                      background: getProgressColor(report.progressPercentage) + '20',
                      color: getProgressColor(report.progressPercentage),
                      fontWeight: 600
                    }}>
                      {getProgressLabel(report.progressPercentage)}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#333' }}>
                        {report.latestScore}/10
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>최근 점수</div>
                    </div>
                    
                    {report.hasDetailedReport && (
                      <div style={{ 
                        fontSize: 12, 
                        padding: '0.3rem 0.6rem', 
                        borderRadius: 8, 
                        background: '#e3f2fd',
                        color: '#1976d2',
                        fontWeight: 600
                      }}>
                        📝 상세 보고서 있음
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    fontSize: 14, 
                    color: '#667eea', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4
                  }}>
                    자세히 보기 →
                  </div>
                </div>

                {/* 진행률 바 */}
                <div style={{ marginTop: 12 }}>
                  <div style={{ width: '100%', height: 6, background: '#f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                    <div style={{
                      width: `${report.progressPercentage}%`,
                      height: '100%',
                      background: getProgressColor(report.progressPercentage),
                      transition: 'width 0.5s ease'
                    }}></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 액션 버튼들 */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
          <button
            onClick={() => navigate('/category-quiz')}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: 10,
              border: 'none',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'var(--accent-gradient)',
              color: '#fff'
            }}
          >
            새 퀴즈 풀기
          </button>
          <button
            onClick={() => navigate('/category-manage')}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: 10,
              border: '1px solid #28a745',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'transparent',
              color: '#28a745'
            }}
          >
            카테고리 관리
          </button>
          <button
            onClick={() => navigate('/dashboard/progress')}
            style={{
              padding: '0.8rem 1.5rem',
              borderRadius: 10,
              border: '1px solid #667eea',
              fontWeight: 700,
              cursor: 'pointer',
              background: 'transparent',
              color: '#667eea'
            }}
          >
            전체 진행률 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CategoryReportsListPage;
