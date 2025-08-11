import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { generateWeeklyQuizByCategory, getUserLearningData } from '../services/quizService';
import axios from 'axios';

function CategoryQuizPage() {
  const { user } = useUser();
  const navigate = useNavigate();

  const [learningData, setLearningData] = useState(null);
  const [categories, setCategories] = useState(['기본']);
  const [selectedCategory, setSelectedCategory] = useState('기본');
  const [testCount, setTestCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);

  const isRequesting = useRef(false);

  const canGenerate = useMemo(() => {
    return Boolean(user?.user_id && learningData && selectedCategory && Number(testCount) >= 1);
  }, [user, learningData, selectedCategory, testCount]);

  // 사용자 카테고리 및 학습 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      if (!user?.user_id) return;
      
      try {
        setDataLoading(true);
        
        // 사용자 카테고리 조회
        const categoryResponse = await axios.get(`/api/user-categories/${user.user_id}`);
        if (categoryResponse.data && categoryResponse.data.length > 0) {
          setCategories(categoryResponse.data);
          setSelectedCategory(categoryResponse.data[0]);
        }

        // 학습 데이터 조회
        const data = await getUserLearningData(user.user_id);
        if (data?.success) {
          setLearningData(data.data);
        }
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

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
      
      // 카테고리별 퀴즈 풀이 페이지로 이동
      navigate('/category-quiz-solve', {
        state: {
          quizData: data.quizData,
          testCount: Number(testCount),
          category: selectedCategory
        }
      });
    } catch (e) {
      alert(e.response?.data?.message || e.message || '퀴즈 생성에 실패했습니다.');
    } finally {
      setLoading(false);
      isRequesting.current = false;
    }
  };

  const getCategoryLearningData = (category) => {
    if (!learningData?.categorizedData) return { notes: 0, records: 0 };
    const categoryData = learningData.categorizedData[category];
    return {
      notes: categoryData?.totalNotes || 0,
      records: categoryData?.totalRecords || 0
    };
  };

  if (dataLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div>데이터를 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem 0', color: 'var(--text-main)' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '1rem' }}>
        <h2 style={{ fontWeight: 900, fontSize: 24, marginBottom: 12 }}>카테고리별 퀴즈</h2>
        <p style={{ color: '#666', marginBottom: 24 }}>학습 카테고리별로 맞춤형 퀴즈를 생성하고 풀어보세요.</p>

        {/* 카테고리 선택 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>📚 학습 카테고리 선택</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            {categories.map(category => {
              const categoryData = getCategoryLearningData(category);
              const isSelected = selectedCategory === category;
              return (
                <div
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  style={{
                    padding: 16,
                    borderRadius: 12,
                    border: isSelected ? '2px solid #667eea' : '1px solid var(--card-border)',
                    background: isSelected ? '#f8f9ff' : 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 8, color: isSelected ? '#667eea' : '#333' }}>
                    {category}
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>
                    노트: {categoryData.notes}개 | 기록: {categoryData.records}개
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedCategory && (
            <div style={{ padding: 12, background: '#e8f2ff', borderRadius: 8, fontSize: 14 }}>
              ✅ 선택된 카테고리: <strong>{selectedCategory}</strong>
            </div>
          )}
        </div>

        {/* 퀴즈 생성 설정 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>🎯 퀴즈 생성 설정</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6 }}>테스트 횟수</div>
              <input 
                type="number" 
                min={1} 
                value={testCount} 
                onChange={(e) => setTestCount(e.target.value)} 
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid var(--card-border)', outline: 'none' }} 
              />
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
          
          {selectedCategory && (
            <div style={{ marginTop: 12 }}>
              {getCategoryLearningData(selectedCategory).notes === 0 && getCategoryLearningData(selectedCategory).records === 0 ? (
                <div style={{ padding: 12, background: '#fff3cd', borderRadius: 8, color: '#856404', fontSize: 14 }}>
                  ⚠️ 선택한 카테고리 '{selectedCategory}'에 학습 데이터가 없습니다. 퀴즈를 생성하려면 해당 카테고리의 학습 노트나 기록이 필요합니다.
                </div>
              ) : (
                <div style={{ padding: 12, background: '#d4edda', borderRadius: 8, color: '#155724', fontSize: 14 }}>
                  ✅ 카테고리 '{selectedCategory}'에 충분한 학습 데이터가 있습니다.
                </div>
              )}
            </div>
          )}
        </div>

        {/* 카테고리별 진행률 보기 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem', marginBottom: 18 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>📊 카테고리별 학습 진행률</h3>
          <p style={{ marginBottom: 16, color: '#666' }}>
            각 카테고리별 퀴즈 결과와 학습 진행률을 확인할 수 있습니다.
          </p>
          <button 
            onClick={() => navigate('/dashboard/progress')}
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
            카테고리별 진행률 보기
          </button>
        </div>

        {/* 추가 기능들 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>📊 카테고리별 보고서</h3>
            <p style={{ marginBottom: 16, color: '#666' }}>
              각 카테고리별 상세 학습 분석 보고서를 확인하세요.
            </p>
            <button 
              onClick={() => navigate('/category-reports')}
              style={{ 
                padding: '0.8rem 1.2rem', 
                borderRadius: 10, 
                border: '1px solid #9c27b0', 
                fontWeight: 700, 
                cursor: 'pointer', 
                background: 'transparent', 
                color: '#9c27b0' 
              }}
            >
              보고서 보기
            </button>
          </div>

          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>⚙️ 카테고리 관리</h3>
            <p style={{ marginBottom: 16, color: '#666' }}>
              학습 카테고리를 추가, 수정, 삭제할 수 있습니다.
            </p>
            <button 
              onClick={() => navigate('/category-manage')}
              style={{ 
                padding: '0.8rem 1.2rem', 
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
          </div>
          
          <div style={{ background: 'var(--card-bg)', borderRadius: 16, boxShadow: '0 8px 24px var(--card-shadow)', padding: '1.2rem' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: '#667eea' }}>🔄 전체 학습 퀴즈</h3>
            <p style={{ marginBottom: 16, color: '#666' }}>
              모든 학습 내용을 포함한 종합 퀴즈를 풀고 싶다면 전체 퀴즈 페이지로 이동하세요.
            </p>
            <button 
              onClick={() => navigate('/weekly-quiz')}
              style={{ 
                padding: '0.8rem 1.2rem', 
                borderRadius: 10, 
                border: '1px solid #667eea', 
                fontWeight: 700, 
                cursor: 'pointer', 
                background: 'transparent', 
                color: '#667eea' 
              }}
            >
              전체 퀴즈 페이지로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CategoryQuizPage;
