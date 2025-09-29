import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { generateWeeklyQuizByCategory, getUserLearningData } from '../services/quizService';

function WeeklyQuizPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [learningData, setLearningData] = useState(null);
  const [testCount, setTestCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [quizData] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("기본");

  const isRequesting = useRef(false);

  const canGenerate = useMemo(() => {
    return Boolean(user?.user_id && learningData && Number(testCount) >= 1);
  }, [user, learningData, testCount]);

  // 사용자 학습 데이터 로드
  useEffect(() => {
    const loadLearningData = async () => {
      if (!user?.user_id) return;
      
      try {
        setDataLoading(true);
        const data = await getUserLearningData(user.user_id);
        if (data?.success) {
          setLearningData(data.data);
          
          // 카테고리별 테스트 횟수 자동 계산
          if (data.data.categoryTestCounts) {
            const categories = Object.keys(data.data.categoryTestCounts);
            if (categories.length > 0) {
              const firstCategory = categories[0];
              const currentTestCount = data.data.categoryTestCounts[firstCategory] || 0;
              setTestCount(currentTestCount + 1);
              setSelectedCategory(firstCategory);
            }
          }
        }
      } catch (error) {
        console.error('학습 데이터 로드 실패:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadLearningData();
  }, [user]);

  // 카테고리 변경 시 테스트 횟수 자동 업데이트
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (learningData?.categoryTestCounts) {
      const currentTestCount = learningData.categoryTestCounts[category] || 0;
      setTestCount(currentTestCount + 1);
    }
  };

  const handleGenerate = async () => {
    if (!canGenerate || isRequesting.current) return;
    setLoading(true);
    isRequesting.current = true;
    try {
      const data = await generateWeeklyQuizByCategory({
        user_id: user.user_id,
        testCount: Number(testCount),
        category: selectedCategory,
      });
      if (!data?.success) throw new Error(data?.error || '퀴즈 생성 실패');
      
      // 퀴즈 풀이 페이지로 이동
      navigate('/weekly-quiz-solve', {
        state: {
          quizData: data.quizData,
          testCount: Number(testCount),
          category: selectedCategory
        }
      });
    } catch (e) {
      alert(e.message || '퀴즈 생성에 실패했습니다.');
    } finally {
      setLoading(false);
      isRequesting.current = false;
    }
  };

  const handleStartQuiz = () => {
    if (quizData.length > 0) {
      navigate('/weekly-quiz-solve', {
        state: {
          quizData,
          testCount: Number(testCount)
        }
      });
    }
  };

  if (dataLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>학습 데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '1rem' }}>
        <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 12 }}>주간 퀴즈</h2>

        {/* 학습 데이터 요약 */}
        {learningData && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 18 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>📚 학습 현황</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>학습 노트</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{learningData.totalNotes}개</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>학습 기록</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{learningData.totalRecords}개</div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>학습 목표</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                  {learningData.learningGoal?.goal || '설정되지 않음'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>테스트 횟수</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                  {testCount}회차
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 퀴즈 생성 섹션 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>🎯 퀴즈 생성</h3>
          
          {/* 카테고리 선택 */}
          {learningData?.categoryTestCounts && Object.keys(learningData.categoryTestCounts).length > 1 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>카테고리 선택</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {Object.keys(learningData.categoryTestCounts).map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(category)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 20,
                      border: 'none',
                      fontWeight: 600,
                      cursor: 'pointer',
                      background: selectedCategory === category ? 'var(--accent-gradient)' : 'var(--card-border)',
                      color: selectedCategory === category ? '#fff' : 'var(--text-main)',
                      fontSize: 14
                    }}
                  >
                    {category} ({learningData.categoryTestCounts[category]}회)
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>테스트 횟수</div>
              <input 
                type="number" 
                min={1} 
                value={testCount} 
                onChange={(e) => setTestCount(e.target.value)} 
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--card-border)', outline: 'none' }} 
                readOnly
              />
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                {selectedCategory} 카테고리 {learningData?.categoryTestCounts?.[selectedCategory] || 0}회 + 1회차
              </div>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>&nbsp;</div>
              <button 
                onClick={handleGenerate} 
                disabled={!canGenerate || loading} 
                style={{ 
                  width: '100%', 
                  padding: '0.6rem 0.8rem', 
                  borderRadius: 10, 
                  border: 'none', 
                  fontWeight: 700, 
                  cursor: canGenerate && !loading ? 'pointer' : 'not-allowed', 
                  background: canGenerate && !loading ? 'var(--accent-gradient)' : '#ddd', 
                  color: '#fff' 
                }}
              >
                {loading ? '생성 중...' : '퀴즈 생성'}
              </button>
            </div>
          </div>
          {!learningData?.noteContent && !learningData?.learningContent && (
            <div style={{ marginTop: 12, padding: 12, background: '#fff3cd', borderRadius: 8, color: '#856404', fontSize: 14 }}>
              ⚠️ 퀴즈를 생성하기 위해서는 학습 노트나 학습 기록이 필요합니다.
            </div>
          )}
        </div>

        {/* 기존 퀴즈 데이터가 있는 경우 */}
        {quizData.length > 0 && (
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 18 }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>📝 퀴즈 풀기</h3>
            <p style={{ marginBottom: 16, color: '#666' }}>
              생성된 퀴즈가 있습니다. 퀴즈를 풀어보세요!
            </p>
            <button 
              onClick={handleStartQuiz}
              style={{ 
                padding: '0.8rem 1.2rem', 
                borderRadius: 10, 
                border: 'none', 
                fontWeight: 700, 
                cursor: 'pointer', 
                background: 'var(--accent-gradient)', 
                color: '#fff' 
              }}
            >
              퀴즈 시작하기
            </button>
          </div>
        )}

        {/* 주간 최종 평가 링크 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>📊 주간 최종 평가</h3>
          <p style={{ marginBottom: 16, color: '#666' }}>
            주간 퀴즈 결과와 상세한 학습 보고서를 확인할 수 있습니다.
          </p>
          <button 
            onClick={() => navigate('/dashboard/weekly')}
            style={{ 
              padding: '0.8rem 1.2rem', 
              borderRadius: 10, 
              border: 'none', 
              fontWeight: 700, 
              cursor: 'pointer', 
              background: 'var(--accent-gradient)', 
              color: '#fff' 
            }}
          >
            주간 평가 보기
          </button>
        </div>
      </div>
    </div>
  );
}

export default WeeklyQuizPage;


